/**
 * CALC-117 — DAE do empregador doméstico.
 *
 * Quem contrata doméstica, babá, cuidador ou caseiro paga todo mês uma guia só,
 * o DAE, e quase ninguém sabe o que está dentro dela. A página abre a guia em
 * seis partes e separa o que é descontado do empregado do que é custo do
 * empregador.
 *
 * Motor em `engine/calculadoras/dae-domestico.ts`.
 */

import { PARAMETROS_DAE, calcularDae } from '../engine/calculadoras/dae-domestico'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { DOMESTICO } from '../params/data/domestico'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA, DOMESTICO)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularDae(
    { salario: centavos(numero(valores, 'salario')), dependentes: numero(valores, 'dependentes') },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.dae,
      detalhamento: [
        { rotulo: 'INSS do empregado (descontado do salário)', valor: v.inssEmpregado, sinal: 'neutro' },
        ...(v.irrf > 0 ? [{ rotulo: 'Imposto de renda (descontado do salário)', valor: v.irrf, sinal: 'neutro' as const }] : []),
        { rotulo: 'Contribuição patronal', valor: v.patronal, sinal: 'debito' },
        { rotulo: 'Seguro contra acidentes', valor: v.seguroAcidente, sinal: 'debito' },
        { rotulo: 'FGTS', valor: v.fgts, sinal: 'debito' },
        { rotulo: 'Indenização compensatória', valor: v.indenizacao, sinal: 'debito' },
      ],
      destaques: [
        { rotulo: 'Custo mensal do empregador', valor: formatarReal(v.custoDoEmpregador) },
        { rotulo: 'Salário líquido do empregado', valor: formatarReal(v.liquidoDoEmpregado) },
      ],
      notas: [
        'O DAE junta o que é descontado do empregado — INSS e imposto de renda — com o que o empregador paga além do salário. Só a segunda parte é custo a mais para quem contrata.',
        'A indenização compensatória é uma reserva para a multa da dispensa sem justa causa: depositada mês a mês, em vez de paga de uma vez.',
        'No mês do 13º e no das férias a guia muda — esta estimativa é a de um mês comum.',
        'Vale-transporte, quando devido, é pago à parte e pode ter desconto de até 6% do salário do empregado.',
      ],
    },
  }
}

export const DAE_DO_EMPREGADOR_DOMESTICO: DefinicaoCalculadora = {
  id: 'CALC-117',
  slug: 'dae-do-empregador-domestico',
  nome: 'DAE do empregador doméstico',
  linhaDeContexto: 'O que vai na guia mensal de quem contrata doméstica, babá ou cuidador — e quanto ela custa de verdade.',
  descricaoSeo:
    'Calcule o DAE do empregado doméstico: INSS, contribuição patronal, seguro-acidente, FGTS e indenização compensatória, e o custo mensal de quem contrata.',

  campos: [
    { id: 'salario', rotulo: 'Salário mensal', tipo: 'monetario', obrigatorio: true, padrao: 162_100, minimo: 0, maximo: 10_000_000 },
    { id: 'dependentes', rotulo: 'Dependentes do empregado (imposto de renda)', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 20 },
  ],

  parametrosRequeridos: [...PARAMETROS_DAE],

  rotuloResultado: 'DAE do mês',

  calcular,

  faq: [
    {
      pergunta: 'O que é o DAE do empregado doméstico?',
      resposta:
        'É o documento único de arrecadação do Simples Doméstico (LC nº 150/2015, art. 34). Numa guia só vão o INSS do empregado, a contribuição patronal, o seguro contra acidentes, o FGTS, a indenização compensatória e, se houver, o imposto de renda retido.',
    },
    {
      pergunta: 'Quanto o empregador paga além do salário?',
      resposta:
        'Oito por cento de contribuição patronal, 0,8% de seguro contra acidentes, 8% de FGTS e 3,2% de indenização compensatória — 20% ao todo. O INSS e o imposto de renda também vão na guia, mas saem do salário do empregado.',
    },
    {
      pergunta: 'O que é a indenização compensatória de 3,2%?',
      resposta:
        'Uma reserva para a indenização da dispensa sem justa causa, depositada todo mês. Na dispensa por justa causa ou a pedido, no fim de contrato por prazo determinado, na aposentadoria e no falecimento, o valor é movimentado pelo empregador; na culpa recíproca, metade fica com cada um (LC nº 150/2015, art. 22).',
    },
    {
      pergunta: 'O INSS da doméstica é fixo?',
      resposta:
        'Não. Ele segue a tabela progressiva do INSS, como o de qualquer empregado, de 7,5% a 14% por faixa de salário.',
    },
    {
      pergunta: 'Qual o prazo do DAE?',
      resposta:
        'A guia se refere à remuneração do mês anterior, incluído o 13º quando for o caso (art. 34, § 1º). A data de vencimento aparece no próprio documento.',
    },
  ],

  relacionadas: ['rescisao-domestico', 'custo-do-funcionario', 'salario-liquido', 'inss'],
}
