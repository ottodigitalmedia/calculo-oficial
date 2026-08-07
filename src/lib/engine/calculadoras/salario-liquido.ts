/**
 * CALC-001 — Salário líquido.
 *
 * Compõe os motores de INSS e IRRF já verificados contra os exemplos oficiais
 * da Receita. Não reimplementa cálculo algum: encadeia os dois e junta os
 * traços, de modo que a memória do salário líquido seja a memória do INSS
 * seguida da do imposto, sem costura visível.
 *
 * O VALE-TRANSPORTE (`RN-027`) ENTROU EM 07/08/2026
 *
 * Este cabeçalho trazia, desde 31/07, um aviso de que o percentual era
 * *"parâmetro legal que ainda não foi pesquisado em fonte oficial"*. Estava no
 * Planalto, aberto: Lei nº 7.418/1985, art. 4º, parágrafo único.
 *
 * **`RN-027` é um mínimo entre dois números, e essa é a regra inteira.** O
 * trabalhador custeia até 6% do salário; o empregador paga o que exceder. Se o
 * transporte custa menos que essa cota, o desconto é o custo — nunca a cota.
 * Descontar a cota cheia de quem gasta menos cobraria por transporte que não
 * houve, e é o erro que o `Math.min` abaixo existe para impedir.
 *
 * **A base tem uma ressalva declarada.** O art. 114, I do Decreto nº
 * 10.854/2021 manda calcular sobre o salário básico *"excluídos quaisquer
 * adicionais ou vantagens"*, e o campo desta calculadora é o salário BRUTO.
 * Para quem não recebe adicional os dois coincidem; para quem recebe, a cota
 * sai maior que a legal — e como o desconto é o mínimo entre cota e custo, isso
 * só muda o resultado de quem gasta mais que 6%. A tela diz isso.
 */

import { aplicarAliquota, naoNegativo, somar, subtrair } from '../money'
import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, type BasisPoints, type Centavos, centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

export interface EntradaSalarioLiquido {
  readonly salarioBruto: Centavos
  readonly dependentes: number
  readonly pensao: Centavos
  readonly outrosDescontos: Centavos
  /**
   * Custo mensal do transporte informado pelo usuário.
   *
   * Zero quer dizer "não usa", e não "usa e custa nada": quem não opta pelo
   * benefício não sofre desconto nenhum, que é o mesmo resultado.
   */
  readonly custoValeTransporte: Centavos
}

export interface SaidaSalarioLiquido {
  readonly liquido: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly valeTransporte: Centavos
  readonly totalDescontos: Centavos
}

export function calcularSalarioLiquido(
  entrada: EntradaSalarioLiquido,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSalarioLiquido> {
  if (entrada.salarioBruto <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário bruto para ver o resultado.',
    }
  }

  const previdencia = calcularInss({ salarioContribuicao: entrada.salarioBruto }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia

  const imposto = calcularIrrf(
    {
      rendimentoBruto: entrada.salarioBruto,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: entrada.pensao,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto

  /**
   * `RN-027` — o desconto é o MENOR entre a cota legal e o custo informado.
   *
   * A cota só é resolvida quando há custo a descontar. Fazer o contrário
   * bloquearia a calculadora inteira por falta de cobertura de vigência
   * (`RN-003`) para quem nem usa o benefício — e a vigência aqui é aberta desde
   * 1985, então o bloqueio seria puro dano colateral.
   */
  let valeTransporte = ZERO
  let etapaDoVale: Etapa | null = null
  let vigenciaDoVale: string | null = null

  if (entrada.custoValeTransporte > 0) {
    const cota = registro.resolver('vale-transporte-cota-do-empregado', dataReferencia)
    if (!cota.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: cota.detalhe }
    if (cota.resolvida.vigencia.valor.tipo !== 'percentual') {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'A cota do vale-transporte não é percentual.' }
    }

    const cotaBp = cota.resolvida.vigencia.valor.aliquotaBp as BasisPoints
    vigenciaDoVale = cota.resolvida.vigencia.id
    const cotaLegal = aplicarAliquota(entrada.salarioBruto, cotaBp, 'meio_para_cima')
    valeTransporte = cotaLegal < entrada.custoValeTransporte ? cotaLegal : entrada.custoValeTransporte

    // O percentual sai do parâmetro, e não da fórmula escrita à mão: um dia a
    // lei muda, e a memória precisa mudar junto. Regra 1.
    etapaDoVale = {
      rotulo: 'Vale-transporte',
      formula:
        `menor entre a cota do empregado — ${reais(entrada.salarioBruto)} × ${percentual(cotaBp)} = ` +
        `${reais(cotaLegal)} — e o custo informado, ${reais(entrada.custoValeTransporte)}`,
      resultado: valeTransporte,
      parametro: citar(cota.resolvida),
      justificativa:
        valeTransporte < cotaLegal
          ? 'O transporte custa menos que a cota do empregado, então o desconto é o próprio custo. ' +
            'Descontar a cota cheia cobraria por transporte que não houve.'
          : 'O custo supera a cota do empregado, então o desconto para no limite legal e o ' +
            'empregador arca com o excedente.',
    }
  }

  const totalDescontos = somar(
    previdencia.valores.contribuicao,
    imposto.valores.imposto,
    entrada.pensao,
    valeTransporte,
    entrada.outrosDescontos,
  )
  const liquido = naoNegativo(subtrair(entrada.salarioBruto, totalDescontos))

  // Os dois traços entram inteiros, na ordem em que a conta acontece.
  const etapas: Etapa[] = [
    ...previdencia.traco.etapas,
    ...imposto.traco.etapas,
  ]

  if (etapaDoVale) etapas.push(etapaDoVale)

  if (entrada.outrosDescontos > 0) {
    etapas.push({
      rotulo: 'Outros descontos',
      formula: `Informado pelo usuário: ${reais(entrada.outrosDescontos)}`,
      resultado: entrada.outrosDescontos,
    })
  }

  etapas.push({
    rotulo: 'Salário líquido',
    formula:
      `${reais(entrada.salarioBruto)} − ${reais(previdencia.valores.contribuicao)} (previdência)` +
      ` − ${reais(imposto.valores.imposto)} (imposto)` +
      (entrada.pensao > 0 ? ` − ${reais(entrada.pensao)} (pensão)` : '') +
      (valeTransporte > 0 ? ` − ${reais(valeTransporte)} (vale-transporte)` : '') +
      (entrada.outrosDescontos > 0 ? ` − ${reais(entrada.outrosDescontos)} (outros)` : ''),
    resultado: liquido,
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [
      ...new Set([
        ...previdencia.traco.vigenciasAplicadas,
        ...imposto.traco.vigenciasAplicadas,
        ...(vigenciaDoVale ? [vigenciaDoVale] : []),
      ]),
    ],
  }

  return {
    ok: true,
    valores: {
      liquido,
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      valeTransporte,
      totalDescontos,
    },
    traco,
  }
}

/** Zero tipado, para composição de entradas ausentes. */
export const SEM_VALOR: Centavos = ZERO
export { centavos }
