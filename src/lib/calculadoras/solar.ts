/**
 * CALC-066 — Retorno de energia solar.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * O catálogo a marcava sem fonte, e `ESTADO-DO-PROJETO` §7.40 explicou por que
 * ela ficou parada mesmo assim: o Fio B da Lei nº 14.300/2022 é valor legal que
 * cresce ano a ano, e não podia ser inventado nem virar campo do usuário —
 * ninguém sabe responder qual é o percentual do próprio ano.
 *
 * Agora ele está em `lib/params/` e a conta existe. O resto — geração, tarifa e
 * o mínimo da fatura — é do usuário, porque está na proposta e na conta de luz.
 */

import { calcularSolar, PARAMETROS_SOLAR, type RegimeSolar } from '../engine/calculadoras/solar'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { ENERGIA_DISTRIBUIDA } from '../params/data/energia-distribuida'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(ENERGIA_DISTRIBUIDA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const regime: RegimeSolar = texto(valores, 'regime') === 'anterior' ? 'anterior' : 'novo'

  const r = calcularSolar(
    {
      investimento: centavos(numero(valores, 'investimento')),
      geracaoMensalKwh: numero(valores, 'geracao'),
      consumoMensalKwh: numero(valores, 'consumo'),
      tarifaKwh: centavos(numero(valores, 'tarifa')),
      tarifaFioBKwh: centavos(numero(valores, 'tarifaFioB')),
      custoFixoMensal: centavos(numero(valores, 'custoFixo')),
      regime,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Energia que deixa de ser comprada', valor: v.economiaBruta, sinal: 'neutro' },
    { rotulo: 'Fio B sobre a energia compensada', valor: v.custoFioBMensal, sinal: 'debito' },
    { rotulo: 'Economia por mês', valor: v.economiaMensal, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    {
      rotulo: 'Tempo para se pagar',
      valor:
        v.paybackMeses === null
          ? 'Não se paga'
          : `${v.paybackMeses} ${v.paybackMeses === 1 ? 'mês' : 'meses'}`,
    },
    { rotulo: 'Economia por mês', valor: formatarReal(v.economiaMensal) },
    {
      rotulo: 'Fio B do ano',
      valor: v.isentoDeFioB ? 'Não incide (art. 26)' : formatarPercentual(v.percentualFioB),
    },
  ]

  if (v.paybackMeses !== null && v.paybackMeses >= 12) {
    const anos = Math.floor(v.paybackMeses / 12)
    const meses = v.paybackMeses % 12
    destaques.push({
      rotulo: 'Em anos',
      valor: meses === 0 ? `${anos}` : `${anos} anos e ${meses} ${meses === 1 ? 'mês' : 'meses'}`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economiaMensal,
      detalhamento: linhas,
      destaques,
      notas: [
        ...(v.excedenteKwh > 0
          ? [
              `Seu sistema gera ${v.excedenteKwh} kWh a mais do que você consome. Esse excedente ` +
                'NÃO entra na economia: ele vira crédito, que abate consumo dos meses seguintes e ' +
                'vence em 60 meses. Dimensionar com folga parece gratuito nas propostas, e não é.',
            ]
          : []),
        ...(v.isentoDeFioB
          ? [
              'Você marcou sistema anterior à Lei nº 14.300/2022. O art. 26 afasta a cobrança do ' +
                'Fio B até 31 de dezembro de 2045 para quem já tinha o sistema quando a lei foi ' +
                'publicada, ou pediu acesso em até doze meses. É um direito que não se transfere ' +
                'para uma instalação nova.',
            ]
          : [
              'O percentual do Fio B cresce todo ano até 2028 — 15% em 2023, 60% em 2026, 90% em ' +
                '2028. O retorno calculado aqui usa o percentual do período selecionado, e ele ' +
                'piora nos anos seguintes.',
            ]),
        'A conta é do cenário congelado de hoje. Ela NÃO considera a degradação dos painéis, que ' +
          'reduz a geração ao longo dos anos, nem o reajuste da tarifa, que aumenta a economia. ' +
          'As duas puxam em direções opostas, e estimar só uma enviesaria o resultado.',
        'Também ficam de fora manutenção, troca de inversor, seguro e bandeiras tarifárias. O ' +
          'inversor costuma ser trocado uma vez ao longo da vida do sistema.',
        'A geração mensal está na proposta do instalador, em kWh. Ela varia com a estação: no ' +
          'inverno gera menos. Use a média anual, que é o número que a proposta apresenta.',
      ],
    },
  }
}

export const SOLAR: DefinicaoCalculadora = {
  id: 'CALC-066',
  slug: 'retorno-energia-solar',
  nome: 'Retorno de energia solar',
  linhaDeContexto: 'Em quanto tempo o sistema se paga, já com a cobrança do Fio B.',
  descricaoSeo:
    'Calcule em quanto tempo um sistema de energia solar se paga, considerando o Fio B da Lei nº 14.300/2022, o excedente que vira crédito e o mínimo da fatura.',

  campos: [
    {
      id: 'investimento',
      rotulo: 'Valor do sistema',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000_000,
      ajuda: 'O total da proposta, com equipamento, instalação e projeto.',
    },
    {
      id: 'geracao',
      rotulo: 'Geração média por mês',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000,
      ajuda: 'Em kWh, como está na proposta. Use a média do ano, não a do melhor mês.',
    },
    {
      id: 'consumo',
      rotulo: 'Consumo médio por mês',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000,
      ajuda: 'Em kWh, na sua conta de luz. Vale a média dos últimos doze meses.',
    },
    {
      id: 'tarifa',
      rotulo: 'Tarifa por kWh',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda:
        'O preço cheio do quilowatt-hora na sua fatura, com tributos. Varia por distribuidora e por estado.',
    },
    {
      id: 'tarifaFioB',
      rotulo: 'Tarifa do Fio B por kWh',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda:
        'A componente TUSD Fio B. Costuma estar na proposta do instalador ou no detalhamento da fatura.',
    },
    {
      id: 'custoFixo',
      rotulo: 'Mínimo que continua pagando por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_00,
      ajuda:
        'O custo de disponibilidade e os encargos que a fatura cobra mesmo sem consumo — a conta nunca chega a zero.',
    },
    {
      id: 'regime',
      rotulo: 'Quando o sistema foi conectado',
      tipo: 'selecao',
      padrao: 'novo',
      opcoes: [
        { valor: 'novo', rotulo: 'Depois de 6 de janeiro de 2023' },
        { valor: 'anterior', rotulo: 'Antes disso, ou pedido de acesso até 6/1/2023' },
      ],
      ajuda:
        'Quem entrou antes tem direito adquirido até 2045 e não paga Fio B — art. 26 da Lei nº 14.300/2022.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_SOLAR],
  rotuloResultado: 'Economia por mês',
  calcular,

  avisoAdicional:
    'A estimativa parte do cenário de hoje: não projeta degradação dos painéis, reajuste de tarifa, manutenção nem troca de inversor. O percentual do Fio B usado é o do período selecionado, e ele cresce até 2028.',

  faq: [
    {
      pergunta: 'O que é o Fio B, e por que ele piora o meu retorno?',
      resposta:
        'É a parcela das componentes tarifárias de distribuição que passou a incidir sobre a energia que você injeta na rede e compensa depois. A Lei nº 14.300/2022 criou uma escada: 15% em 2023, 30% em 2024, 45% em 2025, 60% em 2026, 75% em 2027 e 90% em 2028. Quanto mais tarde a conexão, menor a economia por kWh compensado — e mais longo o retorno.',
    },
    {
      pergunta: 'Meu sistema é de 2021. Também pago?',
      resposta:
        'Não, até 31 de dezembro de 2045. O art. 26 da Lei nº 14.300/2022 preserva quem já tinha o sistema na data de publicação da lei, ou protocolou o pedido de acesso na distribuidora em até doze meses. É por isso que a calculadora pergunta quando você conectou: são duas contas diferentes, não um percentual diferente.',
    },
    {
      pergunta: 'Se eu gerar mais do que consumo, ganho dinheiro?',
      resposta:
        'Não. O excedente vira crédito de energia, que abate o consumo dos meses seguintes e vence em 60 meses — não é pago em dinheiro. Por isso a calculadora limita a economia ao seu consumo: dimensionar o sistema muito acima do que você usa aumenta o investimento sem aumentar a economia na mesma proporção.',
    },
    {
      pergunta: 'Por que a minha conta não vai a zero, mesmo gerando tudo?',
      resposta:
        'Porque existe um valor mínimo que a fatura cobra de qualquer consumidor conectado à rede, mais encargos e a iluminação pública. Informe esse mínimo no campo correspondente e a estimativa passa a respeitar esse piso — sem ele, a economia calculada fica maior do que a que aparece na conta.',
    },
    {
      pergunta: 'Por que não posso escolher 2027 ou 2028 no período?',
      resposta:
        'Porque a calculadora só oferece anos cujo percentual já está cadastrado com a norma correspondente, e cadastrar anos futuros faria a página abrir num ano que ninguém está vivendo — um defeito que este projeto já cometeu antes e registrou. Os percentuais de 2027 e 2028 estão na lei e entram quando cada ano chegar.',
    },
  ],

  relacionadas: ['consumo-de-energia', 'juros-compostos', 'valor-futuro-corrigido'],
}
