/**
 * Campos e textos que as páginas de aposentadoria — CALC-104 a CALC-108 —
 * dividem. Uma declaração só, para que "idade" e "tempo de contribuição"
 * tenham o mesmo rótulo, o mesmo limite e a mesma ajuda nas cinco páginas.
 */

import type { Cumprimento } from '../engine/calculadoras/regras-de-aposentadoria'
import { nomeDoMes } from '../format/moeda'
import type { Campo, Destaque } from './tipos'

export const CAMPO_SEXO: Campo = {
  id: 'sexo',
  rotulo: 'Sexo',
  tipo: 'selecao',
  padrao: 'mulher',
  opcoes: [
    { valor: 'mulher', rotulo: 'Mulher' },
    { valor: 'homem', rotulo: 'Homem' },
  ],
  ajuda: 'A Emenda exige idade e tempo diferentes para cada caso.',
}

export function camposDeIdade(padraoAnos: number): readonly Campo[] {
  return [
    { id: 'idadeAnos', rotulo: 'Sua idade — anos', tipo: 'inteiro', obrigatorio: true, padrao: padraoAnos, minimo: 1, maximo: 110 },
    { id: 'idadeMeses', rotulo: 'Sua idade — meses', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 11 },
  ]
}

export function camposDeTempo(padraoAnos: number, rotulo = 'Tempo de contribuição hoje'): readonly Campo[] {
  return [
    {
      id: 'tempoAnos',
      rotulo: `${rotulo} — anos`,
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: padraoAnos,
      minimo: 0,
      maximo: 70,
      ajuda: 'O total do extrato do CNIS, no Meu INSS.',
    },
    { id: 'tempoMeses', rotulo: `${rotulo} — meses`, tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 11 },
  ]
}

export function camposDeTempoNaEmenda(padraoAnos: number, obrigatorio: boolean): readonly Campo[] {
  return [
    {
      id: 'emendaAnos',
      rotulo: 'Tempo de contribuição em 13/11/2019 — anos',
      tipo: 'inteiro',
      ...(obrigatorio ? { obrigatorio: true } : {}),
      padrao: padraoAnos,
      minimo: 0,
      maximo: 70,
      ajuda: obrigatorio
        ? 'O pedágio é calculado sobre o que faltava nessa data. No CNIS, some as contribuições até outubro de 2019.'
        : 'Opcional: sem ele, os pedágios ficam de fora. No CNIS, some as contribuições até outubro de 2019.',
    },
    { id: 'emendaMeses', rotulo: 'Tempo de contribuição em 13/11/2019 — meses', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 11 },
  ]
}

export const CAMPO_FILIACAO: Campo = {
  id: 'filiacao',
  rotulo: 'Quando começou a contribuir para o INSS',
  tipo: 'selecao',
  padrao: 'antes',
  opcoes: [
    { valor: 'antes', rotulo: 'Até 13/11/2019' },
    { valor: 'depois', rotulo: 'Depois de 13/11/2019' },
  ],
  ajuda: 'Quem já contribuía na data da reforma tem as regras de transição; quem começou depois, só a permanente.',
}

/** "dezembro de 2033". */
export function quando(ano: number, mes: number): string {
  return `${nomeDoMes(mes - 1)} de ${ano}`
}

/** Principal das páginas: meses até cumprir, zero quando já cumpre. */
export function mesesComoPrincipal(c: Cumprimento): number {
  return c.mesesAteCumprir ?? 0
}

export function destaquesDeCumprimento(c: Cumprimento): Destaque[] {
  if (c.cumpreHoje) return [{ rotulo: 'Situação', valor: 'Requisitos cumpridos' }]
  if (c.anoDeCumprimento === null || c.mesDeCumprimento === null) {
    return [{ rotulo: 'Situação', valor: 'Sem previsão nos próximos sessenta anos' }]
  }
  return [
    { rotulo: 'Situação', valor: 'Requisitos ainda não cumpridos' },
    { rotulo: 'Quando cumpre', valor: quando(c.anoDeCumprimento, c.mesDeCumprimento) },
  ]
}

export const NOTA_CNIS =
  'Idade e tempo de contribuição saem do extrato do CNIS, no Meu INSS, que pode incluir períodos que você não ' +
  'lembra — ou deixar de fora períodos que precisam ser acertados antes do pedido.'

export const NOTA_PROJECAO =
  'A data supõe contribuição sem interrupção: cada mês acrescenta um mês de idade e um de contribuição. ' +
  'Interrupções adiam o cumprimento.'

export const NOTA_VALOR =
  'Cumprir os requisitos define o DIREITO, não o valor. O valor é calculado à parte, com a média das ' +
  'contribuições desde julho de 1994, e muda de uma regra para outra.'

export const NOTA_FORA =
  'Professor, atividade especial e pessoa com deficiência têm regras próprias, que esta calculadora não cobre.'
