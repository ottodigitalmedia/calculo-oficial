/**
 * Contrato a prazo, transferência, sobreaviso e prontidão.
 *
 * Lote 2 da expansão do catálogo — CALC-089, CALC-090 e CALC-091. Transcrição
 * literal de cada dispositivo em `fontes.ts`, junto da fonte.
 *
 * **Frações como a norma as escreve** (`ADR-007` F-2): um terço e dois terços
 * não cabem em basis points sem arredondar, e a metade do art. 479 fica como
 * fração pela mesma razão de leitura — é "por metade" que está na lei.
 *
 * Vigência a partir da publicação, pela razão de `trabalhista.ts`: são regras do
 * corpo da CLT que só mudam por alteração legislativa. O art. 479 é texto
 * original da CLT e segue a convenção de `trabalhista.ts` para ele.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CLT_ART_244, CLT_ART_469, CLT_ART_479 } from './fontes'

export const DISPONIBILIDADE: ConjuntoDeParametros = {
  fontes: [CLT_ART_479, CLT_ART_469, CLT_ART_244],

  parametros: [
    {
      id: 'contrato-prazo-indenizacao-fracao',
      nome: 'Contrato a prazo — fração da indenização do art. 479',
      descricao:
        'Parte da remuneração que o empregado receberia até o termo, paga como indenização na dispensa antecipada sem justa causa.',
      tipo: 'fracao',
    },
    {
      id: 'transferencia-adicional-minimo',
      nome: 'Adicional de transferência — mínimo',
      descricao: 'Pagamento suplementar mínimo sobre os salários, enquanto durar a transferência provisória.',
      tipo: 'percentual',
    },
    {
      id: 'sobreaviso-fracao',
      nome: 'Sobreaviso — fração do salário normal',
      descricao: 'Razão pela qual as horas de sobreaviso são contadas sobre o salário normal.',
      tipo: 'fracao',
    },
    {
      id: 'prontidao-fracao',
      nome: 'Prontidão — fração do salário-hora normal',
      descricao: 'Razão pela qual as horas de prontidão são contadas sobre o salário-hora normal.',
      tipo: 'fracao',
    },
  ],

  vigencias: [
    {
      id: 'contrato-prazo-indenizacao-1943',
      parametroId: 'contrato-prazo-indenizacao-fracao',
      fonteId: 'clt-art-479',
      inicio: '1943-05-01',
      fim: null,
      valor: { tipo: 'fracao', numerador: 1, denominador: 2 },
      observacao:
        'Não se aplica quando o contrato tem cláusula assecuratória do direito recíproco de rescisão: aí valem as regras do prazo indeterminado (art. 481). O contrato da Lei nº 9.601/1998 tem indenização fixada na convenção coletiva.',
    },
    {
      id: 'transferencia-1975',
      parametroId: 'transferencia-adicional-minimo',
      fonteId: 'clt-art-469',
      inicio: '1975-04-18',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_500 },
      observacao:
        '"Nunca inferior a" — é piso: contrato ou convenção podem pagar mais. Devido "enquanto durar essa situação", o que liga o adicional à transferência provisória.',
    },
    {
      id: 'sobreaviso-1966',
      parametroId: 'sobreaviso-fracao',
      fonteId: 'clt-art-244',
      inicio: '1966-04-05',
      fim: null,
      valor: { tipo: 'fracao', numerador: 1, denominador: 3 },
      observacao:
        'Escala de no máximo vinte e quatro horas. Regra dos ferroviários, aplicada a outras categorias nas condições da Súmula 428 do TST.',
    },
    {
      id: 'prontidao-1966',
      parametroId: 'prontidao-fracao',
      fonteId: 'clt-art-244',
      inicio: '1966-04-05',
      fim: null,
      valor: { tipo: 'fracao', numerador: 2, denominador: 3 },
      observacao: 'Escala de no máximo doze horas, nas dependências do empregador, aguardando ordens.',
    },
  ],
}
