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
 * **Desde 07/08/2026 ele sustenta a vigência de 2025**, que até então não existia
 * por falta do DIA de início — os valores estavam aqui, a data não.
 *
 * A data veio da publicação do próprio MTE, que estava pública em janeiro de
 * 2025 e hoje pede autenticação. O Internet Archive a capturou em 11/01/2025 às
 * 15h34, um dia depois do carimbo da página ("Publicado em 10/01/2025 16h56"), e
 * o texto do ministério diz em letra: *"com vigência a partir de 11 de janeiro
 * de 2025"*. A captura está em
 * `web.archive.org/web/20250111153440/https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/janeiro/seguro-desemprego-2025-atualizacao-das-faixas-e-valores-do-beneficio`.
 *
 * **O arquivo NÃO virou fonte cadastrada, e a recusa foi do verificador.** BV-07
 * reprovou `web.archive.org` por não ser domínio oficial, e a recusa está certa:
 * a regra existe para impedir que valor legal entre por site que recopia a
 * fonte, e abrir exceção por domínio abriria para qualquer página arquivada.
 *
 * A composição que passou é a honesta: **os valores vêm deste anexo**, que é
 * documento assinado num endereço gov.br que o usuário consegue abrir; **a data
 * vem da publicação arquivada**, e está declarada na observação de cada
 * vigência, com o endereço da captura. O que se clica na memória de cálculo
 * continua sendo fonte oficial acessível.
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

// ===========================================================================
// Lote 1 da expansão do catálogo — trabalhistas, 17/09/2026
//
// Todos os dispositivos abaixo foram lidos no texto consolidado do Planalto em
// 17/09/2026, com os trechos riscados (redação revogada) REMOVIDOS antes da
// leitura — a lição de §7.42: o Planalto empilha redações, e a vigente é a que
// não está riscada. As datas de publicação das leis antigas foram conferidas
// na ficha de legislação da Câmara dos Deputados, porque o texto do Planalto
// traz a data da lei e não a do Diário Oficial.
// ===========================================================================

/**
 * Insalubridade — CLT, art. 192, com a redação da Lei nº 6.514/1977.
 *
 * > "O exercício de trabalho em condições insalubres, acima dos limites de
 * > tolerância estabelecidos pelo Ministério do Trabalho, assegura a percepção
 * > de adicional respectivamente de 40% (quarenta por cento), 20% (vinte por
 * > cento) e 10% (dez por cento) do salário-mínimo da região, segundo se
 * > classifiquem nos graus máximo, médio e mínimo."
 *
 * A Lei nº 6.514 entrou em vigor na data da publicação (art. 5º): Diário
 * Oficial da União, Seção 1, de 23/12/1977, p. 17777.
 */
export const CLT_ART_192: Fonte = {
  id: 'clt-art-192',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 6.514, de 1977',
  dispositivo: 'Art. 192',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Periculosidade — CLT, art. 193, § 1º, incluído pela Lei nº 6.514/1977.
 *
 * > "O trabalho em condições de periculosidade assegura ao empregado um
 * > adicional de 30% (trinta por cento) sobre o salário sem os acréscimos
 * > resultantes de gratificações, prêmios ou participações nos lucros da
 * > empresa."
 *
 * § 2º: "O empregado poderá optar pelo adicional de insalubridade que
 * porventura lhe seja devido." § 4º (Lei nº 12.997/2014): "São também
 * consideradas perigosas as atividades de trabalhador em motocicleta."
 */
export const CLT_ART_193: Fonte = {
  id: 'clt-art-193',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 6.514, de 1977',
  dispositivo: 'Art. 193, §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Trabalho noturno rural — Lei nº 5.889/1973, art. 7º.
 *
 * > "considera-se trabalho noturno o executado entre as vinte e uma horas de um
 * > dia e as cinco horas do dia seguinte, na lavoura, e entre as vinte horas de
 * > um dia e as quatro horas do dia seguinte, na atividade pecuária."
 * > "Parágrafo único. Todo trabalho noturno será acrescido de 25% (vinte e cinco
 * > por cento) sobre a remuneração normal."
 *
 * **A lei rural não reduz a hora.** A hora de 52min30s é do art. 73, § 1º, da
 * CLT, e a Lei nº 5.889 não a reproduz — por isso a calculadora não converte
 * horas de relógio quando o trabalho é rural. Em vigor na publicação (art. 21):
 * Diário Oficial da União, Seção 1, de 11/06/1973, p. 5585.
 */
export const LEI_5889_ART_7: Fonte = {
  id: 'lei-5889-1973-art-7',
  norma: 'Lei nº 5.889, de 8 de junho de 1973',
  dispositivo: 'Art. 7º e parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l5889.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Perda do repouso por falta injustificada — Lei nº 605/1949, art. 6º.
 *
 * > "Não será devida a remuneração quando, sem motivo justificado, o empregado
 * > não tiver trabalhado durante toda a semana anterior, cumprindo
 * > integralmente o seu horário de trabalho."
 *
 * O § 1º lista os motivos justificados — entre eles os do art. 473 da CLT, a
 * doença comprovada e o acidente do trabalho. É a lista que decide se a falta
 * custa só o dia ou o dia e o repouso.
 */
export const LEI_605_ART_6: Fonte = {
  id: 'lei-605-1949-art-6',
  norma: 'Lei nº 605, de 5 de janeiro de 1949',
  dispositivo: 'Art. 6º, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Repouso de quem ganha por produção — Lei nº 605/1949, art. 7º, "c".
 *
 * > "para os que trabalham por tarefa ou peça, o equivalente ao salário
 * > correspondente às tarefas ou peças feitas durante a semana, no horário
 * > normal de trabalho, dividido pelos dias de serviço efetivamente prestados
 * > ao empregador"
 *
 * É a regra que dá a FORMA da conta da remuneração variável: o ganho do
 * período dividido pelos dias trabalhados é o valor de um dia de repouso. A
 * alínea "a", já cadastrada em `LEI_605_ART_7`, é a do salário fixo.
 */
export const LEI_605_ART_7_C: Fonte = {
  id: 'lei-605-1949-art-7-c',
  norma: 'Lei nº 605, de 5 de janeiro de 1949',
  dispositivo: 'Art. 7º, "c"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Súmulas do TST lidas no "Livro de Súmulas, OJs e PNs" publicado pelo
 * tribunal, em 17/09/2026 — o mesmo documento que já sustenta as Súmulas 172 e
 * 431. Textos transcritos:
 *
 * - **27**: "É devida a remuneração do repouso semanal e dos dias feriados ao
 *   empregado comissionista, ainda que pracista."
 * - **60**: "I - O adicional noturno, pago com habitualidade, integra o salário
 *   do empregado para todos os efeitos. II - Cumprida integralmente a jornada
 *   no período noturno e prorrogada esta, devido é também o adicional quanto
 *   às horas prorrogadas."
 * - **139**: "Enquanto percebido, o adicional de insalubridade integra a
 *   remuneração para todos os efeitos legais."
 * - **191, I**: "O adicional de periculosidade incide apenas sobre o salário
 *   básico e não sobre este acrescido de outros adicionais." Os itens II e III
 *   tratam do eletricitário contratado antes da Lei nº 12.740/2012.
 * - **364, I**: devido na exposição permanente ou intermitente; "Indevido,
 *   apenas, quando o contato dá-se de forma eventual".
 */
export const TST_SUMULA_27: Fonte = {
  id: 'tst-sumula-27',
  norma: 'Súmula 27 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 121/2003, DJ 19, 20 e 21.11.2003',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_SUMULA_60: Fonte = {
  id: 'tst-sumula-60',
  norma: 'Súmula 60 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 129/2005, DJ 20, 22 e 25.04.2005',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_SUMULA_139: Fonte = {
  id: 'tst-sumula-139',
  norma: 'Súmula 139 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 129/2005, DJ 20, 22 e 25.04.2005',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_SUMULA_191: Fonte = {
  id: 'tst-sumula-191',
  norma: 'Súmula 191 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 214/2016, DEJT 30.11.2016 e 01 e 02.12.2016',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

export const TST_SUMULA_364: Fonte = {
  id: 'tst-sumula-364',
  norma: 'Súmula 364 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 209/2016, DEJT 01, 02 e 03.06.2016',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

/**
 * Aprendiz — CLT, arts. 428, § 2º, e 432.
 *
 * > Art. 428, § 2º (red. Lei nº 13.420/2017): "Ao aprendiz, salvo condição
 * > mais favorável, será garantido o salário mínimo hora."
 * > Art. 432 (red. Lei nº 10.097/2000): "A duração do trabalho do aprendiz não
 * > excederá de seis horas diárias, sendo vedadas a prorrogação e a
 * > compensação de jornada." § 1º: até oito horas para quem já completou o
 * > ensino fundamental, "se nelas forem computadas as horas destinadas à
 * > aprendizagem teórica".
 */
export const CLT_ART_428: Fonte = {
  id: 'clt-art-428',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.420, de 2017',
  dispositivo: 'Art. 428, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

export const CLT_ART_432: Fonte = {
  id: 'clt-art-432',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 10.097, de 2000',
  dispositivo: 'Art. 432, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * FGTS do aprendiz — Lei nº 8.036/1990, art. 15, § 7º, incluído pela Lei nº
 * 10.097/2000.
 *
 * > "Os contratos de aprendizagem terão a alíquota a que se refere o caput deste
 * > artigo reduzida para dois por cento."
 *
 * A nota de `fgts-aliquota-2022` já registrava este parágrafo como "fora do
 * escopo de CALC-002". Com o aprendiz no catálogo, ele entra. Lei nº 10.097 em
 * vigor na publicação (art. 4º): DOU de 20/12/2000.
 */
export const LEI_8036_ART_15_P7: Fonte = {
  id: 'lei-8036-1990-art-15-p7',
  norma: 'Lei nº 8.036, de 11 de maio de 1990, com a redação da Lei nº 10.097, de 2000',
  dispositivo: 'Art. 15, § 7º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Salário mínimo HORÁRIO — fixado pelo decreto anual, e não derivado.
 *
 * **Por que é parâmetro próprio, e não o mensal dividido por 220.** O decreto
 * fixa o valor horário arredondado, e o art. 428, § 2º, garante ao aprendiz
 * "o salário mínimo hora" — o valor do decreto. Dividir o mensal daria
 * R$ 6,8999… em 2025 e R$ 7,3681… em 2026: um centavo de diferença por hora,
 * que vira quase dois reais num mês de aprendiz, e na direção de pagar menos.
 *
 * > Decreto nº 12.342/2024, art. 1º, parágrafo único: "o valor diário do
 * > salário mínimo corresponderá a R$ 50,60 (cinquenta reais e sessenta
 * > centavos) e o valor horário, a R$ 6,90 (seis reais e noventa centavos)."
 * > Art. 2º: em vigor em 1º de janeiro de 2025.
 *
 * > Decreto nº 12.797/2025, art. 1º, parágrafo único: valor horário "a R$ 7,37
 * > (sete reais e trinta e sete centavos)". Art. 2º: em vigor em 1º de janeiro
 * > de 2026.
 */
export const DECRETO_12342_2024: Fonte = {
  id: 'decreto-12342-2024',
  norma: 'Decreto nº 12.342, de 30 de dezembro de 2024',
  dispositivo: 'Art. 1º, parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/D12342.htm',
  orgao: 'Presidência da República',
}

export const DECRETO_12797_2025: Fonte = {
  id: 'decreto-12797-2025',
  norma: 'Decreto nº 12.797, de 23 de dezembro de 2025',
  dispositivo: 'Art. 1º, parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm',
  orgao: 'Presidência da República',
}

/**
 * Recesso do estagiário — Lei nº 11.788/2008, art. 13.
 *
 * > "É assegurado ao estagiário, sempre que o estágio tenha duração igual ou
 * > superior a 1 (um) ano, período de recesso de 30 (trinta) dias, a ser gozado
 * > preferencialmente durante suas férias escolares.
 * > § 1º O recesso de que trata este artigo deverá ser remunerado quando o
 * > estagiário receber bolsa ou outra forma de contraprestação.
 * > § 2º Os dias de recesso previstos neste artigo serão concedidos de maneira
 * > proporcional, nos casos de o estágio ter duração inferior a 1 (um) ano."
 *
 * Em vigor na publicação (art. 21): DOU de 26/09/2008.
 */
export const LEI_11788_ART_13: Fonte = {
  id: 'lei-11788-2008-art-13',
  norma: 'Lei nº 11.788, de 25 de setembro de 2008',
  dispositivo: 'Art. 13, caput e §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm',
  orgao: 'Congresso Nacional',
}

/**
 * PLR — Lei nº 10.101/2000, art. 3º, §§ 5º a 7º, com a redação da Lei nº
 * 12.832/2013.
 *
 * > § 5º: "será tributada pelo imposto sobre a renda exclusivamente na fonte, em
 * > separado dos demais rendimentos recebidos, no ano do recebimento ou crédito,
 * > com base na tabela progressiva anual constante do Anexo e não integrará a
 * > base de cálculo do imposto devido pelo beneficiário na Declaração de Ajuste
 * > Anual."
 * > § 7º: "Na hipótese de pagamento de mais de 1 (uma) parcela referente a um
 * > mesmo ano-calendário, o imposto deve ser recalculado, com base no total da
 * > participação nos lucros recebida no ano-calendário, mediante a utilização
 * > da tabela constante do Anexo, deduzindo-se do imposto assim apurado o valor
 * > retido anteriormente."
 * > § 10: "Na determinação da base de cálculo da participação dos trabalhadores
 * > nos lucros ou resultados, poderão ser deduzidas as importâncias pagas em
 * > dinheiro a título de pensão alimentícia em face das normas do Direito de
 * > Família, quando em cumprimento de decisão judicial, de acordo homologado
 * > judicialmente ou de separação ou divórcio consensual realizado por
 * > escritura pública, desde que correspondentes a esse rendimento, não podendo
 * > ser utilizada a mesma parcela para a determinação da base de cálculo dos
 * > demais rendimentos."
 *
 * E o caput, que decide as outras incidências: a participação "não substitui
 * ou complementa a remuneração devida a qualquer empregado, nem constitui base
 * de incidência de qualquer encargo trabalhista, não se lhe aplicando o
 * princípio da habitualidade."
 */
export const LEI_10101_ART_3: Fonte = {
  id: 'lei-10101-2000-art-3',
  norma: 'Lei nº 10.101, de 19 de dezembro de 2000, com a redação da Lei nº 12.832, de 2013',
  dispositivo: 'Art. 3º, caput e §§ 5º, 7º e 10',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l10101.htm',
  orgao: 'Congresso Nacional',
}

/**
 * A tabela da PLR VIGENTE — publicada pela Receita Federal.
 *
 * **O que foi encontrado, e o que NÃO foi, dito com clareza.** O texto
 * consolidado da Lei nº 10.101 no Planalto ainda exibe no Anexo a tabela
 * original de 2013 (isenção até R$ 6.000,00): as atualizações posteriores não
 * foram incorporadas ao Anexo publicado ali. A Lei nº 15.191/2025, que
 * atualizou a tabela mensal do IRPF em maio de 2025, **não menciona** a Lei nº
 * 10.101 — a busca por "10.101", "lucros" e pelos valores novos no texto dela
 * voltou vazia.
 *
 * A tabela vigente foi lida, então, na página de tabelas da Receita Federal —
 * órgão competente pela arrecadação —, que publica as DUAS da mesma forma nas
 * páginas de 2025 e de 2026: "De janeiro a abril de 2025" (isenção até
 * R$ 7.640,80) e "A partir de maio de 2025" (isenção até R$ 8.214,40). A
 * página de 2026 repete a de maio de 2025, sem tabela nova.
 *
 * **A conferência que dá confiança é aritmética, e fecha nas duas tabelas.**
 * Tabela progressiva com parcela a deduzir é contínua: nos limites de cada
 * faixa, a conta pela faixa de baixo e pela de cima dá o mesmo imposto.
 *
 *   maio/2025:  8.214,40 × 7,5%  = 616,08  → parcela da 2ª faixa   ✅
 *               9.922,28 × 7,5%  − 616,08   = 128,09
 *               9.922,28 × 15%   − 1.360,25 = 128,09                ✅
 *              13.167,00 × 15%   − 1.360,25 = 614,80
 *              13.167,00 × 22,5% − 2.347,78 = 614,80 (614,795)      ✅
 *              16.380,38 × 22,5% − 2.347,78 = 1.337,81
 *              16.380,38 × 27,5% − 3.166,80 = 1.337,80              ✅ (1 centavo de arredondamento da própria tabela)
 *   jan-abr/25: 7.640,80 × 7,5%  = 573,06  → parcela da 2ª faixa   ✅
 *
 * Um erro de transcrição em qualquer das parcelas quebraria uma dessas
 * igualdades. O ato normativo que alterou o Anexo em 2025 fica registrado como
 * NÃO LOCALIZADO — para a próxima auditoria achá-lo sem repetir esta busca.
 */
export const RFB_TABELA_PLR: Fonte = {
  id: 'rfb-tabela-plr',
  norma:
    'Tabela de tributação exclusiva na fonte da participação nos lucros ou resultados, publicada pela Receita Federal na forma do art. 3º, § 5º, da Lei nº 10.101/2000',
  dispositivo: 'Tabelas 2025 e 2026 · Participação nos Lucros ou Resultados',
  url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  orgao: 'Receita Federal do Brasil',
}

// ---------------------------------------------------------------------------
// Lote 2 do catálogo v5 — licenças, salário-família, contrato a prazo,
// transferência e sobreaviso (CALC-086 a CALC-091)
// ---------------------------------------------------------------------------

/**
 * Licença-maternidade — CF, art. 7º, XVIII.
 *
 * > "licença à gestante, sem prejuízo do emprego e do salário, com a duração de
 * > cento e vinte dias"
 */
export const CF_ART_7_XVIII: Fonte = {
  id: 'cf-1988-art-7-xviii',
  norma: 'Constituição da República Federativa do Brasil de 1988',
  dispositivo: 'Art. 7º, XVIII',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Início do afastamento — CLT, art. 392, § 1º (red. Lei nº 10.421/2002).
 *
 * > "A empregada deve, mediante atestado médico, notificar o seu empregador da
 * > data do início do afastamento do emprego, que poderá ocorrer entre o 28º
 * > (vigésimo oitavo) dia antes do parto e ocorrência deste."
 *
 * § 2º: os repousos antes e depois do parto podem ser aumentados de duas
 * semanas cada, por atestado. § 7º (Lei nº 15.222/2025): internação que supere
 * essas duas semanas estende a licença em até 120 dias após a alta. Fundamento,
 * não parâmetro: a calculadora conta a partir da data informada.
 */
export const CLT_ART_392: Fonte = {
  id: 'clt-art-392',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 10.421, de 2002',
  dispositivo: 'Art. 392, caput e §§ 1º, 2º e 7º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Licença-paternidade até 31/12/2026 — ADCT, art. 10, § 1º.
 *
 * > "Até que a lei venha a disciplinar o disposto no art. 7º, XIX, da
 * > Constituição, o prazo da licença-paternidade a que se refere o inciso é de
 * > cinco dias."
 *
 * A lei que disciplina é a Lei nº 15.371/2026, em vigor em 1º/01/2027 (art. 14).
 */
export const ADCT_ART_10_P1: Fonte = {
  id: 'adct-art-10-p1',
  norma: 'Ato das Disposições Constitucionais Transitórias da Constituição de 1988',
  dispositivo: 'Art. 10, § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Licença-paternidade a partir de 2027 — Lei nº 15.371/2026, art. 11. DOU de
 * 1º/04/2026; vigência em 1º/01/2027 (art. 14).
 *
 * > "A licença-paternidade e o salário-paternidade, considerados isoladamente,
 * > terão a duração total de: I – 10 (dez) dias, a partir de 1º de janeiro de
 * > 2027; II – 15 (quinze) dias, a partir de 1º de janeiro de 2028; III – 20
 * > (vinte) dias, a partir de 1º de janeiro de 2029."
 *
 * O inciso III depende do cumprimento de meta fiscal (§§ 1º e 2º) e por isso
 * NÃO está cadastrado: a data em que ele passa a valer não é conhecida hoje.
 * Art. 2º, § 1º: o período é "contado da data de nascimento de filho, de adoção
 * ou de guarda judicial para fins de adoção". Art. 12: acréscimo de um terço
 * no nascimento ou adoção de criança ou adolescente com deficiência.
 */
export const LEI_15371_ART_11: Fonte = {
  id: 'lei-15371-2026-art-11',
  norma: 'Lei nº 15.371, de 31 de março de 2026',
  dispositivo: 'Art. 2º, § 1º, art. 11 e art. 12',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Programa Empresa Cidadã — Lei nº 11.770/2008, art. 1º (red. Lei nº
 * 13.257/2016).
 *
 * > "É instituído o Programa Empresa Cidadã, destinado a prorrogar: I - por 60
 * > (sessenta) dias a duração da licença-maternidade [...]; II - por 15 (quinze)
 * > dias a duração da licença-paternidade, nos termos desta Lei, além dos 5
 * > (cinco) dias estabelecidos no § 1º do art. 10 do [ADCT]."
 *
 * A data de produção de efeitos é condicionada (art. 8º da Lei nº 11.770 e art.
 * 40 da Lei nº 13.257) e não aparece no texto — por isso a cobertura cadastrada
 * começa em 2025, quando a regra está comprovadamente em vigor, e não antes.
 */
export const LEI_11770_ART_1: Fonte = {
  id: 'lei-11770-2008-art-1',
  norma: 'Lei nº 11.770, de 9 de setembro de 2008, com a redação da Lei nº 13.257, de 2016',
  dispositivo: 'Art. 1º, I e II, e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11770.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Empresa Cidadã a partir de 2027 — Lei nº 15.371/2026, art. 10.
 *
 * > "II – por 15 (quinze) dias a duração da licença-paternidade, além do período
 * > obrigatório fixado em lei."
 *
 * Mesmo número de dias, agora somado ao período novo do art. 11.
 */
export const LEI_15371_ART_10: Fonte = {
  id: 'lei-15371-2026-art-10',
  norma: 'Lei nº 11.770, de 9 de setembro de 2008, com a redação da Lei nº 15.371, de 2026',
  dispositivo: 'Art. 1º, II',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Salário-família — Portarias Interministeriais MPS/MF, art. 4º.
 *
 * > 2025 (Portaria nº 6): cota de "R$ 65,00 (sessenta e cinco reais)" por filho
 * > ou equiparado até 14 anos, ou inválido de qualquer idade, "para o segurado
 * > com remuneração mensal não superior a R$ 1.906,04".
 * > 2026 (Portaria nº 13): R$ 67,54, para remuneração não superior a R$ 1.980,38.
 *
 * § 3º: o 13º salário e o adicional de férias não entram na remuneração. § 4º:
 * a cota é proporcional no mês de admissão e no de demissão — a portaria não
 * fixa o divisor, e a calculadora não inventa um.
 */
export const PORTARIA_MPS_MF_6_2025_ART_4: Fonte = {
  id: 'portaria-mps-mf-6-2025-art-4',
  norma: 'Portaria Interministerial MPS/MF nº 6, de 10 de janeiro de 2025',
  dispositivo: 'Art. 4º',
  url: 'https://www.gov.br/previdencia/pt-br/assuntos/rpps/legislacao-dos-rpps/2025/PortariaInterministerialMPSMFn6de10jan2025.pdf',
  orgao: 'Ministério da Previdência Social',
}

export const PORTARIA_MPS_MF_13_2026_ART_4: Fonte = {
  id: 'portaria-mps-mf-13-2026-art-4',
  norma: 'Portaria Interministerial MPS/MF nº 13, de 9 de janeiro de 2026',
  dispositivo: 'Art. 4º',
  url: 'https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/PortariaInterministerialMPSMF13de9dejaneirode2026.pdf',
  orgao: 'Ministério da Previdência Social',
}

/**
 * Contrato por prazo determinado — CLT, arts. 479, 480 e 481.
 *
 * > Art. 479: "Nos contratos que tenham termo estipulado, o empregador que, sem
 * > justa causa, despedir o empregado será obrigado a pagar-lhe, a titulo de
 * > indenização, e por metade, a remuneração a que teria direito até o termo do
 * > contrato."
 *
 * Art. 480: o empregado que se desliga sem justa causa indeniza "os prejuízos
 * que desse fato lhe resultarem". O § 1º, que limitava essa indenização, foi
 * REVOGADO pela Lei nº 6.533/1978 — não há teto legal a calcular.
 *
 * Art. 481: com cláusula assecuratória do direito recíproco de rescisão,
 * aplicam-se "os princípios que regem a rescisão dos contratos por prazo
 * indeterminado".
 */
export const CLT_ART_479: Fonte = {
  id: 'clt-art-479',
  norma: 'Consolidação das Leis do Trabalho',
  dispositivo: 'Arts. 479, 480 e 481',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Adicional de transferência — CLT, art. 469, § 3º, incluído pela Lei nº
 * 6.203/1975 (DOU de 18/04/1975, em vigor na publicação — art. 5º).
 *
 * > "[...] ficará obrigado a um pagamento suplementar, nunca inferior a 25%
 * > (vinte e cinco por cento) dos salários que o empregado percebia naquela
 * > localidade, enquanto durar essa situação."
 */
export const CLT_ART_469: Fonte = {
  id: 'clt-art-469',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 6.203, de 1975',
  dispositivo: 'Art. 469, § 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Sobreaviso e prontidão — CLT, art. 244, §§ 2º e 3º, restaurados pelo
 * Decreto-lei nº 5/1966 (DOU de 05/04/1966, em vigor na publicação — art. 43).
 *
 * > § 2º: "Cada escala de 'sobre-aviso' será, no máximo, de vinte e quatro
 * > horas. As horas de 'sobre-aviso', para todos os efeitos, serão contadas à
 * > razão de 1/3 (um terço) do salário normal."
 * > § 3º: "A escala de prontidão será, no máximo, de doze horas. As horas de
 * > prontidão serão, para todos os efeitos, contadas à razão de 2/3 (dois
 * > terços) do salário-hora normal."
 *
 * O texto é dos ferroviários. A aplicação do sobreaviso fora da ferrovia vem da
 * Súmula 428 do TST; para a prontidão não há súmula equivalente.
 */
export const CLT_ART_244: Fonte = {
  id: 'clt-art-244',
  norma: 'Consolidação das Leis do Trabalho, restaurada pelo Decreto-lei nº 5, de 1966',
  dispositivo: 'Art. 244, §§ 2º e 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Súmula 428 do TST — o sobreaviso fora da ferrovia.
 *
 * > "I - O uso de instrumentos telemáticos ou informatizados fornecidos pela
 * > empresa ao empregado, por si só, não caracteriza o regime de sobreaviso.
 * > II - Considera-se em sobreaviso o empregado que, à distância e submetido a
 * > controle patronal por instrumentos telemáticos ou informatizados,
 * > permanecer em regime de plantão ou equivalente, aguardando a qualquer
 * > momento o chamado para o serviço durante o período de descanso."
 */
export const TST_SUMULA_428: Fonte = {
  id: 'tst-sumula-428',
  norma: 'Súmula 428 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 185/2012, DEJT divulgado em 25, 26 e 27.09.2012',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

// ---------------------------------------------------------------------------
// Lote 3 do catálogo v5 — rescisão por justa causa (CALC-092)
// ---------------------------------------------------------------------------

/**
 * 13º proporcional na rescisão — Lei nº 4.090/1962, art. 3º.
 *
 * > "Ocorrendo rescisão, sem justa causa, do contrato de trabalho, o empregado
 * > receberá a gratificação devida nos termos dos parágrafos 1º e 2º do art. 1º
 * > desta Lei, calculada sobre a remuneração do mês da rescisão."
 *
 * É o dispositivo que NÃO alcança a justa causa: por isso a calculadora de
 * CALC-092 não paga 13º proporcional, e diz onde isso está escrito.
 */
export const LEI_4090_ART_3: Fonte = {
  id: 'lei-4090-1962-art-3',
  norma: 'Lei nº 4.090, de 13 de julho de 1962',
  dispositivo: 'Art. 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l4090.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Férias proporcionais e justa causa — Súmula 171 do TST.
 *
 * > "Salvo na hipótese de dispensa do empregado por justa causa, a extinção do
 * > contrato de trabalho sujeita o empregador ao pagamento da remuneração das
 * > férias proporcionais, ainda que incompleto o período aquisitivo de 12 (doze)
 * > meses (art. 147 da CLT)."
 */
export const TST_SUMULA_171: Fonte = {
  id: 'tst-sumula-171',
  norma: 'Súmula 171 do Tribunal Superior do Trabalho',
  dispositivo: 'Republicada em razão de erro material, DJ 05.05.2004',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

/**
 * Hipóteses de saque do FGTS — Lei nº 8.036/1990, art. 20.
 *
 * > "A conta vinculada do trabalhador no FGTS poderá ser movimentada nas
 * > seguintes situações: I - despedida sem justa causa, inclusive a indireta,
 * > de culpa recíproca e de força maior [...]"
 *
 * A dispensa por justa causa não está na lista — é o fundamento de CALC-092
 * para não exibir saque nem multa.
 */
export const LEI_8036_ART_20: Fonte = {
  id: 'lei-8036-1990-art-20',
  norma: 'Lei nº 8.036, de 11 de maio de 1990',
  dispositivo: 'Art. 20, I',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Ganhos em bolsa — Lei nº 11.033/2004, art. 2º (CALC-093).
 *
 * > "[...] os ganhos líquidos auferidos em operações realizadas em bolsas de
 * > valores, de mercadorias, de futuros, e assemelhadas, inclusive day trade
 * > [...] serão tributados às seguintes alíquotas: I - 20% (vinte por cento),
 * > no caso de operação day trade; II - 15% (quinze por cento), nas demais
 * > hipóteses."
 *
 * O § 1º sujeita as operações que não são day trade à retenção na fonte de
 * 0,005% — o "dedo-duro". Efeitos a partir de 1º/01/2005 (art. 23, I).
 *
 * **Uma medida provisória quase mudou tudo isto e caducou**: a MP nº 1.303/2025
 * poria alíquota única e acabaria com a isenção mensal. O texto compilado do
 * Planalto traz "Vigência encerrada" ao lado de cada remissão a ela, e por isso
 * as alíquotas abaixo continuam sendo as vigentes.
 */
export const LEI_11033_ART_2: Fonte = {
  id: 'lei-11033-2004-art-2',
  norma: 'Lei nº 11.033, de 21 de dezembro de 2004',
  dispositivo: 'Art. 2º, I e II, e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Isenção das vendas de até R$ 20.000,00 no mês — Lei nº 11.033/2004, art. 3º, I.
 *
 * > "Ficam isentos do imposto de renda: I - os ganhos líquidos auferidos por
 * > pessoa física em operações no mercado à vista de ações nas bolsas de valores
 * > e em operações com ouro ativo financeiro cujo valor das alienações,
 * > realizadas em cada mês, seja igual ou inferior a R$ 20.000,00 (vinte mil
 * > reais), para o conjunto de ações e para o ouro ativo financeiro
 * > respectivamente."
 *
 * O limite é do valor VENDIDO no mês, não do lucro — é o erro mais comum de
 * quem calcula de cabeça. E ele nunca foi corrigido desde 2005.
 */
export const LEI_11033_ART_3_I: Fonte = {
  id: 'lei-11033-2004-art-3-i',
  norma: 'Lei nº 11.033, de 21 de dezembro de 2004',
  dispositivo: 'Art. 3º, I',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Retenção na fonte do day trade — Lei nº 9.959/2000, art. 8º.
 *
 * > "Os rendimentos auferidos em operações de day trade realizadas em bolsas de
 * > valores, de mercadorias, de futuros e assemelhadas, por qualquer
 * > beneficiário, inclusive pessoa jurídica isenta, sujeitam-se à incidência do
 * > imposto de renda na fonte à alíquota de um por cento."
 *
 * Efeitos a partir de 1º/01/2000 (art. 12).
 */
export const LEI_9959_ART_8: Fonte = {
  id: 'lei-9959-2000-art-8',
  norma: 'Lei nº 9.959, de 27 de janeiro de 2000',
  dispositivo: 'Art. 8º e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9959.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Piso do DARF — Lei nº 9.430/1996, art. 68.
 *
 * > "É vedada a utilização de Documento de Arrecadação de Receitas Federais
 * > para o pagamento de tributos e contribuições de valor inferior a R$ 10,00
 * > (dez reais)."
 *
 * O § 1º manda somar o valor apurado abaixo do piso ao do período seguinte, no
 * mesmo código de receita, até alcançá-lo.
 */
export const LEI_9430_ART_68: Fonte = {
  id: 'lei-9430-1996-art-68',
  norma: 'Lei nº 9.430, de 27 de dezembro de 1996',
  dispositivo: 'Art. 68, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9430.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regime regressivo da previdência complementar — Lei nº 11.053/2004, art. 1º.
 *
 * > "[...] a opção por regime de tributação no qual os valores pagos aos
 * > próprios participantes ou aos assistidos, a título de benefícios ou
 * > resgates de valores acumulados, sujeitam-se à incidência de imposto de
 * > renda na fonte às seguintes alíquotas: I - 35% [...] para recursos com
 * > prazo de acumulação inferior ou igual a 2 (dois) anos; [...] VI - 10% [...]
 * > para recursos com prazo de acumulação superior a 10 (dez) anos."
 *
 * O § 2º torna o imposto DEFINITIVO, e o § 3º define prazo de acumulação como o
 * tempo entre o aporte e o pagamento. Efeitos a partir de 1º/01/2005 (art. 8º).
 */
export const LEI_11053_ART_1: Fonte = {
  id: 'lei-11053-2004-art-1',
  norma: 'Lei nº 11.053, de 29 de dezembro de 2004',
  dispositivo: 'Art. 1º, I a VI, e §§ 2º e 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11053.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regime progressivo no resgate — Lei nº 11.053/2004, art. 3º.
 *
 * > "[...] os resgates, parciais ou totais, de recursos acumulados relativos a
 * > participantes dos planos mencionados no art. 1º desta Lei que não tenham
 * > efetuado a opção nele mencionada sujeitam-se à incidência de imposto de
 * > renda na fonte à alíquota de 15% (quinze por cento), como antecipação do
 * > devido na declaração de ajuste da pessoa física, calculado sobre: I - os
 * > valores de resgate, no caso de planos de previdência, inclusive FAPI; II -
 * > os rendimentos, no caso de seguro de vida com cláusula de cobertura por
 * > sobrevivência."
 *
 * O inciso II é o que separa o VGBL do PGBL: num, a base é o rendimento; no
 * outro, o valor resgatado inteiro.
 */
export const LEI_11053_ART_3: Fonte = {
  id: 'lei-11053-2004-art-3',
  norma: 'Lei nº 11.053, de 29 de dezembro de 2004',
  dispositivo: 'Art. 3º, I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11053.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Saque-aniversário do FGTS — Lei nº 8.036/1990, arts. 20-A a 20-D e Anexo,
 * incluídos pela Lei nº 13.932/2019 (DOU de 12/12/2019; em vigor na publicação
 * quanto a estes dispositivos, art. 11, III).
 *
 * > Art. 20-D: "o valor do saque será determinado: I - pela aplicação da
 * > alíquota correspondente, estabelecida no Anexo desta Lei, à soma de todos os
 * > saldos das contas vinculadas do titular, apurados na data do débito; e II -
 * > pelo acréscimo da parcela adicional correspondente, estabelecida no Anexo
 * > desta Lei, ao valor apurado de acordo com o disposto no inciso I".
 *
 * O art. 20-A, § 2º, II, é o que muda a vida de quem opta: na sistemática do
 * saque-aniversário aplicam-se as hipóteses de movimentação do art. 20 "à
 * exceção das estabelecidas nos incisos I, I-A, II, IX e X" — e o inciso I é a
 * despedida sem justa causa. O art. 20-C fixa o retorno à outra sistemática
 * para o primeiro dia do vigésimo quinto mês seguinte ao pedido.
 */
export const LEI_8036_ART_20_D: Fonte = {
  id: 'lei-8036-1990-art-20-d',
  norma: 'Lei nº 8.036, de 11 de maio de 1990, com os dispositivos incluídos pela Lei nº 13.932, de 2019',
  dispositivo: 'Arts. 20-A a 20-D e Anexo',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Fundos imobiliários — Lei nº 8.668/1993, arts. 17 a 19, com a redação da Lei
 * nº 9.779/1999 (DOU de 20/01/1999; em vigor na publicação).
 *
 * > Art. 17: "Os rendimentos e ganhos de capital auferidos, apurados segundo o
 * > regime de caixa, quando distribuídos pelos Fundos de Investimento
 * > Imobiliário a qualquer beneficiário, inclusive pessoa jurídica isenta,
 * > sujeitam-se à incidência do imposto de renda na fonte, à alíquota de vinte
 * > por cento."
 * > Art. 18: "Os ganhos de capital e rendimentos auferidos na alienação ou no
 * > resgate de quotas dos fundos de investimento imobiliário [...] sujeitam-se à
 * > incidência do imposto de renda à alíquota de vinte por cento: I - na fonte,
 * > no caso de resgate; II - às mesmas normas aplicáveis aos ganhos de capital
 * > ou ganhos líquidos auferidos em operações de renda variável, nos demais
 * > casos."
 *
 * O art. 19, II, faz dessa tributação EXCLUSIVA para a pessoa física — o ganho
 * na venda de cotas não volta a ser ajustado na declaração anual.
 */
export const LEI_8668_ART_17_18: Fonte = {
  id: 'lei-8668-1993-art-17-18',
  norma: 'Lei nº 8.668, de 25 de junho de 1993, com a redação da Lei nº 9.779, de 1999',
  dispositivo: 'Arts. 17, 18 e 19',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8668.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Isenção dos rendimentos distribuídos por fundo imobiliário — Lei nº
 * 11.033/2004, art. 3º, III e § 1º.
 *
 * > III (red. Lei nº 14.130/2021): "na fonte e na declaração de ajuste anual das
 * > pessoas físicas, os rendimentos distribuídos pelos Fundos de Investimento
 * > Imobiliário e pelos Fundos de Investimento nas Cadeias Produtivas
 * > Agroindustriais (Fiagro) cujas cotas sejam admitidas à negociação
 * > exclusivamente em bolsas de valores ou no mercado de balcão organizado".
 * > § 1º, I (red. Lei nº 14.754/2023): o benefício "será concedido somente nos
 * > casos em que os Fundos [...] possuam, no mínimo, 100 (cem) cotistas".
 * > § 1º, II: não é concedido ao cotista pessoa física com 10% ou mais das
 * > cotas, ou cujas cotas lhe derem direito a mais de 10% dos rendimentos.
 * > § 1º, III (incluído pela Lei nº 14.754/2023): mesma exclusão para o conjunto
 * > de cotistas pessoas físicas ligadas que alcance 30%.
 *
 * **A MP nº 1.184/2024 chegou a exigir 500 cotistas e está marcada no Planalto
 * como de vigência encerrada** — vale a redação da Lei nº 14.754/2023, com
 * efeitos a partir de 1º/01/2024 (art. 49, II).
 */
export const LEI_11033_ART_3_III: Fonte = {
  id: 'lei-11033-2004-art-3-iii',
  norma: 'Lei nº 11.033, de 21 de dezembro de 2004, com a redação das Leis nº 14.130, de 2021, e nº 14.754, de 2023',
  dispositivo: 'Art. 3º, III, e § 1º, I a III',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Valores das multas de trânsito — CTB, art. 258, na redação da Lei nº
 * 13.281/2016 (DOU de 05/05/2016; em vigor 180 dias depois, em 01/11/2016).
 *
 * > "As infrações punidas com multa classificam-se, de acordo com sua
 * > gravidade, em quatro categorias: I - infração de natureza gravíssima,
 * > punida com multa no valor de R$ 293,47 [...]; II - [...] grave [...] R$
 * > 195,23 [...]; III - [...] média [...] R$ 130,16 [...]; IV - [...] leve
 * > [...] R$ 88,38."
 *
 * O § 2º ressalva a multa agravada, cujo fator multiplicador está no próprio
 * Código, infração a infração.
 */
export const CTB_ART_258: Fonte = {
  id: 'ctb-art-258',
  norma: 'Lei nº 9.503, de 23 de setembro de 1997 — Código de Trânsito Brasileiro, com a redação da Lei nº 13.281, de 2016',
  dispositivo: 'Art. 258, I a IV, e § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Pontuação por infração — CTB, art. 259 (texto original; o Código entrou em
 * vigor em 22/01/1998, cento e vinte dias após o DOU de 24/09/1997).
 *
 * > "A cada infração cometida são computados os seguintes números de pontos:
 * > I - gravíssima - sete pontos; II - grave - cinco pontos; III - média -
 * > quatro pontos; IV - leve - três pontos."
 */
export const CTB_ART_259: Fonte = {
  id: 'ctb-art-259',
  norma: 'Lei nº 9.503, de 23 de setembro de 1997 — Código de Trânsito Brasileiro',
  dispositivo: 'Art. 259, I a IV',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Limites de pontos para a suspensão do direito de dirigir — CTB, art. 261, I,
 * na redação da Lei nº 14.071/2020 (DOU de 14/10/2020; em vigor 180 dias
 * depois, em 12/04/2021).
 *
 * > "I - sempre que, conforme a pontuação prevista no art. 259 deste Código, o
 * > infrator atingir, no período de 12 (doze) meses, a seguinte contagem de
 * > pontos: a) 20 (vinte) pontos, caso constem 2 (duas) ou mais infrações
 * > gravíssimas na pontuação; b) 30 (trinta) pontos, caso conste 1 (uma)
 * > infração gravíssima na pontuação; c) 40 (quarenta) pontos, caso não conste
 * > nenhuma infração gravíssima na pontuação."
 */
export const CTB_ART_261: Fonte = {
  id: 'ctb-art-261',
  norma: 'Lei nº 9.503, de 23 de setembro de 1997 — Código de Trânsito Brasileiro, com a redação da Lei nº 14.071, de 2020',
  dispositivo: 'Art. 261, I, "a" a "c"',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Descontos no pagamento da multa — CTB, art. 284.
 *
 * > Caput: "O pagamento da multa poderá ser efetuado até a data do vencimento
 * > expressa na notificação, por oitenta por cento do seu valor."
 * > § 1º (red. Lei nº 14.599/2023, DOU de 20/06/2023, em vigor na publicação):
 * > "Caso o infrator declare pelo sistema de notificação eletrônica [...] a
 * > opção por não apresentar defesa prévia nem recurso, reconhecendo o
 * > cometimento da infração, o pagamento da multa poderá ser efetuado por 60%
 * > (sessenta por cento) do seu valor [...] desde que a adesão ao sistema seja
 * > realizada antes do correspondente envio da notificação da autuação."
 */
export const CTB_ART_284: Fonte = {
  id: 'ctb-art-284',
  norma: 'Lei nº 9.503, de 23 de setembro de 1997 — Código de Trânsito Brasileiro, com a redação da Lei nº 14.599, de 2023',
  dispositivo: 'Art. 284, caput e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Come-cotas — Lei nº 14.754/2023, art. 17 (DOU de 13/12/2023; efeitos a partir
 * de 1º/01/2024, art. 49, II).
 *
 * > "Os rendimentos das aplicações em fundos de investimento ficarão sujeitos à
 * > retenção na fonte do IRRF nas seguintes datas: I - no último dia útil dos
 * > meses de maio e novembro; ou II - na data da distribuição de rendimentos,
 * > da amortização ou do resgate de cotas, caso ocorra antes."
 * > § 1º, I: "como regra geral: a) 15% (quinze por cento), na data da tributação
 * > periódica [...]; e b) o percentual complementar necessário para totalizar a
 * > alíquota prevista nos incisos I, II, III e IV do caput do art. 1º da Lei nº
 * > 11.033, de 21 de dezembro de 2004, na data da [...] do resgate de cotas".
 *
 * O § 5º, I, define a base da tributação periódica: a diferença positiva entre
 * o valor patrimonial da cota e o custo de aquisição — que o § 2º, II, manda
 * acrescer do que já foi tributado antes. É por isso que o come-cotas não
 * tributa duas vezes o mesmo rendimento.
 *
 * Os fundos de prazo médio curto (art. 6º da Lei nº 11.053/2004) têm alíquotas
 * próprias — 20% na periódica e tabela de 22,5% e 20% no resgate — e ficam fora
 * desta calculadora, que declara isso.
 */
export const LEI_14754_ART_17: Fonte = {
  id: 'lei-14754-2023-art-17',
  norma: 'Lei nº 14.754, de 12 de dezembro de 2023',
  dispositivo: 'Art. 17, caput e §§ 1º, 2º e 5º',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14754.htm',
  orgao: 'Congresso Nacional',
}

// ---------------------------------------------------------------------------
// Lote 5 do catálogo v5 — benefícios do INSS (CALC-100 a CALC-103)
// ---------------------------------------------------------------------------

/**
 * Pensão por morte — EC nº 103/2019, art. 23 (DOU de 13/11/2019; em vigor na
 * publicação, art. 36, III).
 *
 * > "A pensão por morte concedida a dependente de segurado do Regime Geral de
 * > Previdência Social [...] será equivalente a uma cota familiar de 50%
 * > (cinquenta por cento) do valor da aposentadoria recebida pelo segurado [...]
 * > ou daquela a que teria direito se fosse aposentado por incapacidade
 * > permanente na data do óbito, acrescida de cotas de 10 (dez) pontos
 * > percentuais por dependente, até o máximo de 100% (cem por cento)."
 *
 * O § 1º diz que as cotas cessam com a perda da qualidade de dependente e não
 * são reversíveis — mas preserva 100% quando restarem cinco ou mais. O § 2º
 * garante 100% quando há dependente inválido ou com deficiência.
 */
export const EC_103_ART_23: Fonte = {
  id: 'ec-103-2019-art-23',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 23, caput e §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra de transição por pontos — EC nº 103/2019, art. 15.
 *
 * > "Ao segurado filiado ao Regime Geral de Previdência Social até a data de
 * > entrada em vigor desta Emenda Constitucional, fica assegurado o direito à
 * > aposentadoria quando forem preenchidos, cumulativamente, os seguintes
 * > requisitos: I - 30 (trinta) anos de contribuição, se mulher, e 35 (trinta e
 * > cinco) anos de contribuição, se homem; e II - somatório da idade e do tempo
 * > de contribuição, incluídas as frações, equivalente a 86 (oitenta e seis)
 * > pontos, se mulher, e 96 (noventa e seis) pontos, se homem [...]"
 * > § 1º: "A partir de 1º de janeiro de 2020, a pontuação [...] será acrescida a
 * > cada ano de 1 (um) ponto, até atingir o limite de 100 (cem) pontos, se
 * > mulher, e de 105 (cento e cinco) pontos, se homem."
 *
 * O § 2º manda apurar idade e tempo de contribuição EM DIAS — as frações
 * contam, e é por isso que a calculadora aceita meses.
 */
export const EC_103_ART_15: Fonte = {
  id: 'ec-103-2019-art-15',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 15, caput, I e II, e §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Auxílio por incapacidade temporária — Lei nº 8.213/1991, art. 61 (red. Lei nº
 * 9.032/1995, DOU extra de 29/04/1995) e art. 29, § 10.
 *
 * > Art. 61: o benefício "consistirá numa renda mensal correspondente a 91%
 * > (noventa e um por cento) do salário-de-benefício".
 * > Art. 29, § 10: "O auxílio-doença não poderá exceder a média aritmética
 * > simples dos últimos doze salários-de-contribuição, inclusive no caso de
 * > remuneração variável, ou, se não alcançado o número de doze, a média
 * > aritmética simples dos salários-de-contribuição existentes."
 *
 * O salário de benefício é a média de 100% do período contributivo desde julho
 * de 1994 (EC nº 103/2019, art. 26).
 */
export const LEI_8213_ART_61: Fonte = {
  id: 'lei-8213-1991-art-61',
  norma: 'Lei nº 8.213, de 24 de julho de 1991, com a redação da Lei nº 9.032, de 1995',
  dispositivo: 'Art. 61 e art. 29, § 10',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Salário-maternidade pago pela Previdência — Lei nº 8.213/1991, art. 73 (red.
 * Lei nº 10.710/2003), com o parágrafo único incluído pela Lei nº 13.846/2019.
 *
 * > "Assegurado o valor de um salário-mínimo, o salário-maternidade para as
 * > demais seguradas, pago diretamente pela Previdência Social, consistirá:
 * > I - em um valor correspondente ao do seu último salário-de-contribuição,
 * > para a segurada empregada doméstica; II - em um doze avos do valor sobre o
 * > qual incidiu sua última contribuição anual, para a segurada especial;
 * > III - em um doze avos da soma dos doze últimos salários-de-contribuição,
 * > apurados em um período não superior a quinze meses, para as demais
 * > seguradas."
 *
 * O parágrafo único estende o inciso III à segurada desempregada que mantém a
 * qualidade de segurada.
 */
export const LEI_8213_ART_73: Fonte = {
  id: 'lei-8213-1991-art-73',
  norma: 'Lei nº 8.213, de 24 de julho de 1991, com a redação da Lei nº 10.710, de 2003',
  dispositivo: 'Art. 73, I a III, e parágrafo único',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Piso dos benefícios — CF, art. 201, § 2º.
 *
 * > "Nenhum benefício que substitua o salário de contribuição ou o rendimento
 * > do trabalho do segurado terá valor mensal inferior ao salário mínimo."
 *
 * É a regra que impede qualquer estimativa de benefício abaixo do mínimo — e
 * ela aparece na memória de cálculo sempre que o piso é acionado.
 */
export const CF_ART_201_P2: Fonte = {
  id: 'cf-1988-art-201-p2',
  norma: 'Constituição da República Federativa do Brasil de 1988, com a redação da Emenda Constitucional nº 20, de 1998',
  dispositivo: 'Art. 201, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
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
  CLT_ART_192,
  CLT_ART_193,
  LEI_5889_ART_7,
  LEI_605_ART_6,
  LEI_605_ART_7_C,
  TST_SUMULA_27,
  TST_SUMULA_60,
  TST_SUMULA_139,
  TST_SUMULA_191,
  TST_SUMULA_364,
  CLT_ART_428,
  CLT_ART_432,
  LEI_8036_ART_15_P7,
  DECRETO_12342_2024,
  DECRETO_12797_2025,
  LEI_11788_ART_13,
  LEI_10101_ART_3,
  RFB_TABELA_PLR,
  CF_ART_7_XVIII,
  CLT_ART_392,
  ADCT_ART_10_P1,
  LEI_15371_ART_11,
  LEI_11770_ART_1,
  LEI_15371_ART_10,
  PORTARIA_MPS_MF_6_2025_ART_4,
  PORTARIA_MPS_MF_13_2026_ART_4,
  CLT_ART_479,
  CLT_ART_469,
  CLT_ART_244,
  TST_SUMULA_428,
  LEI_4090_ART_3,
  TST_SUMULA_171,
  LEI_8036_ART_20,
  LEI_11033_ART_2,
  LEI_11033_ART_3_I,
  LEI_9959_ART_8,
  LEI_9430_ART_68,
  LEI_11053_ART_1,
  LEI_11053_ART_3,
  LEI_8036_ART_20_D,
  LEI_8668_ART_17_18,
  LEI_11033_ART_3_III,
  CTB_ART_258,
  CTB_ART_259,
  CTB_ART_261,
  CTB_ART_284,
  LEI_14754_ART_17,
  EC_103_ART_23,
  EC_103_ART_15,
  LEI_8213_ART_61,
  LEI_8213_ART_73,
  CF_ART_201_P2,
]

/**
 * Regra de transição da idade progressiva — EC nº 103/2019, art. 16. Vigência
 * na publicação (art. 36, III), DOU de 13/11/2019.
 *
 * > "Ao segurado filiado ao Regime Geral de Previdência Social até a data de
 * > entrada em vigor desta Emenda Constitucional fica assegurado o direito à
 * > aposentadoria quando preencher, cumulativamente, os seguintes requisitos:
 * > I - 30 (trinta) anos de contribuição, se mulher, e 35 (trinta e cinco) anos
 * > de contribuição, se homem; e II - idade de 56 (cinquenta e seis) anos, se
 * > mulher, e 61 (sessenta e um) anos, se homem."
 * > § 1º "A partir de 1º de janeiro de 2020, a idade a que se refere o inciso II
 * > do caput será acrescida de 6 (seis) meses a cada ano, até atingir 62
 * > (sessenta e dois) anos de idade, se mulher, e 65 (sessenta e cinco) anos de
 * > idade, se homem."
 *
 * O § 2º (professor) não está cadastrado — a calculadora declara isso.
 */
export const EC_103_ART_16: Fonte = {
  id: 'ec-103-2019-art-16',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 16, caput, I e II, e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra de transição do pedágio de 50% — EC nº 103/2019, art. 17.
 *
 * > "Ao segurado filiado ao Regime Geral de Previdência Social até a data de
 * > entrada em vigor desta Emenda Constitucional e que na referida data contar
 * > com mais de 28 (vinte e oito) anos de contribuição, se mulher, e 33 (trinta
 * > e três) anos de contribuição, se homem, fica assegurado o direito à
 * > aposentadoria quando preencher, cumulativamente, os seguintes requisitos:
 * > I - 30 (trinta) anos de contribuição, se mulher, e 35 (trinta e cinco) anos
 * > de contribuição, se homem; e II - cumprimento de período adicional
 * > correspondente a 50% (cinquenta por cento) do tempo que, na data de entrada
 * > em vigor desta Emenda Constitucional, faltaria para atingir 30 (trinta)
 * > anos de contribuição, se mulher, e 35 (trinta e cinco) anos de
 * > contribuição, se homem."
 *
 * "Mais de": quem tinha exatamente 28 (ou 33) anos não entra. O parágrafo único
 * manda aplicar o fator previdenciário ao valor — fora desta conta, que trata
 * do acesso e não do valor.
 */
export const EC_103_ART_17: Fonte = {
  id: 'ec-103-2019-art-17',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 17, caput, I e II',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Aposentadoria por idade, na transição — EC nº 103/2019, art. 18.
 *
 * > "O segurado de que trata o inciso I do § 7º do art. 201 da Constituição
 * > Federal filiado ao Regime Geral de Previdência Social até a data de entrada
 * > em vigor desta Emenda Constitucional poderá aposentar-se quando preencher,
 * > cumulativamente, os seguintes requisitos: I - 60 (sessenta) anos de idade,
 * > se mulher, e 65 (sessenta e cinco) anos de idade, se homem; e II - 15
 * > (quinze) anos de contribuição, para ambos os sexos."
 * > § 1º "A partir de 1º de janeiro de 2020, a idade de 60 (sessenta) anos da
 * > mulher, prevista no inciso I do caput, será acrescida em 6 (seis) meses a
 * > cada ano, até atingir 62 (sessenta e dois) anos de idade."
 *
 * Quinze anos para os DOIS sexos — diferente da regra permanente do art. 19,
 * que exige vinte do homem.
 */
export const EC_103_ART_18: Fonte = {
  id: 'ec-103-2019-art-18',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 18, caput, I e II, e § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra permanente, para quem se filiou depois da Emenda — EC nº 103/2019,
 * art. 19, caput.
 *
 * > "Até que lei disponha sobre o tempo de contribuição a que se refere o inciso
 * > I do § 7º do art. 201 da Constituição Federal, o segurado filiado ao Regime
 * > Geral de Previdência Social após a data de entrada em vigor desta Emenda
 * > Constitucional será aposentado aos 62 (sessenta e dois) anos de idade, se
 * > mulher, 65 (sessenta e cinco) anos de idade, se homem, com 15 (quinze) anos
 * > de tempo de contribuição, se mulher, e 20 (vinte) anos de tempo de
 * > contribuição, se homem."
 *
 * O § 1º (atividade especial e professor) não está cadastrado.
 */
export const EC_103_ART_19: Fonte = {
  id: 'ec-103-2019-art-19',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 19, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra de transição do pedágio de 100% — EC nº 103/2019, art. 20.
 *
 * > "O segurado ou o servidor público federal que se tenha filiado ao Regime
 * > Geral de Previdência Social ou ingressado no serviço público em cargo
 * > efetivo até a data de entrada em vigor desta Emenda Constitucional poderá
 * > aposentar-se voluntariamente quando preencher, cumulativamente, os
 * > seguintes requisitos: I - 57 (cinquenta e sete) anos de idade, se mulher, e
 * > 60 (sessenta) anos de idade, se homem; II - 30 (trinta) anos de
 * > contribuição, se mulher, e 35 (trinta e cinco) anos de contribuição, se
 * > homem; [...] IV - período adicional de contribuição correspondente ao tempo
 * > que, na data de entrada em vigor desta Emenda Constitucional, faltaria para
 * > atingir o tempo mínimo de contribuição referido no inciso II."
 *
 * O inciso III é do servidor público e não se aplica ao Regime Geral. O
 * pedágio é o tempo que faltava, inteiro — não há percentual a cadastrar.
 */
export const EC_103_ART_20: Fonte = {
  id: 'ec-103-2019-art-20',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 20, caput, I, II e IV',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

// ---------------------------------------------------------------------------
// Lote 7 do catálogo v5 — valor da aposentadoria, auxílio-acidente,
// aposentadoria do professor e férias em dobro (CALC-109 a CALC-112)
// ---------------------------------------------------------------------------

/**
 * Valor da aposentadoria — EC nº 103/2019, art. 26. Vigência na publicação
 * (art. 36, III), DOU de 13/11/2019.
 *
 * > Caput: a média aritmética simples dos salários de contribuição
 * > "atualizados monetariamente, correspondentes a 100% (cem por cento) do
 * > período contributivo desde a competência julho de 1994 ou desde o início da
 * > contribuição, se posterior àquela competência."
 * > § 1º "A média a que se refere o caput será limitada ao valor máximo do
 * > salário de contribuição do Regime Geral de Previdência Social [...]"
 * > § 2º "O valor do benefício de aposentadoria corresponderá a 60% (sessenta
 * > por cento) da média aritmética [...], com acréscimo de 2 (dois) pontos
 * > percentuais para cada ano de contribuição que exceder o tempo de 20 (vinte)
 * > anos de contribuição nos casos: I - [...] do § 4º do art. 15, do § 3º do
 * > art. 16 e do § 2º do art. 18; [...] III - de aposentadoria por
 * > incapacidade permanente [...]; e IV - do § 2º do art. 19 [...]"
 * > § 3º "O valor do benefício de aposentadoria corresponderá a 100% (cem por
 * > cento) da média aritmética [...]: I - no caso do inciso II do § 2º do
 * > art. 20; II - no caso de aposentadoria por incapacidade permanente, quando
 * > decorrer de acidente de trabalho, de doença profissional e de doença do
 * > trabalho."
 * > § 5º "O acréscimo a que se refere o caput do § 2º será aplicado para cada
 * > ano que exceder 15 (quinze) anos de tempo de contribuição para [...] as
 * > mulheres filiadas ao Regime Geral de Previdência Social."
 *
 * O pedágio de 50% (art. 17, parágrafo único) usa o fator previdenciário e não
 * está nesta conta.
 */
export const EC_103_ART_26: Fonte = {
  id: 'ec-103-2019-art-26',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 26, caput e §§ 1º, 2º, 3º e 5º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Piso e teto do benefício que substitui o salário — Lei nº 8.213/1991,
 * art. 33, redação original (DOU de 25/07/1991).
 *
 * > "A renda mensal do benefício de prestação continuada que substituir o
 * > salário-de-contribuição ou o rendimento do trabalho do segurado não terá
 * > valor inferior ao do salário-mínimo, nem superior ao do limite máximo do
 * > salário-de-contribuição, ressalvado o disposto no art. 45 desta Lei."
 *
 * O auxílio-acidente é indenização (art. 86, caput), não substitui o salário —
 * e por isso não tem o piso deste artigo.
 */
export const LEI_8213_ART_33: Fonte = {
  id: 'lei-8213-1991-art-33',
  norma: 'Lei nº 8.213, de 24 de julho de 1991',
  dispositivo: 'Art. 33',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Auxílio-acidente — Lei nº 8.213/1991, art. 86 (red. Lei nº 9.528/1997, DOU
 * de 11/12/1997). O percentual de 50% vem da Lei nº 9.032/1995 (DOU extra de
 * 29/04/1995) e foi mantido pela redação de 1997.
 *
 * > Caput: "O auxílio-acidente será concedido, como indenização, ao segurado
 * > quando, após consolidação das lesões decorrentes de acidente de qualquer
 * > natureza, resultarem seqüelas que impliquem redução da capacidade para o
 * > trabalho que habitualmente exercia."
 * > § 1º "O auxílio-acidente mensal corresponderá a cinqüenta por cento do
 * > salário-de-benefício e será devido, observado o disposto no § 5º, até a
 * > véspera do início de qualquer aposentadoria ou até a data do óbito do
 * > segurado."
 * > § 2º "[...] será devido a partir do dia seguinte ao da cessação do
 * > auxílio-doença, independentemente de qualquer remuneração ou rendimento
 * > auferido pelo acidentado, vedada sua acumulação com qualquer
 * > aposentadoria."
 *
 * A redação da MP nº 905/2019 (50% da aposentadoria por invalidez) teve a
 * vigência encerrada — o texto compilado a marca assim.
 */
export const LEI_8213_ART_86: Fonte = {
  id: 'lei-8213-1991-art-86',
  norma: 'Lei nº 8.213, de 24 de julho de 1991, com a redação da Lei nº 9.528, de 1997',
  dispositivo: 'Art. 86, caput e §§ 1º e 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra de pontos do professor — EC nº 103/2019, art. 15, § 3º.
 *
 * > "Para o professor que comprovar exclusivamente 25 (vinte e cinco) anos de
 * > contribuição, se mulher, e 30 (trinta) anos de contribuição, se homem, em
 * > efetivo exercício das funções de magistério na educação infantil e no
 * > ensino fundamental e médio, o somatório da idade e do tempo de
 * > contribuição, incluídas as frações, será equivalente a 81 (oitenta e um)
 * > pontos, se mulher, e 91 (noventa e um) pontos, se homem, aos quais serão
 * > acrescidos, a partir de 1º de janeiro de 2020, 1 (um) ponto a cada ano para
 * > o homem e para a mulher, até atingir o limite de 92 (noventa e dois)
 * > pontos, se mulher, e 100 (cem) pontos, se homem."
 */
export const EC_103_ART_15_P3: Fonte = {
  id: 'ec-103-2019-art-15-p3',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 15, § 3º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Idade progressiva do professor — EC nº 103/2019, art. 16, § 2º.
 *
 * > "Para o professor que comprovar exclusivamente tempo de efetivo exercício
 * > das funções de magistério na educação infantil e no ensino fundamental e
 * > médio, o tempo de contribuição e a idade de que tratam os incisos I e II do
 * > caput deste artigo serão reduzidos em 5 (cinco) anos, sendo, a partir de 1º
 * > de janeiro de 2020, acrescidos 6 (seis) meses, a cada ano, às idades
 * > previstas no inciso II do caput, até atingirem 57 (cinquenta e sete) anos,
 * > se mulher, e 60 (sessenta) anos, se homem."
 *
 * Com a redução: 25/30 anos de contribuição e idade de 51/56 anos em 2019.
 */
export const EC_103_ART_16_P2: Fonte = {
  id: 'ec-103-2019-art-16-p2',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 16, § 2º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Regra permanente do professor — EC nº 103/2019, art. 19, § 1º, II.
 *
 * > "ao professor que comprove 25 (vinte e cinco) anos de contribuição
 * > exclusivamente em efetivo exercício das funções de magistério na educação
 * > infantil e no ensino fundamental e médio e tenha 57 (cinquenta e sete) anos
 * > de idade, se mulher, e 60 (sessenta) anos de idade, se homem."
 */
export const EC_103_ART_19_P1_II: Fonte = {
  id: 'ec-103-2019-art-19-p1-ii',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 19, § 1º, II',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Pedágio de 100% do professor — EC nº 103/2019, art. 20, § 1º.
 *
 * > "Para o professor que comprovar exclusivamente tempo de efetivo exercício
 * > das funções de magistério na educação infantil e no ensino fundamental e
 * > médio serão reduzidos, para ambos os sexos, os requisitos de idade e de
 * > tempo de contribuição em 5 (cinco) anos."
 *
 * Com a redução: 52/55 anos de idade e 25/30 anos de contribuição, mais o
 * pedágio do inciso IV sobre esse tempo reduzido.
 */
export const EC_103_ART_20_P1: Fonte = {
  id: 'ec-103-2019-art-20-p1',
  norma: 'Emenda Constitucional nº 103, de 12 de novembro de 2019',
  dispositivo: 'Art. 20, § 1º',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc103.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Período aquisitivo de férias — CLT, art. 130 (red. Decreto-lei nº
 * 1.535/1977, publicado no DOU de 13/04/1977 e em vigor em 1º/05/1977, art. 3º).
 *
 * > "Após cada período de 12 (doze) meses de vigência do contrato de trabalho,
 * > o empregado terá direito a férias, na seguinte proporção: [...]"
 */
export const CLT_ART_130: Fonte = {
  id: 'clt-art-130',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 1.535, de 1977',
  dispositivo: 'Art. 130, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Presidência da República',
}

/**
 * Período concessivo — CLT, art. 134 (red. Decreto-lei nº 1.535/1977, em vigor
 * em 1º/05/1977).
 *
 * > "As férias serão concedidas por ato do empregador, em um só período, nos 12
 * > (doze) meses subseqüentes à data em que o empregado tiver adquirido o
 * > direito."
 */
export const CLT_ART_134: Fonte = {
  id: 'clt-art-134',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 1.535, de 1977',
  dispositivo: 'Art. 134, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Presidência da República',
}

/**
 * Férias fora do prazo — CLT, art. 137 (red. Decreto-lei nº 1.535/1977, em
 * vigor em 1º/05/1977).
 *
 * > "Sempre que as férias forem concedidas após o prazo de que trata o art.
 * > 134, o empregador pagará em dobro a respectiva remuneração."
 *
 * A remuneração de férias inclui o terço constitucional (CF, art. 7º, XVII;
 * Súmula 328 do TST), e é ela que se paga em dobro.
 */
export const CLT_ART_137: Fonte = {
  id: 'clt-art-137',
  norma: 'Consolidação das Leis do Trabalho, com a redação do Decreto-lei nº 1.535, de 1977',
  dispositivo: 'Art. 137, caput',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Presidência da República',
}

/**
 * Súmula 81 do TST — os dias de férias fora do prazo.
 *
 * > "Os dias de férias gozados após o período legal de concessão deverão ser
 * > remunerados em dobro."
 *
 * Mantida pela Res. 121/2003 (DJ 19, 20 e 21/11/2003); redação original da RA
 * 69/1978. É ela que faz a dobra incidir DIA A DIA: férias que começam dentro
 * do prazo e terminam fora dele têm só os dias de fora em dobro.
 */
export const TST_SUMULA_81: Fonte = {
  id: 'tst-sumula-81',
  norma: 'Súmula 81 do Tribunal Superior do Trabalho',
  dispositivo: 'Res. 121/2003, DJ 19, 20 e 21.11.2003',
  url: 'https://www.tst.jus.br/documents/10157/63003/Livro-Internet.pdf',
  orgao: 'Tribunal Superior do Trabalho',
}

// ---------------------------------------------------------------------------
// Lote 8 do catálogo v5 — aluguel e jornada (CALC-114 e CALC-115)
// ---------------------------------------------------------------------------

/**
 * O que não entra na base do imposto sobre aluguel recebido de pessoa física —
 * Regulamento do Imposto de Renda (Decreto nº 9.580/2018), art. 42, com base
 * na Lei nº 7.739/1989, art. 14.
 *
 * > "Não serão computados no rendimento bruto, na hipótese de aluguéis de
 * > imóveis: I - o valor dos impostos, das taxas e dos emolumentos incidentes
 * > sobre o bem que produzir o rendimento; II - o aluguel pago pela locação de
 * > imóvel sublocado; III - as despesas pagas para cobrança ou recebimento do
 * > rendimento; e IV - as despesas de condomínio."
 *
 * O art. 689 repete a regra para o aluguel pago por pessoa jurídica, com
 * retenção na fonte.
 */
export const RIR_2018_ART_42: Fonte = {
  id: 'rir-2018-art-42',
  norma: 'Decreto nº 9.580, de 22 de novembro de 2018 — Regulamento do Imposto sobre a Renda',
  dispositivo: 'Art. 42 (Lei nº 7.739/1989, art. 14)',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/D9580.htm',
  orgao: 'Presidência da República',
}

/**
 * O mesmo, para o aluguel pago por pessoa jurídica — RIR/2018, art. 689.
 *
 * > "Não integrarão a base de cálculo para incidência do imposto sobre a renda,
 * > na hipótese de aluguéis de imóveis: I - o valor dos impostos, das taxas e
 * > dos emolumentos incidentes sobre o bem que produzir o rendimento; II - o
 * > aluguel pago pela locação do imóvel sublocado; III - as despesas para
 * > cobrança ou recebimento do rendimento; e IV - as despesas de condomínio."
 */
export const RIR_2018_ART_689: Fonte = {
  id: 'rir-2018-art-689',
  norma: 'Decreto nº 9.580, de 22 de novembro de 2018 — Regulamento do Imposto sobre a Renda',
  dispositivo: 'Art. 689 (Lei nº 7.739/1989, art. 14)',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/D9580.htm',
  orgao: 'Presidência da República',
}

/**
 * Duração normal do trabalho — Constituição, art. 7º, XIII, texto original de
 * 05/10/1988.
 *
 * > "duração do trabalho normal não superior a oito horas diárias e quarenta e
 * > quatro semanais, facultada a compensação de horários e a redução da
 * > jornada, mediante acordo ou convenção coletiva de trabalho;"
 */
export const CF_ART_7_XIII: Fonte = {
  id: 'cf-1988-art-7-xiii',
  norma: 'Constituição da República Federativa do Brasil de 1988',
  dispositivo: 'Art. 7º, XIII',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Descanso entre jornadas — CLT, art. 66, texto original (em vigor em
 * 10/11/1943, art. 911).
 *
 * > "Entre 2 (duas) jornadas de trabalho haverá um período mínimo de 11 (onze)
 * > horas consecutivas para descanso."
 */
export const CLT_ART_66: Fonte = {
  id: 'clt-art-66',
  norma: 'Consolidação das Leis do Trabalho — Decreto-lei nº 5.452, de 1º de maio de 1943',
  dispositivo: 'Art. 66',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Presidência da República',
}

/**
 * Intervalo para repouso e alimentação — CLT, art. 71, caput e §§ 1º e 2º no
 * texto original (em vigor em 10/11/1943); § 4º na redação da Lei nº
 * 13.467/2017 (DOU de 14/07/2017, em vigor 120 dias depois, em 11/11/2017).
 *
 * > Caput: "Em qualquer trabalho contínuo, cuja duração exceda de 6 (seis)
 * > horas, é obrigatória a concessão de um intervalo para repouso ou
 * > alimentação, o qual será, no mínimo, de 1 (uma) hora e, salvo acordo
 * > escrito ou contrato coletivo em contrário, não poderá exceder de 2 (duas)
 * > horas."
 * > § 1º "Não excedendo de 6 (seis) horas o trabalho, será, entretanto,
 * > obrigatório um intervalo de 15 (quinze) minutos quando a duração
 * > ultrapassar 4 (quatro) horas."
 * > § 2º "Os intervalos de descanso não serão computados na duração do
 * > trabalho."
 * > § 4º "A não concessão ou a concessão parcial do intervalo intrajornada
 * > mínimo, para repouso e alimentação, a empregados urbanos e rurais, implica
 * > o pagamento, de natureza indenizatória, apenas do período suprimido, com
 * > acréscimo de 50% (cinquenta por cento) sobre o valor da remuneração da hora
 * > normal de trabalho."
 */
export const CLT_ART_71: Fonte = {
  id: 'clt-art-71',
  norma: 'Consolidação das Leis do Trabalho, com a redação da Lei nº 13.467, de 2017, no § 4º',
  dispositivo: 'Art. 71, caput e §§ 1º, 2º e 4º',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  orgao: 'Presidência da República',
}

// ---------------------------------------------------------------------------
// Lote 9 do catálogo v5 — DAS do Simples e DAE do doméstico (CALC-116 e 117)
// ---------------------------------------------------------------------------

/**
 * Simples Nacional — Anexo I (comércio), na redação da LC nº 155/2016,
 * "Vigência: 01/01/2018". Transcrito do texto compilado no Planalto, lido em
 * 18/09/2026:
 *
 * > 1ª faixa: até 180.000,00 — 4,00% — deduzir —
 * > 2ª faixa: de 180.000,01 a 360.000,00 — 7,30% — 5.940,00
 * > 3ª faixa: de 360.000,01 a 720.000,00 — 9,50% — 13.860,00
 * > 4ª faixa: de 720.000,01 a 1.800.000,00 — 10,70% — 22.500,00
 * > 5ª faixa: de 1.800.000,01 a 3.600.000,00 — 14,30% — 87.300,00
 * > 6ª faixa: de 3.600.000,01 a 4.800.000,00 — 19,00% — 378.000,00
 *
 * Substituído a partir de 2027 pelo art. 519 da LC nº 214/2025 — ver
 * `LC_123_ANEXO_III`.
 */
export const LC_123_ANEXO_I: Fonte = {
  id: 'lc-123-2006-anexo-i',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Anexo I — vigência a partir de 01/01/2018',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Simples Nacional — Anexo II (indústria), mesma redação e vigência:
 *
 * > 1ª faixa: até 180.000,00 — 4,50% — —
 * > 2ª faixa: de 180.000,01 a 360.000,00 — 7,80% — 5.940,00
 * > 3ª faixa: de 360.000,01 a 720.000,00 — 10,00% — 13.860,00
 * > 4ª faixa: de 720.000,01 a 1.800.000,00 — 11,20% — 22.500,00
 * > 5ª faixa: de 1.800.000,01 a 3.600.000,00 — 14,70% — 85.500,00
 * > 6ª faixa: de 3.600.000,01 a 4.800.000,00 — 30,00% — 720.000,00
 */
export const LC_123_ANEXO_II: Fonte = {
  id: 'lc-123-2006-anexo-ii',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Anexo II — vigência a partir de 01/01/2018',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Simples Nacional — Anexo IV (serviços do § 5º-C do art. 18), mesma redação e
 * vigência:
 *
 * > 1ª faixa: até 180.000,00 — 4,50% — —
 * > 2ª faixa: de 180.000,01 a 360.000,00 — 9,00% — 8.100,00
 * > 3ª faixa: de 360.000,01 a 720.000,00 — 10,20% — 12.420,00
 * > 4ª faixa: de 720.000,01 a 1.800.000,00 — 14,00% — 39.780,00
 * > 5ª faixa: de 1.800.000,01 a 3.600.000,00 — 22,00% — 183.780,00
 * > 6ª faixa: de 3.600.000,01 a 4.800.000,00 — 33,00% — 828.000,00
 *
 * A tabela de partilha deste anexo não tem a coluna da CPP: a contribuição
 * patronal sobre a folha é recolhida fora do DAS.
 */
export const LC_123_ANEXO_IV: Fonte = {
  id: 'lc-123-2006-anexo-iv',
  norma: 'Lei Complementar nº 123, de 14 de dezembro de 2006, com a redação da Lei Complementar nº 155, de 2016',
  dispositivo: 'Anexo IV — vigência a partir de 01/01/2018',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  orgao: 'Congresso Nacional',
}

/**
 * Simples Doméstico — LC nº 150/2015, art. 34 (DOU de 02/06/2015).
 *
 * > "O Simples Doméstico assegurará o recolhimento mensal, mediante documento
 * > único de arrecadação, dos seguintes valores: I - 8% (oito por cento) a 11%
 * > (onze por cento) de contribuição previdenciária, a cargo do segurado
 * > empregado doméstico [...]; II - 8% (oito por cento) de contribuição patronal
 * > previdenciária para a seguridade social, a cargo do empregador doméstico
 * > [...]; III - 0,8% (oito décimos por cento) de contribuição social para
 * > financiamento do seguro contra acidentes do trabalho; IV - 8% (oito por
 * > cento) de recolhimento para o FGTS; V - 3,2% (três inteiros e dois décimos
 * > por cento), na forma do art. 22 desta Lei; e VI - imposto sobre a renda
 * > retido na fonte [...], se incidente."
 * > § 7º "O recolhimento mensal [...] e a exigência das contribuições, dos
 * > depósitos e do imposto [...] somente serão devidos após 120 (cento e vinte)
 * > dias da data de publicação desta Lei."
 *
 * O inciso I foi alcançado pela tabela progressiva da EC nº 103/2019 — a
 * contribuição do empregado sai da tabela do INSS, como a de qualquer
 * empregado. O art. 24 da Lei nº 8.212/1991, na redação da Lei nº
 * 13.202/2015, repete os 8% e os 0,8%.
 */
export const LC_150_ART_34: Fonte = {
  id: 'lc-150-2015-art-34',
  norma: 'Lei Complementar nº 150, de 1º de junho de 2015',
  dispositivo: 'Art. 34, caput, I a VI, e § 7º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  orgao: 'Congresso Nacional',
}

// ---------------------------------------------------------------------------
// Lote 10 do catálogo v5 — abono salarial e seguro-desemprego do doméstico
// ---------------------------------------------------------------------------

/**
 * Abono salarial — Lei nº 7.998/1990, art. 9º, na redação da Lei nº
 * 13.134/2015 (DOU de 17/06/2015; efeitos financeiros a partir do exercício de
 * 2016, ano-base 2015, pela própria Lei nº 13.134).
 *
 * > Caput: "É assegurado o recebimento de abono salarial anual, no valor máximo
 * > de 1 (um) salário-mínimo vigente na data do respectivo pagamento, aos
 * > empregados que: I - tenham percebido [...] até 2 (dois) salários mínimos
 * > médios de remuneração mensal no período trabalhado e que tenham exercido
 * > atividade remunerada pelo menos durante 30 (trinta) dias no ano-base; II -
 * > estejam cadastrados há pelo menos 5 (cinco) anos no Fundo de Participação
 * > PIS-Pasep ou no Cadastro Nacional do Trabalhador."
 * > § 2º "O valor do abono salarial anual [...] será calculado na proporção de
 * > 1/12 (um doze avos) do valor do salário-mínimo vigente na data do
 * > respectivo pagamento, multiplicado pelo número de meses trabalhados no ano
 * > correspondente."
 * > § 3º "A fração igual ou superior a 15 (quinze) dias de trabalho será contada
 * > como mês integral [...]."
 * > § 4º "O valor do abono salarial será emitido em unidades inteiras de moeda
 * > corrente, com a suplementação das partes decimais até a unidade inteira
 * > imediatamente superior."
 *
 * O limite de renda do inciso I foi reescrito pela EC nº 135/2024 no art. 239,
 * § 3º, da Constituição — ver `CF_ART_239_P3`.
 */
export const LEI_7998_ART_9: Fonte = {
  id: 'lei-7998-1990-art-9',
  norma: 'Lei nº 7.998, de 11 de janeiro de 1990, com a redação da Lei nº 13.134, de 2015',
  dispositivo: 'Art. 9º, caput e §§ 2º a 4º',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/l7998.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O limite de renda do abono — Constituição, art. 239, § 3º, na redação da EC
 * nº 135/2024, e § 3º-A.
 *
 * > § 3º "[...] remuneração mensal de até 2 (duas) vezes o salário mínimo do
 * > ano-base para pagamento em 2025, corrigida, a partir de 2026, pela variação
 * > anual do Índice Nacional de Preços ao Consumidor (INPC) [...] acumulada no
 * > segundo exercício anterior ao de pagamento do benefício, é assegurado o
 * > pagamento de 1 (um) salário mínimo anual [...]."
 * > § 3º-A "O limite para elegibilidade do benefício de que trata o § 3º deste
 * > artigo não será inferior ao valor equivalente ao salário mínimo do período
 * > trabalhado multiplicado pelo índice de 1,5 (um inteiro e cinco décimos)."
 */
export const CF_ART_239_P3: Fonte = {
  id: 'cf-1988-art-239-p3',
  norma: 'Constituição da República Federativa do Brasil de 1988, com a redação da Emenda Constitucional nº 135, de 2024',
  dispositivo: 'Art. 239, §§ 3º e 3º-A',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  orgao: 'Congresso Nacional',
}

/**
 * O limite corrigido para o pagamento de 2026 — publicado pelo Ministério do
 * Trabalho e Emprego na página oficial do serviço, conferida em 18/09/2026
 * (atualizada em 28/05/2026):
 *
 * > "No calendário de pagamento de 2026 terão direito os trabalhadores que
 * > receberam remuneração média de até R$ 2.766,00 no ano-base 2024."
 *
 * A mesma página publica a tabela de valores por meses trabalhados, de R$
 * 136,00 a R$ 1.621,00. A regra de correção está na Resolução CODEFAT/MTE nº
 * 1.032/2025, art. 3º, §§ 1º e 2º; o número, só no Ministério.
 */
export const MTE_ABONO_2026: Fonte = {
  id: 'mte-abono-salarial-2026',
  norma: 'Ministério do Trabalho e Emprego — Abono Salarial, calendário de pagamento de 2026 (Resolução CODEFAT/MTE nº 1.032/2025)',
  dispositivo: 'Limite de remuneração média do ano-base 2024',
  url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/abono-salarial',
  orgao: 'Ministério do Trabalho e Emprego',
}

/**
 * Seguro-desemprego do empregado doméstico — LC nº 150/2015, arts. 26 e 28
 * (DOU de 02/06/2015, em vigor na publicação, art. 47).
 *
 * > Art. 26: "O empregado doméstico que for dispensado sem justa causa fará jus
 * > ao benefício do seguro-desemprego, na forma da Lei nº 7.998 [...], no valor
 * > de 1 (um) salário-mínimo, por período máximo de 3 (três) meses, de forma
 * > contínua ou alternada."
 * > Art. 28, I: vínculo "como empregado doméstico, durante pelo menos 15
 * > (quinze) meses nos últimos 24 (vinte e quatro) meses".
 */
export const LC_150_ART_26: Fonte = {
  id: 'lc-150-2015-art-26',
  norma: 'Lei Complementar nº 150, de 1º de junho de 2015',
  dispositivo: 'Arts. 26 e 28, I',
  url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  orgao: 'Congresso Nacional',
}
