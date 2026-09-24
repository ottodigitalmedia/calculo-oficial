/**
 * Robustez de todas as calculadoras — contrato `C-M3` de `ADR-003`, aplicado
 * ao catálogo inteiro e pela porta que o usuário usa.
 *
 * *"Erro de domínio retorna valor tipado, nunca exceção. Exceção significa
 * defeito."* `engine-erros.test.ts` verifica o contrato motor a motor, com
 * entradas escolhidas à mão. Este arquivo faz a pergunta de outro jeito: para
 * cada calculadora publicada, centenas de formulários que **a tela aceitaria**
 * — os mesmos limites de `validar` em `components/campos.tsx` — e a exigência
 * de que nenhum deles produza exceção, número que não é inteiro seguro, ou
 * texto com `NaN`, `undefined` ou `Infinity` escrito na tela.
 *
 * Não confere valor: isso é dos casos-ouro, que ficam em `tests/golden/` por
 * serem conferidos contra fonte oficial (`CO-1`). Aqui se confere que não há
 * formulário válido que quebre a página ou imprima lixo — o tipo de defeito que
 * nenhum caso-ouro pega, porque caso-ouro escolhe entradas razoáveis.
 *
 * O gerador é determinístico (semente fixa): uma falha se reproduz igual em
 * qualquer máquina, e a mensagem traz o formulário que a causou.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS } from '../../src/lib/calculadoras'
import {
  calcularComGuarda,
  MENSAGEM_DE_ESTOURO,
  MENSAGEM_DE_FALHA,
} from '../../src/lib/calculadoras/guarda'
import type { Campo, ValoresFormulario } from '../../src/lib/calculadoras/tipos'
import { EstouroDoInteiroSeguro } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

/**
 * Formulários por calculadora. Metade nos extremos, metade ao acaso.
 *
 * O padrão cabe no `check`; uma auditoria pode pedir mais sem editar o arquivo
 * — a de 24/09/2026 rodou 3.000 por calculadora (§7.99).
 */
const FORMULARIOS = Number(process.env.ROBUSTEZ_FORMULARIOS) || 120

/** Períodos que o seletor de ano oferece hoje — ver `Calculadora.tsx`. */
const REFERENCIAS = ['2024-06-15', '2025-06-15', '2026-06-15'] as const

/** Texto que nunca pode chegar à tela. */
const LIXO = /\bNaN\b|\bundefined\b|\bInfinity\b|\[object Object\]|\bnull\b/

/** mulberry32 — pequeno, determinístico e suficiente para gerar formulários. */
function gerador(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function semente(texto: string): number {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h
}

/** Teto usado quando o campo não declara máximo — a tela também não limita. */
const TETO_SEM_MAXIMO = 100_000_000

function numeroPara(maximo: number, obrigatorio: boolean, sorteio: () => number, extremo: boolean): number {
  const piso = obrigatorio ? 1 : 0
  if (maximo <= piso) return piso
  if (extremo) {
    const opcoes = [piso, piso + 1, maximo, maximo - 1, Math.floor(maximo / 2)]
    return opcoes[Math.floor(sorteio() * opcoes.length)]!
  }
  // Distribuição logarítmica: valores pequenos e grandes aparecem com a mesma
  // frequência, em vez de quase tudo cair perto do máximo.
  const log = Math.log(maximo - piso + 1)
  return Math.min(maximo, piso + Math.floor(Math.exp(sorteio() * log)) - 1)
}

function dataAoAcaso(sorteio: () => number): string {
  const ano = 1990 + Math.floor(sorteio() * 41)
  const mes = 1 + Math.floor(sorteio() * 12)
  const dia = 1 + Math.floor(sorteio() * 28)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function dataPerto(sorteio: () => number): string {
  const ano = 2024 + Math.floor(sorteio() * 3)
  const mes = 1 + Math.floor(sorteio() * 12)
  const dia = 1 + Math.floor(sorteio() * 28)
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function valorPara(campo: Campo, sorteio: () => number, extremo: boolean): number | string {
  switch (campo.tipo) {
    case 'selecao': {
      const opcoes = (campo.opcoes ?? []).filter((o) => !o.indisponivel)
      return opcoes[Math.floor(sorteio() * opcoes.length)]?.valor ?? String(campo.padrao ?? '')
    }
    case 'data':
      if (!campo.obrigatorio && sorteio() < 0.15) return ''
      // Datas distantes testam o bloqueio por vigência (`RN-003`); as próximas,
      // o cálculo em si.
      return sorteio() < 0.3 ? dataAoAcaso(sorteio) : dataPerto(sorteio)
    case 'lista': {
      const colunas = campo.colunas ?? []
      const linhas = 1 + Math.floor(sorteio() * Math.min(4, campo.maximoDeLinhas ?? 4))
      return Array.from({ length: linhas }, () =>
        colunas
          .map((c) => numeroPara(c.maximo ?? TETO_SEM_MAXIMO, false, sorteio, extremo))
          .join(','),
      ).join(';')
    }
    default:
      return numeroPara(campo.maximo ?? TETO_SEM_MAXIMO, campo.obrigatorio === true, sorteio, extremo)
  }
}

function conferirTexto(onde: string, texto: string, contexto: string): void {
  expect(LIXO.test(texto), `${onde} imprime lixo: "${texto}"\n${contexto}`).toBe(false)
}

function inteiroSeguro(onde: string, valor: unknown, contexto: string): void {
  expect(Number.isSafeInteger(valor), `${onde} não é inteiro seguro: ${String(valor)}\n${contexto}`).toBe(true)
}

describe('a guarda da página', () => {
  const data = '2026-06-15' as DataISO

  it('estouro vira recusa com explicação, não página derrubada', () => {
    const r = calcularComGuarda(
      () => {
        throw new EstouroDoInteiroSeguro('teste')
      },
      {},
      data,
    )
    expect(r).toMatchObject({ ok: false, motivo: 'entrada_invalida', detalhe: MENSAGEM_DE_ESTOURO })
  })

  it('qualquer outra exceção também não derruba a página — e não se passa por estouro', () => {
    const r = calcularComGuarda(
      () => {
        throw new RangeError('divisão por zero')
      },
      {},
      data,
    )
    expect(r).toMatchObject({ ok: false, detalhe: MENSAGEM_DE_FALHA })
  })

  it('nenhum valor digitado aparece na mensagem (regra 6)', () => {
    const r = calcularComGuarda(
      () => {
        throw new EstouroDoInteiroSeguro('proporcao: o resultado de 123456789 × 2 excede')
      },
      { salario: 123_456_789 },
      data,
    )
    expect(r.ok ? '' : r.detalhe).not.toContain('123456789')
  })
})

describe('C-M3 · nenhum formulário válido quebra uma calculadora', () => {
  it('o catálogo inteiro está coberto', () => {
    expect(CALCULADORAS.length).toBeGreaterThanOrEqual(123)
  })

  for (const calc of CALCULADORAS) {
    it(`${calc.slug}`, () => {
      const sorteio = gerador(semente(calc.slug))
      let calculados = 0

      for (let i = 0; i < FORMULARIOS; i++) {
        const extremo = i % 2 === 0
        const valores: Record<string, number | string> = {}
        for (const campo of calc.campos) valores[campo.id] = valorPara(campo, sorteio, extremo)
        const referencia = REFERENCIAS[i % REFERENCIAS.length]! as DataISO
        const contexto = `formulário: ${JSON.stringify(valores)} · referência ${referencia}`

        let r
        try {
          r = calc.calcular(valores as ValoresFormulario, referencia)
        } catch (e) {
          // Estouro do inteiro seguro é recusa legítima: resultado acima de
          // R$ 90 trilhões não sai exato, e a guarda da página o traduz
          // (`guarda.ts`). Qualquer outra exceção é defeito.
          if (e instanceof EstouroDoInteiroSeguro) {
            expect(calcularComGuarda(calc.calcular, valores, referencia)).toMatchObject({
              ok: false,
              detalhe: MENSAGEM_DE_ESTOURO,
            })
            continue
          }
          throw new Error(`${calc.slug} lançou exceção: ${(e as Error).message}\n${contexto}`, {
            cause: e,
          })
        }

        if (!r.ok) {
          expect(r.detalhe.length, `erro sem explicação\n${contexto}`).toBeGreaterThan(0)
          conferirTexto('a mensagem de erro', r.detalhe, contexto)
          continue
        }

        calculados++
        const v = r.valores
        inteiroSeguro('o resultado principal', v.principal, contexto)
        for (const linha of v.detalhamento) {
          inteiroSeguro(`"${linha.rotulo}"`, linha.valor, contexto)
          conferirTexto('o rótulo do detalhamento', linha.rotulo, contexto)
        }
        for (const d of v.destaques ?? []) {
          conferirTexto(`o destaque "${d.rotulo}"`, `${d.rotulo} ${d.valor}`, contexto)
        }
        for (const nota of v.notas ?? []) conferirTexto('a nota', nota, contexto)
        for (const linha of v.tabela?.linhas ?? []) {
          for (const valor of linha.valores) inteiroSeguro(`a tabela, linha "${linha.rotulo}"`, valor, contexto)
        }

        // Não existe cálculo sem memória — regra 5.
        expect(r.traco.etapas.length, `resultado sem memória de cálculo\n${contexto}`).toBeGreaterThan(0)
        for (const etapa of r.traco.etapas) {
          inteiroSeguro(`a etapa "${etapa.rotulo}"`, etapa.resultado, contexto)
          conferirTexto('a etapa', `${etapa.rotulo} ${etapa.formula}`, contexto)
        }
      }

      // Um gerador que só produz recusas não testaria nada.
      expect(calculados, `${calc.slug}: nenhum dos ${FORMULARIOS} formulários chegou a calcular`).toBeGreaterThan(0)
    })
  }
})
