/**
 * CALC-065 — Consumo de energia por aparelho.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A tarifa é campo, e isso é regra do catálogo, não escolha.** `00-catalogo`
 * §12 determina que ela venha da fatura do usuário, com instrução de onde
 * achá-la, e proíbe estimativa por região: o preço do quilowatt-hora varia por
 * distribuidora, por bandeira e pelos tributos estaduais, e um valor médio
 * pareceria tão sólido quanto o resto da página sem ter o mesmo lastro.
 */

import { calcularEnergia } from '../engine/calculadoras/consumo'
import { centavos } from '../engine/types'
import { formatarNumero } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularEnergia(
    {
      potencia: numero(valores, 'potencia'),
      horasPorDia: numero(valores, 'horasPorDia'),
      diasPorMes: numero(valores, 'diasPorMes'),
      quantidade: numero(valores, 'quantidade'),
      tarifaKwh: centavos(numero(valores, 'tarifaKwh')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoMensal,
      detalhamento: [
        { rotulo: 'Custo no mês', valor: v.custoMensal, sinal: 'neutro' },
        { rotulo: 'Custo em doze meses', valor: v.custoAnual, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Consumo no mês', valor: `${formatarNumero(v.kwhPorMes)} kWh` },
        { rotulo: 'Consumo por dia', valor: `${formatarNumero(v.kwhPorDia)} kWh` },
        { rotulo: 'Horas ligado no mês', valor: formatarNumero(v.horasNoMes) },
      ],
      notas: [
        'A tarifa é a da sua fatura, e ela não é a mesma no país inteiro: muda por ' +
          'distribuidora, por bandeira tarifária e pelos tributos do seu estado. Na conta de ' +
          'luz ela costuma aparecer como preço por kWh, junto do consumo do mês.',
        'A potência está na etiqueta do aparelho ou no manual, em watts. Aparelhos com motor ou ' +
          'resistência que liga e desliga sozinho — geladeira, ar-condicionado, chuveiro com ' +
          'termostato — consomem menos que a potência cheia vezes o tempo, porque não ficam no ' +
          'máximo o tempo todo.',
        'Aparelhos em espera continuam consumindo. Se quiser estimar esse consumo, informe a ' +
          'potência de espera, que costuma estar no manual, e as horas em que o aparelho fica ' +
          'desligado mas na tomada.',
      ],
    },
  }
}

export const ENERGIA: DefinicaoCalculadora = {
  id: 'CALC-065',
  slug: 'consumo-de-energia',
  nome: 'Consumo de energia por aparelho',
  linhaDeContexto: 'Quanto cada aparelho pesa na conta de luz — pela sua tarifa, não por média.',
  descricaoSeo:
    'Calcule quanto um aparelho consome por mês e quanto custa na conta de luz, pela potência em watts, pelas horas de uso e pela tarifa da sua fatura.',

  campos: [
    {
      id: 'potencia',
      rotulo: 'Potência do aparelho, em watts',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 50_000,
      ajuda: 'Está na etiqueta do aparelho ou no manual. Um chuveiro tem entre 4.500 e 7.500 W; uma lâmpada de LED, entre 5 e 15 W.',
    },
    {
      id: 'horasPorDia',
      rotulo: 'Horas ligado por dia',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 2_400,
      ajuda: 'Use decimais para frações de hora: quinze minutos são 0,25.',
    },
    {
      id: 'diasPorMes',
      rotulo: 'Dias de uso no mês',
      tipo: 'inteiro',
      padrao: 30,
      minimo: 1,
      maximo: 31,
    },
    {
      id: 'quantidade',
      rotulo: 'Quantos aparelhos iguais',
      tipo: 'inteiro',
      padrao: 1,
      minimo: 1,
      maximo: 1_000,
    },
    {
      id: 'tarifaKwh',
      rotulo: 'Tarifa por kWh',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
      ajuda: 'O preço do quilowatt-hora na sua fatura, com tributos e bandeira. Não estime: ele varia muito entre distribuidoras.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Custo do aparelho por mês',

  calcular,

  faq: [
    {
      pergunta: 'Onde encontro a tarifa do kWh na minha conta?',
      resposta:
        'Na fatura, no quadro que discrimina o consumo. Costuma aparecer como preço por kWh ao lado da quantidade consumida no mês. Uma forma alternativa de estimar é dividir o valor total da fatura pelo consumo em kWh do mês — assim a bandeira, os tributos e a iluminação pública já entram no número, e o resultado desta calculadora fica mais próximo do que você de fato paga.',
    },
    {
      pergunta: 'Por que a geladeira consome menos do que essa conta mostra?',
      resposta:
        'Porque ela não fica na potência máxima o tempo todo. O compressor liga e desliga conforme a temperatura interna, então as horas em que ela está na tomada não são horas em que está consumindo a potência cheia. O mesmo vale para ar-condicionado com inversor e para qualquer aparelho com termostato. Para esses, uma estimativa melhor usa as horas equivalentes de funcionamento, e não as horas ligado.',
    },
    {
      pergunta: 'Vale a pena trocar por um aparelho mais econômico?',
      resposta:
        'A comparação é entre o custo anual dos dois e o preço da troca. Rode a conta com a potência atual, depois com a do modelo novo, e veja a diferença no custo de doze meses — se ela paga a troca em poucos anos, a substituição se paga. Aparelhos de uso intenso e potência alta, como chuveiro e ar-condicionado, são onde a diferença aparece mais rápido.',
    },
    {
      pergunta: 'O consumo em espera importa?',
      resposta:
        'Pouco por aparelho e mais na soma. Um equipamento em espera consome poucos watts, mas fica assim mais de vinte horas por dia, todos os dias. Para estimar, informe a potência de espera indicada no manual e as horas em que o aparelho fica desligado mas conectado — a conta é a mesma.',
    },
  ],

  relacionadas: ['porcentagem', 'regra-de-tres', 'reserva-de-emergencia'],
}
