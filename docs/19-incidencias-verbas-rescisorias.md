---
doc: 19-incidencias-verbas-rescisorias
projeto: Cálculo Oficial
versao: 1.1
status: parcial
depende_de: [01-prd, 03-functional-spec, 18-levantamento-calculadoras]
---

# Incidências sobre verbas rescisórias — pesquisa em fonte oficial

> Pesquisa de **31/07/2026**. É o pré-requisito D-1 de `18-levantamento`, que
> bloqueia CALC-002 a CALC-005 e outras sete.
>
> **Método.** Todo item abaixo foi lido no **texto da norma**, no Planalto, não
> em resumo de terceiro (`CLAUDE.md`, regra 10 / `CO-1`). Cada linha traz a
> transcrição literal e o dispositivo.
>
> **Atualizado em 31/07/2026, mesma data:** a Súmula 386 do STJ foi localizada
> no compêndio oficial do tribunal e **resolveu a maior pendência** — o IRRF
> sobre férias indenizadas e o respectivo terço. Restam três, todas sobre a
> mesma verba ou sobre férias gozadas. Ver §9.
>
> **Este documento é PARCIAL, de propósito.** O que não foi confirmado em fonte
> oficial está marcado como ⏳ **pendente** e **não deve ser implementado** até
> que seja. É o mesmo tratamento dado ao vale-transporte em `RN-027`: campo
> ausente vale mais que campo estimado.

---

## 1. Por que esta pesquisa é o item de maior risco

As três perguntas abaixo têm de ser respondidas **por verba**, e é onde as
calculadoras concorrentes mais divergem entre si:

1. Integra o **salário-de-contribuição**? (INSS)
2. É **tributável** pelo imposto de renda? (IRRF)
3. Integra a **base do FGTS**?

Errar qualquer uma produz um número errado com aparência de certo — que
`CLAUDE.md` identifica como o erro mais provável do projeto.

---

## 2. O achado que simplifica metade do trabalho

**A base do FGTS e a base do INSS compartilham a mesma lista de exclusões.**

> **Lei nº 8.036/1990, art. 15, § 6º** (incluído pela Lei nº 9.711/1998):
> *"Não se incluem na remuneração, para os fins desta Lei, as parcelas
> elencadas no § 9º do art. 28 da Lei nº 8.212, de 24 de julho de 1991."*

Consequência prática: **uma** lista de exclusões, cadastrada uma vez, responde
às perguntas 1 e 3. Só o IRRF tem regra própria.

---

## 3. INSS — o que NÃO integra o salário-de-contribuição

**Fonte.** Lei nº 8.212, de 24 de julho de 1991, art. 28, § 9º, na redação da
Lei nº 9.528/1997.
`https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm`

> ⚠️ **Cuidado ao ler esta norma.** O Planalto exibe as redações **revogadas
> logo acima da vigente**, sem separação visual. A alínea "e" original citava
> expressamente o aviso prévio indenizado; a redação **vigente**, dada pela Lei
> nº 9.528/1997, substituiu-a por uma lista numerada de 1 a 9 que **não** o
> menciona. Ler a linha errada inverte a resposta.

| Verba | Integra INSS? | Dispositivo | Transcrição |
|---|---|---|---|
| **Férias indenizadas + terço constitucional** | ❌ Não | art. 28, §9º, **d** | *"as importâncias recebidas a título de férias indenizadas e respectivo adicional constitucional, inclusive o valor correspondente à dobra da remuneração de férias de que trata o art. 137 da CLT"* |
| **Multa de 40% do FGTS** | ❌ Não | art. 28, §9º, **e.1** | *"previstas no inciso I do art. 10 do Ato das Disposições Constitucionais Transitórias"* — é o dispositivo que quadruplicou a indenização, ou seja, a multa rescisória |
| Incentivo à demissão | ❌ Não | art. 28, §9º, **e.5** | *"recebidas a título de incentivo à demissão"* |
| Abono de férias (arts. 143 e 144 CLT) | ❌ Não | art. 28, §9º, **e.6** | *"recebidas a título de abono de férias na forma dos arts. 143 e 144 da CLT"* |
| Vale-transporte | ❌ Não | art. 28, §9º, **f** | *"a parcela recebida a título de vale-transporte, na forma da legislação própria"* |
| Indenização do art. 479 da CLT | ❌ Não | art. 28, §9º, **e.3** | contrato a prazo rescindido antecipadamente |

**Por consequência, integram** (não estão na lista de exclusões): saldo de
salário, 13º salário, férias **gozadas** e horas extras.

### 3.1 ⚠️ Aviso prévio indenizado — divergência que deve ser declarada

**Pela letra da lei vigente, integra.** A alínea que o excluía foi substituída
em 1997, e a lista numerada que a sucedeu não o repete.

**O Superior Tribunal de Justiça decidiu o contrário**, em recurso repetitivo
(Tema 478, REsp 1.230.957/RS): o aviso prévio indenizado tem natureza
indenizatória e não compõe o salário-de-contribuição.

> Esta é exatamente a situação que a memória de cálculo existe para tratar. O
> produto **não deve escolher em silêncio**. Deve declarar qual tratamento
> aplicou, dizer que há divergência e apontar as duas fontes — como já faz com
> a escolha entre deduções legais e desconto simplificado no IRRF.

⏳ **Pendente antes de implementar:** confirmar o inteiro teor do acórdão no
sítio do STJ e verificar se houve ato da Receita ou da PGFN que tenha
uniformizado a cobrança administrativa. **Não implementar por analogia.**

---

## 4. FGTS

**Fonte.** Lei nº 8.036, de 11 de maio de 1990.
`https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm`

| Item | Valor | Dispositivo | Transcrição |
|---|---|---|---|
| **Alíquota do depósito** | **8%** | art. 15, *caput*, na redação da **Lei nº 14.438/2022** | *"a importância correspondente a 8% (oito por cento) da remuneração paga ou devida, no mês anterior, a cada trabalhador, incluídas na remuneração as parcelas de que tratam os arts. 457 e 458 da CLT e a Gratificação de Natal de que trata a Lei nº 4.090, de 13 de julho de 1962"* |
| **13º entra na base** | ✅ Sim | art. 15, *caput* | a "Gratificação de Natal" é citada nominalmente — **confirma `RN-021`** |
| Aprendiz | 2% | art. 15, §7º | |
| **Multa — sem justa causa** | **40%** | art. 18, §1º, na redação da Lei nº 9.491/1997 | *"importância igual a quarenta por cento do montante de todos os depósitos realizados na conta vinculada durante a vigência do contrato de trabalho, **atualizados monetariamente e acrescidos dos respectivos juros**"* |
| **Multa — culpa recíproca ou força maior** | **20%** | art. 18, §2º | reconhecida pela Justiça do Trabalho |
| Exclusões da base | = INSS | art. 15, §6º | ver §2 acima |

**Duas consequências diretas para CALC-002 e CALC-007:**

1. A multa incide sobre os depósitos **corrigidos**, não sobre a soma nominal.
   Isso **confirma `RN-023`**: sem o extrato da conta vinculada, o produto não
   tem como saber o saldo real, e a estimativa precisa ser declarada como tal.
2. Os 20% de culpa recíproca são hipótese **reconhecida pela Justiça do
   Trabalho** — não é escolha do usuário, e não deve virar campo de seleção
   sem aviso de que depende de decisão judicial.

---

## 5. IRRF

**Fonte.** Decreto nº 9.580, de 22 de novembro de 2018 (RIR/2018), art. 35,
inciso III, alínea "c", com base na Lei nº 7.713/1988, art. 6º, V, e na Lei nº
8.036/1990, art. 28.
`https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9580.htm`

> *"a indenização e o aviso prévio pagos por despedida ou por rescisão de
> contrato de trabalho, **até o limite garantido pela lei trabalhista** ou pelo
> dissídio coletivo e pelas convenções trabalhistas homologados pela Justiça do
> Trabalho, e o montante recebido pelos empregados e pelos diretores e pelos
> seus dependentes ou sucessores, referente aos **depósitos, aos juros e à
> correção monetária creditados em contas vinculadas**, nos termos da
> legislação do Fundo de Garantia do Tempo de Serviço — FGTS"*

| Verba | Tributável? | Observação |
|---|---|---|
| **Aviso prévio indenizado** | ❌ Isento | Expresso no dispositivo |
| **FGTS — depósitos, juros e correção** | ❌ Isento | Expresso |
| **Multa de 40%** | ❌ Isento | É creditada na conta vinculada (art. 18, §1º, na redação da Lei nº 9.491/1997), portanto alcançada pela expressão *"creditados em contas vinculadas"* |
| **Indenização por despedida** | ❌ Isento | **Até o limite garantido pela lei trabalhista.** O que exceder o limite legal é tributável — a calculadora precisa dizer isso |
| Saldo de salário | ✅ Tributável | Salário comum |
| **Aviso prévio trabalhado** | ✅ Tributável | É trabalho prestado, não indenização. **Distinção essencial:** a isenção acima alcança o indenizado |
| **13º salário** | ✅ Tributável | **Exclusivamente na fonte**, em separado dos demais rendimentos. Ver §7.1 |
| Férias gozadas + terço | ✅ Tributável | |

### 5.1 ✅ RESOLVIDO — férias indenizadas e o terço, no IRRF

**Fonte.** Súmula 386 do Superior Tribunal de Justiça, conferida no compêndio
oficial de súmulas publicado pelo próprio tribunal.
`https://www.stj.jus.br/docs_internet/SumulasSTJ.pdf`

> **Súmula 386** — DIREITO TRIBUTÁRIO · IMPOSTO DE RENDA
>
> *"São isentas de imposto de renda as indenizações de férias proporcionais e o
> respectivo adicional."*
>
> Órgão julgador: **Primeira Seção** · Data da decisão: **26/08/2009** ·
> DJe de 01/09/2009 · RSTJ vol. 216, p. 741.

**A cadeia normativa fecha.** A súmula não cria isenção — ela **interpreta** a
que já existe: a isenção da *"indenização paga por despedida ou rescisão de
contrato de trabalho"* do **art. 6º, V, da Lei nº 7.713/1988**, que é
exatamente o dispositivo em que se apoia o art. 35, III, "c", do RIR/2018
transcrito acima. Os precedentes da súmula citam esse artigo nominalmente.

**Os precedentes vão além do enunciado**, e é deles que sai a regra que a
calculadora precisa:

| Situação | IRRF | Fundamento no precedente |
|---|---|---|
| Férias **vencidas não gozadas**, pagas na rescisão | ❌ Isento | *"está abrangido na regra de isenção referente à indenização paga por despedida ou rescisão de contrato de trabalho, prevista no art. 6º, V, da Lei 7.713/88"* |
| Férias **proporcionais** indenizadas | ❌ Isento | *"igualmente, não está abrangido pela cobrança do imposto de renda, em razão da aludida regra de isenção"* |
| Férias vencidas não gozadas, pagas **no curso** do contrato | ❌ Isento | mesma razão |
| **Abono pecuniário** de férias | ❌ Isento | listado expressamente entre as verbas sobre as quais *"o imposto de renda não incide"* |

### 5.2 ✅ O terço constitucional segue a natureza do principal

Este é o ponto mais delicado, e o precedente da Súmula 386 o resolve de forma
explícita:

> *"o pagamento relativo a adicional de 1/3 sobre férias, **quando essas são
> gozadas**, sujeita-se à incidência do referido imposto, não apresentando
> caráter indenizatório, mas tipicamente salarial [...]. Todavia, é diferente a
> situação quando tal adicional integra o valor pago a título de conversão em
> pecúnia de férias não gozadas [...] ou de férias proporcionais. **Nesse caso,
> o adicional assume a mesma natureza do pagamento principal.**"*

**Regra para implementar:**

| | Férias | Terço |
|---|---|---|
| **Gozadas** (durante o contrato) | tributável | **tributável** — natureza salarial |
| **Indenizadas** (rescisão ou conversão) | isento | **isento** — acompanha o principal |

> ⚠️ **A divergência STJ × STF que `18-levantamento` menciona é de matéria
> diferente** — trata da **contribuição previdenciária** sobre o terço de
> férias **gozadas**, não do imposto de renda. Ela não é resolvida por esta
> súmula e continua pendente para CALC-004. Não confundir as duas.

---

## 6. Aviso prévio proporcional — `RN-020` resolvido

**Fonte.** Lei nº 12.506, de 11 de outubro de 2011.
`https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12506.htm`

> **Art. 1º** *"O aviso prévio [...] será concedido na proporção de 30 (trinta)
> dias aos empregados que contem até 1 (um) ano de serviço na mesma empresa."*
>
> **Parágrafo único.** *"Ao aviso prévio previsto neste artigo serão acrescidos
> 3 (três) dias por ano de serviço prestado na mesma empresa, até o máximo de
> 60 (sessenta) dias, perfazendo um total de até 90 (noventa) dias."*

| Parâmetro | Valor | Confirmado |
|---|---|---|
| Dias-base | **30** | ✅ art. 1º |
| Acréscimo por ano de serviço | **3 dias** | ✅ parágrafo único |
| Teto do **acréscimo** | **60 dias** | ✅ parágrafo único |
| Teto **total** | **90 dias** | ✅ parágrafo único |

### 6.1 ⚠️ A lei é silente sobre quando o acréscimo começa

O texto diz "3 dias por ano de serviço prestado", e o *caput* fixa 30 dias para
quem tem "até 1 ano". **A lei não diz** se o primeiro acréscimo ocorre ao
completar o primeiro ano ou o segundo. A diferença é de 3 dias de salário em
toda rescisão — não é detalhe.

**O que foi possível apurar em 31/07/2026:**

- A **Nota Técnica nº 184/2012/CGRT/SRT/MTE** publicou a tabela oficial de
  correspondência, e é a referência universalmente citada. **Não foi
  localizada** em acervo acessível: o antigo `mte.gov.br` foi reorganizado e o
  documento não está no repositório atual de notas técnicas do ministério.
- A **jurisprudência do TST e dos TRTs é convergente**: o acréscimo é devido
  **a partir do primeiro ano completo** — 1 ano de serviço → 33 dias, 2 anos →
  36 dias, e assim por diante até 90.

**Encaminhamento.** Diferente das pendências do §9, esta **não bloqueia** a
construção: os três parâmetros que vão para `lib/params/` — 30, 3 e 90 — estão
todos no texto da lei, com URL oficial. O que não está na lei é a regra de
contagem, e por isso ela **não é parâmetro legal**: é decisão de implementação,
e a memória de cálculo deve declará-la como tal.

O texto sugerido para a etapa da memória, na linha do que o produto já faz com
a escolha entre deduções legais e desconto simplificado:

> *"A Lei nº 12.506/2011 fixa 30 dias e acrescenta 3 dias por ano de serviço,
> até 90. A lei não diz a partir de qual ano o acréscimo começa; adotamos o
> primeiro ano completo, conforme entendimento consolidado da Justiça do
> Trabalho."*

⏳ Continua valendo localizar a Nota Técnica, ou o precedente do TST que a
confirme, para citar fonte nominal em vez de "entendimento consolidado".

---

## 7. As duas regras de fracionamento — `RN-015` resolvido

O `01-prd` pedia confirmar se a regra dos 15 dias do 13º e a das férias
proporcionais são idênticas. **As redações são diferentes; o resultado é o
mesmo.**

| | Norma | Transcrição |
|---|---|---|
| **13º salário** | Lei nº 4.090/1962, art. 1º, § 2º | *"A fração **igual ou superior a 15 (quinze) dias** de trabalho será havida como mês integral"* |
| **Férias proporcionais** | CLT, art. 146, parágrafo único, na redação do Decreto-lei nº 1.535/1977 | *"na proporção de 1/12 (um doze avos) por mês de serviço ou **fração superior a 14 (quatorze) dias**"* |

Em dias inteiros — e dia de serviço é sempre inteiro — "≥ 15" e "> 14"
descrevem o mesmo conjunto.

**Conclusão para a implementação.** `RN-015` **pode** compartilhar uma função
entre 13º e férias. O comentário no código deve citar **as duas** normas e
registrar que as redações diferem, para que ninguém "corrija" uma delas depois
achando que é erro de transcrição.

### 7.1 O §3º do Art. 3º-A alcança o 13º

Já registrado em `ESTADO-DO-PROJETO` §7.1 e no changelog: a redução do imposto
de renda **também se aplica ao 13º salário**, tributado exclusivamente na
fonte. Entra em CALC-005.

---

## 8. Quadro-resumo

| Verba | INSS | IRRF | FGTS |
|---|---|---|---|
| Saldo de salário | ✅ integra | ✅ tributável | ✅ integra |
| 13º proporcional | ✅ integra | ✅ tributável (na fonte, em separado) | ✅ integra |
| Aviso prévio **trabalhado** | ✅ integra | ✅ tributável | ✅ integra |
| Aviso prévio **indenizado** | ⚠️ **divergência** (§3.1) | ❌ isento | ⏳ pendente |
| Férias **vencidas indenizadas** + ⅓ | ❌ não integra | ❌ **isento** | ⏳ pendente |
| Férias **proporcionais indenizadas** + ⅓ | ❌ não integra | ❌ **isento** | ⏳ pendente |
| Férias **gozadas** + ⅓ | ✅ integra | ✅ tributável | ✅ integra |
| Abono pecuniário de férias | ❌ não integra | ❌ isento | ❌ não integra |
| Multa de 40% do FGTS | ❌ não integra | ❌ isento | — |
| Vale-transporte | ❌ não integra | — | ❌ não integra |

**Legenda.** ✅ e ❌ = confirmado em fonte primária, com dispositivo citado
acima. ⚠️ = confirmado, mas com divergência que a memória de cálculo deve
declarar. ⏳ = **não confirmado — não implementar.**

**A assimetria que quase induziu ao erro.** Para o **INSS**, a exclusão das
férias indenizadas é expressa em lei (art. 28, §9º, "d"). Para o **IRRF**, não
é: decorre da interpretação sumulada de uma isenção redigida em termos gerais.
Chegaram à mesma resposta por caminhos diferentes — e por isso **uma não pode
ser presumida a partir da outra** em nenhuma verba nova.

---

## 9. O que falta, em ordem

| # | Pendência | Bloqueia | Onde procurar | Estado |
|---|---|---|---|---|
| ~~1~~ | ~~IRRF sobre férias indenizadas + terço~~ | — | Súmula 386 STJ | ✅ **Resolvido** em 31/07/2026 (§5.1 e §5.2) |
| ~~2~~ | ~~Ponto de partida do acréscimo do aviso prévio~~ | — | — | ⚠️ **Deixou de bloquear** (§6.1). A lei é silente; vira decisão declarada na memória, não parâmetro legal |
| ~~3~~ | ~~Aviso prévio indenizado × INSS~~ | — | STJ, Tema 478 | ✅ **Resolvido.** Ver §11 |
| ~~4~~ | ~~Aviso prévio indenizado × base do FGTS~~ | — | Súmula 305 do TST | ✅ **Resolvido.** Ver §11 |
| ~~5~~ | ~~Terço de férias gozadas × contribuição~~ | — | RPS, art. 214, § 4º | ✅ **Resolvido.** Ver §11 |

**Nenhuma pendência bloqueia CALC-002.** A calculadora foi publicada em
31/07/2026 com todas as incidências fundamentadas em fonte primária.

Continua valendo, para a próxima sessão e sem bloquear nada:

- localizar a **Nota Técnica 184/2012** ou precedente do TST que confirme o
  ponto de partida do acréscimo do aviso prévio, para citar fonte nominal em
  vez de "entendimento consolidado" (§6.1);
- verificar se houve **ato da RFB ou da PGFN** que uniformizou a cobrança
  administrativa do INSS sobre o aviso prévio indenizado. A página de
  jurisprudência vinculante da Receita, consultada em 31/07/2026, **não** o
  lista entre as matérias dispensadas — por isso a memória de cálculo declara
  a divergência em vez de escondê-la (§3.1).

---

## 10. Nota de método, para quem continuar

1. **O Planalto exibe redações revogadas junto com a vigente**, sem separação
   visual. Em `l8212cons.htm` isso quase inverteu a resposta sobre o aviso
   prévio indenizado. Confira sempre a etiqueta *"(Redação dada pela Lei nº …)"*
   e prefira a mais recente.
2. **Os PDFs do gov.br recusam requisição sem cabeçalho de navegador** (403), e
   alguns recusam `HEAD`. Um verificador de link ingênuo os reporta como
   quebrados.
3. **Norma digitalizada não é norma inconferível.** Quando o PDF não tem camada
   de texto, `pdftoppm -png` e leitura da imagem resolvem. Foi assim que o
   Anexo II da portaria do INSS foi conferido em 31/07/2026.


## 11. As três pendências que fecharam em 31/07/2026

### 11.1 Aviso prévio indenizado × INSS — Tema 478 do STJ

Tese firmada, conferida na base oficial de repetitivos do tribunal:

> *"Não incide contribuição previdenciária sobre os valores pagos a título de
> aviso prévio indenizado, por não se tratar de verba salarial."*
>
> REsp 1.230.957/RS · Primeira Seção · julgado em 26/02/2014 ·
> **tese mantida após juízo de retratação em 13/05/2026**, publicado em
> 09/06/2026.

**A divergência é real e continua registrada.** A letra da Lei nº 8.212/1991
não exclui o aviso prévio indenizado: a alínea que o fazia foi substituída pela
Lei nº 9.528/1997, e a lista numerada que a sucedeu não o repete. O cálculo
segue a tese vinculante, e a memória **declara** isso com link para o tema — é
o mesmo tratamento dado à escolha entre deduções legais e desconto simplificado
no IRRF.

### 11.2 Aviso prévio indenizado × base do FGTS — Súmula 305 do TST

> **SUM-305 · FUNDO DE GARANTIA DO TEMPO DE SERVIÇO. INCIDÊNCIA SOBRE O AVISO
> PRÉVIO** (mantida) — Res. 121/2003
>
> *"O pagamento relativo ao período de aviso prévio, trabalhado ou não, está
> sujeito a contribuição para o FGTS."*

**E um achado que muda o número da multa.** A OJ-SDI1 nº 42, II, do TST:

> *"O cálculo da multa de 40% do FGTS deverá ser feito com base no saldo da
> conta vinculada na data do efetivo pagamento das verbas rescisórias,
> **desconsiderada a projeção do aviso prévio indenizado**, por ausência de
> previsão legal."*

Os dois convivem: o depósito de 8% incide sobre o aviso, mas a multa é apurada
sobre o saldo existente no pagamento. Quem somasse a projeção à base da multa
pagaria a mais — e é um erro que passa despercebido.

### 11.3 Terço de férias gozadas × contribuição — RPS, art. 214, § 4º

Resolvido pelo **texto do regulamento**, sem precisar do acórdão:

> *"A remuneração adicional de férias de que trata o inciso XVII do art. 7º da
> Constituição Federal **integra o salário-de-contribuição**."*

A divergência STJ × STF que `18-levantamento` mencionava dizia respeito à
contribuição **patronal**; o STF a pacificou no Tema 985 (RE nº 1.072.485), e a
Receita Federal a lista entre sua jurisprudência vinculante. Para o desconto do
**empregado**, que é o que esta calculadora apura, o regulamento já bastava.

### 11.4 Duas confirmações que vieram junto

| O quê | Fonte | Para quê |
|---|---|---|
| **INSS do 13º é apurado em separado** | RPS, art. 216, § 1º e § 3º: *"deverá ser calculado em separado"* e, na rescisão, *"computando-se em separado a parcela referente à gratificação natalina"* | Muda o valor: somar o 13º ao saldo de salário empurraria a base para faixas superiores |
| **Divisor 30 do salário-dia** | CLT, art. 64: *"dividindo-se o salário mensal [...] por 30 (trinta) vezes o número de horas"* | O 30 é da norma, não convenção de mercado |
| **Projeção do aviso indenizado** | CLT, art. 487, § 1º: *"garantida sempre a integração desse período no seu tempo de serviço"* | É a base legal exata de `RN-019` |

---
