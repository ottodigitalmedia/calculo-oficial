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

O catálogo tem **10 categorias ativas** e **5 categorias excluídas em definitivo**.

| Cód. | Categoria | Papel estratégico | Calculadoras |
|---|---|---|---|
| TRB | Trabalhista e CLT | Âncora de volume e de autoridade | 14 |
| TRI | Tributos Pessoa Física | Volume sazonal intenso | 7 |
| CRD | Crédito e Dívidas | Âncora de receita | 9 |
| IMV | Imóveis e Financiamento | Âncora de receita | 8 |
| INV | Investimentos e Renda Fixa | Âncora de receita | 8 |
| AUT | Autônomo, MEI e PJ | Ponte entre trabalhista e tributário | 7 |
| VEI | Veículos | Receita média, manutenção baixa | 6 |
| IDX | Correção Monetária e Índices | Diferencial técnico defensável | 5 |
| CSM | Consumo Doméstico e Energia | Volume estável, receita média | 5 |
| UTI | Utilitários e Matemática | Volume alto, receita baixa — sustentação de sessão | 6 |
| | **Total** | | **76** |

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
| **v3** | 28 | + IDX, CSM | Profundidade nos clusters e diferencial técnico |
| **v4** | 20 | — | Cauda longa e cobertura |
| | **75** | 10 | |

**Regra de conferência.** A quebra por fase é derivada da coluna `Fase` das tabelas §4 a §13, não escrita à mão. Ao mover uma calculadora de fase, recontar — divergência entre esta tabela e as tabelas de categoria invalida o dimensionamento de esforço do `11-roadmap`.

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
