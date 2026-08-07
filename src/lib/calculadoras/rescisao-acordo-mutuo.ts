/**
 * CALC-008 — Rescisão por acordo mútuo (CLT, art. 484-A).
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que o acordo muda é pequeno e caro.** Duas frações e um limite de saque:
 * aviso indenizado pela metade (I, "a"), multa do FGTS pela metade (I, "b"),
 * saque limitado a 80% (§ 1º) — e as demais verbas integrais (II). Tudo o mais
 * é idêntico à dispensa sem justa causa, inclusive as incidências de INSS e
 * IRRF pesquisadas em `docs/19-incidencias-verbas-rescisorias.md`.
 *
 * Por isso ela reaproveita `calcularRescisao` em vez de existir como motor
 * próprio: a parte cara é a das incidências, e ela não pode divergir entre
 * duas implementações.
 *
 * **O custo que não aparece no valor.** O § 2º veda o ingresso no
 * Seguro-Desemprego. É a informação que mais muda a decisão de quem avalia a
 * proposta, e não produz número nenhum — por isso vira etapa da memória, nota
 * do resultado e aviso próprio.
 */

import { calcularRescisao } from "../engine/calculadoras/rescisao";
import { centavos } from "../engine/types";
import {
  formatarData,
  formatarPercentual,
  formatarReal,
} from "../format/moeda";
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
} from "./tipos";

import { INSS } from "../params/data/inss";
import { IRRF } from "../params/data/irrf";
import { TRABALHISTA } from "../params/data/trabalhista";
import { construirRegistro } from "../params/registry";

/** Registro montado no módulo adiado — ver a nota em `rescisao-sem-justa-causa.ts`. */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA);

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRescisao(
    {
      admissao: texto(valores, "admissao"),
      desligamento: texto(valores, "desligamento"),
      salario: centavos(numero(valores, "salario")),
      modalidade: "acordo-mutuo",
      regime: "clt",
      avisoPrevio:
        texto(valores, "avisoPrevio") === "trabalhado"
          ? "trabalhado"
          : "indenizado",
      temFeriasVencidas: texto(valores, "feriasVencidas") === "sim",
      saldoFgtsInformado: centavos(numero(valores, "saldoFgts")),
      dependentes: numero(valores, "dependentes"),
    },
    dataReferencia,
    registro,
  );
  if (!r.ok) return r;

  const v = r.valores;

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalLiquido,
      detalhamento: [
        { rotulo: "Saldo de salário", valor: v.saldoSalario, sinal: "credito" },
        ...(v.avisoPrevioValor > 0
          ? ([
              {
                rotulo: "Aviso prévio indenizado — metade",
                valor: v.avisoPrevioValor,
                sinal: "credito",
              },
            ] as const)
          : []),
        {
          rotulo: "13º salário proporcional",
          valor: v.decimoTerceiro,
          sinal: "credito",
        },
        ...(v.feriasVencidas > 0
          ? ([
              {
                rotulo: "Férias vencidas + 1/3",
                valor: v.feriasVencidas,
                sinal: "credito",
              },
            ] as const)
          : []),
        {
          rotulo: "Férias proporcionais + 1/3",
          valor: v.feriasProporcionais,
          sinal: "credito",
        },
        {
          rotulo: `Multa do FGTS — ${formatarPercentual(v.multaBp)}`,
          valor: v.multaFgts,
          sinal: "credito",
        },
        {
          rotulo: "Contribuição previdenciária (INSS)",
          valor: v.inss,
          sinal: "debito",
        },
        {
          rotulo: "Imposto de Renda retido na fonte",
          valor: v.irrf,
          sinal: "debito",
        },
        {
          rotulo: "Total líquido estimado",
          valor: v.totalLiquido,
          sinal: "neutro",
        },
      ],
      destaques: [
        { rotulo: "Aviso prévio", valor: `${v.diasAviso} dias` },
        {
          rotulo: `FGTS liberado para saque (${formatarPercentual(v.limiteSaqueBp)})`,
          valor: formatarReal(v.saqueDisponivel),
        },
        { rotulo: "Seguro-desemprego", valor: "Não tem direito" },
        ...(v.dataProjetada !== texto(valores, "desligamento")
          ? [
              {
                rotulo: "Tempo de serviço projetado até",
                valor: formatarData(v.dataProjetada),
              },
            ]
          : []),
      ],
      notas: [
        "O acordo custa mais do que a diferença nas verbas: além do aviso e da multa pela " +
          "metade, ele veda o seguro-desemprego. Compare o total acima com o da dispensa sem " +
          "justa causa antes de assinar.",
        "Os 20% do FGTS que ficam retidos não se perdem — continuam na conta vinculada e " +
          "podem ser sacados nas hipóteses gerais da Lei nº 8.036/1990.",
        ...(v.fgtsEstimado
          ? [
              "O saldo do FGTS foi ESTIMADO a partir do salário informado. O saldo real inclui " +
                "correção monetária e juros e consta do extrato da conta vinculada — informe-o " +
                "para um resultado exato.",
            ]
          : []),
      ],
    },
  };
};

export const RESCISAO_ACORDO_MUTUO: DefinicaoCalculadora = {
  id: "CALC-008",
  slug: "rescisao-acordo-mutuo",
  nome: "Rescisão — acordo mútuo",
  linhaDeContexto:
    "Quanto se recebe na extinção por acordo — e o que se abre mão para ter esse valor.",
  descricaoSeo:
    "Calcule a rescisão por acordo entre empregado e empregador (art. 484-A da CLT): aviso prévio e multa do FGTS pela metade, saque limitado a 80% e a vedação do seguro-desemprego.",

  campos: [
    {
      id: "admissao",
      rotulo: "Data de admissão",
      tipo: "data",
      obrigatorio: true,
    },
    {
      id: "desligamento",
      rotulo: "Data do desligamento",
      tipo: "data",
      obrigatorio: true,
    },
    {
      id: "salario",
      rotulo: "Último salário bruto",
      tipo: "monetario",
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: "avisoPrevio",
      rotulo: "Aviso prévio",
      tipo: "selecao",
      padrao: "indenizado",
      opcoes: [
        { valor: "indenizado", rotulo: "Indenizado — devido pela metade" },
        {
          valor: "trabalhado",
          rotulo: "Trabalhado — pago integralmente como salário",
        },
      ],
      ajuda: "A redução do art. 484-A alcança apenas o aviso indenizado.",
    },
    {
      id: "feriasVencidas",
      rotulo: "Tem férias vencidas não gozadas?",
      tipo: "selecao",
      padrao: "nao",
      opcoes: [
        { valor: "nao", rotulo: "Não" },
        { valor: "sim", rotulo: "Sim" },
      ],
    },
    {
      id: "saldoFgts",
      rotulo: "Saldo do FGTS (se souber)",
      tipo: "monetario",
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda:
        "Deixe em branco para estimar. O valor exato está no extrato da conta vinculada.",
    },
    {
      id: "dependentes",
      rotulo: "Número de dependentes",
      tipo: "inteiro",
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
  ],

  parametrosRequeridos: [
    "inss-tabela-progressiva",
    "irrf-tabela-progressiva",
    "irrf-deducao-dependente",
    "irrf-desconto-simplificado",
    "fgts-aliquota-deposito",
    "fgts-multa-acordo-mutuo",
    "fgts-saque-acordo-mutuo",
    "aviso-previo-fracao-acordo",
    "aviso-previo-dias-base",
  ],

  rotuloResultado: "Total líquido estimado da rescisão",

  calcular,

  avisoAdicional:
    "A extinção por acordo não autoriza o ingresso no Programa de Seguro-Desemprego (art. 484-A, § 2º, da CLT). Esse custo não aparece no valor acima.",

  faq: [
    {
      pergunta: "O que muda na rescisão por acordo?",
      resposta:
        "Três coisas, e só três. O aviso prévio indenizado é devido pela metade e a multa do FGTS cai de 40% para 20% — é o que diz o art. 484-A, I. O saque da conta vinculada fica limitado a 80% dos depósitos, pelo § 1º. Todas as demais verbas são devidas na integralidade, pelo inciso II: saldo de salário, 13º proporcional, férias vencidas e proporcionais com o terço.",
    },
    {
      pergunta: "Perco o seguro-desemprego?",
      resposta:
        "Sim. O art. 484-A, § 2º, é expresso: a extinção por acordo não autoriza o ingresso no Programa de Seguro-Desemprego. É o custo menos visível do acordo, porque não aparece em nenhuma linha da rescisão — e costuma ser maior que a diferença nas verbas. Compare o total desta calculadora com o da dispensa sem justa causa antes de decidir.",
    },
    {
      pergunta: "Os 20% do FGTS que não posso sacar são perdidos?",
      resposta:
        "Não. O § 1º limita a movimentação a 80% dos depósitos; o restante continua na sua conta vinculada e pode ser sacado nas hipóteses gerais da Lei nº 8.036/1990 — aposentadoria, compra de imóvel, doença grave, entre outras. É retenção, não perda.",
    },
    {
      pergunta: "O aviso prévio pela metade também reduz os dias?",
      resposta:
        'Não, e essa é a confusão mais comum. A lei diz "por metade: o aviso prévio, se indenizado" — o que é reduzido é a verba, não o prazo. Os dias continuam sendo os da Lei nº 12.506/2011, e o art. 487, § 1º, integra o período inteiro ao tempo de serviço. É por isso que a projeção do contrato não muda, e os avos de 13º e férias seguem contando sobre o prazo cheio. A memória de cálculo mostra as duas etapas separadas.',
    },
    {
      pergunta: "E se o aviso for trabalhado?",
      resposta:
        'Aí não há redução nenhuma. A redução do art. 484-A alcança apenas o aviso indenizado — o texto traz um "se indenizado" que não está ali por acaso. O aviso trabalhado é salário do período, e salário não se paga pela metade.',
    },
    {
      pergunta: "O acordo precisa ser homologado?",
      resposta:
        "A Reforma Trabalhista de 2017 dispensou a homologação sindical das rescisões em geral. O que esta calculadora estima são as verbas devidas pela lei — ela não avalia a validade do acordo nem substitui orientação jurídica sobre ele.",
    },
  ],

  relacionadas: [
    "acordo-ou-dispensa",
    "rescisao-sem-justa-causa",
    "aviso-previo-proporcional",
    "fgts",
  ],
};
