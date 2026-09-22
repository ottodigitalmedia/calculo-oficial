/**
 * De que o resultado pode depender, além dos dados informados.
 *
 * **Isto nasceu de um texto errado no ar.** O aviso abaixo do resultado dizia,
 * em TODA calculadora com parâmetro legal, que "o valor final pode variar
 * conforme acordos, convenções coletivas e particularidades do seu contrato".
 * Numa rescisão isso é verdade e é importante. Na restituição do imposto de
 * renda, no PGBL ou no Tesouro Selic, é falso: convenção coletiva não muda
 * imposto nem rendimento de título público. Um aviso que não se aplica ensina o
 * leitor a ignorar os avisos que se aplicam.
 *
 * **O critério é a categoria do catálogo, e não o gosto de quem escreve.** As
 * trabalhistas (§4 de `00-catalogo`) são as que dependem de instrumento
 * coletivo e de cláusula de contrato. As demais dependem de particularidades do
 * caso — outras fontes de renda, regimes especiais, regras que a conta não
 * cobre —, e é isso que elas dizem.
 *
 * A lista é única e conferida por teste: slug que não existe reprova, e
 * calculadora trabalhista nova que fique de fora aparece na revisão do lote.
 */

/** A ressalva que a tela exibe abaixo do resultado. */
export type Ressalva = 'coletiva' | 'caso'

/**
 * As calculadoras da categoria TRB do catálogo — as que podem variar por
 * acordo individual, convenção ou acordo coletivo.
 */
export const SLUGS_TRABALHISTAS: ReadonlySet<string> = new Set([
  'abono-salarial-pis',
  'acordo-ou-dispensa',
  'adicional-de-transferencia',
  'adicional-noturno',
  'aviso-previo-proporcional',
  'banco-de-horas',
  'contrato-intermitente',
  'custo-do-funcionario',
  'dae-do-empregador-domestico',
  'decimo-terceiro',
  'desconto-de-faltas',
  'dsr-sobre-comissoes',
  'escala-12x36',
  'ferias',
  'ferias-em-dobro',
  'fgts',
  'horas-extras',
  'horas-trabalhadas',
  'insalubridade',
  'jovem-aprendiz',
  'licenca-maternidade',
  'licenca-paternidade',
  'periculosidade',
  'recesso-de-estagio',
  'rescisao-acordo-mutuo',
  'rescisao-contrato-de-experiencia',
  'rescisao-domestico',
  'rescisao-justa-causa',
  'rescisao-pedido-demissao',
  'rescisao-sem-justa-causa',
  'salario-familia',
  'salario-liquido',
  'saque-aniversario-do-fgts',
  'seguro-desemprego',
  'sobreaviso-e-prontidao',
  'vale-transporte',
])

export function ressalvaDe(slug: string): Ressalva {
  return SLUGS_TRABALHISTAS.has(slug) ? 'coletiva' : 'caso'
}
