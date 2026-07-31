---
doc: 19-incidencias-verbas-rescisorias
projeto: Cálculo Oficial
versao: 1.0
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

### 5.1 ⏳ PENDENTE — férias indenizadas e o terço, no IRRF

**Não foi possível confirmar em fonte oficial acessível.** O RIR/2018 não trata
das férias indenizadas de forma expressa; a isenção decorre de jurisprudência
consolidada e de ato administrativo que a acolheu.

Ponteiros a abrir na próxima sessão, **nesta ordem**:

1. **Súmula 386 do STJ** — *"São isentas de imposto de renda as indenizações de
   férias proporcionais e o respectivo adicional."* Confirmar o enunciado no
   sítio do STJ.
2. **Instrução Normativa RFB nº 1.500/2014, art. 6º** — a norma administrativa
   que lista os rendimentos isentos. O sítio `normas.receita.fazenda.gov.br`
   não respondeu em 31/07/2026; tentar de novo ou pelo Diário Oficial.
3. **Ato Declaratório PGFN** que dispensou a contestação judicial da matéria.

> **Enquanto isso não for confirmado, CALC-002 e CALC-004 não podem ser
> publicadas.** Férias indenizadas + terço é uma das maiores parcelas da
> rescisão; errar a incidência muda o resultado em centenas de reais.
>
> Note a assimetria já provada: para o **INSS**, a exclusão é expressa em lei
> (§3, alínea "d"). Para o **IRRF**, não é. Não presuma que uma implica a outra.

### 5.2 ⚠️ A divergência do terço constitucional

Há divergência entre STJ e STF sobre a natureza do terço constitucional. Ela
vale para as férias **gozadas**, não para as **indenizadas** da rescisão — e
por isso não bloqueia CALC-002, mas **bloqueia CALC-004**, que trata das férias
usufruídas.

⏳ Pendente de leitura direta dos acórdãos antes de CALC-004.

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

### 6.1 ⏳ PENDENTE — a partir de qual ano o acréscimo começa

O texto diz "3 dias por ano de serviço prestado", e o *caput* fixa 30 dias para
quem tem "até 1 ano". **A lei não diz explicitamente** se o primeiro acréscimo
ocorre ao completar o primeiro ano ou o segundo.

A diferença é de 3 dias de salário em toda rescisão — não é detalhe.

⏳ **Confirmar na Nota Técnica nº 184/2012/CGRT/SRT do então Ministério do
Trabalho**, que publicou a tabela oficial de correspondência. Não implementar
antes disso.

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
| Férias **vencidas/proporcionais indenizadas** + ⅓ | ❌ não integra | ⏳ **pendente** (§5.1) | ⏳ pendente |
| Férias **gozadas** + ⅓ | ✅ integra | ✅ tributável | ✅ integra |
| Multa de 40% do FGTS | ❌ não integra | ❌ isento | — |
| Vale-transporte | ❌ não integra | — | ❌ não integra |

**Legenda.** ✅ e ❌ = confirmado em fonte primária, com dispositivo citado
acima. ⚠️ = confirmado, mas com divergência que a memória de cálculo deve
declarar. ⏳ = **não confirmado — não implementar.**

---

## 9. O que falta, em ordem

| # | Pendência | Bloqueia | Onde procurar |
|---|---|---|---|
| 1 | IRRF sobre férias indenizadas + terço | **CALC-002, CALC-003, CALC-004** | Súmula 386 STJ · IN RFB 1500/2014 art. 6º |
| 2 | Ponto de partida do acréscimo do aviso prévio | **CALC-002, CALC-003, CALC-010** | Nota Técnica 184/2012 CGRT/SRT/MTE |
| 3 | Aviso prévio indenizado × INSS | **CALC-002** | STJ Tema 478 · ato da RFB/PGFN |
| 4 | Aviso prévio indenizado × base do FGTS | CALC-002, CALC-007 | Lei 8.036 · Súmula 305 do TST |
| 5 | Terço de férias **gozadas** × INSS | **CALC-004** | Acórdãos STJ e STF |

**Três das cinco bloqueiam CALC-002**, que é a de maior busca do catálogo.
Nenhuma delas é trabalho de programação — é leitura de norma. É por isso que
`18-levantamento` §6 recomenda começar por aqui e construir, em paralelo,
CALC-024 e CALC-025, que não dependem de nada.

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
