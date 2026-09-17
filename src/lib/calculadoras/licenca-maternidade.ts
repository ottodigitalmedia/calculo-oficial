/**
 * CALC-086 — Licença-maternidade.
 *
 * A pergunta real de quem busca é uma data: quando eu volto? A calculadora
 * responde com o último dia e o retorno, com e sem a prorrogação da Empresa
 * Cidadã, e confere — se a data do parto for informada — se o início cabe na
 * janela do art. 392, § 1º.
 *
 * Motor em `engine/calculadoras/licencas.ts`.
 */

import { calcularLicencaMaternidade } from '../engine/calculadoras/licencas'
import { centavos } from '../engine/types'
import { formatarData } from '../format/moeda'
import { LICENCAS } from '../params/data/licencas'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(LICENCAS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const parto = texto(valores, 'parto')
  const r = calcularLicencaMaternidade(
    {
      inicio: texto(valores, 'inicio') as DataISO,
      parto: parto === '' ? '' : (parto as DataISO),
      empresaCidada: texto(valores, 'empresaCidada') === 'sim',
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
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
        'O dia de início conta como o primeiro dia da licença. O retorno é o dia seguinte ao último.',
        'Durante a licença a empregada recebe o salário-maternidade, que para a empregada com carteira ' +
          'corresponde à remuneração integral, pago pela empresa e compensado junto à Previdência.',
        'Atestado médico pode aumentar em duas semanas os repousos antes e depois do parto, e internação ' +
          'ligada ao parto pode estender a licença — casos que dependem de documento e que esta estimativa não soma.',
      ],
    },
  }
}

export const LICENCA_MATERNIDADE: DefinicaoCalculadora = {
  id: 'CALC-086',
  slug: 'licenca-maternidade',
  nome: 'Licença-maternidade',
  linhaDeContexto: 'Quando a licença termina e quando é a volta ao trabalho, com ou sem a prorrogação da Empresa Cidadã.',
  descricaoSeo:
    'Calcule a data de término da licença-maternidade e do retorno ao trabalho, com a prorrogação da Empresa Cidadã e a conferência da data de início.',

  campos: [
    {
      id: 'inicio',
      rotulo: 'Início da licença',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'O primeiro dia de afastamento, indicado no atestado médico, ou o dia do parto.',
    },
    {
      id: 'parto',
      rotulo: 'Data do parto (opcional)',
      tipo: 'data',
      ajuda: 'Se já souber, a calculadora confere se o início está dentro do prazo permitido.',
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
      ajuda: 'A prorrogação precisa ser pedida até o fim do primeiro mês após o parto.',
    },
  ],

  parametrosRequeridos: [
    'licenca-maternidade-dias',
    'licenca-maternidade-inicio-antes-do-parto',
    'empresa-cidada-maternidade-dias',
  ],

  rotuloResultado: 'Dias de licença',

  calcular,

  faq: [
    {
      pergunta: 'Quando a licença-maternidade pode começar?',
      resposta:
        'O art. 392, § 1º, da CLT permite que o afastamento comece a partir do 28º dia antes do parto, mediante atestado médico, ou no próprio dia do parto. Se o bebê nasce antes do afastamento, a licença começa no parto. Informe a data do parto no campo opcional para conferir a data escolhida.',
    },
    {
      pergunta: 'O que é a prorrogação da Empresa Cidadã?',
      resposta:
        'É a extensão prevista na Lei nº 11.770/2008 para empregadas de empresas que aderiram ao Programa Empresa Cidadã. Ela começa logo depois da licença, precisa ser pedida até o fim do primeiro mês após o parto e é paga integralmente. Durante a prorrogação, a empregada não pode exercer atividade remunerada e a criança deve ficar sob seus cuidados. Nem toda empresa participa: confirme com o RH.',
    },
    {
      pergunta: 'A licença conta dias corridos ou dias úteis?',
      resposta:
        'Dias corridos. A Constituição fixa a duração em dias, e fins de semana e feriados dentro do período contam normalmente. Por isso a data de retorno pode cair em qualquer dia da semana.',
    },
    {
      pergunta: 'E se a mãe ou o bebê ficarem internados depois do parto?',
      resposta:
        'O art. 392, § 7º, da CLT, incluído pela Lei nº 15.222/2025, prevê que a internação ligada ao parto que passe de duas semanas estende a licença, que pode ir até cento e vinte dias após a alta, descontado o repouso anterior ao parto. Como depende das datas de internação e de comprovação, esta estimativa não faz essa conta.',
    },
    {
      pergunta: 'Quem adota também tem licença-maternidade?',
      resposta:
        'Tem. O art. 392-A da CLT garante a licença à empregada que adotar ou obtiver guarda judicial para fins de adoção, e a prorrogação da Empresa Cidadã vale na mesma proporção para adotantes. Use a data da adoção ou da guarda como início.',
    },
  ],

  relacionadas: ['licenca-paternidade', 'salario-familia', 'ferias', 'salario-liquido'],
}
