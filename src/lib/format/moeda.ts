/**
 * Formatação pt-BR — camada de apresentação (`C-M4` de `ADR-003`).
 *
 * O motor devolve centavos e basis points; converter para "R$ 4.500,00" é
 * daqui. O motor **não importa** este módulo, e o lint reprova se tentar.
 */

const FORMATO = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

/** Centavos inteiros para "R$ 4.500,00". */
export function formatarReal(valorEmCentavos: number): string {
  return FORMATO.format(valorEmCentavos / 100)
}

/**
 * Centésimos inteiros para "1.234,56" — número sem unidade monetária.
 *
 * Existe desde CALC-054, para grandezas que são fracionárias sem ser dinheiro:
 * km por litro, e o resultado de CALC-070. Duas casas fixas de propósito — é a
 * mesma precisão que o campo de entrada aceita, e variar a quantidade de casas
 * na saída faria o valor exibido parecer diferente do digitado.
 */
export function formatarNumero(centesimos: number): string {
  return (centesimos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Basis points para "7,50", sem o símbolo. Para dentro de campo de entrada. */
export function formatarTaxa(bp: number): string {
  return (bp / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Basis points para "7,50%". */
export function formatarPercentual(bp: number): string {
  return `${(bp / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/** "2026-06-15" para "15/06/2026". Sem `Date`: evita fuso. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso
}

/** "2026-06" para "junho de 2026". */
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function formatarPeriodo(inicio: string, fim: string | null): string {
  const desde = formatarData(inicio)
  return fim === null ? `a partir de ${desde}` : `de ${desde} a ${formatarData(fim)}`
}

export function nomeDoMes(indiceZeroBase: number): string {
  return MESES[indiceZeroBase] ?? ''
}
