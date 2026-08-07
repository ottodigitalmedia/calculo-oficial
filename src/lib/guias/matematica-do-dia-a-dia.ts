/**
 * Guia — "A matemática do dia a dia, sem decorar fórmula".
 *
 * Fecha a cobertura (§11.3): as seis utilitárias num guia só.
 *
 * **Um guia por utilitária seria página de porta** — "como dividir a conta" não
 * sustenta um texto próprio, e seis textos rasos puxariam o domínio para baixo.
 * É exatamente o caso que §11.2 previu ao recusar o 1:1.
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1) — e não há nenhum: aritmética não é norma.
 */

import type { Guia } from './tipos'

export const MATEMATICA_DO_DIA_A_DIA: Guia = {
  slug: 'matematica-do-dia-a-dia',
  titulo: 'A matemática do dia a dia, sem decorar fórmula',
  subtitulo:
    'Porcentagem, regra de três, média e prazos — as quatro contas que resolvem quase tudo fora da calculadora científica.',
  descricaoSeo:
    'Como pensar porcentagem, regra de três, média ponderada e contagem de dias úteis sem decorar fórmula, e onde cada uma costuma dar errado.',
  atualizadoEm: '2026-08-07',
  calculadoras: [
    'porcentagem',
    'regra-de-tres',
    'media-ponderada',
    'divisao-de-conta',
    'conversor-de-unidades',
    'dias-uteis-entre-datas',
  ],

  secoes: [
    {
      id: 'porcentagem',
      titulo: 'Porcentagem: o erro está quase sempre no "de quê"',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Porcentagem é uma fração de cem, e a conta em si raramente é o problema. O que dá errado é a base: sobre qual valor o percentual incide.',
        },
        {
          tipo: 'destaque',
          texto:
            'Subir vinte por cento e depois cair vinte por cento não devolve ao ponto de partida — a queda incide sobre um valor maior.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É o mesmo mecanismo do desconto sequencial, das promoções em cascata e do reajuste seguido de correção. Sempre que houver dois percentuais em série, vale calcular um de cada vez sobre a base correta.',
        },
        {
          tipo: 'lista',
          itens: [
            'Aumento seguido de desconto igual sempre termina abaixo do original.',
            'Descontos sucessivos não se somam: trinta e depois vinte não são cinquenta.',
            'Variação percentual entre dois valores usa o valor INICIAL como base.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'porcentagem',
          texto:
            'A calculadora cobre os quatro casos — quanto é, qual o percentual, aumento e desconto.',
        },
      ],
    },

    {
      id: 'regra-de-tres',
      titulo: 'Regra de três: escrever antes de calcular',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A regra de três resolve proporção, e quase todo erro vem de montar a relação invertida. O jeito de não errar é escrever as duas grandezas com as unidades ao lado, e conferir se elas crescem juntas ou em sentidos opostos.',
        },
        {
          tipo: 'lista',
          itens: [
            'Direta: mais de um, mais do outro — o dobro de tecido para o dobro de peças.',
            'Inversa: mais de um, menos do outro — o dobro de pessoas para metade do tempo.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A inversa é onde mora o engano, e ela aparece mais do que se imagina: velocidade e tempo, número de trabalhadores e prazo, rendimento e consumo.',
        },
        {
          tipo: 'chamada',
          slug: 'regra-de-tres',
          texto: 'A calculadora resolve os dois tipos, com a proporção explicitada.',
        },
      ],
    },

    {
      id: 'medias',
      titulo: 'Média simples e média ponderada',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A média simples supõe que todos os itens têm a mesma importância. Quando não têm, ela dá a resposta errada com aparência de certa — e o caso escolar é o mais comum: prova que vale mais que trabalho.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A média ponderada multiplica cada valor pelo seu peso e divide pela soma dos pesos. É o que permite responder à pergunta que interessa: quanto preciso tirar na última avaliação para alcançar determinada média.',
        },
        {
          tipo: 'chamada',
          slug: 'media-ponderada',
          texto:
            'A calculadora aceita notas e pesos e mostra também quanto falta para a média desejada.',
        },
      ],
    },

    {
      id: 'dias-e-divisoes',
      titulo: 'Prazos, divisões e unidades',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Contar dias parece trivial até aparecer a distinção entre dias corridos e dias úteis — que é o que a maioria dos prazos usa, e que depende de feriados nacionais além dos fins de semana.',
        },
        {
          tipo: 'chamada',
          slug: 'dias-uteis-entre-datas',
          texto:
            'A calculadora conta dias úteis considerando os feriados nacionais do período.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Dividir uma conta entre pessoas é aritmética simples até haver consumo desigual, gorjeta e alguém que pagou parte antes. O trabalho não é a divisão: é organizar o que cada um deve antes de dividir.',
        },
        {
          tipo: 'chamada',
          slug: 'divisao-de-conta',
          texto: 'A calculadora aceita valores diferentes por pessoa e distribui o que sobra.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'E converter unidades tem um único cuidado que evita a maior parte dos erros: confirmar a unidade de origem antes de converter. Trocar polegada por centímetro é fácil; descobrir depois que o número estava em outra unidade é caro.',
        },
        {
          tipo: 'chamada',
          slug: 'conversor-de-unidades',
          texto: 'A calculadora converte comprimento, massa, volume, área e temperatura.',
        },
      ],
    },
  ],
}
