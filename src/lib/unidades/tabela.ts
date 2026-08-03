/**
 * As unidades físicas e as razões exatas entre elas — CALC-074.
 *
 * **Por que fica FORA de `engine/`.** É dado declarado, não lógica: a mesma
 * razão pela qual `lib/params/` existe. E é dado feito de números grandes —
 * 40.468.564.224 centímetros quadrados no acre —, que dentro do motor
 * disparariam BV-10 quarenta vezes. Desativar a regra quarenta vezes numa
 * tabela é o caminho para desativá-la uma vez a mais onde ela importava.
 *
 * **Não são parâmetro legal** (`ADR-001` / regra 1), e por isso não têm
 * vigência: são definições do Sistema Internacional e dos acordos que fixaram
 * as unidades imperiais — a polegada é 25,4 mm exatos desde 1959, e nenhuma
 * norma brasileira a altera. O que varia por região está no RÓTULO, não
 * escondido: o alqueire paulista e o mineiro são áreas diferentes com o mesmo
 * nome, e aparecem separados.
 *
 * A razão é escrita como fração de inteiros de propósito. "0,0254 m" seria
 * ponto flutuante; 254 ÷ 10 mm é exato, e é o que permite a conversão fechar.
 */

export interface UnidadeFisica {
  readonly id: string
  readonly nome: string
  readonly simbolo: string
  /** Valor na base da categoria = valor × `numerador` ÷ `denominador`. */
  readonly numerador: number
  readonly denominador: number
}

export interface CategoriaDeUnidade {
  readonly id: string
  readonly nome: string
  /** Unidade em que a memória de cálculo mostra o valor intermediário. */
  readonly base: string
  readonly unidades: readonly UnidadeFisica[]
}

/**
 * As categorias, com a razão exata de cada unidade para a base.
 *
 * **Não são parâmetro legal** (`ADR-001` / regra 1). São definições do Sistema
 * Internacional e dos acordos que fixaram as unidades imperiais — não têm
 * vigência, não mudam por norma brasileira e não expiram. O que muda por região
 * está no rótulo, não escondido: o alqueire paulista e o mineiro aparecem
 * separados porque são áreas diferentes com o mesmo nome.
 */
export const CATEGORIAS: readonly CategoriaDeUnidade[] = [
  {
    id: 'comprimento',
    nome: 'Comprimento',
    base: 'milímetro',
    unidades: [
      { id: 'mm', nome: 'Milímetro', simbolo: 'mm', numerador: 1, denominador: 1 },
      { id: 'cm', nome: 'Centímetro', simbolo: 'cm', numerador: 10, denominador: 1 },
      { id: 'm', nome: 'Metro', simbolo: 'm', numerador: 1_000, denominador: 1 },
      { id: 'km', nome: 'Quilômetro', simbolo: 'km', numerador: 1_000_000, denominador: 1 },
      { id: 'pol', nome: 'Polegada', simbolo: 'pol', numerador: 254, denominador: 10 },
      { id: 'pe', nome: 'Pé', simbolo: 'pé', numerador: 3_048, denominador: 10 },
      { id: 'jd', nome: 'Jarda', simbolo: 'jd', numerador: 9_144, denominador: 10 },
      { id: 'mi', nome: 'Milha', simbolo: 'mi', numerador: 1_609_344, denominador: 1 },
    ],
  },
  {
    id: 'massa',
    nome: 'Massa',
    base: 'miligrama',
    unidades: [
      { id: 'mg', nome: 'Miligrama', simbolo: 'mg', numerador: 1, denominador: 1 },
      { id: 'g', nome: 'Grama', simbolo: 'g', numerador: 1_000, denominador: 1 },
      { id: 'kg', nome: 'Quilograma', simbolo: 'kg', numerador: 1_000_000, denominador: 1 },
      { id: 't', nome: 'Tonelada', simbolo: 't', numerador: 1_000_000_000, denominador: 1 },
      { id: 'oz', nome: 'Onça', simbolo: 'oz', numerador: 28_349_523_125, denominador: 1_000_000 },
      { id: 'lb', nome: 'Libra', simbolo: 'lb', numerador: 45_359_237, denominador: 100 },
      {
        id: 'arroba',
        nome: 'Arroba (15 kg, uso brasileiro)',
        simbolo: '@',
        numerador: 15_000_000,
        denominador: 1,
      },
    ],
  },
  {
    id: 'volume',
    nome: 'Volume',
    base: 'mililitro',
    unidades: [
      { id: 'ml', nome: 'Mililitro', simbolo: 'ml', numerador: 1, denominador: 1 },
      { id: 'cm3', nome: 'Centímetro cúbico', simbolo: 'cm³', numerador: 1, denominador: 1 },
      { id: 'l', nome: 'Litro', simbolo: 'l', numerador: 1_000, denominador: 1 },
      { id: 'm3', nome: 'Metro cúbico', simbolo: 'm³', numerador: 1_000_000, denominador: 1 },
      {
        id: 'gal',
        nome: 'Galão americano',
        simbolo: 'gal',
        numerador: 3_785_411_784,
        denominador: 1_000_000,
      },
    ],
  },
  {
    id: 'area',
    nome: 'Área',
    base: 'centímetro quadrado',
    unidades: [
      { id: 'cm2', nome: 'Centímetro quadrado', simbolo: 'cm²', numerador: 1, denominador: 1 },
      { id: 'm2', nome: 'Metro quadrado', simbolo: 'm²', numerador: 10_000, denominador: 1 },
      { id: 'ha', nome: 'Hectare', simbolo: 'ha', numerador: 100_000_000, denominador: 1 },
      {
        id: 'km2',
        nome: 'Quilômetro quadrado',
        simbolo: 'km²',
        numerador: 10_000_000_000,
        denominador: 1,
      },
      {
        id: 'acre',
        nome: 'Acre',
        simbolo: 'acre',
        numerador: 40_468_564_224,
        denominador: 1_000,
      },
      {
        id: 'alqueire-paulista',
        nome: 'Alqueire paulista (2,42 ha)',
        simbolo: 'alq. paulista',
        numerador: 242_000_000,
        denominador: 1,
      },
      {
        id: 'alqueire-mineiro',
        nome: 'Alqueire mineiro (4,84 ha)',
        simbolo: 'alq. mineiro',
        numerador: 484_000_000,
        denominador: 1,
      },
    ],
  },
  {
    id: 'velocidade',
    nome: 'Velocidade',
    base: 'milímetro por hora',
    unidades: [
      {
        id: 'kmh',
        nome: 'Quilômetro por hora',
        simbolo: 'km/h',
        numerador: 1_000_000,
        denominador: 1,
      },
      {
        id: 'ms',
        nome: 'Metro por segundo',
        simbolo: 'm/s',
        numerador: 3_600_000,
        denominador: 1,
      },
      { id: 'mph', nome: 'Milha por hora', simbolo: 'mph', numerador: 1_609_344, denominador: 1 },
      { id: 'no', nome: 'Nó', simbolo: 'nó', numerador: 1_852_000, denominador: 1 },
    ],
  },
  {
    id: 'tempo',
    nome: 'Tempo',
    base: 'segundo',
    unidades: [
      { id: 's', nome: 'Segundo', simbolo: 's', numerador: 1, denominador: 1 },
      { id: 'min', nome: 'Minuto', simbolo: 'min', numerador: 60, denominador: 1 },
      { id: 'h', nome: 'Hora', simbolo: 'h', numerador: 3_600, denominador: 1 },
      { id: 'd', nome: 'Dia', simbolo: 'd', numerador: 86_400, denominador: 1 },
      { id: 'sem', nome: 'Semana', simbolo: 'sem', numerador: 604_800, denominador: 1 },
    ],
  },
  {
    id: 'dados',
    nome: 'Dados digitais',
    base: 'byte',
    unidades: [
      { id: 'B', nome: 'Byte', simbolo: 'B', numerador: 1, denominador: 1 },
      { id: 'kB', nome: 'Quilobyte (1.000 B)', simbolo: 'kB', numerador: 1_000, denominador: 1 },
      { id: 'MB', nome: 'Megabyte (10⁶ B)', simbolo: 'MB', numerador: 1_000_000, denominador: 1 },
      {
        id: 'GB',
        nome: 'Gigabyte (10⁹ B)',
        simbolo: 'GB',
        numerador: 1_000_000_000,
        denominador: 1,
      },
      {
        id: 'TB',
        nome: 'Terabyte (10¹² B)',
        simbolo: 'TB',
        numerador: 1_000_000_000_000,
        denominador: 1,
      },
      { id: 'KiB', nome: 'Kibibyte (1.024 B)', simbolo: 'KiB', numerador: 1_024, denominador: 1 },
      {
        id: 'MiB',
        nome: 'Mebibyte (1.024 KiB)',
        simbolo: 'MiB',
        numerador: 1_048_576,
        denominador: 1,
      },
      {
        id: 'GiB',
        nome: 'Gibibyte (1.024 MiB)',
        simbolo: 'GiB',
        numerador: 1_073_741_824,
        denominador: 1,
      },
    ],
  },
  {
    id: 'temperatura',
    nome: 'Temperatura',
    base: 'kelvin',
    /**
     * As razões abaixo NÃO são usadas na conversão — temperatura tem caminho
     * próprio, porque a relação entre as escalas é uma reta com deslocamento, e
     * não uma proporção. Ficam declaradas para a lista de unidades da categoria
     * ter a mesma forma das outras.
     */
    unidades: [
      { id: 'C', nome: 'Grau Celsius', simbolo: '°C', numerador: 1, denominador: 1 },
      { id: 'F', nome: 'Grau Fahrenheit', simbolo: '°F', numerador: 1, denominador: 1 },
      { id: 'K', nome: 'Kelvin', simbolo: 'K', numerador: 1, denominador: 1 },
    ],
  },
]

export function categoriaPorId(id: string): CategoriaDeUnidade | undefined {
  return CATEGORIAS.find((c) => c.id === id)
}

export function unidadePorId(
  categoria: CategoriaDeUnidade,
  id: string,
): UnidadeFisica | undefined {
  return categoria.unidades.find((u) => u.id === id)
}
