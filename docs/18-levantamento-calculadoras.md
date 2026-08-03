---
doc: 18-levantamento-calculadoras
projeto: Cálculo Oficial
versao: 1.0
status: gerado
depende_de: [00-catalogo-calculadoras, 03-functional-spec, 16-adr/ADR-006]
---

# Levantamento das 71 calculadoras que faltam

> Escrito em **31/07/2026**, na primeira sessão pós-lançamento.
>
> `00-catalogo-calculadoras.md` diz **o que** existe e em que fase. Este
> documento diz **o que falta para cada uma poder ser construída** — do que ela
> depende, o que já está pronto e reaproveitável, e onde está a armadilha.
>
> Não substitui o catálogo nem redefine fase. Reordena por **dependência**, que
> é o que decide o que dá para fazer amanhã de manhã.

---

## 1. O panorama em três números

Publicadas: **4** — CALC-001, CALC-015, CALC-016, CALC-022. Restam **71**.

A divisão que importa não é por categoria. É por **do que a calculadora
depende para existir**:

| Bloco | Quantas | Depende de | Pode começar hoje? |
|---|---|---|---|
| **A · Matemática pura** | **33** | Nada. Fórmula fechada, entrada digitada | ✅ **Sim, todas as 33** |
| **B · Parâmetro legal novo** | **26** | Pesquisa em fonte oficial + cadastro em `lib/params/` | ⚠️ Só depois da pesquisa |
| **C · Série externa (BCB)** | **12** | `ADR-006` implementado — coleta de série no build | ❌ Bloqueadas |

**O achado principal deste levantamento:** 33 das 71 — quase metade do que
falta — **não dependem de nada que não exista hoje**. Nem de pesquisa em norma,
nem de API, nem de decisão pendente. Entre elas estão as de maior valor
publicitário do catálogo inteiro (crédito e imóveis).

O plano até aqui priorizava as trabalhistas, que são bloco B e exigem a
pesquisa mais delicada do catálogo. Isso não está errado — elas são a âncora de
autoridade e reaproveitam os motores prontos —, mas convém saber que existe uma
fila inteira sem bloqueio nenhum ao lado.

---

## 2. O que desbloqueia o quê

Cinco dependências governam as 38 calculadoras dos blocos B e C. Resolver as
duas primeiras libera 24.

| # | Dependência | Libera | Esforço | Estado |
|---|---|---|---|---|
| D-1 | **Incidência de INSS e IRRF por verba rescisória** | 11 trabalhistas | Pesquisa em fonte oficial. Alto risco de erro | ❌ Pendente. É o pré-requisito de CALC-002 |
| D-2 | **`ADR-006` — coleta de série do BCB no build** | 12 | Implementação. Endpoint e armadilhas já mapeados (§5) | ❌ Adiado por `ADR-008` |
| D-3 | **Tabelas do Simples Nacional / anexos do MEI** | 6 (AUT) | Pesquisa em LC 123/2006 e anexos | ❌ Pendente |
| D-4 | **Tabela regressiva de IR sobre aplicações** | 4 (TRI/INV) | Pesquisa. Tabela pequena e estável | ❌ Pendente |
| D-5 | **Calendário de feriados nacionais** | 1 (CALC-072) | Lei 662/1949 e Lei 9.093/1995 | ❌ Pendente |

> **D-1 é o gargalo real do v1.** Não é volume de trabalho — é risco. As regras
> de incidência sobre cada verba rescisória são onde as calculadoras
> concorrentes mais divergem entre si, e `CLAUDE.md` proíbe copiar de qualquer
> uma delas. Cada verba precisa de resposta própria, em norma, para três
> perguntas: incide INSS? incide IRRF? entra na base do FGTS?

---

## 3. Bloco A — as 33 que podem começar hoje

Nenhuma depende de parâmetro legal versionado nem de série externa. A entrada é
digitada pelo usuário e a saída é fórmula fechada. **Manutenção anual: zero.**

### 3.1 Crédito e dívidas — 7 · a maior receita por página do catálogo

| ID | Calculadora | Fase | Reaproveita | Dificuldade e armadilha |
|---|---|---|---|---|
| CALC-023 | Rotativo do cartão — custo real | v2 | Motor de juros compostos | **Baixa.** A armadilha é de produto, não de conta: o usuário chega endividado e o anúncio ao lado vende crédito. `00-catálogo` §6 exige aviso contextual, não só no rodapé |
| CALC-024 | CET — custo efetivo total | v2 | — | **Média.** O CET é a taxa que zera o valor presente do fluxo — resolvido por iteração (Newton ou bisseção), não por fórmula fechada. O motor precisa devolver traço de uma iteração, o que é novo aqui |
| CALC-025 | Amortização SAC vs. Price | v2 | Tabela de resultado de CALC-022 | **Baixa.** Duas fórmulas clássicas. A memória de cálculo fica longa — a tabela de evolução já resolvida em juros compostos serve de molde |
| CALC-026 | Quitação antecipada | v3 | CALC-025 | **Baixa.** É CALC-025 rodado duas vezes e subtraído |
| CALC-028 | Bola de neve vs. avalanche | v3 | — | **Média.** Simulação iterativa sobre N dívidas. O campo é uma lista de tamanho variável — **o contrato de `Campo` hoje não suporta isso.** Ver §7 |
| CALC-029 | Portabilidade de crédito | v4 | CALC-024 | **Baixa.** Comparação de dois CETs |
| CALC-030 | Cheque especial — custo real | v4 | CALC-023 | **Baixa.** Praticamente o mesmo motor do rotativo |

> **CALC-024 é a chave da categoria.** CET aparece em CALC-029, CALC-056 e no
> comparativo de CALC-031. Construir o motor de taxa interna de retorno uma vez
> e bem resolve quatro calculadoras.

### 3.2 Imóveis — 5 · ticket alto de anunciante

| ID | Calculadora | Fase | Reaproveita | Dificuldade e armadilha |
|---|---|---|---|---|
| CALC-031 | Financiamento SAC vs. Price completo | v2 | CALC-025 | **Média.** É CALC-025 com seguros (MIP e DFI) e taxa de administração. Os valores de seguro **variam por banco e por idade** — entram como campo do usuário, nunca estimados |
| CALC-032 | Capacidade de financiamento | v2 | CALC-031 | **Baixa.** O limite de 30% da renda é **praxe de mercado, não norma.** Não pode ser apresentado como regra legal, e por `RN-028` nem como direito |
| CALC-035 | Rentabilidade de imóvel para locação | v3 | — | **Baixa.** Aritmética simples |
| CALC-036 | Amortização extra | v3 | CALC-025 | **Média.** Duas modalidades — reduzir prazo ou reduzir parcela. A comparação entre elas é a razão de a página existir |
| CALC-038 | Financiamento de reforma | v4 | CALC-031 | **Baixa.** |

### 3.3 Veículos — 6 · manutenção nula, fórmulas simples

| ID | Calculadora | Fase | Dificuldade e armadilha |
|---|---|---|---|
| CALC-054 | Álcool vs. gasolina | v2 | **Muito baixa.** A regra dos 70% é aproximação; o cálculo correto usa o consumo real dos dois combustíveis, e é aí que a memória de cálculo se diferencia do concorrente |
| CALC-055 | Custo de viagem por combustível | v3 | **Muito baixa.** |
| CALC-056 | Financiamento de veículo | v3 | **Baixa**, se CALC-024 já existir — é o mesmo motor de CET |
| CALC-057 | Custo mensal real de ter um carro | v3 | **Baixa.** IPVA entra como campo digitado: alíquota varia por UF e está fora por `§14` do catálogo |
| CALC-058 | Elétrico vs. combustão | v4 | **Baixa.** |
| CALC-059 | Depreciação de veículo | v4 | **Média.** Sem tabela FIPE (licenciamento restrito), a curva tem de ser percentual digitado pelo usuário — o que enfraquece o produto. Avaliar se vale existir |

### 3.4 Consumo e energia — 5

| ID | Calculadora | Fase | Dificuldade e armadilha |
|---|---|---|---|
| CALC-065 | Consumo de energia por aparelho | v3 | **Baixa.** A tarifa é campo do usuário, com instrução de onde achar na fatura (`§12` do catálogo). **Não estimar por região** |
| CALC-066 | Retorno de energia solar | v3 | **Média.** Depende de irradiação solar, que varia por região. Ou vira campo do usuário, ou a calculadora promete o que não pode entregar |
| CALC-067 | Conta de água | v4 | **Baixa.** Tarifa progressiva por faixa varia por concessionária — campo do usuário |
| CALC-068 | Botijão de gás | v4 | **Muito baixa.** |
| CALC-069 | Orçamento 50/30/20 | v4 | **Muito baixa.** É divisão. O valor está no texto, não na conta |

### 3.5 Utilitários — 5 · tráfego barato, receita baixa

| ID | Calculadora | Fase | Dificuldade |
|---|---|---|---|
| CALC-070 | Porcentagem | v2 | **Muito baixa.** Alto volume de busca. Serve de porta de entrada para as âncoras |
| CALC-071 | Regra de três | v3 | **Muito baixa.** |
| CALC-073 | Divisão de conta | v4 | **Baixa.** Lista de tamanho variável — mesmo limite de contrato de CALC-028 (§7) |
| CALC-074 | Conversor de unidades | v4 | **Baixa.** Muitas unidades, pouca lógica. O campo de seleção precisa crescer |
| CALC-075 | Média ponderada | v4 | **Baixa.** Lista de tamanho variável (§7) |

### 3.6 As 5 restantes do bloco A

| ID | Calculadora | Cat. | Fase | Dificuldade e armadilha |
|---|---|---|---|---|
| CALC-013 | Banco de horas e jornada | TRB | v3 | **Média.** Sem parâmetro legal, mas com aritmética de tempo — e a regra de compensação depende de acordo coletivo, que o produto não conhece. `RN-028` vale em dobro |
| CALC-043 | Meta de independência financeira | INV | v3 | **Baixa.** Juros compostos invertido |
| CALC-044 | Reserva de emergência | INV | v3 | **Muito baixa.** |
| CALC-046 | Dividend yield | INV | v4 | **Baixa.** |
| CALC-049 | Precificação de hora | AUT | v3 | **Média.** Depende de premissas do usuário (horas faturáveis, custo fixo). O risco é a calculadora parecer prescritiva |

---

## 4. Bloco B — as 26 que precisam de parâmetro legal novo

### 4.1 As 6 trabalhistas do v1 — o resto da âncora

Todas reaproveitam os motores de INSS e IRRF **que já existem e já estão
auditados**. É o menor esforço marginal de motor do catálogo — e a maior
pesquisa normativa.

| ID | Calculadora | Já tem texto de tela? | Bloqueio | Armadilha específica |
|---|---|---|---|---|
| CALC-002 | Rescisão sem justa causa | ✅ `03-functional-spec` §3.2 | D-1 | A de maior busca do catálogo. Sete campos já definidos, incluindo aviso prévio indenizado/trabalhado — **precisa de `visivelSe`**, que virou dado em 31/07 |
| CALC-003 | Rescisão — pedido de demissão | ✅ §3.3 | D-1 | Estrutura de CALC-002 com três diferenças já escritas. **O bloco de FGTS não é exibido zerado** — some, para não sugerir erro |
| CALC-004 | Férias | ✅ §3.4 | D-1 | O terço constitucional tem divergência **STJ × STF** sobre incidência — e ela vale para férias *gozadas*, não para as *indenizadas*. A memória deve **declarar** a divergência, não escondê-la |
| CALC-005 | 13º salário | ✅ §3.5 | D-1 | **O §3º do Art. 3º-A aplica a redução do IR também ao 13º**, cobrado exclusivamente na fonte. Descoberto na auditoria de 31/07; nenhuma calculadora publicada é afetada, esta é |
| CALC-006 | Horas extras | ✅ §3.6 | Parcial | DSR sobre horas extras é a parte que os concorrentes mais erram. Adicional noturno tem **hora reduzida de 52min30s** — aritmética de tempo, não de dinheiro |
| CALC-007 | FGTS | ✅ §3.7 | Parcial | `RN-023` exige aviso próprio: o saldo é **estimado**, porque o real depende de depósitos que o produto não conhece |

> **Os textos de tela das seis já estão escritos e são finais.** É a diferença
> entre estas e todas as outras 65: metade do trabalho de especificação está
> pronto desde a fundação documental.

### 4.2 Trabalhistas de fases posteriores — 6

| ID | Calculadora | Fase | Bloqueio | Armadilha |
|---|---|---|---|---|
| CALC-008 | Rescisão — acordo mútuo (art. 484-A) | v2 | D-1 | Multa de FGTS pela metade e saque de 80%. Regra recente, texto claro |
| CALC-009 | Seguro-desemprego | v2 | Faixas próprias | As faixas de cálculo são reajustadas por portaria anual — **parâmetro novo, manutenção alta** |
| CALC-010 | Aviso prévio proporcional | v2 | Lei 12.506/2011 | **Baixa.** Três dias por ano trabalhado, teto de 90. Uma das mais simples do bloco B |
| CALC-011 | Custo real do funcionário | v3 | D-1 + FGTS + terceiros | **Alta.** Alíquotas de terceiros (Sistema S) variam por código FPAS — risco de virar tributário empresarial, que `§14` excluiu |
| CALC-012 | Rescisão — doméstico (LC 150/2015) | v3 | D-1 + LC 150 | Regime próprio: FGTS com 3,2% de indenização compensatória |
| CALC-014 | Rescisão — intermitente (art. 452-A) | v4 | D-1 | Baixo volume, regra pouco assentada |

### 4.3 Tributos pessoa física — 5

| ID | Calculadora | Fase | Bloqueio | Armadilha |
|---|---|---|---|---|
| CALC-017 | Restituição estimada do IRPF | v2 | Tabela anual + limites de dedução | **Alta.** É o ajuste anual inteiro: educação, saúde, dependentes, cada um com teto próprio. Muitos parâmetros, todos anuais |
| CALC-018 | IR sobre renda fixa — regressiva | v2 | D-4 | **Baixa.** Tabela de 4 faixas por prazo, estável há anos. Excelente relação esforço/valor |
| CALC-019 | Simplificado vs. completo | v3 | CALC-017 | É CALC-017 rodado duas vezes |
| CALC-020 | Ganho de capital em imóvel | v3 | Fatores de redução | **Alta.** Isenções e fatores de redução por época de aquisição; regra antiga e cheia de exceção |
| CALC-021 | IR sobre criptoativos | v4 | IN RFB | **Média.** Isenção mensal e alíquotas por faixa de ganho |

### 4.4 Autônomo, MEI e PJ — 6

| ID | Calculadora | Fase | Bloqueio | Armadilha |
|---|---|---|---|---|
| CALC-047 | DAS-MEI por atividade | v2 | D-3 | **Baixa.** Valor fixo por atividade (comércio, serviço, ambos), atrelado ao salário mínimo — **que já está cadastrado** |
| CALC-048 | CLT vs. PJ vs. MEI | v2 | D-3 + motores prontos | **Alta**, e é a de maior valor da categoria. Compara três regimes; o resultado depende de premissas (férias, 13º, FGTS como salário diferido) que precisam ficar **visíveis**, não embutidas |
| CALC-050 | INSS do contribuinte individual | v3 | Alíquotas próprias | **Média.** Já tem seção em `03-functional-spec`. 20%, 11% e 5% conforme o plano — e o teto já cadastrado |
| CALC-051 | Pró-labore e encargos | v4 | D-3 | Fronteira com tributário empresarial |
| CALC-052 | Faturamento máximo do MEI | v4 | D-3 | **Baixa.** Limite anual e proporcional ao mês de abertura |
| CALC-053 | Carnê-leão | v4 | Tabela mensal (já cadastrada) | **Média.** Reaproveita a tabela de IRRF que já existe |

### 4.5 As 3 avulsas do bloco B

| ID | Calculadora | Cat. | Fase | Armadilha |
|---|---|---|---|---|
| CALC-027 | Consignado — margem e parcela | CRD | v3 | Margem consignável tem percentual legal por categoria (INSS, servidor, CLT). Pesquisa pequena |
| CALC-033 | Custo total de aquisição de imóvel | IMV | v3 | ITBI e cartório **variam por município** — `§14` exclui hiperlocal. Entram como campo digitado, com instrução |
| CALC-072 | Dias úteis entre datas | UTI | v3 | D-5. Feriados **móveis** (Carnaval, Corpus Christi) exigem cálculo da Páscoa. Feriado estadual e municipal ficam fora |

---

## 5. Bloco C — as 12 que dependem da série do Banco Central

Todas bloqueadas pela mesma coisa: `ADR-006`, a coleta de série econômica no
build. **Uma implementação libera as doze.**

| ID | Calculadora | Cat. | Série necessária |
|---|---|---|---|
| CALC-034 | Alugar vs. comprar | IMV | IPCA ou IGP-M |
| CALC-037 | Reajuste de aluguel | IMV | IGP-M `189`, IPCA `433`, INPC `188` |
| CALC-039 | CDB/LCI/LCA líquido | INV | Selic `11` / `4189` + D-4 |
| CALC-040 | Tesouro Selic vs. CDB vs. poupança | INV | Selic + regra da poupança |
| CALC-041 | Rendimento da poupança | INV | Selic e TR |
| CALC-042 | Quanto rende X por mês | INV | Selic |
| CALC-045 | Tesouro IPCA+ | INV | IPCA `433` |
| CALC-060 | Correção por índice | IDX | Todas as cinco |
| CALC-061 | Poder de compra no tempo | IDX | IPCA `433` |
| CALC-062 | Conversor de moeda com IOF | IDX | Câmbio (série distinta) + alíquota de IOF, que é parâmetro legal |
| CALC-063 | Reajuste de salário por inflação | IDX | IPCA / INPC |
| CALC-064 | Valor futuro corrigido | IDX | Todas |

### 5.1 As seis armadilhas do SGS, já medidas

O projeto irmão mediu a API com requisições reais (`docs/fontes/bcb-sgs.md`).
Cada uma destas custaria um defeito para descobrir sozinho:

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa
```

Sem autenticação. **IGP-M `189` · IPCA `433` · Selic `11` e `4189` · INPC `188`.**

1. `valor` vem como **string** com ponto decimal (`"0.41"`), não número.
2. `data` é `dd/MM/aaaa`, **não ISO** — e isso casa com a nossa regra de nunca
   usar `new Date(string)`.
3. **Janela máxima de 10 anos** por requisição. Série longa exige fatiar.
4. **Defasagem de ~1 mês.** A tela precisa dizer qual é o último mês fechado, e
   não fingir que tem o mês corrente.
5. Limite de taxa não publicado; bibliotecas comunitárias usam ~5 conexões.
6. **Atribuição:** o BCB *republica* IGP-M (FGV) e IPCA/INPC (IBGE). Creditar o
   produtor original.

> Isso **não** muda `ADR-006`: a coleta continua sendo de build, com cache, e a
> falha dela não interrompe o pipeline (regra R-3). O catálogo (`§8`) exige
> ainda que a calculadora funcione com o último valor em cache, **exibindo a
> data do dado** — nunca uma tela quebrada, nunca um valor silenciosamente
> velho.

### 5.2 Correção de contagem

`ESTADO-DO-PROJETO` §6.1 diz que o SGS destrava **13** calculadoras, listando
"CALC-037, CALC-039 a CALC-045, CALC-060 a CALC-064".

Conferido contra a coluna `Fonte` do catálogo, são **12**: CALC-043 e CALC-044
estão marcadas como `—` (matemática pura, sem série), e CALC-034 está marcada
como `API` e ficou de fora da lista. A diferença importa porque CALC-043 e
CALC-044 **podem ser construídas hoje** — estão no bloco A, não no C.

---

## 6. Ordem sugerida, por desbloqueio

Não é a ordem do catálogo — é a que produz mais calculadoras por unidade de
trabalho, respeitando as fases.

| Passo | O quê | Libera | Por quê primeiro |
|---|---|---|---|
| 1 | **Pesquisar D-1** (incidência sobre verbas rescisórias) | 11 | É o gargalo do v1 inteiro e a pesquisa mais demorada. Começar cedo |
| 2 | **CALC-002 a CALC-007** | 6 | Fecha o v1. Textos de tela prontos, motores prontos |
| 3 | **CALC-024 · CET** | 4 | O motor de taxa interna serve a CALC-029, CALC-056 e CALC-031 |
| 4 | **CALC-025 · SAC vs. Price** | 4 | Serve a CALC-026, CALC-031, CALC-036, CALC-038 |
| 5 | **CALC-070, CALC-054** | 2 | Muito baixo esforço, alto volume de busca. Alimentam links internos |
| 6 | **Implementar `ADR-006`** | 12 | Uma implementação, doze calculadoras |
| 7 | **CALC-018** | 1 | Tabela pequena e estável, categoria de valor alto |

**Passos 3 a 5 não dependem de nada** e podem ser feitos em paralelo com a
pesquisa do passo 1 — que é de leitura, não de código.

---

## 7. O limite de contrato que vai aparecer

Quatro calculadoras precisam de **campo de lista com tamanho variável**:
CALC-028 (N dívidas), CALC-073 (N pessoas), CALC-075 (N notas) e, em menor
grau, CALC-074.

O contrato de `Campo` em `lib/calculadoras/tipos.ts` hoje descreve **um valor
por campo** — monetário, inteiro, seleção ou percentual. Não há repetição.

Quando chegar a hora, o caminho é o de `ESTADO-DO-PROJETO` §7.4: **fazer o
contrato crescer**, não criar uma página própria para essas quatro. O mesmo já
aconteceu em 31/07 com `visivelSe`, que era função e virou dado.

Nenhuma dessas quatro é v1 nem v2 — há tempo. Está registrado aqui para que a
decisão seja tomada de propósito, e não sob pressão de entrega.

---

## 8. O que este levantamento não decide

- **Prioridade por receita.** A classificação de valor publicitário do catálogo
  é hipótese declarada (`§1`, premissa), não medição. Os 90 dias de MR-2 vão
  corrigi-la, e a ordem do §6 deve ser revista quando isso acontecer.
- **A sobreposição com o projeto irmão.** Decidida em `ESTADO-DO-PROJETO` §6.4
  para CALC-002. CALC-037 e CALC-060 herdam a decisão e devem ser reavaliadas.
- ~~**CALC-059 (depreciação de veículo).** Sem tabela FIPE, o produto pede ao
  usuário o dado que ele foi buscar. Vale decidir se existe.~~ ✅ **Decidido em
  03/08/2026: existe, e não pede a resposta.** Ela pergunta quanto a pessoa
  pagou, quanto o carro vale hoje — consulta pública e gratuita na FIPE — e há
  quanto tempo, e DESCOBRE a taxa de depreciação daquele carro. Ver
  `ESTADO-DO-PROJETO` §7.39.
