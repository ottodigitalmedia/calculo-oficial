/**
 * CALC-087 — Licença-paternidade.
 *
 * O cadastro faz o trabalho pesado: a duração muda em 2027 e em 2028 (Lei nº
 * 15.371/2026), e a calculadora escolhe pela data do nascimento. A página deixa
 * isso visível porque é o que a busca de 2026 em diante mais vai perguntar.
 *
 * Motor em `engine/calculadoras/licencas.ts`.
 */

import { calcularLicencaPaternidade } from '../engine/calculadoras/licencas'
import { centavos } from '../engine/types'
import { formatarData } from '../format/moeda'
import { LICENCAS } from '../params/data/licencas'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(LICENCAS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularLicencaPaternidade(
    {
      nascimento: texto(valores, 'nascimento') as DataISO,
      empresaCidada: texto(valores, 'empresaCidada') === 'sim',
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Dias da licença obrigatória', valor: `${v.diasLicenca}` },
    { rotulo: 'Último dia da licença', valor: formatarData(v.fimLicenca) },
    ...(v.fimProrrogacao !== null
      ? [{ rotulo: 'Último dia da prorrogação', valor: formatarData(v.fimProrrogacao) }]
      : []),
    { rotulo: 'Retorno ao trabalho', valor: formatarData(v.retorno) },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(v.totalDias),
      unidade: 'numero',
      casasDecimais: 0,
      detalhamento: [],
      destaques,
      notas: [
        'A duração é a da data do nascimento, da adoção ou da guarda: ela muda em 1º de janeiro de 2027 e ' +
          'de novo em 1º de janeiro de 2028.',
        'Nascimento ou adoção de criança ou adolescente com deficiência acrescenta um terço ao período a ' +
          'partir de 2027, e a internação da mãe ou do bebê ligada ao parto prorroga a licença — casos que ' +
          'esta estimativa não soma.',
      ],
    },
  }
}

export const LICENCA_PATERNIDADE: DefinicaoCalculadora = {
  id: 'CALC-087',
  slug: 'licenca-paternidade',
  nome: 'Licença-paternidade',
  linhaDeContexto: 'Quantos dias de licença pela data do nascimento, com a lei nova de 2027 e a Empresa Cidadã.',
  descricaoSeo:
    'Calcule os dias de licença-paternidade e a data de retorno pela data do nascimento, com a ampliação a partir de 2027 e a prorrogação da Empresa Cidadã.',

  campos: [
    {
      id: 'nascimento',
      rotulo: 'Data do nascimento, da adoção ou da guarda',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'A contagem começa nesta data.',
    },
    {
      id: 'empresaCidada',
      rotulo: 'A empresa participa do Programa Empresa Cidadã?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não, ou não sei' },
        { valor: 'sim', rotulo: 'Sim, e vou pedir a prorrogação' },
      ],
      ajuda: 'A prorrogação precisa ser pedida em até dois dias úteis após o parto.',
    },
  ],

  parametrosRequeridos: ['licenca-paternidade-dias', 'empresa-cidada-paternidade-dias'],

  rotuloResultado: 'Dias de licença',

  calcular,

  faq: [
    {
      pergunta: 'A licença-paternidade aumentou?',
      resposta:
        'Aumenta a partir de 2027. A Lei nº 15.371/2026 fixou uma duração maior para nascimentos a partir de 1º de janeiro de 2027 e outra, maior ainda, a partir de 1º de janeiro de 2028. Até 31 de dezembro de 2026 vale a regra transitória da Constituição. A lei prevê um terceiro aumento em 2029, condicionado ao cumprimento de meta fiscal — por isso a calculadora ainda não calcula nascimentos de 2029 em diante.',
    },
    {
      pergunta: 'A contagem começa no dia do nascimento?',
      resposta:
        'A partir de 2027, sim: a lei manda contar da data do nascimento, da adoção ou da guarda. Até 2026, a CLT fala em dias consecutivos em caso de nascimento, sem fixar o dia inicial; a calculadora usa a mesma contagem, a partir da data informada. Convenção coletiva pode prever regra mais favorável.',
    },
    {
      pergunta: 'Como funciona a prorrogação da Empresa Cidadã?',
      resposta:
        'A Lei nº 11.770/2008 acrescenta dias à licença do empregado de empresa que aderiu ao Programa Empresa Cidadã. É preciso pedir em até dois dias úteis após o parto e comprovar participação em programa ou atividade de orientação sobre paternidade responsável. Durante a prorrogação, o empregado não pode exercer atividade remunerada.',
    },
    {
      pergunta: 'Quem paga os dias de licença?',
      resposta:
        'Até 2026, os dias de ausência são pagos pela empresa, porque o art. 473 da CLT garante a falta sem prejuízo do salário. A partir de 2027, a Lei nº 15.371/2026 cria o salário-paternidade na Previdência Social: para o empregado, em regra, a empresa paga e é reembolsada; para os demais segurados, o pagamento é feito diretamente pela Previdência.',
    },
    {
      pergunta: 'O pai pode ser demitido depois da licença?',
      resposta:
        'A partir de 2027, a Lei nº 15.371/2026 proíbe a dispensa arbitrária ou sem justa causa desde o início da licença até um mês depois do seu término. Até 2026 a lei não prevê essa garantia para o pai, salvo o que estiver na convenção coletiva.',
    },
  ],

  relacionadas: ['licenca-maternidade', 'salario-familia', 'ferias'],
}
