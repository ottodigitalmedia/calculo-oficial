/**
 * Jornada e intervalos — CALC-115.
 *
 * Os números da conta de horas: oito diárias e quarenta e quatro semanais
 * (Constituição, art. 7º, XIII), o intervalo do art. 71 da CLT conforme a
 * duração do trabalho, as onze horas entre jornadas do art. 66 e o acréscimo
 * de 50% sobre o intervalo suprimido (art. 71, § 4º, redação de 2017).
 *
 * **Tudo em MINUTOS**, que é o grão da entrada — oito horas são 480.
 *
 * **A escala 12 × 36 do art. 59-A** (CALC-120) também mora aqui, em minutos:
 * doze horas de trabalho e trinta e seis de descanso, desde a mesma reforma.
 *
 * **O § 4º tem vigência própria.** Antes de 11/11/2017 a redação era outra, e a
 * jurisprudência mandava pagar a hora inteira do intervalo; a cobertura desta
 * calculadora começa na redação atual e não tenta reconstruir a anterior.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CF_ART_7_XIII, CLT_ART_59A, CLT_ART_66, CLT_ART_71 } from './fontes'

/** Constituição de 1988, promulgada e em vigor em 05/10/1988. */
const CF = '1988-10-05'
/** CLT, em vigor em 10/11/1943 (art. 911). */
const CLT = '1943-11-10'
/** Lei nº 13.467/2017, em vigor 120 dias após o DOU de 14/07/2017 (art. 6º). */
const REFORMA = '2017-11-11'

export const JORNADA: ConjuntoDeParametros = {
  fontes: [CF_ART_7_XIII, CLT_ART_59A, CLT_ART_66, CLT_ART_71],

  parametros: [
    { id: 'jornada-normal-diaria-minutos', nome: 'Jornada normal diária', descricao: 'Duração normal do trabalho por dia, em minutos.', tipo: 'inteiro' },
    { id: 'jornada-normal-semanal-minutos', nome: 'Jornada normal semanal', descricao: 'Duração normal do trabalho por semana, em minutos.', tipo: 'inteiro' },
    { id: 'intervalo-limite-jornada-longa-minutos', nome: 'Intervalo — jornada acima da qual é de uma hora', descricao: 'Trabalho contínuo acima desta duração, em minutos, exige o intervalo mínimo de uma hora.', tipo: 'inteiro' },
    { id: 'intervalo-minimo-jornada-longa-minutos', nome: 'Intervalo mínimo da jornada longa', descricao: 'Intervalo mínimo, em minutos, quando o trabalho passa do limite.', tipo: 'inteiro' },
    { id: 'intervalo-maximo-sem-acordo-minutos', nome: 'Intervalo máximo sem acordo', descricao: 'Intervalo máximo, em minutos, salvo acordo escrito ou contrato coletivo.', tipo: 'inteiro' },
    { id: 'intervalo-limite-jornada-curta-minutos', nome: 'Intervalo — jornada acima da qual há pausa curta', descricao: 'Trabalho acima desta duração, em minutos, e até o limite da jornada longa exige a pausa curta.', tipo: 'inteiro' },
    { id: 'intervalo-minimo-jornada-curta-minutos', nome: 'Intervalo mínimo da jornada curta', descricao: 'Pausa mínima, em minutos, da jornada entre os dois limites.', tipo: 'inteiro' },
    { id: 'interjornada-minima-minutos', nome: 'Descanso mínimo entre jornadas', descricao: 'Minutos consecutivos de descanso entre duas jornadas.', tipo: 'inteiro' },
    { id: 'escala-12x36-trabalho-minutos', nome: 'Escala 12 × 36 — trabalho seguido', descricao: 'Horas seguidas de trabalho da escala do art. 59-A, em minutos.', tipo: 'inteiro' },
    { id: 'escala-12x36-descanso-minutos', nome: 'Escala 12 × 36 — descanso ininterrupto', descricao: 'Horas ininterruptas de descanso depois de cada plantão da escala do art. 59-A, em minutos.', tipo: 'inteiro' },
    { id: 'intervalo-suprimido-acrescimo', nome: 'Intervalo suprimido — acréscimo', descricao: 'Acréscimo sobre a hora normal no pagamento do período de intervalo suprimido.', tipo: 'percentual' },
  ],

  vigencias: [
    { id: 'jornada-diaria-1988', parametroId: 'jornada-normal-diaria-minutos', fonteId: 'cf-1988-art-7-xiii', inicio: CF, fim: null, valor: { tipo: 'inteiro', valor: 480 }, observacao: 'Oito horas diárias.' },
    { id: 'jornada-semanal-1988', parametroId: 'jornada-normal-semanal-minutos', fonteId: 'cf-1988-art-7-xiii', inicio: CF, fim: null, valor: { tipo: 'inteiro', valor: 2640 }, observacao: 'Quarenta e quatro horas semanais.' },
    { id: 'intervalo-limite-longa-1943', parametroId: 'intervalo-limite-jornada-longa-minutos', fonteId: 'clt-art-71', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 360 }, observacao: 'Caput: trabalho contínuo "cuja duração exceda de 6 horas".' },
    { id: 'intervalo-minimo-longa-1943', parametroId: 'intervalo-minimo-jornada-longa-minutos', fonteId: 'clt-art-71', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 60 } },
    { id: 'intervalo-maximo-1943', parametroId: 'intervalo-maximo-sem-acordo-minutos', fonteId: 'clt-art-71', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 120 } },
    { id: 'intervalo-limite-curta-1943', parametroId: 'intervalo-limite-jornada-curta-minutos', fonteId: 'clt-art-71', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 240 }, observacao: '§ 1º: quando a duração "ultrapassar 4 horas".' },
    { id: 'intervalo-minimo-curta-1943', parametroId: 'intervalo-minimo-jornada-curta-minutos', fonteId: 'clt-art-71', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 15 } },
    { id: 'interjornada-1943', parametroId: 'interjornada-minima-minutos', fonteId: 'clt-art-66', inicio: CLT, fim: null, valor: { tipo: 'inteiro', valor: 660 }, observacao: 'Onze horas consecutivas.' },
    { id: 'intervalo-suprimido-2017', parametroId: 'intervalo-suprimido-acrescimo', fonteId: 'clt-art-71', inicio: REFORMA, fim: null, valor: { tipo: 'percentual', aliquotaBp: 5_000 }, observacao: '§ 4º na redação da Lei nº 13.467/2017: paga-se "apenas do período suprimido", com natureza indenizatória.' },
    { id: 'escala-12x36-trabalho-2017', parametroId: 'escala-12x36-trabalho-minutos', fonteId: 'clt-art-59-a', inicio: REFORMA, fim: null, valor: { tipo: 'inteiro', valor: 720 }, observacao: 'Caput do art. 59-A: "doze horas seguidas". A MP nº 808/2017 mudou a forma de ajuste, não a duração, e caducou em 23/04/2018.' },
    { id: 'escala-12x36-descanso-2017', parametroId: 'escala-12x36-descanso-minutos', fonteId: 'clt-art-59-a', inicio: REFORMA, fim: null, valor: { tipo: 'inteiro', valor: 2160 }, observacao: 'Caput do art. 59-A: "trinta e seis horas ininterruptas de descanso".' },
  ],
}
