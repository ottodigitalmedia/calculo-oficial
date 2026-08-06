/**
 * Geração distribuída — o cronograma do Fio B. CALC-066.
 *
 * O art. 27 da Lei nº 14.300/2022 manda incidir, sobre **toda a energia
 * compensada**, um percentual crescente das componentes tarifárias de
 * distribuição — remuneração dos ativos, depreciação e custo de operação e
 * manutenção. É o que o mercado chama de "taxação do sol", e é o que faz o
 * retorno de um sistema solar piorar a cada ano de conexão.
 *
 * ```
 * I   - 15% a partir de 2023      IV  - 60% a partir de 2026
 * II  - 30% a partir de 2024      V   - 75% a partir de 2027
 * III - 45% a partir de 2025      VI  - 90% a partir de 2028
 *                                 VII - a regra do art. 17, a partir de 2029
 * ```
 *
 * ## Por que 2027, 2028 e 2029 NÃO estão cadastrados
 *
 * Estão na lei, publicados, e cadastrá-los parece virtude — é exatamente o que
 * `ESTADO-DO-PROJETO` §7.48 conta ter dado errado no DAS-MEI. O seletor de
 * período abre no ano mais recente que a calculadora sabe calcular; com 2028
 * cadastrado, a página abriria em **2028** e ofereceria um ano que ninguém está
 * vivendo, com ar de resposta.
 *
 * O inciso VII é razão adicional: de 2029 em diante a regra deixa de ser um
 * percentual e passa a ser a do art. 17, que é outra conta. Cadastrar até lá
 * exigiria implementar aquela conta também.
 *
 * **Cada vigência fecha no fim do seu ano**, e não há nenhuma aberta. Escolher
 * 2027 devolve o bloqueio de `RN-003` — que é a resposta certa até alguém
 * acrescentar a linha, no ano em que ela valer.
 *
 * ## O art. 26 não é parâmetro, é bifurcação
 *
 * Quem já tinha o sistema em 06/01/2022, ou pediu acesso em até doze meses,
 * fica fora do art. 27 até 31/12/2045. Isso não é um valor com vigência: é um
 * caminho diferente da conta, e por isso vive como **campo** na calculadora, não
 * como parâmetro. A fonte está cadastrada assim mesmo, para a tela poder citar
 * a norma que dá o benefício.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_14300_ART_26, LEI_14300_ART_27 } from './fontes'

export const ENERGIA_DISTRIBUIDA: ConjuntoDeParametros = {
  fontes: [LEI_14300_ART_27, LEI_14300_ART_26],

  parametros: [
    {
      id: 'fio-b-percentual',
      nome: 'Percentual do Fio B sobre a energia compensada',
      descricao:
        'Parcela das componentes tarifárias de distribuição que incide sobre a energia compensada de quem entrou na geração distribuída depois da Lei nº 14.300/2022.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'fio-b-2023',
      parametroId: 'fio-b-percentual',
      fonteId: 'lei-14300-2022-art-27',
      inicio: '2023-01-01',
      fim: '2023-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
      observacao: 'Art. 27, I. Vigência fechada no fim do ano: o inciso seguinte assume em 2024.',
    },
    {
      id: 'fio-b-2024',
      parametroId: 'fio-b-percentual',
      fonteId: 'lei-14300-2022-art-27',
      inicio: '2024-01-01',
      fim: '2024-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 3_000 },
      observacao: 'Art. 27, II.',
    },
    {
      id: 'fio-b-2025',
      parametroId: 'fio-b-percentual',
      fonteId: 'lei-14300-2022-art-27',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 4_500 },
      observacao: 'Art. 27, III.',
    },
    {
      id: 'fio-b-2026',
      parametroId: 'fio-b-percentual',
      fonteId: 'lei-14300-2022-art-27',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 6_000 },
      observacao:
        'Art. 27, IV. Os incisos V (75% em 2027) e VI (90% em 2028) existem e NÃO foram cadastrados — ver o cabeçalho deste arquivo.',
    },
  ],
}
