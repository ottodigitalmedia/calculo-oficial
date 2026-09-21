---
doc: 00-catalogo-calculadoras
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: []
referenciado_por: [00-product-brief, 01-prd, 11-roadmap]
---

# Catálogo de Calculadoras

Documento de escopo. Define **todas** as calculadoras que o projeto terá, em que fase entram e quais estão permanentemente fora. Nenhuma calculadora é implementada sem constar aqui.

---

## 1. Decisões que governam este catálogo

| # | Decisão | Consequência |
|---|---|---|
| D-01 | Monetização exclusiva por anúncio | Prioridade = pageviews × RPM do nicho, não volume bruto de busca |
| D-02 | Sem autenticação, sem banco de dados | Toda calculadora executa no navegador; nenhuma depende de estado do usuário |
| D-03 | Sem geração de documentos jurídicos | Nada que configure assessoria jurídica (decisão OAB, Lei 8.906/94, art. 1º, II) |
| D-04 | Cobertura nacional | Nada que dependa de dado municipal isolado |
| D-05 | Toda constante legal é versionada por vigência com fonte citada | Calculadora com parâmetro volátil custa manutenção anual; isso entra na priorização |
| D-06 | Memória de cálculo obrigatória | Calculadora cujo cálculo não pode ser explicado passo a passo não entra |

> 📌 PREMISSA: a classificação de valor publicitário por vertical abaixo é hipótese de mercado baseada na competição típica de anunciantes em cada nicho. Não é medição. Deve ser corrigida com dados reais do painel de anúncios após 90 dias de tráfego.

---

## 2. Critérios de classificação

**Demanda** — volume estimado de busca no Brasil
`🔥 alta` · `🔸 média` · `▫️ nichada`

**Valor** — valor publicitário estimado da vertical
`A alto` (crédito, seguro, investimento, imóvel) · `M médio` (trabalhista, tributário, veículo, energia) · `B baixo` (utilitário, matemática)

**Fonte de dados**
`P` parâmetro legal versionado manualmente · `API` série do BCB · `—` matemática pura, sem parâmetro externo

**Manutenção** — custo anual de atualização
`Alta` muda todo exercício · `Média` muda de forma irregular · `Nula` fórmula estável

**Fase** — `v1` `v2` `v3` `v4`

---

## 3. Categorias

O catálogo tem **11 categorias ativas** e **5 categorias excluídas em definitivo**. A décima primeira — PRV — foi aberta em 17/09/2026, no lote 5 do v5; ver §13.1 e §18.6.

| Cód. | Categoria | Papel estratégico | Calculadoras |
|---|---|---|---|
| TRB | Trabalhista e CLT | Âncora de volume e de autoridade | 35 |
| TRI | Tributos Pessoa Física | Volume sazonal intenso | 15 |
| CRD | Crédito e Dívidas | Âncora de receita | 10 |
| IMV | Imóveis e Financiamento | Âncora de receita | 8 |
| INV | Investimentos e Renda Fixa | Âncora de receita | 9 |
| AUT | Autônomo, MEI e PJ | Ponte entre trabalhista e tributário | 8 |
| VEI | Veículos | Receita média, manutenção baixa | 7 |
| IDX | Correção Monetária e Índices | Diferencial técnico defensável | 5 |
| CSM | Consumo Doméstico e Energia | Volume estável, receita média | 5 |
| UTI | Utilitários e Matemática | Volume alto, receita baixa — sustentação de sessão | 7 |
| PRV | Previdência e Benefícios do INSS | Volume alto e permanente; risco alto de norma | 12 |
| | **Total** | | **122** |

---

## 4. TRB — Trabalhista e CLT

**Papel.** É a categoria de maior volume de busca do nicho e a que estabelece autoridade. Todas compartilham o mesmo motor de INSS, IRRF e proporcionalidades — o custo marginal da segunda calculadora em diante é baixo.

**Risco.** Manutenção alta: praticamente todo parâmetro muda na virada de exercício. Concentre a revisão anual em um único bloco de trabalho.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-001 | Salário líquido (INSS + IRRF + VT + dependentes) | 🔥 | M | P | Alta | **v1** |
| CALC-002 | Rescisão — demissão sem justa causa | 🔥 | M | P | Alta | **v1** |
| CALC-003 | Rescisão — pedido de demissão | 🔥 | M | P | Alta | **v1** |
| CALC-004 | Férias (integrais, proporcionais, abono, 1/3) | 🔥 | M | P | Alta | **v1** |
| CALC-005 | 13º salário (1ª parcela, 2ª parcela, proporcional) | 🔥 | M | P | Alta | **v1** |
| CALC-006 | Horas extras (50%, 100%, adicional noturno, DSR) | 🔥 | M | P | Média | **v1** |
| CALC-007 | FGTS — saldo acumulado e multa rescisória | 🔥 | M | P | Baixa | **v1** |
| CALC-008 | Rescisão — acordo mútuo (art. 484-A da CLT) | 🔸 | M | P | Alta | v2 |
| CALC-009 | Seguro-desemprego — parcelas e valor | 🔥 | M | P | Alta | v2 |
| CALC-076 | Acordo mútuo ou dispensa — comparador | 🔸 | A | P | Alta | v3 |
| CALC-010 | Aviso prévio proporcional (Lei 12.506/2011) | 🔸 | M | P | Baixa | v2 |
| CALC-011 | Custo real do funcionário (encargos + provisões) | 🔸 | M | P | Alta | v3 |
| CALC-012 | Rescisão — empregado doméstico (LC 150/2015) | ▫️ | M | P | Alta | v3 |
| CALC-013 | Banco de horas e jornada acumulada | ▫️ | B | — | Nula | v3 |
| CALC-014 | Rescisão — contrato intermitente (art. 452-A) | ▫️ | M | P | Alta | v4 |
| CALC-077 | Adicional noturno — urbano e rural | 🔸 | M | P | Baixa | v5 |
| CALC-078 | Adicional de insalubridade | 🔥 | M | P | Média | v5 |
| CALC-079 | Adicional de periculosidade, com comparação | 🔸 | M | P | Baixa | v5 |
| CALC-080 | DSR sobre comissões e variáveis | 🔸 | M | — | Nula | v5 |
| CALC-081 | Desconto de faltas e perda do DSR | 🔸 | M | — | Nula | v5 |
| CALC-082 | Desconto do vale-transporte | 🔸 | M | P | Baixa | v5 |
| CALC-083 | Salário do jovem aprendiz | 🔥 | M | P | Alta | v5 |
| CALC-084 | Recesso do estágio | ▫️ | M | P | Nula | v5 |
| CALC-086 | Licença-maternidade — término e retorno, com Empresa Cidadã | 🔥 | M | P | Baixa | v5 |
| CALC-087 | Licença-paternidade — duração pela data do nascimento (Lei 15.371/2026) | 🔥 | M | P | Média | v5 |
| CALC-088 | Salário-família — cota e limite de remuneração | 🔸 | M | P | Alta | v5 |
| CALC-089 | Rescisão antecipada do contrato de experiência (art. 479) | 🔸 | M | P | Nula | v5 |
| CALC-090 | Adicional de transferência (art. 469, § 3º) | ▫️ | M | P | Nula | v5 |
| CALC-091 | Sobreaviso e prontidão (art. 244) | 🔸 | M | P | Nula | v5 |
| CALC-092 | Rescisão por justa causa — o que resta e o que sai | 🔥 | M | P | Alta | v5 |
| CALC-112 | Férias vencidas em dobro (CLT, arts. 134 e 137; Súmula 81 do TST) | 🔥 | M | P | Nula | v5 |
| CALC-115 | Horas trabalhadas e intervalo (CF, art. 7º, XIII; CLT, arts. 66 e 71) | 🔥 | M | P | Nula | v5 |
| CALC-117 | DAE do empregador doméstico (LC 150, art. 34) | 🔥 | M | P | Alta | v5 |
| CALC-118 | Abono salarial do PIS (Lei 7.998, art. 9º; CF, art. 239, § 3º) | 🔥 | M | P | **Crítica** | v5 |
| CALC-120 | Escala 12 × 36 — plantões, horas e feriados (CLT, art. 59-A) | 🔥 | M | P | Nula | v5 |
| CALC-095 | Saque-aniversário do FGTS | 🔥 | B | P | Média | v5 |

> ⚠️ VERIFICAR: base legal e alíquotas de cada item contra o texto normativo vigente antes de codificar. Nunca contra blog, software de terceiro ou site concorrente.

> **CALC-076 entrou em 07/08/2026, por decisão do mantenedor**, e é a única do
> catálogo que nasceu fora do desenho original. Ela não colide com a exclusão
> jurídico-documental de `§14`: o que ali está fora é **gerar** documentos —
> contratos, distratos, acordos —, e não calcular o valor de uma rescisão por
> acordo, que já está no ar desde CALC-008. Comparar dois cálculos publicados é a
> mesma classe, e não a excluída.
>
> O valor dela é alto porque a diferença que decide **não está nas verbas**: o
> art. 484-A, § 2º veda o seguro-desemprego, e isso não aparece em linha nenhuma
> da rescisão. A última nota do resultado de CALC-008 já mandava o usuário fazer
> essa comparação à mão, em duas abas.

---

## 5. TRI — Tributos Pessoa Física

**Papel.** Volume concentrado em dois picos anuais — virada de exercício e prazo de declaração. É a categoria mais sensível a mudança legal.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-015 | IRRF mensal na fonte | 🔥 | M | P | **Crítica** | **v1** |
| CALC-016 | INSS mensal — tabela progressiva | 🔥 | M | P | Alta | **v1** |
| CALC-017 | Restituição estimada do IRPF anual | 🔸 | M | P | Alta | v2 |
| CALC-018 | IR sobre renda fixa — tabela regressiva | 🔸 | A | P | Média | v2 |
| CALC-019 | Comparador: modelo simplificado vs. completo | 🔸 | M | P | Alta | v3 |
| CALC-020 | IR sobre ganho de capital em venda de imóvel | ▫️ | A | P | Média | v3 |
| CALC-021 | IR sobre criptoativos | ▫️ | A | P | Média | v4 |
| CALC-085 | Imposto sobre a PLR (tabela exclusiva) | 🔸 | M | P | Média | v5 |
| CALC-093 | Imposto sobre ganhos em bolsa (ações e day trade) | 🔥 | A | P | Média | v5 |
| CALC-094 | Imposto no resgate da previdência privada | 🔸 | M | P | Baixa | v5 |
| CALC-096 | Imposto em fundos imobiliários (rendimentos e ganho) | 🔥 | A | P | Média | v5 |
| CALC-098 | Come-cotas do fundo de investimento | 🔸 | A | P | Baixa | v5 |
| CALC-113 | Imposto na venda de carro e outros bens (Lei 9.250, art. 22) | 🔥 | M | P | Média | v5 |
| CALC-114 | Imposto de renda sobre aluguel (RIR/2018, arts. 42 e 689) | 🔥 | M | P | Alta | v5 |
| CALC-121 | PGBL no imposto de renda (Lei 9.532, art. 11; Lei 9.250, art. 11-A) | 🔥 | M | P | Alta | v5 |

> ⚠️ VERIFICAR: a regra vigente de IRRF combina tabela progressiva com mecanismo de redução para faixas intermediárias. Confirmar contra a lei e a orientação da Receita Federal antes de implementar CALC-015 — é o parâmetro de maior impacto e maior risco de erro do projeto inteiro.

---

## 6. CRD — Crédito e Dívidas

**Papel.** Âncora de receita. Vertical com a maior competição de anunciantes do catálogo. Manutenção próxima de zero porque são fórmulas financeiras estáveis, sem parâmetro legal.

**Nota de conteúdo.** É também a categoria de maior fragilidade ética: o usuário chega endividado e o anúncio ao lado vende crédito. O aviso de não-aconselhamento precisa ser contextual e visível, não só no rodapé.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-022 | Juros compostos com aportes mensais | 🔥 | A | — | Nula | **v1** |
| CALC-023 | Juros do rotativo do cartão — custo real | 🔥 | A | — | Nula | v2 |
| CALC-024 | CET — custo efetivo total de um empréstimo | 🔸 | A | — | Nula | v2 |
| CALC-025 | Amortização — tabela completa SAC vs. Price | 🔥 | A | — | Nula | v2 |
| CALC-026 | Quitação antecipada — economia de juros | 🔸 | A | — | Nula | v3 |
| CALC-099 | Consórcio ou financiamento — comparador | 🔥 | A | — | Nula | v5 |
| CALC-027 | Empréstimo consignado — margem e parcela | 🔸 | A | P | Média | v3 |
| CALC-028 | Plano de quitação (bola de neve vs. avalanche) | 🔸 | A | — | Nula | v3 |
| CALC-029 | Portabilidade de crédito — vale a pena? | ▫️ | A | — | Nula | v4 |
| CALC-030 | Cheque especial — custo real | ▫️ | A | — | Nula | v4 |

---

## 7. IMV — Imóveis e Financiamento Imobiliário

**Papel.** Âncora de receita. Ticket alto do anunciante, sessões longas, alta propensão a navegar entre calculadoras do mesmo cluster.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-031 | Financiamento imobiliário — SAC vs. Price completo | 🔥 | A | — | Nula | v2 |
| CALC-032 | Capacidade de financiamento (renda × parcela) | 🔸 | A | — | Nula | v2 |
| CALC-033 | Custo total de aquisição (entrada + taxas + registro) | 🔸 | A | P | Média | v3 |
| CALC-034 | Alugar vs. comprar — comparativo de longo prazo | 🔸 | A | API | Nula | v3 |
| CALC-035 | Rentabilidade de imóvel para locação | ▫️ | A | — | Nula | v3 |
| CALC-036 | Amortização extra no financiamento (prazo vs. parcela) | 🔸 | A | — | Nula | v3 |
| CALC-037 | Reajuste de aluguel por índice contratual | 🔸 | M | **API** | Nula | v3 |
| CALC-038 | Financiamento de reforma | ▫️ | A | — | Nula | v4 |

> 📌 PREMISSA: CALC-033 usa apenas custos de incidência nacional. Taxa de cartório e ITBI variam por município e estado e ficam fora do cálculo, sinalizados como campo de entrada manual do usuário — nunca estimados por conta própria (ver §14, categoria excluída HIPERLOCAL).

---

## 8. INV — Investimentos e Renda Fixa

**Papel.** Âncora de receita. Depende do SGS do Banco Central, o que exige plano de falha explícito — é a única categoria com dependência externa em runtime.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-039 | CDB/LCI/LCA — rendimento líquido com IR | 🔸 | A | **API** | Baixa | v2 |
| CALC-040 | Comparador: Tesouro Selic vs. CDB vs. Poupança | 🔸 | A | **API** | Baixa | v2 |
| CALC-041 | Rendimento da poupança | 🔥 | M | **API** | Baixa | v2 |
| CALC-042 | Quanto rende X reais por mês | 🔥 | A | **API** | Baixa | v3 |
| CALC-043 | Meta de independência financeira | 🔸 | A | — | Nula | v3 |
| CALC-044 | Reserva de emergência — dimensionamento | 🔸 | M | — | Nula | v3 |
| CALC-045 | Tesouro IPCA+ — rendimento real projetado | ▫️ | A | **API** | Baixa | v4 |
| CALC-046 | Dividend yield e renda passiva | ▫️ | A | — | Nula | v4 |
| CALC-122 | Tesouro Prefixado no vencimento (Decreto 12.814/2026, art. 2º; Lei 11.033, art. 1º) | 🔥 | A | P | Baixa | v5 |

> ⚠️ Toda calculadora `API` desta categoria deve funcionar com o último valor conhecido em cache quando a fonte externa estiver indisponível, exibindo a data do dado. Nunca uma tela quebrada, nunca um valor silenciosamente desatualizado.

---

## 9. AUT — Autônomo, MEI e PJ

**Papel.** Ponte entre trabalhista e tributário. Público com alta intenção comercial e boa densidade de anunciante.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-047 | DAS-MEI — valor mensal por atividade | 🔥 | M | P | Média | v2 |
| CALC-048 | Comparador CLT vs. PJ vs. MEI — renda líquida real | 🔥 | M | P | Alta | v2 |
| CALC-049 | Precificação de hora — freelancer e autônomo | 🔸 | M | — | Nula | v3 |
| CALC-050 | INSS do contribuinte individual e facultativo | 🔸 | M | P | Alta | v3 |
| CALC-051 | Pró-labore e encargos do sócio | ▫️ | M | P | Alta | v4 |
| CALC-052 | Faturamento máximo do MEI e desenquadramento | 🔸 | M | P | Média | v4 |
| CALC-116 | DAS do Simples Nacional — anexo, faixa e alíquota efetiva (LC 123, art. 18) | 🔥 | A | P | **Crítica** | v5 |
| CALC-053 | Carnê-leão — recolhimento mensal do autônomo | ▫️ | M | P | Alta | v4 |

---

## 10. VEI — Veículos

**Papel.** Receita média a alta (financiamento e seguro são anunciantes fortes), manutenção baixa, fórmulas simples. Boa relação esforço/retorno a partir do v3.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-054 | Álcool vs. gasolina — qual compensa | 🔥 | M | — | Nula | v2 |
| CALC-055 | Consumo e custo de viagem por combustível | 🔥 | M | — | Nula | v3 |
| CALC-056 | Financiamento de veículo — parcela e CET | 🔸 | A | — | Nula | v3 |
| CALC-057 | Custo mensal real de ter um carro | 🔸 | A | — | Nula | v3 |
| CALC-058 | Carro elétrico vs. combustão — custo por km | 🔸 | M | — | Nula | v4 |
| CALC-059 | Depreciação de veículo | ▫️ | M | — | Nula | v4 |
| CALC-097 | Multa de trânsito e pontos na carteira | 🔥 | M | P | Média | v5 |

> ❌ IPVA fica fora: alíquota e base variam por unidade federativa e a tabela de valor venal tem restrição de licenciamento. Ver §14.

---

## 11. IDX — Correção Monetária e Índices

**Papel.** Categoria de menor volume e maior diferencial técnico. É onde o motor de vigências e o histórico de séries do Banco Central geram algo que os concorrentes gratuitos não têm: **cálculo retroativo auditável**.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-060 | Correção de valor por índice (IPCA, INPC, IGP-M, SELIC, TR) | 🔸 | M | **API** | Nula | v3 |
| CALC-061 | Poder de compra ao longo do tempo | 🔸 | M | **API** | Nula | v3 |
| CALC-062 | Conversor de moeda com IOF | 🔸 | M | **API** | Média | v3 |
| CALC-063 | Reajuste de salário por inflação acumulada | 🔸 | M | **API** | Nula | v4 |
| CALC-064 | Valor futuro corrigido — projeção por índice | ▫️ | M | **API** | Nula | v4 |

---

## 12. CSM — Consumo Doméstico e Energia

**Papel.** Volume estável, sazonalidade baixa, e o subnicho de energia solar tem anunciante forte.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-065 | Consumo de energia por aparelho — custo mensal | 🔥 | M | — | Nula | v3 |
| CALC-066 | Retorno de investimento em energia solar | 🔸 | A | — | Nula | v3 |
| CALC-067 | Conta de água — consumo estimado | 🔸 | B | — | Nula | v4 |
| CALC-068 | Duração e custo do botijão de gás | ▫️ | B | — | Nula | v4 |
| CALC-069 | Orçamento doméstico — regra 50/30/20 | 🔸 | M | — | Nula | v4 |

> 📌 PREMISSA: tarifas de energia, água e gás variam por concessionária. Todas entram como campo preenchido pelo usuário, com instrução de onde encontrar na própria fatura. O produto não estima tarifa por região.

---

## 13. UTI — Utilitários e Matemática

**Papel.** Volume muito alto, receita baixa. Existem por dois motivos: capturar tráfego barato e sustentar profundidade de sessão através de links internos para categorias de maior valor. Não são prioridade e nunca devem competir por espaço com as âncoras.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-070 | Porcentagem — aumento, desconto, variação | 🔥 | B | — | Nula | v2 |
| CALC-071 | Regra de três simples e composta | 🔥 | B | — | Nula | v3 |
| CALC-072 | Dias úteis entre datas (com feriados nacionais) | 🔸 | B | P | Baixa | v3 |
| CALC-073 | Divisão de conta entre pessoas | 🔸 | B | — | Nula | v4 |
| CALC-074 | Conversor de unidades | 🔥 | B | — | Nula | v4 |
| CALC-075 | Média ponderada e média escolar | 🔸 | B | — | Nula | v4 |
| CALC-119 | Juros simples, com comparação ao composto | 🔥 | B | — | Nula | v5 |

---

## 13.1 PRV — Previdência e Benefícios do INSS

**Papel.** A pergunta previdenciária tem volume alto e permanente — não depende
de calendário fiscal nem de virada de exercício —, e é a que o buscador menos
consegue responder sozinho: as regras combinam idade, tempo, médias e limites.

**Risco.** É a categoria de maior risco de norma do catálogo. A EC nº 103/2019
criou regras de transição que mudam de valor a cada ano, e há jurisprudência
viva sobre vários pontos. Nada entra aqui sem cláusula de vigência lida e sem
caso-ouro que trave as fronteiras.

**Por que a categoria foi aberta.** §18.6 já previa a previdência como grupo
próprio, "com cuidado próprio". Alocá-la em TRB misturaria direito do trabalho
com benefício previdenciário; em TRI, tributo com benefício. A numeração desta
seção evita renumerar §14 a §18, que são referenciadas em todo o projeto.

| ID | Calculadora | Demanda | Valor | Fonte | Manut. | Fase |
|---|---|---|---|---|---|---|
| CALC-100 | Pensão por morte — cota familiar e cotas por dependente | 🔥 | M | P | Média | v5 |
| CALC-101 | Auxílio por incapacidade temporária | 🔥 | M | P | Média | v5 |
| CALC-102 | Salário-maternidade pago pelo INSS | 🔸 | M | P | Alta | v5 |
| CALC-103 | Aposentadoria pela regra de pontos (EC 103, art. 15) | 🔥 | M | P | **Crítica** | v5 |
| CALC-104 | Aposentadoria pela idade progressiva (EC 103, art. 16) | 🔥 | M | P | **Crítica** | v5 |
| CALC-105 | Aposentadoria pelo pedágio de 50% (EC 103, art. 17) | 🔥 | M | P | Média | v5 |
| CALC-106 | Aposentadoria pelo pedágio de 100% (EC 103, art. 20) | 🔥 | M | P | Média | v5 |
| CALC-107 | Aposentadoria por idade — transição e permanente (EC 103, arts. 18 e 19) | 🔥 | M | P | Média | v5 |
| CALC-108 | Comparador de regras de aposentadoria (EC 103, arts. 15 a 20) | 🔥 | A | P | **Crítica** | v5 |
| CALC-109 | Valor da aposentadoria (EC 103, art. 26) | 🔥 | A | P | Média | v5 |
| CALC-110 | Auxílio-acidente (Lei 8.213, art. 86) | 🔸 | M | P | Baixa | v5 |
| CALC-111 | Aposentadoria do professor (EC 103, arts. 15, 16, 19 e 20) | 🔥 | A | P | **Crítica** | v5 |

> **CALC-103 tem manutenção crítica por construção.** A pontuação exigida sobe
> um ponto por ano até 2033 (mulher) e 2028 (homem) — e toda a tabela já está
> cadastrada, ano a ano, como vigência. A manutenção não é anual: é conferir, a
> cada revisão, se nenhuma emenda mudou a regra.
>
> **CALC-104 e CALC-108 herdam a mesma condição.** A idade progressiva sobe seis
> meses por ano até 2031 (mulher) e 2027 (homem), também cadastrada ano a ano; o
> comparador depende de todas as regras ao mesmo tempo.

---

## 14. Categorias excluídas em definitivo

Estas **não** são backlog. Não entram em nenhuma fase.

### SAÚDE — excluída

IMC, calorias e macros, dosagem pediátrica, risco de diabetes, risco de osteoporose, período fértil, gestação, frequência cardíaca, testes de ansiedade e saúde mental, expectativa de vida.

**Motivo.** Potencial de dano físico ou psicológico direto, sem retorno correspondente. Dosagem pediátrica calculada por site genérico é risco de dano a criança. Ferramentas de triagem de saúde mental e de composição corporal podem reforçar comportamento autodestrutivo em usuário vulnerável, e não há como oferecer o acompanhamento que tornaria isso responsável. O aviso legal do rodapé não transfere essa responsabilidade.

### JURÍDICO-DOCUMENTAL — excluída

Geração de contratos, notificações, rescisões contratuais, petições, procurações, distratos, acordos.

**Motivo.** O Conselho Federal da OAB decidiu que ferramenta online que monta contrato personalizado por perguntas e respostas configura assessoria jurídica, atividade privativa da advocacia (Lei 8.906/94, art. 1º, II). Exposição administrativa, civil e potencialmente penal. Recibo simples de quitação é reavaliável, contrato não.

### HIPERLOCAL — excluída

ITBI, IPVA, taxas de cartório, tarifas de concessionária, alíquotas municipais de ISS, valor venal de imóvel ou veículo.

**Motivo.** Exigem base de dados por município ou unidade federativa, com atualização independente em milhares de fontes. Manutenção nacional inviável para um mantenedor. Onde o dado é indispensável, ele entra como campo preenchido pelo usuário.

### TRIBUTÁRIO EMPRESARIAL COMPLEXO — excluída do horizonte planejado

Simples Nacional por anexo, Fator R, ICMS-ST, ISS, IRPJ, CSLL, apuração de impostos, importação e exportação.

**Motivo.** A tributação sobre consumo no Brasil está em transição de regime. Construir sobre base que muda debaixo do produto significa manutenção contínua e risco alto de publicar cálculo incorreto — exatamente o dano que o projeto existe para evitar.
`> ⚠️ VERIFICAR: reavaliar apenas quando o regime estiver estabilizado e a base de cálculo consolidada.`

### RUÍDO — excluída

Probabilidade de loteria, teste vocacional, pegada de carbono, compatibilidade astrológica, rendimento de horta, estimativa de vida de bateria, calculadora de churrasco e festas.

**Motivo.** Diluem a tese de confiabilidade. Um site que calcula rescisão trabalhista e sorte na loteria na mesma navegação não é levado a sério em nenhuma das duas.

---

## 15. Distribuição por fase

| Fase | Calculadoras | Categorias ativas | Objetivo |
|---|---|---|---|
| **v1** | 10 | TRB, TRI, CRD | Provar a tese: memória de cálculo auditável em volume alto de busca |
| **v2** | 17 | + IMV, INV, AUT, VEI, UTI | Abrir as verticais de maior valor publicitário |
| **v3** | 29 | + IDX, CSM | Profundidade nos clusters e diferencial técnico |
| **v4** | 20 | — | Cauda longa e cobertura |
| **v5** | 46 | — | Expansão de cobertura — lotes 1 a 14 de §18 |
| | **122** | 11 | |

**Regra de conferência.** A quebra por fase é derivada da coluna `Fase` das tabelas §4 a §13, não escrita à mão. Ao mover uma calculadora de fase, recontar — divergência entre esta tabela e as tabelas de categoria invalida o dimensionamento de esforço do `11-roadmap`.

> **A regra acima foi violada por esta própria tabela, e a auditoria de
> 08/08/2026 a encontrou.** CALC-076 entrou em §4 em 07/08/2026 e §15 não foi
> recontada: a tabela seguiu somando **75** enquanto §3 já dizia **76**, com o
> v3 em 28 em vez de 29. Um documento de escopo que erra a própria soma perde a
> autoridade justamente onde ela mais vale — nas afirmações que não dá para
> conferir de imediato.

### Composição do v1

| ID | Calculadora | Categoria |
|---|---|---|
| CALC-001 | Salário líquido | TRB |
| CALC-002 | Rescisão — sem justa causa | TRB |
| CALC-003 | Rescisão — pedido de demissão | TRB |
| CALC-004 | Férias | TRB |
| CALC-005 | 13º salário | TRB |
| CALC-006 | Horas extras | TRB |
| CALC-007 | FGTS | TRB |
| CALC-015 | IRRF mensal | TRI |
| CALC-016 | INSS mensal | TRI |
| CALC-022 | Juros compostos com aportes | CRD |

**Por que estas dez.** Nove das dez compartilham o mesmo motor de INSS, IRRF e proporcionalidades — construir uma constrói quase todas. A décima (CALC-022) entra porque é a única do v1 na vertical de maior valor publicitário e não custa quase nada: fórmula pura, manutenção zero.

---

## 16. Regras de crescimento do catálogo

1. Nenhuma calculadora entra sem constar neste documento com ID atribuído.
2. IDs nunca são reciclados. Calculadora descontinuada mantém o ID reservado.
3. Nova calculadora exige: categoria, demanda, valor, fonte, custo de manutenção e fase.
4. Calculadora com manutenção `Alta` só entra se a demanda for `🔥` ou o valor for `A`. Nove itens já catalogados não satisfazem este critério — ver §17.
5. Calculadora que não pode ter memória de cálculo explicada passo a passo não entra.
6. Antes de abrir uma fase nova, as calculadoras da fase anterior precisam ter passado na auditoria de casos-ouro contra fonte oficial.
7. O catálogo pode encolher. Uma calculadora cuja manutenção passou a custar mais do que rende deve ser descontinuada, não abandonada em produção com dado velho — dado velho é o dano que este projeto existe para evitar.

---

## 17. Exceções abertas à regra 4

Nove calculadoras já catalogadas têm manutenção `Alta` sem demanda `🔥` nem valor `A`, o que a regra 4 de §16 não admite. Elas **não** são removidas aqui — são registradas como exceções pendentes, porque a decisão de cortar escopo é do mantenedor, não do documento.

| ID | Calculadora | Demanda | Valor | Fase |
|---|---|---|---|---|
| CALC-008 | Rescisão — acordo mútuo | 🔸 | M | v2 |
| CALC-017 | Restituição estimada do IRPF anual | 🔸 | M | v2 |
| CALC-011 | Custo real do funcionário | 🔸 | M | v3 |
| CALC-012 | Rescisão — empregado doméstico | ▫️ | M | v3 |
| CALC-019 | Comparador: simplificado vs. completo | 🔸 | M | v3 |
| CALC-050 | INSS do contribuinte individual e facultativo | 🔸 | M | v3 |
| CALC-014 | Rescisão — contrato intermitente | ▫️ | M | v4 |
| CALC-051 | Pró-labore e encargos do sócio | ▫️ | M | v4 |
| CALC-053 | Carnê-leão — recolhimento mensal do autônomo | ▫️ | M | v4 |

**Regra de resolução.** Antes de abrir a fase correspondente (regra 6 de §16), cada exceção recebe uma de três decisões, registrada em `17-changelog`:

1. **Manter com justificativa** — a calculadora sustenta um cluster cuja soma justifica o custo. Exige declarar qual cluster.
2. **Reclassificar** — a estimativa de demanda ou de valor estava errada. Exige o dado do painel de anúncios que corrigiu a estimativa, não uma nova suposição.
3. **Remover** — o ID permanece reservado (regra 2 de §16).

**Por que isto importa.** Sete das nove são trabalhistas ou previdenciárias, ou seja, `Alta` porque mudam todo exercício. Mantidas todas, o custo de auditoria anual cresce sem contrapartida de tráfego nem de receita — que é exatamente o mecanismo que HIP-04 testa e o limite que §9 de `04-architecture` descreve.

---

## 18. v5 — a expansão de cobertura

Decidida pelo mantenedor em **17/09/2026**, depois de a medição mostrar que o
site perdia espaço de busca aos poucos. O ponto de partida foi o de
`00-product-brief` §5.1: os agregadores generalistas têm **cobertura quatro
vezes maior**, e para toda busca fora do catálogo eles ganham por padrão.

### 18.1 As regras que a expansão manteve

Decisões do mantenedor na mesma data:

1. **As cinco categorias de §14 continuam excluídas.** Nenhuma foi reaberta.
2. **Prioridade para cálculo de várias entradas e alto valor** nas categorias
   ativas. Cálculo de resposta de uma linha fica por último — a medição de
   27/08/2026 mostrou o conversor de unidades com 1.259 impressões e nenhum
   clique, porque o buscador responde sozinho (`00-product-brief` §5.4).
3. **Lotes de 10 a 15**, publicados um a um, medidos no Search Console antes de
   acelerar o ritmo.
4. **Tudo o que §16 já exigia continua valendo**: ID atribuído, fonte oficial,
   casos-ouro antes de considerar pronto, guia ligado.

### 18.2 Lote 1 — trabalhistas, publicado em 17/09/2026

CALC-077 a CALC-085, nas tabelas de §4 e §5. Nove calculadoras, dois guias
novos e três guias ampliados.

**Duas que saíram do lote antes de começar, e por quê:**

| Candidata | Motivo |
|---|---|
| Licença-maternidade | A Lei nº 15.371/2026 cria a nova licença-paternidade e reescreve o art. 392 da CLT **a partir de 01/01/2027**. Publicar agora seria publicar com prazo para ficar errada em janeiro. Vai para o lote 2, junto com a paternidade e com as vigências por ano |
| Salário-família | A cota e o limite estão na portaria interministerial, cujo PDF é digitalizado e exige leitura por imagem (§5.2 de `ESTADO-DO-PROJETO`). Vai para o lote 2 |

### 18.3 Lote 2 — trabalhistas, publicado em 17/09/2026

CALC-086 a CALC-091, na tabela de §4. Seis calculadoras, um guia novo —
*Licença-maternidade e paternidade* — e três ampliados: rescisão sem justa causa
(contrato a prazo), horas extras (sobreaviso e prontidão) e insalubridade e
periculosidade (transferência).

**Menor que a regra 3 de §18.1 pede, e por quê.** As candidatas trabalhistas
restantes de §18.4 com fonte oficial conferível e conta fechada eram estas seis.
Completar o lote com as outras significaria publicar antes de a pesquisa
terminar: férias em dobro e rescisão por justa causa dependem de conferir o
estado atual de súmulas do TST depois de decisões do STF, e a jornada 12×36
depende de convenção coletiva para boa parte da conta.

**As duas pendências do lote 1 estão resolvidas assim:**

| Candidata | Como entrou |
|---|---|
| Licença-maternidade e paternidade | Com vigências por data do nascimento: cinco dias pelo ADCT até 31/12/2026, dez em 2027 e quinze em 2028 (Lei nº 15.371/2026, art. 11). Os vinte dias de 2029 dependem de meta fiscal e **não** estão cadastrados — nascimento a partir de 2029 bloqueia o cálculo (`RN-003`) |
| Salário-família | Cota e limite lidos no art. 4º das duas portarias, pela mesma leitura por imagem que conferiu o Anexo II |

**O que ficou declarado como fora da conta:** a prorrogação por internação e o
acréscimo por deficiência nas licenças; a proporção do salário-família no mês
de admissão e de demissão, cujo divisor a portaria não fixa; e a indenização do
art. 480, cujo teto foi revogado em 1978.

### 18.4 Lote 3 — justa causa, bolsa, previdência e FGTS, publicado em 17/09/2026

CALC-092 a CALC-095, nas tabelas de §4 e §5. Quatro calculadoras, dois guias
novos — *Imposto na bolsa* e *Previdência privada* — e dois ampliados: rescisão
sem justa causa e FGTS.

**O lote saiu do trabalhista e abriu o tributário de investimento.** A razão é a
regra 2 de §18.1: cálculo de várias entradas e alto valor primeiro. O imposto em
bolsa tem três decisões encadeadas — isenção pelo valor vendido, day trade
apartado, prejuízo compensado —, e é o tipo de conta que o buscador não responde
sozinho.

**Uma mudança de modelo de dados entrou junto, e está registrada.** O Anexo da
Lei nº 8.036/1990 traz uma parcela ADICIONAL por faixa, somada ao resultado da
alíquota — o inverso da parcela a deduzir das tabelas de imposto. `Faixa` ganhou
`parcelaAdicionalCentavos`, com verificação que impede uma faixa de ter as duas.

**O que ficou declarado como fora da conta:** a apuração por lote de aportes na
previdência (cada aporte tem o seu prazo); a janela operacional do
saque-aniversário, que é do agente operador e não da lei; e os fundos
imobiliários, adiados por pesquisa — as condições de isenção mudaram em 2023 e
exigem conferência de número de cotistas e de participação por cotista.

### 18.5 Lote 4 — fundos, trânsito e consórcio, publicado em 17/09/2026

CALC-096 a CALC-099, nas tabelas de §5, §6 e §10. Quatro calculadoras e quatro
guias ampliados: imposto na bolsa (fundos imobiliários), IR na renda fixa
(come-cotas), custo de ter um carro (multas) e CET (consórcio).

**O lote fechou a pendência declarada do lote 3.** Os fundos imobiliários
voltaram com as condições de isenção separadas por redação: vale a da Lei nº
14.754/2023, com efeitos desde 2024, e a MP nº 1.184/2024 — que exigia mais
cotistas — está marcada no Planalto como de vigência encerrada. A cobertura das
condições começa em 2024, e o cadastro diz por quê.

**Três categorias diferentes, de propósito.** Depois de três lotes concentrados
em trabalhista e tributário, o lote 4 abriu VEI (multa de trânsito) e CRD
(consórcio × financiamento) — as duas com volume de busca alto e nenhuma
dependência de dado hiperlocal, que é o que §14 exclui.

**O que ficou declarado como fora da conta:** os fundos de prazo médio curto, com
alíquota periódica e tabela próprias; o lance do consórcio e o reajuste da
parcela pelo preço do bem; e a janela operacional de pagamento das multas, que é
do órgão autuador.

### 18.6 Lote 5 — previdência, publicado em 17/09/2026

CALC-100 a CALC-103, na tabela de §13.1. Quatro calculadoras, dois guias novos —
*Benefícios do INSS* e *Aposentadoria pela regra de pontos* — e a **abertura da
categoria PRV**, a primeira desde o lançamento.

**A tabela de pontos entrou como DADO, ano a ano.** O § 1º do art. 15 da EC nº
103/2019 acrescenta um ponto por ano, e escrever `86 + (ano − 2019)` no motor
seria pôr três constantes legais no código — o ponto de partida, o ano inicial e
o teto. Cada ano virou uma vigência: 25 no total, e o registro resolve pela data
como resolve qualquer outro parâmetro.

**O que a categoria PRV não cobre, e está declarado:** as demais regras de
transição (idade progressiva e os dois pedágios), a aposentadoria por idade e o
VALOR da aposentadoria — que depende da média das contribuições desde julho de
1994, dado que só o extrato do CNIS tem. As páginas dizem isso, e os guias
repetem.

### 18.7 Lote 6 — as demais regras de aposentadoria, publicado em 18/09/2026

CALC-104 a CALC-108, na tabela de §13.1. Cinco calculadoras e um guia novo —
*Regras de aposentadoria depois da reforma* —, fechando o que o lote 5 havia
declarado como fora: idade progressiva (art. 16), os dois pedágios (arts. 17 e
20), a aposentadoria por idade na transição e na regra permanente (arts. 18 e
19) e o comparador que põe as seis regras lado a lado.

**Cada artigo tem os seus próprios parâmetros**, mesmo quando o número coincide:
os trinta anos da mulher aparecem em quatro artigos, e a memória de cálculo
precisa citar o artigo da regra aplicada, não o de outra que diz o mesmo número.

**O pedágio de 50% trabalha em meios meses.** Metade de um número ímpar de meses
termina em meio mês, e a conta o mantém — sem arredondar a lei. Só a data de
cumprimento, que é um mês do calendário, conta o meio mês como inteiro.

**O lote corrigiu CALC-103 em dois pontos**, registrados em `ESTADO-DO-PROJETO`
§7.85: a página abria no ano de 2033 (a vigência mais recente da tabela), e a
projeção anual errava por um ano quando o cumprimento caía no meio do ano. A
projeção das seis regras é mês a mês.

**Continua fora, e declarado:** professor, atividade especial, pessoa com
deficiência e o VALOR da aposentadoria.

### 18.8 Lote 7 — o valor da aposentadoria, o professor e as férias em dobro, publicado em 18/09/2026

CALC-109 a CALC-111, na tabela de §13.1, e CALC-112, na tabela de TRB. Nenhum
guia novo: as quatro respondem perguntas que três guias existentes já faziam —
*Regras de aposentadoria*, *Benefícios do INSS* e *Férias* —, e ganharam seção
neles.

**O valor fecha o que o comparador declarava não fazer.** CALC-108 diz quando;
CALC-109 diz quanto, pelo art. 26 da Emenda: 60% da média mais dois pontos por
ano acima de vinte anos (homem) ou quinze (mulher), com a média limitada ao
teto e o benefício entre o piso e o teto do art. 33 da Lei nº 8.213. O pedágio
de 50% continua fora — o valor dele leva o fator previdenciário, que depende da
tábua de mortalidade do ano.

**As regras do professor reusam os motores do lote 6** com os parâmetros dos
parágrafos próprios (arts. 15, § 3º; 16, § 2º; 19, § 1º, II; 20, § 1º). Cada
parágrafo tem o seu cadastro, pela mesma razão do lote 6: a memória precisa
citar o parágrafo do professor.

**A dobra das férias é por dia** (Súmula 81 do TST), sobre a remuneração com o
terço. Escrever a FAQ de CALC-112 revelou que as rescisões pagavam as férias
vencidas sempre simples — corrigido no mesmo dia (`ESTADO-DO-PROJETO` §7.87).

**Duas candidatas saíram do lote, com motivo:**

- **PGBL** — a tabela anual do IR está cadastrada só para 2024 e 2025, porque a
  Lei nº 15.270/2025 mudou a estrutura a partir de 2026. Uma calculadora de
  dedução que não calcula o ano corrente não serve;
- **auxílio-reclusão** — o limite de baixa renda sai da portaria anual,
  digitalizada, e o valor segue a pensão com teto de um salário mínimo. Risco
  alto para pouco retorno.

### 18.9 Lote 8 — venda de bens, aluguel e jornada, publicado em 18/09/2026

CALC-113 e CALC-114, na tabela de §5, e CALC-115, na de §4. Sem guia novo: cada
uma ganhou seção num guia que já respondia a mesma pergunta — *Cripto no
imposto* (o teto e o degrau são a mesma regra), *Imóvel para alugar* e *Horas
extras*.

**Duas das três são montagem de peças conferidas.** A venda de bens usa a tabela
de CALC-020 e a isenção de pequeno valor de CALC-021 (Lei nº 9.250/1995, art.
22), relida no Planalto: o teste é o PREÇO no mês, somados os bens da mesma
natureza. O aluguel tira da base o que o RIR/2018 manda tirar (arts. 42 e 689) e
entrega o resto ao motor do carnê-leão.

**A jornada trouxe parâmetros novos** — oito horas diárias e quarenta e quatro
semanais (Constituição, art. 7º, XIII), os intervalos do art. 71 e as onze horas
do art. 66 da CLT —, em minutos, num conjunto próprio. A cobertura começa em
11/11/2017, com a redação atual do § 4º do art. 71.

**Duas correções saíram da preparação do lote**, antes dele: a dobra das férias
vencidas nas rescisões (§7.87) e o carnê-leão sem o redutor de 2026 (§7.88).

### 18.10 Lote 9 — o DAS do Simples e o DAE do doméstico, publicado em 18/09/2026

CALC-116, na tabela de §9, e CALC-117, na de §4. Sem guia novo: seções em *MEI:
DAS e limite* (o caminho de quem sai do MEI) e *Empregado doméstico*.

**O DAS aplica a fórmula da lei sem arredondar no meio.** O art. 18, § 1º-A,
define a alíquota efetiva como (RBT12 × Aliq − PD) ÷ RBT12, e o DAS é essa
fração sobre a receita do mês, em inteiro grande; só o valor final vira
centavo. O comparador CLT × PJ (CALC-048) arredonda a efetiva para duas casas
antes de aplicá-la — aceitável numa comparação, e registrado aqui para quem for
unificar os dois.

**Os anexos I, II e IV entraram fechados em 31/12/2026**, como III e V: a LC nº
214/2025 os substitui a partir de 2027. **CALC-116 tem manutenção crítica por
isso** — em janeiro de 2027 ela bloqueia até os anexos novos serem cadastrados.

**O fator previdenciário ficou fora**, com motivo: a tábua do IBGE é legível,
mas as regras de idade fracionária e de arredondamento do fator não foram
confirmadas em fonte.

### 18.11 Lote 10 — o abono salarial e o seguro-desemprego do doméstico, publicado em 18/09/2026

CALC-118, na tabela de §4, com guia novo — *Abono salarial do PIS* —, e o
seguro-desemprego do doméstico como opção de CALC-009, e não página nova: a
regra é curta (um salário mínimo, até três parcelas) e a pergunta já tem
endereço.

**O limite do abono é número do Ministério, não da lei.** A EC nº 135/2024
manda corrigir dois salários mínimos de 2023 pelo INPC; o número de 2026 — R$
2.766,00 — está na página oficial do serviço, e a vigência fecha no ano. O de
2027 depende do INPC de 2025 e da publicação. **Manutenção crítica:** CALC-118
bloqueia em 1º/01/2027 até o novo limite ser cadastrado.

**A tabela oficial serviu de caso-ouro — e mostrou um erro.** Onze dos doze
valores publicados pelo Ministério batem com a lei; o de cinco meses (R$ 675,00)
não segue o arredondamento para cima do § 4º, que dá R$ 676,00. A calculadora
segue a lei (`ESTADO-DO-PROJETO` §7.91).

**O fator previdenciário continua fora**: nem o Decreto nº 3.048/1999 nem a IN
nº 128/2022 fixam o arredondamento e o tratamento das frações de idade e tempo.

### 18.12 Lote 11 — juros simples e escala 12 × 36, publicado em 18/09/2026

CALC-119, em §13, ligada ao guia *Juros compostos* — que já explicava a
diferença entre os dois regimes e agora mostra o trecho em que o simples ganha
—, e CALC-120, em §4, ligada ao guia *Horas extras*, com seção nova sobre a
escala.

**Juros simples não tem parâmetro legal**, como CALC-022. O que a página
acrescenta ao C × i × n é a conversão de unidades declarada — calendário
comercial, mês de 30 e ano de 360 dias — e a comparação com o composto, feita
pelo motor de CALC-022 para que a conta tenha uma só verdade.

**A escala 12 × 36 lê a regra do art. 59-A em `params/`**: doze horas de
trabalho e trinta e seis de descanso, desde 11/11/2017, e o parágrafo único
sobre feriado e descanso semanal, citado na tela. A página não calcula dinheiro:
conta plantões, horas, domingos e feriados nacionais, que é o que se pergunta.

**Provisão de férias e 13º sai da lista**: CALC-011 (custo do funcionário) já
mostra as duas provisões e os encargos sobre elas. **Horas entre horários
também sai**: é CALC-115.

### 18.13 Lote 12 — curto prazo no come-cotas e percentuais em série, publicado em 19/09/2026

Sem calculadora nova, e de propósito: as duas perguntas cabiam em páginas que já
existiam. **CALC-098** ganha os fundos de curto prazo — carteira com prazo médio
de até 365 dias —, com come-cotas de 20% (Lei nº 14.754/2023, art. 17, § 1º,
II) e resgate a 22,5% ou 20% (Lei nº 11.053/2004, art. 6º, § 2º). **CALC-070**
ganha descontos e acréscimos em série, com o percentual único equivalente.

**O prazo do curto prazo é em meses, e a página pergunta em meses.** O art. 6º
diz "até 6 (seis) meses"; converter em dias exigiria uma convenção que a lei não
dá, e a calculadora não a inventa.

**IR sobre aluguel pago por pessoa jurídica sai da lista: já era CALC-114.** A
pesquisa em fonte oficial (RIR/2018, arts. 688, 689 e 707; IN RFB nº
1.500/2014, arts. 22, 31 e 52, na redação da IN RFB nº 2.299/2025) confirmou a
conta publicada e achou um ponto que a página não declarava: o redutor de 2026 é
enquadrado pelo aluguel tributável, sem exemplo oficial que o confirme para
aluguel. A página passou a dizer isso (`ESTADO-DO-PROJETO` §7.93).

### 18.14 Lote 13 — o ajuste anual de 2026 e o PGBL, publicado em 19/09/2026

**CALC-121**, na tabela de §5, e **o ano-calendário de 2026 em CALC-017 e
CALC-019**, que estavam bloqueados desde o lote de agosto por decisão: a Lei nº
15.270/2025 revogou o art. 11 da Lei nº 9.250/1995 e criou a redução anual do
art. 11-A, e 2026 só entrou quando as três peças puderam entrar juntas — a
tabela anual publicada pela Receita, o limite de R$ 17.640,00 do simplificado
(art. 10, X) e a redução.

**A faixa da redução é definida pelos rendimentos tributáveis, e não pela
base.** O texto diz isso três vezes. Consequência que a página do PGBL mostra:
deduções — o PGBL inclusive — diminuem o imposto da tabela, mas não aumentam a
redução; até R$ 60 mil o imposto anual já é zero, e o PGBL não economiza nada.

**A tabela e a redução fecham entre si.** Com R$ 60.000,00 de rendimentos, o
simplificado dá R$ 2.694,15 de imposto — o teto exato da redução. As duas vêm de
fontes diferentes (Receita e Planalto), e o encaixe ao centavo é a melhor
conferência disponível enquanto não houver exemplo oficial de ajuste anual.

**O PGBL entrou também em CALC-017 e CALC-019**, que declaravam a ausência dele
desde o lançamento.

### 18.15 Lote 14 — antecipação do saque-aniversário e Tesouro Prefixado, publicado em 21/09/2026

**CALC-122**, na tabela de §8, e os **limites da antecipação em CALC-095**, por
escolha na própria página.

**A antecipação entrou por causa de uma data.** A Resolução CCFGTS nº
1.130/2025 reduz de cinco para três os saques que podem ser cedidos, e a
transição acaba em **31/10/2026**. Os limites viraram parâmetro com duas
vigências: a página responde cinco hoje e três a partir de 1º/11, sem ninguém
precisar lembrar. Entraram também o mínimo e o máximo por saque (R$ 100,00 e
R$ 500,00), a carência de noventa dias e o teto de juros.

**O que a antecipação NÃO mostra é o valor liberado.** Nenhuma norma define o
desconto que o banco aplica até cada aniversário; publicar um "você recebe"
exigiria inventar uma convenção e apresentá-la como regra. A página entrega o
limite do que pode ser cedido e diz que o resto vem da proposta do banco.

**No Tesouro Prefixado, a entrada é o PREÇO, não a taxa.** Converter taxa em
preço exige o calendário de dias úteis do mercado, que tem feriados bancários
fora da lista de feriados nacionais. Partindo do preço unitário — que está no
extrato —, a conta é exata: cada título paga R$ 1.000,00 no vencimento
(Decreto nº 12.814/2026, art. 2º). Abaixo de trinta dias ainda há IOF, e a
calculadora recusa em vez de calcular sem ele.

### 18.16 Candidatas dos próximos lotes

**Sem ID ainda, de propósito.** ID é atribuído quando o lote abre e a
candidata é classificada por §16; atribuir agora reservaria números para
calculadoras que a pesquisa pode descartar. A lista é mapa de temas, e nenhum
valor dela veio de site de terceiro.

| Categoria | Candidatas |
|---|---|
| PRV | auxílio-reclusão (depende da portaria anual) · fator previdenciário e o valor pelo pedágio de 50% (falta confirmar arredondamento e idade fracionária) |
| CRD | juros de mora e multa por atraso (a taxa legal mudou com a Lei nº 14.905/2024 e depende de série) |
| INV | Tesouro Selic (depende da série da Selic) · rendimento pelo CDI (depende da série do CDI) |
| VEI | IPVA por estado — **bloqueada por §14**, é dado estadual · custo de manutenção por faixa de quilometragem |

> **A conta que a expansão precisa ter à vista.** Somadas, as candidatas
> legítimas dentro das dez categorias ativas ficam na casa de **quarenta a
> sessenta** — e não das duzentas e poucas que faltariam para trezentas. A
> distância é explicada por §14: boa parte dos catálogos com trezentas
> calculadoras é saúde, jurídico-documental, dado municipal e ruído, que este
> projeto excluiu com motivo registrado. Chegar a trezentas exigiria reabrir
> §14, e essa é decisão do mantenedor, não desta seção.

> **Previdência entra como grupo próprio, com cuidado próprio.** A
> aposentadoria é a pergunta de maior volume da lista e também a de maior risco:
> as regras de transição da EC nº 103/2019 combinam idade, tempo, pontos e
> pedágio, e mudam a cada ano. Ela só entra com pesquisa dedicada e casos-ouro
> tirados dos exemplos oficiais do INSS — nunca como item de fim de lote.
