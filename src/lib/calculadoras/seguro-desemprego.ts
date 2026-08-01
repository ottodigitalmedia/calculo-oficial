/**
 * CALC-009 — Seguro-desemprego: parcelas e valor.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela existe por causa de CALC-008.** A rescisão por acordo avisa que o
 * trabalhador perde o seguro-desemprego e não diz quanto isso vale — e é
 * justamente esse número que decide se o acordo compensa. As duas se citam.
 */

import { calcularSeguroDesemprego } from '../engine/calculadoras/seguro-desemprego'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { SEGURO_DESEMPREGO as PARAMS } from '../params/data/seguro-desemprego'
import { INSS } from '../params/data/inss'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/**
 * `INSS` entra pelo salário mínimo, que é o piso do art. 5º, § 2º — e que já é
 * parâmetro do sistema desde T-102. Cadastrá-lo de novo aqui criaria duas
 * verdades sobre o mesmo número.
 */
const registro = construirRegistro(PARAMS, INSS)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolha = texto(valores, 'solicitacao')
  const solicitacao =
    escolha === 'segunda' ? 'segunda' : escolha === 'terceira-ou-mais' ? 'terceira-ou-mais' : 'primeira'

  const r = calcularSeguroDesemprego(
    {
      salarios: [
        centavos(numero(valores, 'salario1')),
        centavos(numero(valores, 'salario2')),
        centavos(numero(valores, 'salario3')),
      ],
      mesesTrabalhados: numero(valores, 'mesesTrabalhados'),
      solicitacao,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.total,
      detalhamento: [
        {
          rotulo: `${v.numeroDeParcelas} parcelas de ${formatarReal(v.parcela)}`,
          valor: v.total,
          sinal: 'neutro',
        },
      ],
      destaques: [
        { rotulo: 'Valor de cada parcela', valor: formatarReal(v.parcela) },
        { rotulo: 'Número de parcelas', valor: `${v.numeroDeParcelas}` },
        { rotulo: 'Média dos últimos salários', valor: formatarReal(v.media) },
      ],
      notas: [
        ...(v.aplicouTeto
          ? [
              'Sua média salarial ficou acima do limite da última faixa, então o benefício é o ' +
                'teto — o mesmo valor pago a quem ganhava muito mais. É a característica do ' +
                'seguro-desemprego que mais surpreende quem tinha salário alto.',
            ]
          : []),
        ...(v.aplicouPiso
          ? [
              'A fórmula das faixas daria menos que o salário mínimo, e a lei não permite: o ' +
                'benefício foi elevado ao piso.',
            ]
          : []),
        'O cálculo cobre o tempo de vínculo e o valor. Ele não verifica os demais requisitos do ' +
          'art. 3º da Lei nº 7.998/1990 — dispensa sem justa causa, ausência de renda própria ' +
          'suficiente e não estar recebendo benefício previdenciário continuado —, que não se ' +
          'apuram a partir de números.',
      ],
    },
  }
}

export const SEGURO_DESEMPREGO: DefinicaoCalculadora = {
  id: 'CALC-009',
  slug: 'seguro-desemprego',
  nome: 'Seguro-desemprego',
  linhaDeContexto: 'Quantas parcelas você tem direito a receber, e de quanto é cada uma.',
  descricaoSeo:
    'Calcule o seguro-desemprego: número de parcelas pelo tempo de vínculo e valor de cada uma pelas faixas da tabela vigente, com o piso do salário mínimo e o teto aplicados.',

  campos: [
    {
      id: 'salario1',
      rotulo: 'Salário do último mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'salario2',
      rotulo: 'Salário do penúltimo mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco se foi igual ao último.',
    },
    {
      id: 'salario3',
      rotulo: 'Salário do antepenúltimo mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'A lei manda usar a média dos três últimos meses.',
    },
    {
      id: 'mesesTrabalhados',
      rotulo: 'Meses trabalhados nos últimos 36',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 36,
      ajuda: 'Contando o vínculo que terminou e outros do período, se houver.',
    },
    {
      id: 'solicitacao',
      rotulo: 'Qual solicitação é esta',
      tipo: 'selecao',
      padrao: 'primeira',
      opcoes: [
        { valor: 'primeira', rotulo: 'Primeira — nunca recebi' },
        { valor: 'segunda', rotulo: 'Segunda' },
        { valor: 'terceira-ou-mais', rotulo: 'Terceira ou mais' },
      ],
      ajuda: 'O tempo mínimo de vínculo exigido cai a cada solicitação.',
    },
  ],

  parametrosRequeridos: [
    'seguro-desemprego-faixa-1-limite',
    'seguro-desemprego-faixa-2-limite',
    'seguro-desemprego-teto',
    'seguro-desemprego-meses-minimos-1a',
    'salario-minimo',
  ],

  rotuloResultado: 'Total do seguro-desemprego',

  calcular,

  avisoAdicional:
    'O cálculo cobre o tempo de vínculo e o valor. Quem defere o benefício é o Ministério do Trabalho e Emprego, que verifica os demais requisitos do art. 3º da Lei nº 7.998/1990.',

  faq: [
    {
      pergunta: 'Quantas parcelas eu tenho direito a receber?',
      resposta:
        'Depende do tempo de vínculo nos 36 meses anteriores à dispensa e de quantas vezes você já recebeu o benefício. São 5 parcelas a partir de 24 meses e 4 a partir de 12, em qualquer solicitação. Abaixo de 12 meses, só há direito da segunda solicitação em diante: 3 parcelas com no mínimo 9 meses na segunda, ou 6 meses da terceira em diante. É o art. 4º, § 2º, da Lei nº 7.998/1990.',
    },
    {
      pergunta: 'Como se calcula o valor da parcela?',
      resposta:
        'Sobre a média dos três últimos salários, em três faixas. Até o primeiro limite, multiplica-se por 0,8. Entre o primeiro e o segundo, aplica-se 0,5 apenas sobre o que excede o primeiro limite e soma-se o valor apurado sobre ele. Acima do segundo limite, o benefício é um valor fixo — o teto. Os fatores estão no art. 5º da lei; os limites são reajustados todo ano pelo INPC.',
    },
    {
      pergunta: 'Posso receber menos que um salário mínimo?',
      resposta:
        'Não. O art. 5º, § 2º, determina que o benefício não pode ser inferior ao salário mínimo. Quem ganhava perto do mínimo recebe o próprio mínimo, o que na prática significa uma reposição proporcionalmente maior que a de quem ganhava mais.',
    },
    {
      pergunta: 'Perco o seguro-desemprego se sair por acordo?',
      resposta:
        'Sim. A extinção do contrato por acordo entre as partes, do art. 484-A da CLT, não autoriza o ingresso no Programa de Seguro-Desemprego — é o que diz o § 2º daquele artigo. Use esta calculadora para dimensionar o que se perde e compare com a diferença nas verbas, que a calculadora de rescisão por acordo mostra.',
    },
    {
      pergunta: 'Pedi demissão. Tenho direito?',
      resposta:
        'Não. O seguro-desemprego pressupõe dispensa sem justa causa. Pedido de demissão e dispensa por justa causa não dão acesso ao benefício. Esta calculadora estima parcelas e valor supondo que a dispensa foi sem justa causa; ela não verifica essa condição nem as demais do art. 3º da lei.',
    },
    {
      pergunta: 'Esse é o valor exato que vou receber?',
      resposta:
        'É a estimativa com base nos salários e no tempo que você informou, aplicando a tabela vigente na data de referência. Quem defere o benefício e apura o valor oficial é o Ministério do Trabalho e Emprego, a partir dos dados do eSocial. A memória de cálculo mostra cada faixa aplicada e a fonte de cada parâmetro.',
    },
  ],

  relacionadas: ['rescisao-acordo-mutuo', 'rescisao-sem-justa-causa', 'aviso-previo-proporcional'],
}
