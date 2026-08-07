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

/**
 * A tabela ANUAL — e por que ela tem fonte própria, separada da mensal.
 *
 * A anual **não é doze vezes a mensal**, e 2025 é a demonstração: a tabela
 * mudou em maio, então o ano tem quatro meses de uma e oito de outra. Quem
 * multiplicar a mensal vigente por doze erra a isenção em mais de mil reais.
 *
 * Quem publica a anual apurada é a Receita, na página de tabelas do exercício.
 * É fonte oficial do órgão que administra o tributo, e **confere por
 * reprodução** — a mistura das mensais que já estão em `irrf.ts` devolve
 * exatamente os valores publicados:
 *
 *   isenção AC2025   4 × 2.259,20 + 8 × 2.428,80 = 28.467,20  ✅
 *   deduzir 7,5%     4 ×   169,44 + 8 ×   182,16 =  2.135,04  ✅
 *   isenção AC2024   1 × 2.112,00 + 11 × 2.259,20 = 26.963,20 ✅
 *   deduzir 7,5%     1 ×   158,40 + 11 ×   169,44 =  2.022,24 ✅
 *
 * Os limites das faixas superiores são doze vezes os mensais, que não mudaram
 * em nenhuma das duas viradas — só a isenção subiu.
 */
export const RFB_TABELA_ANUAL_2024: Fonte = {
  id: 'rfb-tabela-anual-ac2024',
  norma:
    'Tabela progressiva anual do IRPF publicada pela Receita Federal para o exercício de 2025, ano-calendário de 2024, na forma da Lei nº 14.848/2024',
  dispositivo: 'Exercício 2025 · ano-calendário 2024',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/copy_of_2024',
  orgao: 'Receita Federal do Brasil',
}

export const RFB_TABELA_ANUAL_2025: Fonte = {
  id: 'rfb-tabela-anual-ac2025',
  norma:
    'Tabela progressiva anual do IRPF publicada pela Receita Federal para o exercício de 2026, ano-calendário de 2025, na forma da Lei nº 15.191/2025',
  dispositivo: 'Exercício 2026 · ano-calendário 2025',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2025',
  orgao: 'Receita Federal do Brasil',
}

/**
 * Art. 8º — as deduções da declaração, e o teto que cada uma tem (ou não tem).
 *
 * Lido no texto consolidado do Planalto em 06/08/2026, com o cuidado de §7.42:
 * dependente e instrução aparecem com **várias redações empilhadas**, e a
 * vigente é a última — ambas da Lei nº 13.149/2015, "a partir do ano-calendário
 * de 2015", sem prazo final declarado.
 *
 * **Despesa médica não tem teto**, e isso é do texto: a alínea "a" enumera o que
 * é dedutível e não fixa limite algum, ao contrário da alínea "b", que traz o
 * valor da instrução. A ausência de teto é conteúdo da norma, não lacuna do
 * cadastro — por isso não existe parâmetro de limite médico aqui.
 */
export const LEI_9250_ART_8: Fonte = {
  id: 'lei-9250-1995-art-8',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 13.149, de 2015',
  dispositivo: 'Art. 8º, II, "b" e "c"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Art. 10 — o desconto simplificado, e a data que ele carrega.
 *
 * *"[...] desconto simplificado, que consistirá em dedução de 20% (vinte por
 * cento) do valor desses rendimentos, limitada a [...]"*, e o limite está nos
 * incisos. A última redação, dada pela **Lei nº 15.270, de 2025**, é o que fecha
 * o recorte desta calculadora:
 *
 *   IX - R$ 16.754,34 [...] a partir do ano-calendário de 2015 **até o
 *        ano-calendário de 2025**; e
 *   X  - R$ 17.640,00 [...] a partir do ano-calendário de 2026.
 *
 * **O inciso X não foi cadastrado, de propósito.** A mesma Lei nº 15.270/2025
 * **revogou o art. 11**, que é onde vive a tabela anual — ou seja, de 2026 em
 * diante a conta não é a mesma com outro número: é outra estrutura, com o
 * redutor do art. 3º-A. Cadastrar só o limite novo deixaria a calculadora
 * oferecer 2026 e calcular pela estrutura velha, que é o defeito de §7.48 com
 * consequência pior. Ver a nota em `irpf-anual.ts`.
 */
export const LEI_9250_ART_10: Fonte = {
  id: 'lei-9250-1995-art-10',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 15.270, de 2025',
  dispositivo: 'Art. 10, caput e inciso IX',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Art. 22 — a isenção de pequeno valor, e a MP que quase a matou.
 *
 * *"Fica isento do imposto de renda o ganho de capital auferido na alienação de
 * bens e direitos de pequeno valor, cujo preço unitário de alienação, no mês em
 * que esta se realizar, seja igual ou inferior a: [...] II - R$ 35.000,00
 * (trinta e cinco mil reais), nos demais casos."*
 *
 * E o **parágrafo único**, que é o que faz a regra funcionar na prática:
 * *"No caso de alienação de diversos bens ou direitos da mesma natureza, será
 * considerado, para os efeitos deste artigo, o valor do conjunto dos bens
 * alienados no mês."*
 *
 * **A Medida Provisória nº 1.303/2025 revogaria isto para criptoativos**, com
 * alíquota única de 17,5% a partir de 01/01/2026. O texto consolidado traz
 * "(Vide Medida Provisória nº 1.303, de 2025)" ao lado do inciso II E do
 * parágrafo único — os dois marcados com **"Vigência encerrada"**.
 *
 * É a assinatura de §7.61: MP que caduca leva a regra inteira com ela. A MP
 * perdeu vigência em 08/10/2025 sem conversão, e o que vale é o texto de 2005.
 * Publicar os 17,5% teria produzido uma calculadora inteira errada — e a única
 * diferença visível, no texto consolidado, é a marca entre parênteses.
 */
/**
 * Lei nº 14.300/2022 — o marco legal da geração distribuída.
 *
 * **Art. 27** é o cronograma do chamado Fio B: o percentual das componentes
 * tarifárias de distribuição que passa a incidir sobre a energia compensada,
 * crescendo ano a ano — 15% a partir de 2023 até 90% em 2028, e a regra do art.
 * 17 a partir de 2029.
 *
 * **Art. 26** é o que separa dois mundos, e sem ele a calculadora erra metade
 * dos casos: quem já tinha o sistema na publicação da lei, ou pediu acesso em
 * até doze meses, **não** entra nesse cronograma até 31/12/2045.
 *
 * O art. 27 não foi alterado. A Lei nº 15.269/2025 mexeu na lei — revogou um
 * dispositivo e deu nova redação ao art. 25 —, e conferir isso fazia parte do
 * trabalho: §7.45 manda ler o "Vide", e §7.42 manda desconfiar de artigo com
 * redação empilhada. Aqui não há nenhuma das duas coisas sobre o art. 27.
 */
export const LEI_14300_ART_27: Fonte = {
  id: 'lei-14300-2022-art-27',
  norma: 'Lei nº 14.300, de 6 de janeiro de 2022',
  dispositivo: 'Art. 27, incisos I a VI',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14300.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_14300_ART_26: Fonte = {
  id: 'lei-14300-2022-art-26',
  norma: 'Lei nº 14.300, de 6 de janeiro de 2022',
  dispositivo: 'Art. 26, incisos I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14300.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Simples Nacional — os anexos de serviço e o fator R.
 *
 * **A janela é fechada, e a leitura que a fechou vale registrar.** O art. 519 da
 * LC nº 214/2025 diz que os *"Anexos I a V da Lei Complementar nº 123 [...]
 * passam a vigorar com a redação dos Anexos XVIII a XXII"* — ou seja, as tabelas
 * inteiras são substituídas. O que salva a transcrição atual é o art. 544, III,
 * na redação da **LC nº 227/2026**: os arts. 519 a 534 só produzem efeitos **a
 * partir de 1º de janeiro de 2027**.
 *
 * Então até 31/12/2026 valem estes anexos, e de 2027 em diante valem outros.
 * Foi por isso que `ESTADO-DO-PROJETO` §10 mandava ler a LC 214 **antes** de
 * transcrever: sem essa data, a tabela cadastrada seria uma tabela que não vale.
 *
 * **O fator R decide qual anexo se aplica** — § 5º-J do art. 18: os serviços do
 * § 5º-I são tributados pelo Anexo III *"caso a razão entre a folha de salários
 * e a receita bruta da pessoa jurídica seja igual ou superior a 28%"*. Abaixo
 * disso, Anexo V.
 *
 * O § 5º-K manda usar os montantes dos **doze meses anteriores** ao período de
 * apuração, e o § 24 define folha como a remuneração paga a pessoas físicas
 * pelo trabalho, incluídas as retiradas de pró-labore, acrescida do que foi
 * efetivamente recolhido de contribuição patronal e de FGTS.
 *
 * > **O texto deste trecho vem estilhaçado no HTML do Planalto.** Os spans de
 * > `letter-spacing` picam as palavras letra a letra — `a 28% (vinte e oito por
 * > c ento)` —, e busca por expressão regular não acha. Foi preciso ler o
 * > intervalo cru. Vale para quem for reconferir na próxima auditoria.
 */
/**
 * Art. 6º-A — o fim da isenção de dividendos, e o degrau que ele criou.
 *
 * Inserido pela Lei nº 15.270/2025, com efeitos a partir de janeiro de 2026.
 * Ver o cabeçalho de `dividendos.ts` para a leitura e as três armadilhas.
 */
export const LEI_9250_ART_6A: Fonte = {
  id: 'lei-9250-1995-art-6a',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 15.270, de 2025',
  dispositivo: 'Art. 6º-A, caput e §§ 1º a 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Art. 16-A — a tributação mínima, que CALC-048 declara e não calcula.
 *
 * A partir do ano-calendário de 2026, quem soma mais de R$ 600.000,00 de
 * rendimentos no ano fica sujeito a uma alíquota mínima que cresce linearmente
 * até 10% — `Alíquota % = (REND / 60.000) − 10` —, e o art. 16-B traz um redutor
 * que depende da tributação efetiva dos lucros na pessoa jurídica.
 *
 * **O comparador não calcula isso, e o motivo é de honestidade, não de
 * preguiça:** o redutor do art. 16-B exige saber a alíquota efetiva de
 * tributação dos lucros da PJ, que numa empresa do Simples não é um número que
 * o usuário tenha. O valor entra aqui para a calculadora AVISAR quem passou da
 * fronteira de que o lado PJ dela está otimista — que é o que dá para afirmar.
 */
export const LEI_9250_ART_16A: Fonte = {
  id: 'lei-9250-1995-art-16a',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 15.270, de 2025',
  dispositivo: 'Art. 16-A, caput e § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

export const LC_123_ANEXO_III: Fonte = {
  id: 'lc-123-2006-anexo-iii',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Anexo III — vigência a partir de 01/01/2018',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

export const LC_123_ANEXO_V: Fonte = {
  id: 'lc-123-2006-anexo-v',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Anexo V — vigência a partir de 01/01/2018',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

export const LC_123_ART_18_FATOR_R: Fonte = {
  id: 'lc-123-2006-art-18-fator-r',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Art. 18, §§ 5º-J, 5º-K e 24',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_9250_ART_22: Fonte = {
  id: 'lei-9250-1995-art-22',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995, com a redação da Lei nº 11.196, de 2005',
  dispositivo: 'Art. 22, II, e parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A aplicação da isenção a criptoativos — quem diz é a Receita, e por escrito.
 *
 * O art. 22 fala em "bens e direitos de pequeno valor", sem citar criptoativo.
 * Quem faz a ponte é a publicação oficial da própria Receita, na resposta 653:
 *
 * > *"A isenção relativa às alienações de até R$ 35.000,00 mensais deve observar
 * > o conjunto de criptoativos alienados no Brasil ou no exterior,
 * > independentemente de seu tipo (Bitcoin, altcoins, stablecoins, NFTs, entre
 * > outros). Caso o total alienado no mês ultrapasse esse valor, o ganho de
 * > capital relativo a todas as alienações estará sujeito à tributação."*
 *
 * Três coisas que essa frase decide, e que nenhuma leitura do art. 22 sozinha
 * entregaria:
 *
 *   1. O teste é sobre o **total alienado**, não sobre o ganho.
 *   2. O conjunto é de **todos os tipos** de criptoativo, somados.
 *   3. Ultrapassado o teto, **todo** o ganho do mês é tributado — é degrau, não
 *      dedução.
 *
 * A mesma resposta separa o regime dos criptoativos custodiados **no exterior**,
 * que desde 01/01/2024 seguem a Lei nº 14.754/2023 e para os quais *"não há
 * previsão legal de isenção"*. Esse regime está fora de CALC-021, e a tela diz
 * isso.
 */
export const RFB_PR_IRPF_CRIPTOATIVOS: Fonte = {
  id: 'rfb-pr-irpf-2026-cripto',
  norma:
    'Receita Federal, "Perguntas e Respostas IRPF 2026", versão 1.00, resposta 653 — Alienação de criptoativos',
  dispositivo: 'Criptoativos custodiados ou negociados por instituições localizadas no Brasil',
  url: 'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf',
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

/**
 * As três alíquotas do contribuinte individual e do facultativo — CALC-050.
 *
 * Conferidas no texto CONSOLIDADO do Planalto em 06/08/2026, que traz as
 * redações sucessivas empilhadas. A leitura exige cuidado: o mesmo `§ 2º`
 * aparece quatro vezes na página, com as redações da LC 123/2006, da MP
 * 529/2011 e da Lei 12.470/2011 uma abaixo da outra. **A vigente é a última.**
 */
export const LEI_8212_ART_21_CAPUT: Fonte = {
  id: 'lei-8212-1991-art-21-caput',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 9.876, de 1999',
  dispositivo: 'Art. 21, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8212_ART_21_P2: Fonte = {
  id: 'lei-8212-1991-art-21-p2',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 12.470, de 2011',
  dispositivo: 'Art. 21, § 2º, incisos I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8212_ART_21_P3: Fonte = {
  id: 'lei-8212-1991-art-21-p3',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 12.470, de 2011',
  dispositivo: 'Art. 21, § 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O pró-labore — CALC-051. Os 11% que a empresa desconta do sócio NÃO estão
 * escritos em lugar nenhum: são o resultado de 20% menos a dedução do § 4º.
 */
export const LEI_8212_ART_22_III: Fonte = {
  id: 'lei-8212-1991-art-22-iii',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 9.876, de 1999',
  dispositivo: 'Art. 22, III',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8212_ART_30_P4: Fonte = {
  id: 'lei-8212-1991-art-30-p4',
  norma: 'Lei nº 8.212, de 24 de julho de 1991, com a redação da Lei nº 9.876, de 1999',
  dispositivo: 'Art. 30, § 4º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_10666_ART_4: Fonte = {
  id: 'lei-10666-2003-art-4',
  norma: 'Lei nº 10.666, de 8 de maio de 2003, com a redação da Lei nº 11.933, de 2009',
  dispositivo: 'Art. 4º, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.666.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8212_ART_28_LIMITES: Fonte = {
  id: 'lei-8212-1991-art-28-limites',
  norma: 'Lei nº 8.212, de 24 de julho de 1991',
  dispositivo: 'Art. 28, III e IV, e §§ 3º e 5º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O MEI — CALC-047 e CALC-052.
 *
 * Conferidas no texto consolidado da LC 123/2006 e no texto da LC 214/2025, no
 * Planalto, em 06/08/2026. **A leitura do art. 18-A não se resolve só na LC
 * 123:** as alíneas do § 3º, V trazem a marca "(Vide Lei Complementar nº 214, de
 * 2025)", e é preciso ir até lá para saber o que muda e quando.
 */
export const LC123_ART_18A_V: Fonte = {
  id: 'lc-123-2006-art-18a-v',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006',
  dispositivo: 'Art. 18-A, § 3º, V, alíneas "a", "b" e "c"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A regra que transforma "R$ 45,65" em "5% do salário mínimo".
 *
 * O texto da alínea "a" traz um valor NOMINAL de 2008. É o § 11 que manda
 * reajustá-lo "de forma a manter equivalência com a contribuição de que trata o
 * § 2º do art. 21 da Lei nº 8.212" — e é por essa equivalência que o valor
 * praticado é 5% do salário mínimo, e não os R$ 45,65 escritos.
 */
export const LC123_ART_18A_P11: Fonte = {
  id: 'lc-123-2006-art-18a-p11',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006',
  dispositivo: 'Art. 18-A, § 11',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

export const LC123_ART_18A_LIMITES: Fonte = {
  id: 'lc-123-2006-art-18a-limites',
  norma:
    'Lei Complementar nº 123, de 14 de dezembro de 2006, com as redações das Leis Complementares nº 155, de 2016, e nº 188, de 2021',
  dispositivo: 'Art. 18-A, §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

export const LC123_ART_18A_P7: Fonte = {
  id: 'lc-123-2006-art-18a-p7',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006',
  dispositivo: 'Art. 18-A, § 7º, incisos III e IV, e § 10',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A tabela que substitui os valores fixos a partir de 2027.
 *
 * O art. 516 da LC 214/2025 troca as alíneas "b" e "c" do art. 18-A, § 3º, V
 * por remissões ao Anexo VII — e o próprio Anexo declara a vigência de cada
 * linha, começando em 1º/1/2027. **É isso que garante que os R$ 1,00 e R$ 5,00
 * continuam valendo até 31/12/2026.**
 */
export const LC214_ANEXO_VII: Fonte = {
  id: 'lc-214-2025-anexo-vii',
  norma: 'Lei Complementar nº 214, de 16 de janeiro de 2025',
  dispositivo: 'Anexo VII — Valores fixos do Microempreendedor Individual (MEI)',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O carnê-leão — CALC-053. Fundamentos, não valores: quem deve recolher e o
 * que pode ser deduzido. Os números vêm da tabela do IRPF, já cadastrada.
 */
export const LEI_7713_ART_8: Fonte = {
  id: 'lei-7713-1988-art-8',
  norma: 'Lei nº 7.713, de 22 de dezembro de 1988',
  dispositivo: 'Art. 8º, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l7713.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_8134_ART_6: Fonte = {
  id: 'lei-8134-1990-art-6',
  norma: 'Lei nº 8.134, de 27 de dezembro de 1990',
  dispositivo: 'Art. 6º, incisos I a III, e §§ 1º e 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8134.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Os feriados nacionais — CALC-072.
 *
 * **O senso comum erra aqui, e erra na mesma direção.** Carnaval, Sexta-feira
 * Santa e Corpus Christi NÃO são feriados nacionais. A Lei nº 9.093/1995 é
 * explícita: feriados civis são os declarados em lei federal (art. 1º), e a
 * Sexta-Feira da Paixão é feriado RELIGIOSO, declarado em lei MUNICIPAL, dentro
 * de um limite de quatro (art. 2º). Carnaval e Corpus Christi são ponto
 * facultativo, não feriado.
 */
export const LEI_662_ART_1: Fonte = {
  id: 'lei-662-1949-art-1',
  norma: 'Lei nº 662, de 6 de abril de 1949, com a redação da Lei nº 10.607, de 2002',
  dispositivo: 'Art. 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l0662.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_6802_ART_1: Fonte = {
  id: 'lei-6802-1980-art-1',
  norma: 'Lei nº 6.802, de 30 de junho de 1980',
  dispositivo: 'Art. 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l6802.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_14759_ART_1: Fonte = {
  id: 'lei-14759-2023-art-1',
  norma: 'Lei nº 14.759, de 21 de dezembro de 2023',
  dispositivo: 'Art. 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm',
  orgao: 'Congresso Nacional',
}

/** O fundamento de por que Carnaval e Sexta-feira Santa ficam de fora. */
export const LEI_9093_1995: Fonte = {
  id: 'lei-9093-1995',
  norma: 'Lei nº 9.093, de 12 de setembro de 1995',
  dispositivo: 'Arts. 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9093.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A margem consignável do empregado CLT — CALC-027.
 *
 * **O art. 2º, § 2º, I é onde a margem está, e o inciso VIII é onde está a
 * base.** "Remuneração disponível" é definida como "os vencimentos, subsídios,
 * soldos, salários ou remunerações, DESCONTADAS AS CONSIGNAÇÕES COMPULSÓRIAS" —
 * o líquido, não o bruto. É o erro mais comum de quem estima a própria margem.
 *
 * A alínea que separava 5% para cartão de crédito foi REVOGADA pela Lei nº
 * 14.431/2022: hoje o limite é único, de 40%.
 */
export const LEI_10820_ART_2: Fonte = {
  id: 'lei-10820-2003-art-2',
  norma: 'Lei nº 10.820, de 17 de dezembro de 2003, com a redação da Lei nº 14.431, de 2022',
  dispositivo: 'Art. 2º, § 2º, I, e art. 2º, VIII',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.820.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Vale-transporte — `RN-027`, em CALC-001.
 *
 * **A regra estava a uma leitura de distância, e o documento a listou como
 * "não localizada" desde 31/07/2026.** O percentual é o mesmo desde a lei
 * original de 1985, e nunca dependeu de portaria anual — que é o formato de
 * pendência que a lista de §5.1 sugeria.
 *
 * As duas fontes dizem a mesma coisa, e a segunda é a que **define a base**:
 *
 *   Lei nº 7.418/1985, art. 4º, parágrafo único — *"O empregador participará
 *   dos gastos de deslocamento do trabalhador com a ajuda de custo equivalente
 *   à parcela que exceder a 6% (seis por cento) de seu salário básico."*
 *
 *   Decreto nº 10.854/2021, art. 114, I — *"pelo beneficiário, na parcela
 *   equivalente a seis por cento de seu salário básico ou vencimento,
 *   **excluídos quaisquer adicionais ou vantagens**"*.
 *
 * A lei dá o número; o regulamento diz sobre o quê. Sem o inciso I, a base
 * plausível seria o salário bruto, e sobre quem recebe adicional isso
 * **superestima** a cota do trabalhador — o mesmo erro de base que
 * `consignado.ts` documenta para a margem consignável.
 *
 * O art. 4º não traz marca de revogação no texto compilado do Planalto; o que
 * aparece revogado ali é o art. 3º, o incentivo fiscal, pela Lei nº 9.532/1997.
 */
export const LEI_7418_ART_4: Fonte = {
  id: 'lei-7418-1985-art-4',
  norma: 'Lei nº 7.418, de 16 de dezembro de 1985 (artigo renumerado pela Lei nº 7.619, de 1987)',
  dispositivo: 'Art. 4º, parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l7418.htm',
  orgao: 'Congresso Nacional',
}

export const DEC_10854_ART_114: Fonte = {
  id: 'decreto-10854-2021-art-114',
  norma: 'Decreto nº 10.854, de 10 de novembro de 2021',
  dispositivo: 'Art. 114, I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/D10854.htm',
  orgao: 'Presidência da República',
}

/**
 * Ganho de capital na venda de imóvel — CALC-020.
 *
 * **A armadilha de leitura aqui é a pior do projeto até agora.** O art. 21 da
 * Lei nº 8.981/1995 aparece com três redações empilhadas, e a da **MP nº
 * 692/2015** traz faixas completamente diferentes — 15%/20%/25%/30% com corte em
 * R$ 1 milhão — que não são as vigentes. A vigente é a da Lei nº 13.259/2016.
 */
export const LEI_8981_ART_21: Fonte = {
  id: 'lei-8981-1995-art-21',
  norma: 'Lei nº 8.981, de 20 de janeiro de 1995, com a redação da Lei nº 13.259, de 2016',
  dispositivo: 'Art. 21, incisos I a IV',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8981.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_9250_ART_23: Fonte = {
  id: 'lei-9250-1995-art-23',
  norma: 'Lei nº 9.250, de 26 de dezembro de 1995',
  dispositivo: 'Art. 23',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9250.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_11196_ART_39: Fonte = {
  id: 'lei-11196-2005-art-39',
  norma: 'Lei nº 11.196, de 21 de novembro de 2005',
  dispositivo: 'Art. 39, caput e §§ 2º, 3º e 5º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11196.htm',
  orgao: 'Congresso Nacional',
}

export const LEI_11196_ART_40: Fonte = {
  id: 'lei-11196-2005-art-40',
  norma: 'Lei nº 11.196, de 21 de novembro de 2005',
  dispositivo: 'Art. 40, § 1º, incisos I e II, e § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11196.htm',
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

/**
 * O contrato intermitente — CALC-014.
 *
 * **A leitura do texto consolidado aqui é decisiva.** O art. 452-A aparece com
 * a redação da Lei nº 13.467/2017, depois com a da Medida Provisória nº
 * 808/2017 e de novo com a da Lei — e a da MP traz a marca **"(Vigência
 * encerrada)"**. A MP caducou em 23/04/2018 sem ser convertida, e com ela caiu
 * tudo o que ela criara: os §§ 10 a 15 e os arts. 452-B a 452-H INTEIROS.
 *
 * Isso não é detalhe de nota de rodapé. Era no art. 452-E que estava o regime
 * de rescisão do intermitente — aviso prévio e multa do FGTS pela METADE — e no
 * art. 452-F a regra de calculá-los pela média dos valores recebidos. **Nada
 * disso está em vigor.** Ver `ESTADO-DO-PROJETO` §7.61.
 */
export const CLT_ART_452A: Fonte = {
  id: 'clt-art-452-a',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017',
  dispositivo: 'Art. 452-A, caput e §§ 6º, 7º, 8º e 9º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
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
 * A NORMA QUE MANDA REAJUSTAR, E QUE DIZ A QUEM CABE DIVULGAR.
 *
 * Esta fonte respondeu, em 06/08/2026, a pendência que o projeto carregava como
 * a mais grave da sua tese — e a resposta é que **a pergunta estava errada**.
 *
 * Procurava-se a "portaria anual que formaliza a tabela do seguro-desemprego".
 * Ela não foi encontrada em busca do DOU por período, por órgão, no JSON diário
 * de janeiro nem na página de serviço do MTE, e a conclusão registrada era que
 * a fonte estava abaixo do padrão da casa. O texto da resolução mostra por quê:
 *
 *   Art. 19  "O reajuste das três faixas salariais [...] para os anos
 *            subsequentes à publicação desta Resolução, observará a variação do
 *            Índice Nacional de Preços ao Consumidor - INPC, calculado e
 *            divulgado pela [...] IBGE, acumulada nos doze meses anteriores ao
 *            mês de reajuste."
 *   § 1º     "A divulgação dos valores das três faixas salariais reajustadas na
 *            forma do caput do artigo [...] caberá à Secretaria de Trabalho do
 *            Ministério do Trabalho e Previdência."
 *
 * **Não existe ato anual a localizar.** O reajuste é comandado pela própria
 * resolução, e o que a norma prevê no lugar de uma portaria nova é a
 * *divulgação* dos valores pela Secretaria. A publicação do órgão não é um
 * substituto precário do ato — ela **é** o ato que o art. 19, § 1º determina.
 *
 * O art. 17 traz as três faixas com os valores de 2022, que são a base da série,
 * e os fatores 0,8 e 0,5. É por isso que esta fonte entra no conjunto: ela dá
 * fundamento normativo ao método inteiro, que antes se apoiava só no art. 5º da
 * lei — cujos limites estão em BTN, moeda extinta em 1991.
 */
export const RES_CODEFAT_957: Fonte = {
  id: 'res-codefat-957-2022',
  norma: 'Resolução CODEFAT nº 957, de 21 de setembro de 2022',
  dispositivo: 'Arts. 17 e 19',
  url: 'https://portalfat.mte.gov.br/wp-content/uploads/2024/01/Resolucao-no-957-de-21-de-setembro-de-2022-Revisao-do-SD.pdf',
  orgao: 'Conselho Deliberativo do Fundo de Amparo ao Trabalhador',
}

/**
 * A DIVULGAÇÃO DO ART. 19, § 1º — e o que a sustenta.
 *
 * Esta continuava sendo, até 06/08/2026, "a fonte mais fraca do projeto", com
 * uma nota pedindo que a próxima auditoria trocasse a URL pela portaria. A nota
 * saiu: a portaria não existe, pela razão registrada em `RES_CODEFAT_957`.
 *
 * O que sustenta os valores de 2026, hoje, são três coisas conferidas:
 *
 *   1. **A norma** — `RES_CODEFAT_957`, art. 19: reajuste pelo INPC do IBGE
 *      acumulado nos doze meses anteriores ao mês do reajuste.
 *   2. **A divulgação assinada do exercício anterior** — o Anexo SEI nº 4274391
 *      (Processo nº 19965.200004/2025-82), assinado em 10/01/2025 pelo
 *      Coordenador-Geral do Seguro-Desemprego, Abono Salarial e Identificação
 *      Profissional, com código verificador. Documento com assinatura, órgão e
 *      procedência — não notícia. Traz a tabela de 2025 e declara o INPC de
 *      4,77% de 2024.
 *   3. **A reprodução aritmética**, feita em 06/08/2026: aplicando o INPC de
 *      3,90% divulgado para o reajuste de 2026 aos quatro valores do anexo
 *      assinado de 2025, os quatro resultados batem com os publicados, ao
 *      centavo — limite da 1ª faixa, limite da 2ª, parcela a somar e teto.
 *
 * A terceira é a que muda a natureza da conferência. Antes, os números vinham de
 * uma página e não havia como checá-los; agora eles são **deriváveis** de um
 * documento assinado pela regra que a norma manda aplicar. Um erro de
 * transcrição na página teria de ser um erro que a fórmula do art. 19 reproduz,
 * o que é bem diferente de um erro qualquer.
 *
 * **Conferência cruzada que já existia, e continua valendo:** o piso declarado,
 * R$ 1.621,00, coincide com `salario-minimo` de 2026, conferido no PDF da
 * Portaria Interministerial MPS/MF nº 13/2026.
 *
 * **O que falta, e a busca já foi delimitada.** Cadastrar a vigência de 2025 como
 * exercício anterior exige o DIA em que ela passou a valer. O anexo assinado traz
 * os valores e declara apenas *"período: ano de 2025"*; as tabelas de 2024 e de
 * 2026 valem a partir de **11 de janeiro**, não de 1º — então "ano de 2025" não
 * responde, e cadastrar 01/01 aplicaria a tabela nova à primeira semana de
 * janeiro, quando a antiga ainda valia.
 *
 * **Onde já se procurou (07/08/2026), para não repetir:**
 *
 *   ✗ `gov.br/trabalho-e-emprego/.../2025/janeiro/seguro-desemprego-2025-...`
 *     — a notícia existe e a página pede autenticação
 *   ✗ `portalfat.mte.gov.br` — espelhou 2024 e 2026, não espelhou 2025
 *   ✗ busca do próprio portal do FAT por "seguro-desemprego 2025"
 *   ✗ Relatório de Gestão do FAT 2025 (`RG_FAT_2025.pdf`, abril/2026, no host
 *     `portalfat.trabalho.gov.br`) — texto extraído, não traz a tabela
 *   ✗ **o art. 19 da própria Resolução CODEFAT nº 957/2022, lido na íntegra:
 *     ele NÃO fixa dia nem mês.** Define o índice (INPC) e o período de
 *     acumulação ("doze meses anteriores ao mês de reajuste"), e o § 2º
 *     menciona *"a vigência do reajuste"* como data já conhecida, sem dizê-la.
 *     Esta avenida está fechada em definitivo — não vale reler o artigo.
 *
 * **Uma coincidência que NÃO serve de fonte, registrada para não ser usada:** a
 * Lei nº 7.998 é de **11 de janeiro** de 1990, e as tabelas de 2024 e 2026
 * começam a valer em 11/01. O padrão é forte e a explicação é plausível, mas
 * nenhuma norma lida até aqui diz que o reajuste vigora no aniversário da lei.
 * Padrão observado não é dispositivo.
 *
 * O que resta tentar: a edição do DOU de janeiro/2025 (fora da janela de ~4
 * meses do INLABS, exige a busca por edição no portal do IN), ou o pedido da
 * página do MTE por outro caminho que não o autenticado.
 *
 * **Não foi inferida por analogia**, e não deve ser: data de vigência é valor
 * legal, e o dia certo decide qual tabela se aplica a quem foi dispensado na
 * primeira semana de janeiro.
 */
export const MTE_TABELA_SEGURO_DESEMPREGO: Fonte = {
  id: 'mte-tabela-seguro-desemprego-2026',
  norma:
    'Divulgação das faixas do seguro-desemprego pelo Ministério do Trabalho e Emprego, na forma do art. 19, § 1º, da Resolução CODEFAT nº 957/2022 e do art. 5º da Lei nº 7.998/1990',
  dispositivo: 'Faixas vigentes a partir de 11/01/2026',
  url: 'https://portalfat.mte.gov.br/mte-reajusta-valores-do-beneficio-seguro-desemprego/',
  orgao: 'Ministério do Trabalho e Emprego',
}

/**
 * O anexo assinado de 2025 — a peça que faltava para conferir a série.
 *
 * Não sustenta nenhuma vigência cadastrada hoje (a de 2025 ainda não existe, e a
 * razão está acima). Está aqui porque é a **prova documental** da reprodução
 * descrita em `MTE_TABELA_SEGURO_DESEMPREGO`, e porque quem for cadastrar 2025
 * na próxima sessão precisa achá-lo sem repetir a busca.
 *
 * O PDF é digitalizado e `pdftotext` devolve vazio nele. Rasterizar funciona —
 * é a mesma lição da portaria do INSS, registrada em `ESTADO-DO-PROJETO` §5.2:
 *
 *   pdftoppm -png -r 150 anexo.pdf pag
 */
export const MTE_ANEXO_SEGURO_DESEMPREGO_2025: Fonte = {
  id: 'mte-anexo-seguro-desemprego-2025',
  norma:
    'Anexo "Programa do Seguro-Desemprego — Faixas de salário médio necessárias ao cálculo do benefício", período: ano de 2025, SEI nº 4274391, Processo nº 19965.200004/2025-82',
  dispositivo:
    'Secretaria de Proteção ao Trabalhador — assinado em 10/01/2025 pelo Coordenador-Geral do Seguro-Desemprego',
  url: 'https://www.gov.br/trabalho-e-emprego/pt-br/pdfs/sei_4274391_anexo.pdf',
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

// ---------------------------------------------------------------------------
// Banco de horas — CALC-013
// ---------------------------------------------------------------------------

/**
 * O prazo do banco de horas por norma coletiva, e o que acontece na rescisão.
 *
 * § 2º: o acréscimo de salário pode ser dispensado se, por força de acordo ou
 * convenção coletiva, o excesso de um dia for compensado em outro, *"no período
 * máximo de um ano"*, sem ultrapassar dez horas diárias.
 *
 * § 3º é o que dá utilidade à calculadora: *"na hipótese de rescisão do contrato
 * de trabalho sem que tenha havido a compensação integral da jornada
 * extraordinária [...] o trabalhador terá direito ao pagamento das horas extras
 * não compensadas, calculadas sobre o valor da remuneração na data da
 * rescisão"*. Saldo positivo não compensado não evapora: vira dinheiro, pelo
 * salário do fim e com adicional.
 */
export const CLT_ART_59: Fonte = {
  id: 'clt-art-59',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Medida Provisória nº 2.164-41, de 2001',
  dispositivo: 'Art. 59, § 2º e § 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Os dois prazos que a Reforma Trabalhista criou, e a regra do art. 59-B.
 *
 * § 5º: o banco de horas *"poderá ser pactuado por acordo individual escrito,
 * desde que a compensação ocorra no período máximo de seis meses"*.
 * § 6º: acordo individual, tácito ou escrito, *"para a compensação no mesmo
 * mês"*.
 *
 * Art. 59-B: descumpridas as exigências da compensação, não há repetição do
 * pagamento das horas — *"sendo devido apenas o respectivo adicional"* —, desde
 * que não ultrapassada a duração máxima semanal. E o parágrafo único fecha a
 * discussão mais comum: *"a prestação de horas extras habituais não
 * descaracteriza o acordo de compensação de jornada e o banco de horas"*.
 */
export const CLT_ART_59_REFORMA: Fonte = {
  id: 'clt-art-59-reforma',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017',
  dispositivo: 'Art. 59, § 5º e § 6º, e art. 59-B',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/** Todas as fontes, para conferência de conjunto. */
export const FONTES: readonly Fonte[] = [
  PORTARIA_MPS_MF_6_2025,
  PORTARIA_MPS_MF_13_2026,
  LEI_14848_2024,
  LEI_15191_2025,
  RFB_TABELA_ANUAL_2024,
  RFB_TABELA_ANUAL_2025,
  LEI_9250_ART_8,
  LEI_9250_ART_10,
  LEI_9250_ART_22,
  RFB_PR_IRPF_CRIPTOATIVOS,
  LEI_14300_ART_26,
  LEI_14300_ART_27,
  LEI_9250_ART_6A,
  LEI_9250_ART_16A,
  LC_123_ANEXO_III,
  LC_123_ANEXO_V,
  LC_123_ART_18_FATOR_R,
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
  RES_CODEFAT_957,
  MTE_TABELA_SEGURO_DESEMPREGO,
  MTE_ANEXO_SEGURO_DESEMPREGO_2025,
  LEI_7418_ART_4,
  DEC_10854_ART_114,
  RES_CMN_4765,
  LEI_8212_ART_22,
  STF_TEMA_985,
  LC_150_ART_22,
  LC_150_ART_23,
  LEI_11033_ART_1,
  LEI_11033_ART_3,
  CLT_ART_59,
  CLT_ART_59_REFORMA,
]
