/**
 * Fontes normativas dos parâmetros legais — `ENT-001`.
 *
 * **Nenhum parâmetro existe sem fonte** (`RN-001`), e a URL precisa ser de
 * domínio oficial (regra F-1, verificada por BV-07).
 *
 * CONVENÇÃO DESTE ARQUIVO
 *
 * `norma` nomeia o ato normativo — é o que dá autoridade ao valor.
 * `url` aponta para **onde os valores foram efetivamente conferidos**, que nem
 * sempre é o texto da norma: várias tabelas são publicadas pelo órgão em
 * página institucional própria, mais legível e mais estável que o PDF do
 * Diário Oficial. As duas informações juntas é que tornam a auditoria possível
 * — a norma diz o que procurar, a URL diz onde.
 *
 * Quando a URL não é o texto da norma, a vigência registra isso em
 * `observacao`.
 */

import type { Fonte } from '../tipos'

// ---------------------------------------------------------------------------
// Previdência
// ---------------------------------------------------------------------------

export const PORTARIA_MPS_MF_6_2025: Fonte = {
  id: 'portaria-mps-mf-6-2025',
  norma: 'Portaria Interministerial MPS/MF nº 6, de 10 de janeiro de 2025',
  dispositivo: 'Anexo II',
  // Texto da própria portaria. Conferido diretamente no PDF.
  url: 'https://www.gov.br/previdencia/pt-br/assuntos/rpps/legislacao-dos-rpps/2025/PortariaInterministerialMPSMFn6de10jan2025.pdf',
  orgao: 'Ministério da Previdência Social',
}

export const PORTARIA_MPS_MF_13_2026: Fonte = {
  id: 'portaria-mps-mf-13-2026',
  norma: 'Portaria Interministerial MPS/MF nº 13, de 9 de janeiro de 2026',
  dispositivo: 'Anexo II',
  // O PDF desta portaria é digitalizado, sem camada de texto. Os valores
  // foram conferidos na página institucional do INSS, que os publica
  // atribuindo expressamente a esta portaria.
  url: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
  orgao: 'Ministério da Previdência Social',
}

// ---------------------------------------------------------------------------
// Imposto sobre a renda
// ---------------------------------------------------------------------------

export const LEI_14848_2024: Fonte = {
  id: 'lei-14848-2024',
  norma: 'Lei nº 14.848, de 1º de maio de 2024',
  dispositivo: 'Tabela progressiva mensal',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2025',
  orgao: 'Receita Federal do Brasil',
}

export const LEI_15191_2025: Fonte = {
  id: 'lei-15191-2025',
  norma: 'Lei nº 15.191, de 11 de agosto de 2025',
  dispositivo: 'Tabela progressiva mensal',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  orgao: 'Receita Federal do Brasil',
}

export const LEI_9250_ART_3A: Fonte = {
  id: 'lei-9250-1995-art-3a',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 15.270, de 26 de novembro de 2025',
  dispositivo: 'Art. 3º-A',
  // Publicação original da Lei nº 15.270/2025, que inseriu o art. 3º-A.
  url: 'https://www2.camara.leg.br/legin/fed/lei/2025/lei-15270-26-novembro-2025-798354-publicacaooriginal-177117-pl.html',
  orgao: 'Congresso Nacional',
}

/** Todas as fontes, para conferência de conjunto. */
export const FONTES: readonly Fonte[] = [
  PORTARIA_MPS_MF_6_2025,
  PORTARIA_MPS_MF_13_2026,
  LEI_14848_2024,
  LEI_15191_2025,
  LEI_9250_ART_3A,
]
