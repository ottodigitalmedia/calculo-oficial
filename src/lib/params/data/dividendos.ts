/**
 * Retenção sobre lucros e dividendos — art. 6º-A da Lei nº 9.250/1995. CALC-048.
 *
 * **A isenção de dividendos acabou.** Ela valia desde 1996 pelo art. 10 da Lei
 * nº 9.249/1995, e é a premissa que todo comparador CLT × PJ usava. A Lei nº
 * 15.270/2025 inseriu o art. 6º-A, que o `ESTADO-DO-PROJETO` §7.49 registrou ao
 * descobrir que a calculadora não podia ser publicada com a premissa antiga.
 *
 * O texto, lido no Planalto:
 *
 * > A partir do mês de janeiro do ano-calendário de 2026, o pagamento [...] de
 * > lucros e dividendos por uma mesma pessoa jurídica a uma mesma pessoa física
 * > residente no Brasil em montante **superior a R$ 50.000,00** em um mesmo mês
 * > fica sujeito à retenção na fonte [...] à alíquota de **10%** [...] **sobre o
 * > total do valor pago**, creditado, empregado ou entregue.
 *
 * ## Três coisas que só aparecem lendo com atenção
 *
 * 1. **Os 10% incidem sobre o TOTAL, não sobre o excedente.** Distribuir
 *    R$ 50.000,00 custa zero; distribuir R$ 50.000,01 custa R$ 5.000,00. É
 *    degrau, e o § 1º fecha a porta: *"São vedadas quaisquer deduções da base de
 *    cálculo."*
 * 2. **A soma é por MÊS, por PJ e por sócio.** O § 2º manda recalcular sobre o
 *    total do mês quando há mais de um pagamento — não se escapa parcelando.
 * 3. **O passado está preservado.** O § 3º, I afasta a retenção sobre lucros
 *    *"relativos a resultados apurados até o ano-calendário de 2025"*. Quem
 *    distribui reserva antiga não paga — e isso é entrada do usuário, não
 *    parâmetro: só ele sabe de que exercício vem o lucro.
 *
 * A vigência começa em **janeiro de 2026**, como o caput manda, e fecha no fim
 * de 2026 pelo mesmo motivo dos anexos do Simples: a calculadora que a usa não
 * resolve além disso, e vigência aberta aqui ofereceria 2027 no seletor sem que
 * as tabelas do Simples existissem para ele.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_9250_ART_6A, LEI_9250_ART_16A } from './fontes'

export const DIVIDENDOS: ConjuntoDeParametros = {
  fontes: [LEI_9250_ART_6A, LEI_9250_ART_16A],

  parametros: [
    {
      id: 'dividendos-retencao-limite-mensal',
      nome: 'Limite mensal isento de retenção sobre dividendos',
      descricao:
        'Total pago por uma mesma pessoa jurídica a uma mesma pessoa física no mês até o qual não há retenção. Ultrapassado, a alíquota incide sobre o total.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-minima-limite-anual',
      nome: 'Limite anual da tributação mínima do IRPF',
      descricao:
        'Soma de rendimentos no ano-calendário acima da qual a pessoa física fica sujeita à tributação mínima do art. 16-A. Abaixo dele, o mecanismo não incide.',
      tipo: 'valor_monetario',
    },
    {
      id: 'dividendos-retencao-aliquota',
      nome: 'Alíquota de retenção sobre dividendos',
      descricao:
        'Retenção na fonte sobre o total de lucros e dividendos pagos no mês, quando ultrapassado o limite. Sem deduções da base.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'dividendos-limite-2026',
      parametroId: 'dividendos-retencao-limite-mensal',
      fonteId: 'lei-9250-1995-art-6a',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'valor_monetario', centavos: 5_000_000 },
      observacao:
        'O caput fixa o marco em "a partir do mês de janeiro do ano-calendário de 2026". Fechada no fim de 2026 para não oferecer ano sem tabela do Simples — ver simples-nacional.ts.',
    },
    {
      id: 'irpf-minima-limite-2026',
      parametroId: 'irpf-minima-limite-anual',
      fonteId: 'lei-9250-1995-art-16a',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'valor_monetario', centavos: 60_000_000 },
      observacao:
        'Art. 16-A: "a partir do exercício de 2027, ano-calendário de 2026, a pessoa física cuja soma de todos os rendimentos recebidos no ano-calendário seja superior a R$ 600.000,00". CALC-048 usa este valor só para AVISAR que passou da fronteira — a tributação mínima em si não é calculada.',
    },
    {
      id: 'dividendos-aliquota-2026',
      parametroId: 'dividendos-retencao-aliquota',
      fonteId: 'lei-9250-1995-art-6a',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 1_000 },
      observacao: 'Incide sobre o TOTAL pago no mês, não sobre o excedente. § 1º veda deduções.',
    },
  ],
}
