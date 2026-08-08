/**
 * CALC-031 — Financiamento imobiliário: SAC vs. Price completo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A diferença para CALC-025 é a única que importa aqui:** o que o banco cobra
 * ao lado da amortização. O seguro de morte e invalidez, o seguro de danos ao
 * imóvel e a tarifa de administração não aparecem na taxa anunciada, entram
 * todo mês na prestação e, num contrato de trinta anos, respondem por uma fatia
 * que surpreende quem só olhou o percentual.
 *
 * Os três são digitados, nunca estimados — variam por seguradora, por banco e
 * pela idade do tomador, e não há fonte oficial que os fixe (`docs/18` §3.2).
 */

import { calcularFinanciamentoImobiliario } from '../engine/calculadoras/imobiliario'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const sistema = texto(valores, 'sistema') === 'price' ? 'price' : 'sac'
  const valorFinanciado = centavos(numero(valores, 'valorFinanciado'))

  const r = calcularFinanciamentoImobiliario(
    {
      valorFinanciado,
      prazoMeses: numero(valores, 'prazoMeses'),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
      sistema,
      mipPrimeiraParcela: centavos(numero(valores, 'mip')),
      dfiMensal: centavos(numero(valores, 'dfi')),
      tarifaMensal: centavos(numero(valores, 'tarifa')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const outroSistema = sistema === 'sac' ? 'Price' : 'SAC'
  const totalDoOutro = sistema === 'sac' ? v.totalPrice : v.totalSac

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalPago,
      /**
       * O detalhamento DECOMPÕE o total, e a soma tem de fechar com ele.
       *
       * `ESTADO-DO-PROJETO` §7.12 registra o defeito que esta escolha evita: em
       * CALC-023 cada número estava certo isoladamente e a coluna não somava,
       * porque uns vinham antes e outros depois de um teto. Aqui as quatro
       * linhas são as parcelas exatas do total, e um caso-ouro cobra a
       * identidade sobre a saída DESTA função — não a do motor.
       */
      detalhamento: [
        { rotulo: 'Valor financiado', valor: valorFinanciado, sinal: 'neutro' },
        { rotulo: 'Juros do contrato', valor: v.totalJuros, sinal: 'debito' },
        ...(v.totalSeguros > 0
          ? ([{ rotulo: 'Seguros MIP e DFI', valor: v.totalSeguros, sinal: 'debito' }] as const)
          : []),
        ...(v.totalTarifas > 0
          ? ([
              { rotulo: 'Tarifa de administração', valor: v.totalTarifas, sinal: 'debito' },
            ] as const)
          : []),
        { rotulo: 'Total pago ao fim do contrato', valor: v.totalPago, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Primeira prestação', valor: formatarReal(v.primeiraPrestacao) },
        { rotulo: 'Última prestação', valor: formatarReal(v.ultimaPrestacao) },
        ...(v.totalEncargos > 0
          ? [
              {
                rotulo: 'Seguros e tarifa no total pago',
                valor: formatarPercentual(v.parteDosEncargosBp),
              },
            ]
          : []),
        { rotulo: `Total no sistema ${outroSistema}`, valor: formatarReal(totalDoOutro) },
      ],
      tabela: {
        titulo: 'Evolução ao fim de cada ano',
        colunas: ['Prestação', 'Juros do mês', 'Seguros e tarifa', 'Saldo devedor'],
        linhas: v.evolucao.map((linha) => ({
          rotulo: `Ano ${linha.ano}`,
          valores: [linha.prestacao, linha.juros, linha.encargos, linha.saldo],
        })),
      },
      notas: [
        'O MIP incide sobre o saldo devedor, então ele cai a cada mês junto com o saldo — a ' +
          'conta parte do valor que você informou para a primeira prestação e o reduz na mesma ' +
          'proporção. O DFI e a tarifa são fixos, porque a base deles não muda. Seguradoras ' +
          'ainda reajustam o prêmio conforme a idade do segurado, e esse reajuste não entra aqui.',
        'O saldo devedor aqui não é corrigido por índice. Contratos do sistema financeiro ' +
          'da habitação costumam corrigir o saldo pela TR todo mês, e quando isso acontece as ' +
          'prestações e o total ficam acima do que esta estimativa mostra.',
        'Custos de aquisição ficam de fora: ITBI, registro em cartório, avaliação do imóvel e ' +
          'eventual tarifa de contratação são pagos uma vez, fora da prestação, e não entram ' +
          'nesta conta.',
      ],
    },
  }
}

export const FINANCIAMENTO_IMOBILIARIO: DefinicaoCalculadora = {
  id: 'CALC-031',
  slug: 'financiamento-imobiliario',
  nome: 'Financiamento imobiliário',
  linhaDeContexto:
    'Quanto a prestação custa de verdade — com os seguros e a tarifa dentro da conta.',
  descricaoSeo:
    'Simule um financiamento imobiliário no SAC ou no Price com MIP, DFI e tarifa na prestação. Veja a primeira parcela, a última e quanto do total é seguro.',

  campos: [
    {
      id: 'valorFinanciado',
      rotulo: 'Valor financiado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 500_000_000,
      ajuda: 'O que o banco empresta — o valor do imóvel menos a entrada.',
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 420,
      ajuda: 'Trinta anos são 360 meses; trinta e cinco, 420.',
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda:
        'A taxa mensal do contrato. Bancos costumam anunciar a taxa ao ano; a mensal aparece na simulação e na planilha de evolução.',
    },
    {
      id: 'sistema',
      rotulo: 'Sistema de amortização',
      tipo: 'selecao',
      padrao: 'sac',
      opcoes: [
        { valor: 'sac', rotulo: 'SAC — prestação decrescente' },
        { valor: 'price', rotulo: 'Price — amortização e juros constantes' },
      ],
      ajuda: 'Quem escolhe costuma ser o banco. A comparação com o outro sistema sai junto.',
    },
    {
      id: 'mip',
      rotulo: 'Seguro MIP na primeira prestação',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
      ajuda:
        'Morte e invalidez permanente. Está na simulação do banco, incide sobre o saldo devedor e cai junto com ele.',
    },
    {
      id: 'dfi',
      rotulo: 'Seguro DFI por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
      ajuda:
        'Danos físicos ao imóvel. Incide sobre o valor de avaliação, que não muda — por isso é o mesmo todo mês.',
    },
    {
      id: 'tarifa',
      rotulo: 'Tarifa de administração por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000,
      ajuda: 'A tarifa mensal do contrato, quando houver.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Total pago ao fim do financiamento',

  calcular,

  faq: [
    {
      pergunta: 'Por que a prestação é maior que a parcela anunciada?',
      resposta:
        'Porque a parcela anunciada costuma ser só amortização mais juros. O que sai da sua conta inclui ainda o seguro de morte e invalidez, o seguro de danos ao imóvel e a tarifa mensal de administração. Em contratos longos esses três somam uma fatia relevante do total pago, e é justamente a fatia que a taxa de juros divulgada não descreve.',
    },
    {
      pergunta: 'O que são MIP e DFI, e por que são dois?',
      resposta:
        'São coberturas diferentes. O MIP protege contra a morte ou a invalidez permanente de quem tomou o crédito, e quita o saldo devedor nessa hipótese — por isso ele incide sobre o saldo e diminui conforme você paga. O DFI cobre danos físicos ao imóvel dado em garantia, e incide sobre o valor de avaliação, que não muda ao longo do contrato. Os prêmios variam por seguradora, por banco e pela idade do segurado, e por isso são campos aqui, e não números que a calculadora inventa.',
    },
    {
      pergunta: 'SAC ou Price — qual sai mais barato?',
      resposta:
        'Com a mesma taxa e o mesmo prazo, o SAC custa menos no total, porque amortiza mais cedo e os juros passam a incidir sobre um saldo que cai mais rápido. A contrapartida é a primeira prestação, que no SAC é bem maior — e é ela que a análise de crédito olha para saber se cabe na sua renda. Compare os dois totais que aparecem no resultado antes de concluir.',
    },
    {
      pergunta: 'É este o valor que o banco vai cobrar?',
      resposta:
        'É uma estimativa a partir dos números que você informou. Duas coisas comuns em contrato real ficam de fora: a correção do saldo devedor por índice, que muitos contratos aplicam mês a mês, e o reajuste do prêmio do seguro conforme a idade do segurado. As duas empurram o valor para cima. Para comparar propostas de bancos diferentes, o número que resume tudo é o custo efetivo total.',
    },
    {
      pergunta: 'Onde encontro o valor dos seguros e da tarifa?',
      resposta:
        'Na simulação que o banco entrega antes da contratação e na planilha de evolução do financiamento, que abre a composição de cada prestação. Se você já tem contrato assinado, os mesmos valores aparecem no extrato ou no boleto, discriminados linha a linha. Com os campos de seguro em branco, o resultado mostra apenas amortização e juros.',
    },
  ],

  relacionadas: ['amortizacao-sac-price', 'capacidade-de-financiamento', 'cet-custo-efetivo-total'],
}
