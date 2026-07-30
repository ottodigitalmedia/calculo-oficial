---
doc: 01-prd
projeto: Cálculo Aberto
versao: 1.0
status: draft
depende_de: [00-product-brief, 00-catalogo-calculadoras]
---

# PRD — Product Requirements Document

## 1. Objetivo

Especificar o v1: dez calculadoras públicas cujo resultado é verificável passo a passo, sustentadas por um motor de parâmetros legais versionado por vigência, sem autenticação, sem banco de dados e sem coleta de dado pessoal.

---

## 2. Requisitos funcionais

Prioridade em MoSCoW: `M` must · `S` should · `C` could · `W` won't (v1).

### RF-001 — Motor de parâmetros legais versionado `M`

Repositório central de todas as constantes legais (faixas de INSS, tabela de IRRF, dedução por dependente, salário mínimo, teto previdenciário, alíquota de FGTS, percentual de multa rescisória, divisores de jornada), cada uma com período de vigência e fonte.

**Critério de aceite:** dado um conjunto de parâmetros e uma data de referência, o motor retorna exatamente o conjunto vigente naquela data, ou erro explícito se não houver cobertura. Nenhuma constante legal existe fora deste motor.

### RF-002 — Motor de cálculo `M`

Biblioteca pura, sem dependência de framework, interface ou rede, que implementa os cálculos de INSS, IRRF, bases de incidência, proporcionalidades por avos e verbas rescisórias.

**Critério de aceite:** cada função recebe entradas e uma data de referência, e retorna resultado + traço de cálculo estruturado. Executa em Node e em navegador sem alteração. Cobertura de casos-ouro conforme `12-test-plan`.

### RF-003 — Memória de cálculo expansível `M`

Todo resultado exibe, sob demanda, o traço completo: cada etapa, a fórmula aplicada, os valores de entrada, os parâmetros usados com sua vigência, e link para a norma de origem.

**Critério de aceite:** para qualquer cálculo do v1, um usuário consegue reproduzir o resultado à mão apenas com o que está na tela. Nenhuma etapa é omitida por ser "óbvia".

### RF-004 — Seletor de data de referência `M`

O usuário pode calcular usando a tabela vigente em qualquer período coberto pelo motor.

**Critério de aceite:** alterar a data de referência recalcula o resultado e atualiza os parâmetros exibidos na memória de cálculo. Datas sem cobertura são bloqueadas com mensagem explícita, nunca calculadas por extrapolação.

### RF-005 — Página de calculadora `M`

Formulário de entrada, validação em tempo real, resultado, memória de cálculo, FAQ contextual, aviso de estimativa, links para calculadoras relacionadas.

**Critério de aceite:** conforme especificado por calculadora em `03-functional-spec`. Todos os estados (vazio, digitando, inválido, calculado) especificados e implementados.

### RF-006 — Permalink de cálculo `S`

O estado do formulário é refletido na query string, permitindo compartilhar ou salvar um cálculo por URL, sem servidor e sem conta.

**Critério de aceite:** abrir a URL compartilhada reproduz exatamente o mesmo resultado. A URL não é indexável (`noindex` quando há parâmetros).

**Justificativa:** entrega a função "salvar cálculo" sem banco de dados nem autenticação — é o que torna a decisão de arquitetura `ADR-002` sustentável.

### RF-007 — Índice e navegação `M`

Página inicial, página por categoria, busca local no catálogo.

**Critério de aceite:** qualquer calculadora acessível em no máximo dois cliques a partir da home. Busca funciona sem rede após o primeiro carregamento.

### RF-008 — Conteúdo educativo `M`

FAQ contextual em cada página de calculadora e guias longos em MDX, com ligação bidirecional entre guia e calculadora.

**Critério de aceite:** cada calculadora do v1 tem no mínimo 4 perguntas de FAQ e ao menos um guia associado.

### RF-009 — Monetização por anúncio `M`

Um único slot, posicionado abaixo do resultado, com altura reservada, precedido de gestão de consentimento.

**Critério de aceite:** o anúncio nunca aparece acima do resultado nem entre etapas da memória de cálculo. Sem consentimento, nenhum script de terceiro é carregado.

### RF-010 — Páginas legais e aviso de estimativa `M`

Privacidade, termos, cookies, aviso de não-aconselhamento. Aviso contextual em cada calculadora.

**Critério de aceite:** o aviso é visível na mesma dobra do resultado, não apenas no rodapé.

### RF-011 — SEO técnico `M`

Metadata por rota, sitemap, dados estruturados na memória de cálculo, canônicas.

**Critério de aceite:** todas as rotas do catálogo v1 no sitemap; nenhuma página de resultado com parâmetros indexada.

### RF-012 — Integração com série econômica externa `S`

Consumo do Sistema Gerenciador de Séries Temporais do Banco Central para a calculadora de juros compostos (CALC-022), obtido em build com revalidação periódica.

**Critério de aceite:** falha da fonte externa não impede renderização nem cálculo. Exibe o último valor conhecido com a data de obtenção.

### RF-013 — Painel de manutenção de parâmetros `W`

**Fora do v1.** Atualização de parâmetro é feita por commit revisável. Interface administrativa exigiria autenticação e banco, contradizendo `ADR-002`.

---

## 3. Regras de negócio

Formuladas como condição → ação, para virarem teste sem reinterpretação.

### 3.1 Parâmetros e vigência

**RN-001** — Se uma constante legal é usada em qualquer cálculo, então ela deve possuir `vigencia_inicio`, `fonte_norma` e `fonte_url`. Constante sem esses três campos falha a validação de build.

**RN-002** — Se a data de referência do cálculo está dentro de `[vigencia_inicio, vigencia_fim]` de um parâmetro, então esse parâmetro é aplicado. Se dois parâmetros do mesmo tipo cobrem a mesma data, o build falha por sobreposição.

**RN-003** — Se a data de referência não é coberta por nenhuma vigência do parâmetro necessário, então o cálculo não é executado e o sistema informa o intervalo disponível. **Nunca extrapolar a vigência mais recente.**

**RN-004** — Se um parâmetro tem `vigencia_fim` nula, então ele é considerado vigente indefinidamente a partir de `vigencia_inicio`, até que uma vigência posterior seja adicionada.

### 3.2 Aritmética

**RN-005** — Todo valor monetário é representado internamente como inteiro em centavos. Operação em ponto flutuante sobre valor monetário é proibida.

**RN-006** — Se uma operação intermediária produz fração de centavo, então o arredondamento ocorre apenas na apresentação de cada etapa; a propagação para a etapa seguinte usa o valor não arredondado, salvo quando a norma determinar arredondamento intermediário.
`> ⚠️ VERIFICAR: identificar, por cálculo, em quais etapas a norma exige arredondamento intermediário. Divergência aqui produz diferença de centavos contra o holerite e destrói a confiança no produto.`

**RN-007** — Se o resultado final é exibido, então o arredondamento é para duas casas decimais, meio para cima.

### 3.3 Contribuição previdenciária

**RN-008** — Se a base de contribuição do segurado é calculada, então a alíquota é aplicada progressivamente por faixa: cada faixa incide apenas sobre a parcela do salário contida nela, e as parcelas são somadas.

**RN-009** — Se a base de contribuição excede o teto previdenciário vigente, então a contribuição é limitada ao valor correspondente ao teto.

**RN-010** — Se o cálculo é de 13º salário, então a contribuição previdenciária incide sobre ele de forma separada da remuneração mensal, com aplicação própria da tabela.

`> ⚠️ VERIFICAR: faixas, alíquotas e teto vigentes por exercício. Fonte primária: portaria interministerial vigente. Nunca copiar de software de terceiro ou de site concorrente.`

### 3.4 Imposto sobre a renda retido na fonte

**RN-011** — Se a base de cálculo do imposto é apurada, então ela equivale à remuneração tributável menos a contribuição previdenciária do segurado, menos a dedução por dependente multiplicada pelo número de dependentes, menos pensão alimentícia judicial quando informada.

**RN-012** — Se existe modalidade de desconto simplificado vigente e ela resulta em base menor que a apuração por deduções legais, então o sistema aplica a mais favorável ao contribuinte e registra na memória de cálculo qual foi aplicada e por quê.

**RN-013** — Se a legislação vigente na data de referência prevê mecanismo de redução do imposto apurado para determinadas faixas de rendimento, então esse redutor é aplicado após a apuração pela tabela progressiva, e a memória de cálculo exibe as duas etapas separadamente.

**RN-014** — Se o imposto apurado após todas as reduções é negativo, então o valor devido é zero. Nunca resultado negativo.

`> ⚠️ VERIFICAR: tabela progressiva, dedução por dependente, limite do desconto simplificado, existência e fórmula do redutor por faixa, e sua aplicação ao 13º salário. Este é o conjunto de parâmetros de maior risco do projeto.`

### 3.5 Proporcionalidade e avos

**RN-015** — Se um período de trabalho no mês é igual ou superior a 15 dias, então esse mês conta como um avo integral para fins de 13º salário e de férias proporcionais. Caso contrário, não conta.

**RN-016** — Se o número de avos apurado é `n`, então o valor proporcional equivale à base multiplicada por `n` e dividida por 12.

`> ⚠️ VERIFICAR: a regra do fracionamento por 15 dias tem tratamento próprio na norma de férias e na de 13º. Confirmar se são idênticas antes de compartilhar implementação.`

### 3.6 Verbas rescisórias

**RN-017** — Se a modalidade de rescisão é demissão sem justa causa, então são devidos: saldo de salário, aviso prévio (trabalhado ou indenizado), 13º proporcional, férias vencidas com terço quando houver, férias proporcionais com terço, e multa sobre o saldo de FGTS.

**RN-018** — Se a modalidade é pedido de demissão, então não há multa de FGTS nem aviso prévio devido pelo empregador, e o aviso prévio pode ser descontado do trabalhador quando não cumprido.

**RN-019** — Se o aviso prévio é indenizado, então o período correspondente é somado ao tempo de serviço para efeito de projeção das verbas proporcionais.

**RN-020** — Se o aviso prévio proporcional é calculado, então acrescem-se dias ao período base por ano completo de serviço, observado o limite máximo previsto em norma.

`> ⚠️ VERIFICAR: dias-base, dias acrescidos por ano e limite máximo do aviso prévio proporcional. Confirmar também as incidências de cada verba (o que é tributável, o que é base de FGTS).`

### 3.7 FGTS

**RN-021** — Se o depósito de FGTS é calculado, então incide o percentual vigente sobre a remuneração do período, incluindo 13º salário.

**RN-022** — Se a rescisão é sem justa causa, então incide multa sobre a totalidade dos depósitos do contrato, corrigidos.

**RN-023** — Se o usuário não informa o saldo real da conta vinculada, então o sistema apresenta uma **estimativa de depósitos** e declara explicitamente que o saldo real inclui correção e pode divergir. Nunca apresentar estimativa como saldo.

### 3.8 Jornada

**RN-024** — Se a hora extra é calculada, então o valor da hora normal é obtido pela divisão do salário pelo divisor mensal correspondente à jornada informada, e sobre ela incide o adicional aplicável.

**RN-025** — Se há habitualidade de horas extras, então incide o reflexo em descanso semanal remunerado, calculado pela razão entre dias úteis e dias de repouso do mês de referência.

**RN-026** — Se o trabalho ocorre em horário noturno, então aplica-se o adicional noturno e a redução da hora noturna, ambos conforme a norma vigente na data de referência.

`> ⚠️ VERIFICAR: divisores por jornada, percentuais de adicional, faixa horária do período noturno e fator de redução da hora noturna.`

### 3.9 Descontos

**RN-027** — Se o vale-transporte é descontado, então o desconto é limitado ao menor valor entre o percentual legal sobre o salário e o custo efetivo informado pelo usuário.

### 3.10 Comunicação e responsabilidade

**RN-028** — Se um resultado é exibido, então ele é rotulado como estimativa. É proibido o uso de linguagem que afirme direito ou obrigação ("você tem direito a", "a empresa deve pagar"). Formulação obrigatória: "estimativa com base nos dados informados".

**RN-029** — Se um parâmetro legal é exibido na memória de cálculo, então ele vem acompanhado da vigência e do link para a norma.

### 3.11 Dados e privacidade

**RN-030** — Se o usuário preenche qualquer campo, então esse dado permanece exclusivamente no navegador. É proibido transmitir, registrar ou telemetrar valores digitados pelo usuário, inclusive em log de erro.

**RN-031** — Se um evento de uso é registrado para análise, então ele contém apenas identificação da calculadora e do tipo de interação. Nunca valores de entrada nem de resultado.

**RN-031.1 — Exceção única e exaustiva.** O evento `busca_sem_resultado` transmite o termo digitado no campo de busca do catálogo, e é a **única** exceção a `RN-031`. Ela se sustenta em três condições, todas obrigatórias:

1. O campo de busca do catálogo não recebe dado pessoal — recebe o nome de uma calculadora procurada. Nenhum campo de formulário de calculadora está coberto por esta exceção.
2. O termo é a informação de produto mais valiosa para decidir o que construir a seguir (`14-observability` §4.2).
3. A exceção é declarada explicitamente na política de privacidade.

Qualquer outro evento que transmita entrada do usuário viola `RN-031` e é defeito, não exceção. Ampliar esta lista exige alterar este requisito — nunca configurar a ferramenta de análise. Verificado por TC-042.

### 3.12 Dependência externa

**RN-032** — Se a fonte externa de série econômica está indisponível ou responde fora do prazo, então o sistema usa o último valor obtido, exibe a data desse valor e prossegue. Falha externa nunca bloqueia cálculo nem renderização.

**RN-033** — Se o último valor conhecido tem mais de 30 dias, então a interface sinaliza que o indicador pode estar desatualizado.

---

## 4. Requisitos não funcionais

| ID | Requisito | Meta | Como medir |
|---|---|---|---|
| RNF-001 | Largest Contentful Paint, p75 mobile | ≤ 2,0s | Web Vitals em produção |
| RNF-002 | Cumulative Layout Shift, p75 | ≤ 0,05 | Idem. Slot de anúncio com altura reservada |
| RNF-003 | Interaction to Next Paint, p75 | ≤ 200ms | Idem |
| RNF-004 | Peso de JavaScript por rota de calculadora | ≤ 120 KB comprimido | Orçamento verificado no CI |
| RNF-005 | Tempo de cálculo após entrada válida | ≤ 50ms | Cálculo local, sem rede |
| RNF-006 | Disponibilidade | ≥ 99,5% mensal | Monitoramento externo |
| RNF-007 | Funcionamento sem scripts de terceiro | Cálculo e memória operam integralmente | Teste com bloqueador ativo |
| RNF-008 | Acessibilidade | WCAG 2.1 AA nas rotas de calculadora | Auditoria automatizada + navegação por teclado |
| RNF-009 | Suporte a navegadores | Duas últimas versões estáveis dos principais navegadores | Matriz no CI |
| RNF-010 | Dado pessoal armazenado | Zero | Revisão de código e ausência de banco |
| RNF-011 | Cobertura de teste do motor de cálculo | 100% dos casos-ouro; ramos ≥ 90% | Relatório do CI, bloqueador |
| RNF-012 | Tempo de atualização de um parâmetro legal | ≤ 1 hora do commit ao ar | Medido na primeira virada de exercício |
| RNF-013 | Custo marginal mensal de infraestrutura | ≤ R$ 10 | Fatura |

---

## 5. Casos de uso

**UC-01 — Conferir o holerite.** Usuário informa salário bruto, dependentes e descontos; obtém o líquido estimado; expande a memória para comparar cada desconto com o próprio holerite; identifica a divergência.

**UC-02 — Estimar a rescisão.** Usuário informa datas, salário e modalidade; obtém a composição das verbas; expande a memória para entender por que a multa incide sobre um valor e não outro.

**UC-03 — Recalcular período anterior.** Usuário precisa de um cálculo de exercício passado; altera a data de referência; obtém o resultado com a tabela daquela vigência, explicitada na memória.

**UC-04 — Compartilhar o cálculo.** Usuário copia a URL e envia a terceiro, que abre o mesmo cenário sem precisar redigitar.

**UC-05 — Entender o conceito.** Usuário chega por um guia, lê a explicação e é conduzido à calculadora correspondente.

---

## 6. Fora de escopo do v1

Autenticação · conta de usuário · histórico persistido · assinatura e pagamento · banco de dados · exportação em PDF · painel administrativo · aplicativo nativo · API pública · newsletter · comentários · as 65 calculadoras das fases v2 a v4.

Fora em definitivo: documentos jurídicos · calculadoras de saúde · cálculos hiperlocais · tributário empresarial complexo · calculadoras de entretenimento.

---

## 7. Dependências externas

| Dependência | Uso | Criticidade | Plano de falha |
|---|---|---|---|
| Fontes normativas oficiais | Origem de todo parâmetro legal | **Crítica** | Não é dependência de runtime. Falha significa parâmetro desatualizado, tratado por auditoria periódica (`12-test-plan`) |
| Sistema de séries temporais do Banco Central | Indicador sugerido em CALC-022 | Baixa | RN-032: último valor em cache com data visível |
| Rede de anúncio | Única receita | Média | Ausência degrada receita, não funcionalidade. Layout não depende do slot preencher |
| Plataforma de consentimento | Pré-requisito do anúncio | Média | Sem consentimento, nenhum terceiro carrega. Produto opera integralmente |
| Registro de contêiner e provedor de VPS | Hospedagem | Média | Ver `15-runbook` |
