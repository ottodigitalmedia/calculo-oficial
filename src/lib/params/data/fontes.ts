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
  // Texto da própria portaria, como publicado no DOU de 12/01/2026, edição 7,
  // seção 1, página 58.
  //
  // Até 31/07/2026 esta URL apontava para a página institucional do INSS,
  // porque o PDF é digitalizado e não tem camada de texto — `pdftotext` sobre
  // ele devolve vazio. A conclusão de que ele era inconferível estava errada:
  // rasterizar a página e ler a imagem funciona, e o Anexo II foi conferido
  // assim, faixa a faixa, em 31/07/2026.
  //
  // A troca importa por CLAUDE.md, regra de atualização de parâmetro: "abrir a
  // fonte oficial, não o site que diz o que a fonte oficial diz". A página do
  // INSS transcreve a portaria corretamente, mas é transcrição — e o leitor
  // que clica no link para auditar merece o texto que tem força normativa.
  url: 'https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/PortariaInterministerialMPSMF13de9dejaneirode2026.pdf',
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

// ---------------------------------------------------------------------------
// Verbas rescisórias — pesquisa registrada em `docs/19-incidencias-verbas-rescisorias.md`
// ---------------------------------------------------------------------------

export const LEI_8036_ART_15: Fonte = {
  id: 'lei-8036-1990-art-15',
  norma: 'Lei nº 8.036, de 11 de maio de 1990, com a redação da Lei nº 14.438, de 2022',
  dispositivo: 'Art. 15, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8036_ART_18: Fonte = {
  id: 'lei-8036-1990-art-18',
  norma: 'Lei nº 8.036, de 11 de maio de 1990, com a redação da Lei nº 9.491, de 1997',
  dispositivo: 'Art. 18, § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_12506_2011: Fonte = {
  id: 'lei-12506-2011',
  norma: 'Lei nº 12.506, de 11 de outubro de 2011',
  dispositivo: 'Art. 1º e parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12506.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Fundamentos que **não são constante numérica** — respondem "esta verba sofre
 * incidência?", não "quanto".
 *
 * Vivem aqui, e não no motor, porque `CLAUDE.md` regra 1 exige que toda
 * referência normativa tenha URL oficial e fique em `lib/params/`. São citados
 * pelo campo `fundamento` de uma etapa do traço, que a memória de cálculo
 * renderiza como link — a alternativa seria o motor carregar nome de norma e
 * URL escritos à mão, que é exatamente o que a regra 1 impede.
 */

export const CLT_ART_146: Fonte = {
  id: 'clt-art-146',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 1.535, de 1977',
  dispositivo: 'Art. 146, parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_487: Fonte = {
  id: 'clt-art-487',
  norma: 'Consolidação das Leis do Trabalho',
  dispositivo: 'Art. 487, § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_4090_ART_1: Fonte = {
  id: 'lei-4090-1962-art-1',
  norma: 'Lei nº 4.090, de 13 de julho de 1962',
  dispositivo: 'Art. 1º, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l4090.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8212_ART_28: Fonte = {
  id: 'lei-8212-1991-art-28',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 9.528, de 1997',
  dispositivo: 'Art. 28, § 9º, alíneas "d" e "e"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

export const RPS_ART_216: Fonte = {
  id: 'decreto-3048-1999-art-216',
  norma: 'Decreto nº 3.048, de 6 de maio de 1999 — Regulamento da Previdência Social',
  dispositivo: 'Art. 216, § 1º e § 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto/d3048compilado.htm',
  orgao: 'Presidência da República',
}

export const RIR_ART_35: Fonte = {
  id: 'decreto-9580-2018-art-35',
  norma: 'Decreto nº 9.580, de 22 de novembro de 2018 — Regulamento do Imposto sobre a Renda',
  dispositivo: 'Art. 35, III, "c" (Lei nº 7.713/1988, art. 6º, V)',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9580.htm',
  orgao: 'Presidência da República',
}

export const STJ_SUMULA_386: Fonte = {
  id: 'stj-sumula-386',
  norma: 'Súmula 386 do Superior Tribunal de Justiça',
  dispositivo: 'Primeira Seção, 26/08/2009, DJe 01/09/2009',
  url: 'https://www.stj.jus.br/docs_internet/SumulasSTJ.pdf',
  orgao: 'Superior Tribunal de Justiça',
}

export const STJ_TEMA_478: Fonte = {
  id: 'stj-tema-478',
  norma: 'Tema Repetitivo 478 do Superior Tribunal de Justiça (REsp 1.230.957/RS)',
  dispositivo: 'Primeira Seção, 26/02/2014; tese mantida em 13/05/2026',
  url: 'https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=478&cod_tema_final=478',
  orgao: 'Superior Tribunal de Justiça',
}

export const TST_SUMULA_305: Fonte = {
  id: 'tst-sumula-305',
  norma: 'Súmula 305 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 121/2003, DJ 19, 20 e 21.11.2003',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_OJ_SDI1_42: Fonte = {
  id: 'tst-oj-sdi1-42',
  norma: 'Orientação Jurisprudencial nº 42, II, da SBDI-I do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 129/2005, DJ 20, 22 e 25.04.2005',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

// ---------------------------------------------------------------------------
// Férias e 13º — CALC-004 e CALC-005
// ---------------------------------------------------------------------------

export const CF_ART_7_XVII: Fonte = {
  id: 'cf-1988-art-7-xvii',
  norma: 'Constituição da República Federativa do Brasil de 1988',
  dispositivo: 'Art. 7º, XVII',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_143: Fonte = {
  id: 'clt-art-143',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 1.535, de 1977',
  dispositivo: 'Art. 143 e art. 144',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_4749_ART_2: Fonte = {
  id: 'lei-4749-1965-art-2',
  norma: 'Lei nº 4.749, de 12 de agosto de 1965',
  dispositivo: 'Art. 1º e art. 2º, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l4749.htm',
  orgao: 'Congresso Nacional',
}

export const RPS_ART_214: Fonte = {
  id: 'decreto-3048-1999-art-214',
  norma: 'Decreto nº 3.048, de 6 de maio de 1999 — Regulamento da Previdência Social',
  dispositivo: 'Art. 214, § 4º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto/d3048compilado.htm',
  orgao: 'Presidência da República',
}

export const TST_SUMULA_45: Fonte = {
  id: 'tst-sumula-45',
  norma: 'Súmula 45 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 121/2003, DJ 19, 20 e 21.11.2003',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

// ---------------------------------------------------------------------------
// Jornada e FGTS — CALC-006 e CALC-007
// ---------------------------------------------------------------------------

export const CF_ART_7_XVI: Fonte = {
  id: 'cf-1988-art-7-xvi',
  norma: 'Constituição da República Federativa do Brasil de 1988',
  dispositivo: 'Art. 7º, XVI',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_73: Fonte = {
  id: 'clt-art-73',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 9.666, de 1946',
  dispositivo: 'Art. 73, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_484A: Fonte = {
  id: 'clt-art-484a',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017',
  dispositivo: 'Art. 484-A, I, "b"',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A outra metade do inciso I, e a razão de CALC-008 existir separada.
 *
 * *"I - por metade: a) o aviso prévio, se indenizado"*. Repare no **se**: só o
 * aviso indenizado é reduzido. O trabalhado é salário do período, e salário não
 * se paga pela metade.
 *
 * Fonte própria e não reaproveitamento de `CLT_ART_484A` porque o dispositivo é
 * outro — a alínea "b" trata da multa do FGTS. O link da memória de cálculo
 * precisa levar ao dispositivo que decide **aquela** verba, e não ao artigo em
 * geral. Conferido no texto do Planalto em 01/08/2026.
 */
export const CLT_ART_484A_AVISO: Fonte = {
  id: 'clt-art-484a-aviso',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017',
  dispositivo: 'Art. 484-A, I, "a"',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O que a extinção por acordo **permite** e o que ela **impede**.
 *
 * § 1º: a movimentação da conta vinculada fica *"limitada até 80% (oitenta por
 * cento) do valor dos depósitos"*.
 * § 2º: a extinção por acordo *"não autoriza o ingresso no Programa de
 * Seguro-Desemprego"*.
 *
 * O § 2º não produz número, e ainda assim é a informação que mais muda a decisão
 * de quem está avaliando o acordo — por isso vira `fundamento` na memória, e não
 * apenas texto de FAQ.
 */
export const CLT_ART_484A_SAQUE: Fonte = {
  id: 'clt-art-484a-saque',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017',
  dispositivo: 'Art. 484-A, § 1º e § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_64: Fonte = {
  id: 'clt-art-64',
  norma: 'Consolidação das Leis do Trabalho',
  dispositivo: 'Art. 64',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_605_ART_7: Fonte = {
  id: 'lei-605-1949-art-7',
  norma: 'Lei nº 605, de 5 de janeiro de 1949, com a redação da Lei nº 7.415, de 1985',
  dispositivo: 'Art. 7º, "a"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm',
  orgao: 'Congresso Nacional',
}

export const TST_SUMULA_431: Fonte = {
  id: 'tst-sumula-431',
  norma: 'Súmula 431 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 185/2012, DEJT de 25, 26 e 27.09.2012',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_SUMULA_172: Fonte = {
  id: 'tst-sumula-172',
  norma: 'Súmula 172 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 121/2003, DJ 19, 20 e 21.11.2003',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

// ---------------------------------------------------------------------------
// Crédito — CALC-024
// ---------------------------------------------------------------------------

export const RESOLUCAO_CMN_4881: Fonte = {
  id: 'resolucao-cmn-4881-2020',
  norma: 'Resolução CMN nº 4.881, de 23 de dezembro de 2020',
  dispositivo: 'Art. 2º a 4º',
  url: 'https://www.bcb.gov.br/content/estabilidadefinanceira/especialnor/Resolu%C3%A7%C3%A3o4881.pdf',
  orgao: 'Banco Central do Brasil',
}

/**
 * O dispositivo que dá razão de existir a CALC-026.
 *
 * *"É assegurado ao consumidor a liquidação antecipada do débito, total ou
 * parcialmente, mediante redução proporcional dos juros e demais acréscimos."*
 *
 * A palavra que decide a conta é **proporcional**: quitar antes não é pagar a
 * soma das parcelas que faltam, é pagar o valor presente delas. A diferença
 * entre as duas leituras é exatamente o que a calculadora mostra — e é dinheiro
 * que o consumidor deixa na mesa quando aceita o primeiro número que o banco
 * informa.
 *
 * Conferido no texto compilado do Planalto em 01/08/2026.
 */
/**
 * O teto que CALC-023 existe para mostrar.
 *
 * Art. 28, § 1º: *"Se os limites referidos no caput deste artigo não forem
 * aprovados no prazo máximo de 90 (noventa) dias, contado da data da publicação
 * desta Lei, o total cobrado em cada caso a título de juros e encargos
 * financeiros não poderá exceder o valor original da dívida."*
 *
 * A autorregulação do caput **não foi aprovada** no prazo, e por isso o teto do
 * § 1º passou a valer — foi o que a Resolução CMN nº 5.112/2023 regulamentou.
 * Conferido no texto do Planalto em 01/08/2026.
 */
export const LEI_14690_ART_28: Fonte = {
  id: 'lei-14690-2023-art-28',
  norma: 'Lei nº 14.690, de 3 de outubro de 2023',
  dispositivo: 'Art. 28, § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14690.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A norma que define a **estrutura** do financiamento da fatura, e sem a qual a
 * conta do rotativo sai errada por construção.
 *
 * - Art. 1º: o saldo não pago *"somente pode ser objeto de financiamento na
 *   modalidade de crédito rotativo até o vencimento da fatura subsequente"*. O
 *   rotativo dura **um ciclo**, não doze.
 * - Art. 2º: depois disso o saldo remanescente pode ser parcelado *"desde que
 *   em condições mais vantajosas para o cliente em relação àquelas praticadas
 *   na modalidade de crédito rotativo, inclusive no que diz respeito à cobrança
 *   de encargos financeiros"*.
 * - Art. 2º-A, parágrafo único (incluído pela Resolução CMN nº 5.112/2023): na
 *   migração, o valor original da dívida é o **montante inicial do rotativo**, e
 *   os juros e encargos são apurados **desde o início do rotativo**. O teto vale
 *   para a cadeia inteira, não por operação.
 *
 * A URL é a versão **consolidada** publicada pelo Banco Central, que já traz as
 * alterações da Resolução CMN nº 5.112/2023 marcadas dispositivo a dispositivo —
 * conferida em 01/08/2026.
 */
export const RES_CMN_4549: Fonte = {
  id: 'resolucao-cmn-4549-2017',
  norma: 'Resolução CMN nº 4.549, de 26 de janeiro de 2017, com as alterações da Resolução CMN nº 5.112, de 21 de dezembro de 2023',
  dispositivo: 'Art. 1º, art. 2º e art. 2º-A',
  url: 'https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50330/Res_4549_v2_L.pdf',
  orgao: 'Banco Central do Brasil',
}

export const CDC_ART_52: Fonte = {
  id: 'lei-8078-1990-art-52',
  norma: 'Lei nº 8.078, de 11 de setembro de 1990 — Código de Defesa do Consumidor',
  dispositivo: 'Art. 52, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
  orgao: 'Congresso Nacional',
}

// ---------------------------------------------------------------------------
// Seguro-desemprego — CALC-009
// ---------------------------------------------------------------------------

export const LEI_7998_ART_4: Fonte = {
  id: 'lei-7998-1990-art-4',
  norma: 'Lei nº 7.998, de 11 de janeiro de 1990, com a redação da Lei nº 13.134, de 2015',
  dispositivo: 'Art. 4º, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l7998.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_7998_ART_5: Fonte = {
  id: 'lei-7998-1990-art-5',
  norma: 'Lei nº 7.998, de 11 de janeiro de 1990',
  dispositivo: 'Art. 5º, caput e § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l7998.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A ÚNICA FONTE DESTE PROJETO QUE NÃO É TEXTO NORMATIVO NEM PÁGINA DE TABELA.
 *
 * O art. 5º da Lei nº 7.998/1990 fixa o MÉTODO — três faixas, fatores 0,8 e
 * 0,5, piso no salário mínimo — mas expressa os limites em BTN, moeda extinta.
 * Os limites em reais são reajustados todo ano pelo INPC, na forma da Resolução
 * CODEFAT nº 957/2022, e divulgados pelo Ministério do Trabalho e Emprego.
 *
 * **A portaria que os formaliza não foi localizada.** Foram tentados: a busca do
 * Diário Oficial por período e por órgão, o JSON diário do DOU de 09 a 14/01/2026
 * e a página de serviço do MTE. Nenhum devolveu o ato.
 *
 * O que se tem é a divulgação no **portal do próprio órgão emissor** — o Portal
 * do FAT, do MTE —, publicada em 13/01/2026, declarando vigência a partir de
 * 11/01/2026 e citando a lei e a resolução. É fonte oficial para BV-07 e para a
 * convenção deste arquivo, e é mais fraca que todas as outras do projeto.
 *
 * **Conferência cruzada que aumenta a confiança:** o piso declarado ali,
 * R$ 1.621,00, coincide com `salario-minimo` de 2026, que foi conferido no PDF
 * da Portaria Interministerial MPS/MF nº 13/2026. Um erro de transcrição na
 * tabela teria de coincidir com outro documento para passar.
 *
 * **A fazer na próxima auditoria:** localizar a portaria e trocar esta URL pelo
 * texto com força normativa, como foi feito com o INSS de 2026 em 31/07/2026.
 */
export const MTE_TABELA_SEGURO_DESEMPREGO: Fonte = {
  id: 'mte-tabela-seguro-desemprego-2026',
  norma:
    'Tabela anual do seguro-desemprego divulgada pelo Ministério do Trabalho e Emprego, na forma do art. 5º da Lei nº 7.998/1990 e da Resolução CODEFAT nº 957, de 2022',
  dispositivo: 'Faixas vigentes a partir de 11/01/2026',
  url: 'https://portalfat.mte.gov.br/mte-reajusta-valores-do-beneficio-seguro-desemprego/',
  orgao: 'Ministério do Trabalho e Emprego',
}

// ---------------------------------------------------------------------------
// Cheque especial — CALC-030
// ---------------------------------------------------------------------------

/**
 * O teto de 8% ao mês — e uma lição sobre ler a norma inteira.
 *
 * Art. 3º: *"As taxas de juros remuneratórios cobradas sobre o valor utilizado
 * do cheque especial estão limitadas a, no máximo, 8% (oito por cento) ao
 * mês."* Vigente desde 6 de janeiro de 2020, pelo art. 6º.
 *
 * **O art. 2º da mesma resolução NÃO vale mais.** Ele admitia tarifa de até
 * 0,25% ao mês sobre o limite que excedesse R$ 500,00, e foi **revogado a partir
 * de 1º/11/2021** pela Resolução CMN nº 4.962/2021 — além de ter sido declarado
 * **inconstitucional** pelo STF na ADI 6.407-DF.
 *
 * Toda descrição secundária desta resolução que se encontra por aí ainda cita a
 * tarifa, porque descreve o texto de 2019. Construir a calculadora a partir de
 * um resumo teria publicado uma cobrança extinta há cinco anos. É exatamente o
 * que a regra "abra a fonte oficial, não o site que diz o que ela diz" existe
 * para impedir — e desta vez ela pagou o próprio custo.
 *
 * Conferido no PDF consolidado do Banco Central em 01/08/2026.
 */
export const RES_CMN_4765: Fonte = {
  id: 'resolucao-cmn-4765-2019',
  norma: 'Resolução CMN nº 4.765, de 27 de novembro de 2019',
  dispositivo: 'Art. 3º, caput',
  url: 'https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50875/Res_4765_v2_P.pdf',
  orgao: 'Banco Central do Brasil',
}

// ---------------------------------------------------------------------------
// Encargos do empregador — CALC-011
// ---------------------------------------------------------------------------

export const LEI_8212_ART_22: Fonte = {
  id: 'lei-8212-1991-art-22',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação das Leis nº 9.876, de 1999, e nº 9.732, de 1998',
  dispositivo: 'Art. 22, I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A virada de entendimento que muda o custo de toda folha de pagamento.
 *
 * Até 2020 prevalecia a tese do STJ, firmada em repetitivo de 2014, de que o
 * terço constitucional tinha natureza indenizatória e **não** sofria
 * contribuição patronal. O STF decidiu o contrário no Tema 985 (RE 1.072.485):
 * *"É legítima a incidência de contribuição social sobre o valor satisfeito a
 * título de terço constitucional de férias."*
 *
 * Com **modulação**: a cobrança vale a partir de 15/09/2020, data da publicação
 * da ata de julgamento.
 *
 * Não produz valor numérico — decide uma incidência. Por isso entra como
 * `fundamento`, como as teses do STJ e do TST usadas em CALC-002.
 */
export const STF_TEMA_985: Fonte = {
  id: 'stf-tema-985',
  norma: 'Tema 985 da Repercussão Geral do Supremo Tribunal Federal (RE 1.072.485)',
  dispositivo: 'Tese firmada, com modulação a partir de 15/09/2020',
  url: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=985',
  orgao: 'Supremo Tribunal Federal',
}

// ---------------------------------------------------------------------------
// Empregado doméstico — CALC-012
// ---------------------------------------------------------------------------

/**
 * A diferença estrutural do regime doméstico, e a razão de CALC-012 não ser
 * CALC-002 com outro nome.
 *
 * *"O empregador doméstico depositará a importância de 3,2% (três inteiros e
 * dois décimos por cento) sobre a remuneração devida, no mês anterior, a cada
 * empregado, destinada ao pagamento da indenização compensatória da perda do
 * emprego, sem justa causa ou por culpa do empregador, **não se aplicando ao
 * empregado doméstico o disposto nos §§ 1º a 3º do art. 18 da Lei nº 8.036**"*.
 *
 * Ou seja: **não existe multa de 40% no doméstico.** No lugar dela há um fundo
 * formado mês a mês, em variação distinta da conta do FGTS (§ 3º), que o
 * trabalhador movimenta na dispensa sem justa causa e que o **empregador**
 * movimenta no pedido de demissão, na justa causa, no fim do contrato por prazo
 * determinado, na aposentadoria e no falecimento (§ 1º).
 *
 * Conferido no texto do Planalto em 01/08/2026.
 */
export const LC_150_ART_22: Fonte = {
  id: 'lc-150-2015-art-22',
  norma: 'Lei Complementar nº 150, de 1º de junho de 2015',
  dispositivo: 'Art. 22, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O aviso prévio do doméstico tem norma própria, com os mesmos números.
 *
 * Art. 23, § 1º e § 2º: trinta dias até um ano de serviço, acrescidos de três
 * dias por ano, até o total de noventa. É o mesmo desenho da Lei nº 12.506/2011,
 * e ainda assim outra norma — o contrato doméstico não é regido por ela.
 *
 * Parâmetros próprios, portanto. Reaproveitar os da CLT faria a memória de
 * cálculo de uma rescisão doméstica citar uma lei que não rege aquele contrato,
 * e o link levaria o leitor ao lugar errado. Números iguais, fundamentos
 * distintos — a duplicação aqui é o que mantém a citação correta.
 */
export const LC_150_ART_23: Fonte = {
  id: 'lc-150-2015-art-23',
  norma: 'Lei Complementar nº 150, de 1º de junho de 2015',
  dispositivo: 'Art. 23, § 1º, § 2º e § 4º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  orgao: 'Congresso Nacional',
}

// ---------------------------------------------------------------------------
// Renda fixa — CALC-018
// ---------------------------------------------------------------------------

/**
 * A tabela regressiva do imposto de renda sobre aplicações financeiras.
 *
 * Art. 1º: 22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% acima
 * de 720. Art. 3º, II: isenção, na fonte e na declaração, da remuneração
 * produzida por letras hipotecárias, CRI e LCI.
 *
 * **UMA MEDIDA PROVISÓRIA QUASE MUDOU TUDO ISSO, E CADUCOU.** A MP nº 1.303, de
 * 11 de junho de 2025, propunha substituir a tabela regressiva por alíquota
 * única e tributar os títulos hoje isentos. O Planalto marca a MP com
 * **"Vigência encerrada"** — ela perdeu eficácia sem conversão em lei, e a Lei
 * nº 11.033 vale exatamente como escrita.
 *
 * O texto compilado traz a remissão "(Vide Medida Provisória nº 1.303, de 2025)"
 * ao lado de quase todo dispositivo, o que assusta na primeira leitura. A
 * etiqueta seguinte — "Vigência encerrada" — é a que decide, e ela está na
 * página da própria MP. Conferido nas duas em 01/08/2026.
 *
 * É o segundo caso do dia, depois do art. 2º da Resolução CMN nº 4.765: norma
 * que existe no texto e não vale mais. Ver `ESTADO-DO-PROJETO` §7.20.
 */
export const LEI_11033_ART_1: Fonte = {
  id: 'lei-11033-2004-art-1',
  norma: 'Lei nº 11.033, de 21 de dezembro de 2004',
  dispositivo: 'Art. 1º, I a IV',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_11033_ART_3: Fonte = {
  id: 'lei-11033-2004-art-3',
  norma: 'Lei nº 11.033, de 21 de dezembro de 2004',
  dispositivo: 'Art. 3º, II',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  orgao: 'Congresso Nacional',
}

/** Todas as fontes, para conferência de conjunto. */
export const FONTES: readonly Fonte[] = [
  PORTARIA_MPS_MF_6_2025,
  PORTARIA_MPS_MF_13_2026,
  LEI_14848_2024,
  LEI_15191_2025,
  LEI_9250_ART_3A,
  LEI_8036_ART_15,
  LEI_8036_ART_18,
  LEI_12506_2011,
  CLT_ART_146,
  CLT_ART_487,
  LEI_4090_ART_1,
  LEI_8212_ART_28,
  RPS_ART_216,
  RIR_ART_35,
  STJ_SUMULA_386,
  STJ_TEMA_478,
  TST_SUMULA_305,
  TST_OJ_SDI1_42,
  CF_ART_7_XVII,
  CLT_ART_143,
  LEI_4749_ART_2,
  RPS_ART_214,
  TST_SUMULA_45,
  CF_ART_7_XVI,
  CLT_ART_73,
  CLT_ART_484A,
  CLT_ART_484A_AVISO,
  CLT_ART_484A_SAQUE,
  CLT_ART_64,
  LEI_605_ART_7,
  TST_SUMULA_431,
  TST_SUMULA_172,
  RESOLUCAO_CMN_4881,
  CDC_ART_52,
  LEI_14690_ART_28,
  RES_CMN_4549,
  LEI_7998_ART_4,
  LEI_7998_ART_5,
  MTE_TABELA_SEGURO_DESEMPREGO,
  RES_CMN_4765,
  LEI_8212_ART_22,
  STF_TEMA_985,
  LC_150_ART_22,
  LC_150_ART_23,
  LEI_11033_ART_1,
  LEI_11033_ART_3,
]
