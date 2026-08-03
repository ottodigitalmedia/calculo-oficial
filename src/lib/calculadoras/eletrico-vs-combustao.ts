/**
 * CALC-058 — Carro elétrico vs. combustão: custo por km.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O recorte é declarado, e é o que torna a comparação honesta.** Ela compara
 * energia por quilômetro, e só isso. Manutenção, seguro e perda de valor diferem
 * entre os dois carros e não entram — os dois primeiros o usuário informa em
 * CALC-057, para cada veículo, e o terceiro é o dado que o mercado brasileiro
 * menos publica de forma confiável. Uma comparação que fingisse cobrir tudo
 * seria pior que uma que diz onde para.
 *
 * **A unidade do elétrico é km/kWh.** As duas formas circulam — km/kWh e
 * kWh/100 km —, e trocá-las erra por um fator de cem.
 */

import { compararEletricoVsCombustao } from '../engine/calculadoras/veiculos'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = compararEletricoVsCombustao(
    {
      kmPorMes: numero(valores, 'kmPorMes'),
      consumoCombustao: numero(valores, 'consumoCombustao'),
      precoLitro: centavos(numero(valores, 'precoLitro')),
      consumoEletrico: numero(valores, 'consumoEletrico'),
      tarifaKwh: centavos(numero(valores, 'tarifaKwh')),
      diferencaDePreco: centavos(numero(valores, 'diferencaDePreco')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Por km a combustão', valor: formatarReal(v.custoPorKmCombustao) },
    { rotulo: 'Por km elétrico', valor: formatarReal(v.custoPorKmEletrico) },
    {
      rotulo: v.economiaMensal >= 0 ? 'Economia em doze meses' : 'Custo a mais em doze meses',
      valor: formatarReal(Math.abs(v.economiaAnual)),
    },
  ]

  if (v.mesesParaPagarADiferenca > 0) {
    destaques.push({
      rotulo: 'Meses para a economia cobrir a diferença de preço',
      valor: `${v.mesesParaPagarADiferenca}`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economiaMensal,
      /** A primeira linha menos a segunda é exatamente a terceira. */
      detalhamento: [
        { rotulo: 'Combustível no mês', valor: v.custoMensalCombustao, sinal: 'debito' },
        { rotulo: 'Energia no mês', valor: v.custoMensalEletrico, sinal: 'debito' },
        {
          rotulo: v.economiaMensal >= 0 ? 'Economia por mês' : 'Custo a mais por mês',
          valor: v.economiaMensal,
          sinal: 'neutro',
        },
      ],
      destaques,
      notas: [
        'A comparação é só de ENERGIA por quilômetro. Manutenção, seguro e perda de valor ' +
          'diferem entre os dois e não entram aqui — para o custo cheio de cada carro, a ' +
          'calculadora de custo mensal do carro soma tudo, e vale rodá-la duas vezes.',
        'Onde você carrega muda o resultado. A tarifa da sua fatura vale para carregar em casa; ' +
          'eletroposto costuma custar bem mais, e em viagem a conta pode se inverter. Se você ' +
          'divide entre os dois, use uma tarifa média ponderada pelo uso.',
        'O consumo do elétrico aqui é em km/kWh. Se a ficha do seu carro traz kWh por 100 km, ' +
          'divida 100 pelo número dela: 15 kWh/100 km são 6,67 km/kWh.',
        'A diferença de preço na compra, quando informada, é comparada só com a economia de ' +
          'energia. Incentivos, isenções e a diferença de valor na revenda ficam de fora, e ' +
          'podem pesar mais que o combustível.',
      ],
    },
  }
}

export const ELETRICO_VS_COMBUSTAO: DefinicaoCalculadora = {
  id: 'CALC-058',
  slug: 'eletrico-ou-combustao',
  nome: 'Carro elétrico ou a combustão',
  linhaDeContexto: 'Quanto cada um custa por quilômetro — pela sua tarifa e pelo seu consumo.',
  descricaoSeo:
    'Compare o custo por quilômetro de um carro elétrico e um a combustão a partir do consumo real, do preço do combustível e da tarifa de energia da sua conta de luz.',

  campos: [
    {
      id: 'kmPorMes',
      rotulo: 'Quilômetros rodados por mês',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'consumoCombustao',
      rotulo: 'Consumo do carro a combustão, em km/l',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
    },
    {
      id: 'precoLitro',
      rotulo: 'Preço do combustível por litro',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'consumoEletrico',
      rotulo: 'Consumo do elétrico, em km/kWh',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Se a ficha traz kWh por 100 km, divida 100 por ela: 15 kWh/100 km são 6,67 km/kWh.',
    },
    {
      id: 'tarifaKwh',
      rotulo: 'Tarifa por kWh',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
      ajuda: 'A da sua fatura, se carrega em casa. Em eletroposto, o preço cobrado lá.',
    },
    {
      id: 'diferencaDePreco',
      rotulo: 'Quanto o elétrico custa a mais na compra',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 5_000_000_000,
      ajuda: 'Deixe em branco para comparar só o custo de rodar.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Diferença por mês',

  calcular,

  faq: [
    {
      pergunta: 'Por que a conta cobre só a energia?',
      resposta:
        'Porque é a parte que dá para comparar com honestidade a partir de dados que você tem. Manutenção e seguro variam por modelo e por perfil, e a perda de valor de carros elétricos no mercado brasileiro ainda não tem série pública confiável. Incluir estimativas dessas três daria ao resultado uma aparência de completude que ele não teria. Para o custo cheio de cada carro, a calculadora de custo mensal do carro soma tudo — rode-a uma vez para cada.',
    },
    {
      pergunta: 'Qual tarifa de energia eu informo?',
      resposta:
        'A da sua fatura, se você carrega em casa — ela aparece como preço por kWh, e já inclui tributos e bandeira. Se carrega em eletroposto, use o preço cobrado lá, que costuma ser bem maior. Quem alterna entre os dois deve usar uma média ponderada pelo uso: carregar sempre em casa e comparar com o custo de eletroposto dá um resultado que não corresponde a nenhum dos dois casos.',
    },
    {
      pergunta: 'Meu carro elétrico faz quantos km/kWh?',
      resposta:
        'A ficha técnica costuma trazer o dado, às vezes na forma invertida — kWh por 100 km. Para converter, divida 100 pelo número: 15 kWh/100 km equivalem a 6,67 km/kWh. Como no carro a combustão, o consumo real depende de trânsito, ar-condicionado e estilo de condução, e o do fabricante costuma ser otimista.',
    },
    {
      pergunta: 'Em quanto tempo o elétrico se paga?',
      resposta:
        'Informando quanto ele custa a mais na compra, o resultado mostra em quantos meses a economia de energia cobre essa diferença. Leia esse número com cuidado: ele considera só o combustível. Diferenças de manutenção, seguro, incentivos fiscais e valor de revenda ficam de fora, e as quatro podem pesar mais que a economia no posto — para os dois lados.',
    },
  ],

  relacionadas: ['custo-mensal-do-carro', 'alcool-ou-gasolina', 'consumo-de-energia'],
}
