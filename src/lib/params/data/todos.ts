/**
 * Todos os conjuntos de parâmetros, numa lista só.
 *
 * **Por que existe.** O registro do SERVIDOR — o que resolve a cobertura de
 * vigências e os anos disponíveis para o formulário — era montado com uma lista
 * escrita à mão dentro da página. Publicar CALC-050 com um conjunto novo e
 * esquecer de acrescentá-lo ali produziu um defeito silencioso: a calculadora
 * calculava certo, mas exibia o aviso de *"esta calculadora não consulta
 * parâmetro legal com vigência"* — negando fundamento legal onde havia, que é o
 * inverso exato do defeito que `Calculadora.tsx` já registrava ter corrigido
 * duas vezes.
 *
 * É a mesma lição de `indice.ts` e de `ESTADO-DO-PROJETO` §7.41: **duas listas
 * do mesmo conjunto divergem.** A diferença é que agora existe uma só, e
 * `tests/unit/parametros-do-servidor.test.ts` compara esta lista com os arquivos
 * do diretório — conjunto novo que não chegue aqui reprova na suíte.
 *
 * **Isto não afeta o pacote do navegador.** Cada calculadora continua montando,
 * dentro do seu módulo adiado, um registro só com os conjuntos que ela consome
 * — que é o que mantém `RNF-004` de pé. Completa é a lista do servidor, onde
 * tabela legal não custa quilobyte a ninguém.
 */

import { BANCO_DE_HORAS } from './banco-de-horas'
import { CONSIGNADO } from './consignado'
import { CREDITO } from './credito'
import { DIVIDENDOS } from './dividendos'
import { DOMESTICO } from './domestico'
import { EMPREGADOR } from './empregador'
import { ENERGIA_DISTRIBUIDA } from './energia-distribuida'
import { FERIADOS } from './feriados'
import { GANHO_DE_CAPITAL } from './ganho-de-capital'
import { INSS } from './inss'
import { IRPF_ANUAL } from './irpf-anual'
import { INSS_INDIVIDUAL } from './inss-individual'
import { IRRF } from './irrf'
import { MEI } from './mei'
import { RENDA_FIXA } from './renda-fixa'
import { SEGURO_DESEMPREGO } from './seguro-desemprego'
import { SIMPLES_NACIONAL } from './simples-nacional'
import { TRABALHISTA } from './trabalhista'
import { VALE_TRANSPORTE } from './vale-transporte'
import type { ConjuntoDeParametros } from '../tipos'

export const TODOS_OS_CONJUNTOS: readonly ConjuntoDeParametros[] = [
  INSS,
  IRPF_ANUAL,
  GANHO_DE_CAPITAL,
  INSS_INDIVIDUAL,
  IRRF,
  MEI,
  TRABALHISTA,
  CREDITO,
  CONSIGNADO,
  VALE_TRANSPORTE,
  SEGURO_DESEMPREGO,
  SIMPLES_NACIONAL,
  EMPREGADOR,
  ENERGIA_DISTRIBUIDA,
  FERIADOS,
  DIVIDENDOS,
  DOMESTICO,
  RENDA_FIXA,
  BANCO_DE_HORAS,
]
