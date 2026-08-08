/**
 * CALC-002 — Rescisão por demissão sem justa causa.
 *
 * Campos e microcopy de `03-functional-spec` §3.2, usados literalmente — o
 * documento diz que todo texto entre aspas ali é final.
 *
 * A pesquisa de incidências está em `docs/19-incidencias-verbas-rescisorias.md`,
 * e o motor cita o fundamento de cada uma no traço.
 */

import { calcularRescisao } from "../engine/calculadoras/rescisao";
import { centavos } from "../engine/types";
import { formatarData } from "../format/moeda";
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

/**
 * Registro montado aqui, e não recebido de fora.
 *
 * Vive no módulo ADIADO: as tabelas legais só entram no navegador junto com o
 * cálculo que as usa, e não no pacote estático de toda rota. Ver
 * `tipos.ts`, `FuncaoCalculo`.
 */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA);

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRescisao(
    {
      admissao: texto(valores, "admissao") as never,
      desligamento: texto(valores, "desligamento") as never,
      salario: centavos(numero(valores, "salario")),
      modalidade: "sem-justa-causa",
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
                rotulo: "Aviso prévio indenizado",
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
          rotulo: "Multa de 40% do FGTS",
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
        ...(v.fgtsEstimado
          ? [
              "O saldo do FGTS foi ESTIMADO a partir do salário informado. O saldo real inclui " +
                "correção monetária e juros e consta do extrato da conta vinculada — informe-o " +
                "para um resultado exato.",
            ]
          : []),
        "A memória de cálculo mostra, verba a verba, se incide contribuição previdenciária e " +
          "imposto de renda, com o link para a norma ou a tese que fundamenta cada decisão.",
      ],
    },
  };
};

export const RESCISAO_SEM_JUSTA_CAUSA: DefinicaoCalculadora = {
  id: "CALC-002",
  slug: "rescisao-sem-justa-causa",
  nome: "Rescisão — demissão sem justa causa",
  linhaDeContexto:
    "Quanto você tem a receber na demissão sem justa causa — verba a verba, com as incidências à mostra.",
  descricaoSeo:
    "Calcule as verbas da rescisão sem justa causa: saldo de salário, aviso prévio, 13º, férias e multa do FGTS, com a norma de cada incidência à mostra.",

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
        { valor: "indenizado", rotulo: "Indenizado" },
        { valor: "trabalhado", rotulo: "Trabalhado" },
      ],
      ajuda:
        "Indenizado é o mais comum: você é dispensado e não cumpre o período.",
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
    "fgts-multa-sem-justa-causa",
    "aviso-previo-dias-base",
  ],

  rotuloResultado: "Total líquido estimado da rescisão",

  calcular,

  avisoAdicional:
    "O saldo do FGTS e a multa dependem dos depósitos efetivamente realizados e corrigidos, " +
    "que constam apenas do extrato da conta vinculada.",

  faq: [
    {
      pergunta: "Por que o aviso prévio indenizado não tem desconto de INSS?",
      resposta:
        "Porque o Superior Tribunal de Justiça decidiu, em recurso repetitivo, que não incide contribuição previdenciária sobre ele, por não se tratar de verba salarial (Tema 478). A letra da Lei nº 8.212/1991 não o exclui expressamente — há divergência, e o cálculo segue a tese vinculante do STJ. A memória de cálculo mostra essa decisão com o link para o tema.",
    },
    {
      pergunta: "As férias indenizadas pagam imposto de renda?",
      resposta:
        "Não. A Súmula 386 do STJ firmou que são isentas as indenizações de férias proporcionais e o respectivo adicional. O terço constitucional acompanha a natureza do principal: quando as férias são gozadas ele é salarial e tributável; quando são indenizadas na rescisão, é isento junto com elas.",
    },
    {
      pergunta: "Quantos dias de aviso prévio eu tenho direito a receber?",
      resposta:
        "A Lei nº 12.506/2011 fixa 30 dias e acrescenta 3 dias por ano de serviço na mesma empresa, até o total de 90 dias. A lei não diz a partir de qual ano o acréscimo começa; o cálculo adota o primeiro ano completo, conforme entendimento consolidado da Justiça do Trabalho, e a memória declara essa escolha.",
    },
    {
      pergunta:
        "Por que o valor da multa do FGTS pode não bater com o meu extrato?",
      resposta:
        "Se você não informar o saldo, o cálculo estima os depósitos a partir do salário atual — e a estimativa ignora aumentos, faltas, afastamentos e, principalmente, a correção monetária e os juros que o saldo real acumula. Informe o saldo do extrato para um resultado exato. O resultado sempre declara quando o valor é estimado.",
    },
    {
      pergunta: "Por que o desconto do 13º aparece separado do resto?",
      resposta:
        "Porque o Regulamento da Previdência Social manda apurá-lo em separado: na rescisão, a parcela da gratificação natalina é computada à parte e não se soma ao saldo de salário para efeito da tabela progressiva. O imposto de renda sobre o 13º também é apurado em separado, com tributação exclusiva na fonte.",
    },
  ],

  relacionadas: ["acordo-ou-dispensa", "salario-liquido", "inss", "irrf"],
};
