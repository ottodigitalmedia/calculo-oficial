/**
 * Guia — "Trabalho intermitente: o acerto de cada convocação".
 *
 * Bloco trabalhista restante (§11.3). O guia carrega a lição de §7.61: o regime
 * de rescisão do intermitente foi criado por medida provisória que caducou, e
 * hoje **não existe norma no lugar**. Dizer isso é o conteúdo mais útil que ele
 * pode entregar.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const CONTRATO_INTERMITENTE: Guia = {
  slug: 'trabalho-intermitente',
  titulo: 'Trabalho intermitente: o acerto de cada convocação',
  subtitulo:
    'Aqui não se espera o fim do contrato para receber — cada período trabalhado se encerra com pagamento próprio.',
  descricaoSeo:
    'Como funciona o pagamento no contrato intermitente: o que entra no acerto de cada convocação, por que férias e décimo terceiro são pagos na hora, e o que a lei deixou sem resposta.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['contrato-intermitente', 'rescisao-sem-justa-causa'],

  secoes: [
    {
      id: 'o-que-e',
      titulo: 'Um contrato que não garante trabalho',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O contrato intermitente é um vínculo com carteira assinada em que a prestação de serviço não é contínua: a empresa convoca quando precisa, o trabalhador aceita ou recusa, e só há remuneração pelos períodos efetivamente trabalhados.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Recusar uma convocação não é falta nem indisciplina, e o trabalhador pode ter mais de um contrato desse tipo. Em compensação, não há salário garantido no mês em que não houver convocação.',
        },
        {
          tipo: 'destaque',
          texto:
            'É a única modalidade da CLT em que o acerto acontece ao fim de CADA período de prestação, e não ao fim do contrato.',
        },
      ],
    },

    {
      id: 'o-acerto',
      titulo: 'O que entra no acerto de cada convocação',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A lei manda pagar, imediatamente ao fim de cada período de prestação, um conjunto de parcelas que num contrato comum ficariam para depois:',
        },
        {
          tipo: 'lista',
          itens: [
            'A remuneração das horas trabalhadas.',
            'As férias proporcionais com o adicional constitucional.',
            'O décimo terceiro proporcional.',
            'O repouso semanal remunerado.',
            'Os adicionais legais que couberem ao período.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Como cada convocação gera um acerto próprio, conferir o recibo é uma tarefa recorrente — e é justamente por ser recorrente que os erros passam despercebidos. Um avo a menos por convocação, repetido ao longo do ano, some.',
        },
        {
          tipo: 'chamada',
          slug: 'contrato-intermitente',
          texto:
            'A calculadora monta o acerto de uma convocação e separa cada parcela na memória de cálculo.',
        },
      ],
    },

    {
      id: 'o-que-a-lei-nao-responde',
      titulo: 'O que a lei deixou sem resposta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Existiu um regime completo para o intermitente: aviso prévio e multa do fundo de garantia pela metade, cálculo pela média dos valores recebidos, extinção automática do contrato após um ano sem convocação.',
        },
        {
          tipo: 'destaque',
          texto:
            'Esse regime nunca chegou a virar lei. Veio por medida provisória, que perdeu a vigência sem ser convertida — e não há norma no lugar.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência prática é que hoje não existe regra dizendo sobre que base se calcula o aviso prévio de quem não tem salário fixo. Uma calculadora que apresentasse esse valor estaria escolhendo uma interpretação e exibindo-a com aparência de norma.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há um segundo ponto sem resposta, e ele afeta o acerto de toda convocação: o repouso semanal remunerado corresponde, para quem trabalha por hora, à jornada normal de trabalho — e o intermitente não tem jornada normal. A norma não responde, e nenhuma leitura mais atenta a faz responder.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando isso acontece, o mais honesto é declarar a lacuna e pedir o dado a quem o tem — quem está com o recibo na mão — em vez de escolher um número e apresentá-lo com a mesma aparência de certeza dos que vêm da lei.',
        },
      ],
    },
  ],
}
