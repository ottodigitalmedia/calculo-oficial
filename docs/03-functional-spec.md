---
doc: 03-functional-spec
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: [01-prd, 02-user-stories]
---

# Especificação Funcional

Todo texto entre aspas neste documento é **microcopy final em pt-BR**, para ser usado literalmente.

---

## 1. Padrões comuns a todas as calculadoras

### 1.1 Anatomia da página

```
┌─ Cabeçalho: navegação + busca
├─ Título da calculadora + linha de contexto
├─ Seletor de data de referência
├─ Formulário
├─ Resultado (destaque) + aviso de estimativa
├─ Memória de cálculo (recolhida por padrão)
├─ Slot de anúncio
├─ FAQ contextual
├─ Calculadoras relacionadas
└─ Rodapé: links legais
```

O anúncio nunca sobe acima do resultado nem entra na memória de cálculo (`RF-009`).

### 1.2 Comportamento de cálculo

| Aspecto | Regra |
|---|---|
| Disparo | Automático, ao sair de um campo válido. Sem botão "Calcular" |
| Debounce | 300ms após a última tecla em campos de digitação livre |
| Campos obrigatórios incompletos | Estado pendente, sem resultado parcial |
| Campo inválido | Resultado anterior é limpo. Nunca manter número velho na tela |
| Recálculo | Toda alteração de qualquer campo ou da data de referência recalcula tudo |

### 1.3 Tipos de campo e máscaras

| Tipo | Máscara | Teclado mobile | Validação |
|---|---|---|---|
| Monetário | `R$ 0.000,00` | numérico decimal | ≥ 0; máximo R$ 1.000.000,00 |
| Data | `DD/MM/AAAA` + seletor nativo | data | Data válida; dentro do intervalo permitido |
| Inteiro | Sem máscara | numérico | ≥ 0; máximo definido por campo |
| Horas | `000:00` | numérico | ≥ 0; máximo 999:59 |
| Percentual | `00,00 %` | numérico decimal | 0 a 100 |
| Seleção | — | — | Sempre com opção padrão preenchida |

### 1.4 Mensagens de validação — texto final

| Situação | Mensagem |
|---|---|
| Obrigatório vazio | "Preencha este campo para ver o resultado." |
| Valor negativo | "Informe um valor igual ou maior que zero." |
| Valor acima do máximo | "Informe um valor de até R$ 1.000.000,00." |
| Data inválida | "Informe uma data válida no formato DD/MM/AAAA." |
| Data final anterior à inicial | "A data final precisa ser posterior à data inicial." |
| Data futura não permitida | "Informe uma data até hoje." |
| Data de referência sem cobertura | "Ainda não temos os parâmetros legais desse período. Períodos disponíveis: de {inicio} a {fim}." |
| Inteiro fora do intervalo | "Informe um número entre {min} e {max}." |

### 1.5 Estados da tela

| Estado | Quando | O que aparece |
|---|---|---|
| Vazio | Primeiro acesso | Formulário + área de resultado com "Preencha os campos acima para ver o resultado." |
| Pendente | Faltam obrigatórios | "Falta preencher: {lista de campos}." |
| Calculando | Só se exceder 200ms | Esqueleto do bloco de resultado. Nunca giro de carregamento |
| Calculado | Entradas válidas | Resultado + memória disponível |
| Erro de parâmetro | Data sem cobertura | Mensagem de §1.4, formulário preservado |
| Erro inesperado | Exceção no motor | "Não conseguimos concluir este cálculo. Se o problema continuar, avise pelo formulário de contato." + registro em ferramenta de erro **sem os valores digitados** (`RN-030`) |

### 1.6 Aviso de estimativa — texto final

Exibido na mesma dobra do resultado, sempre:

> "Estimativa com base nos dados informados e nos parâmetros legais vigentes em {data de referência}. O valor final pode variar conforme acordos, convenções coletivas e particularidades do seu contrato."

Para FGTS, acrescenta-se (`RN-023`):

> "Este é o valor estimado dos depósitos. O saldo real da sua conta vinculada inclui correção e pode ser diferente — consulte-o nos canais oficiais."

### 1.7 Memória de cálculo

Recolhida por padrão. Acionador: "Ver como este valor foi calculado".
Aberta, exibe uma linha por etapa:

| Coluna | Conteúdo |
|---|---|
| Etapa | Nome em linguagem comum. Ex.: "Contribuição previdenciária — 2ª faixa" |
| Fórmula | Expressão com os valores substituídos |
| Parâmetro | Valor usado + vigência + link para a norma |
| Resultado | Valor da etapa |

Rodapé do bloco: "Parâmetros vigentes em {periodo}. Fonte: {norma}."
Acionador de fechamento: "Recolher memória de cálculo".

### 1.8 Permissões por papel

Não há papéis. Todos os recursos são públicos e anônimos (`ADR-002`). Esta seção existe para registrar que a ausência é deliberada, e que qualquer recurso futuro com papel exige revisão de `07-security`.

### 1.9 Comportamento em rede lenta ou ausente

Após o primeiro carregamento, o cálculo, a memória e a navegação entre calculadoras já visitadas funcionam sem rede. A única funcionalidade degradada é o indicador econômico sugerido em CALC-022, que usa o último valor conhecido com a data visível (`RN-032`).

---

## 2. Telas de navegação

### 2.1 Home

**Objetivo.** Levar à calculadora certa em um clique e comunicar o diferencial em uma linha.

**Hierarquia:** título → busca → categorias com as calculadoras do v1 → bloco "Como funciona" (3 itens: cálculo aberto, parâmetro com fonte, qualquer período) → guias recentes.

**Microcopy do bloco de diferencial:**
- "Cálculo aberto — veja cada etapa da conta, não só o resultado."
- "Parâmetro com fonte — cada tabela usada vem com a norma e a vigência."
- "Qualquer período — recalcule com a tabela que valia na época."

**Busca:** campo com "Buscar calculadora…". Filtragem local, sem rede. Sem resultado: "Não encontramos nada com esse termo. Veja todas as calculadoras."

### 2.2 Página de categoria

Lista as calculadoras da categoria com nome e uma linha de descrição. Texto de topo explicando o que a categoria cobre, com link para os guias relacionados.

---

## 3. Especificação por calculadora

Notação de campos: `*` obrigatório.

### 3.1 CALC-001 — Salário líquido

**Objetivo.** Estimar quanto sobra do salário após os descontos legais.

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salarioBruto` * | Monetário | "Salário bruto mensal" | > 0 | vazio |
| `dependentes` | Inteiro | "Número de dependentes" | 0 a 20 | 0 |
| `pensao` | Monetário | "Pensão alimentícia (desconto judicial)" | ≥ 0; ≤ salário bruto | 0 |
| `optanteVT` | Seleção | "Vale-transporte" | "Não uso" / "Uso" | "Não uso" |
| `custoVT` | Monetário | "Custo mensal do vale-transporte" | ≥ 0 | 0 |
| `outrosDescontos` | Monetário | "Outros descontos (plano de saúde, etc.)" | ≥ 0 | 0 |

**Habilitação:** `custoVT` só aparece quando `optanteVT` = "Uso".

**Saída principal:** "Salário líquido estimado".
**Detalhamento exibido:** salário bruto · contribuição previdenciária · imposto de renda retido · vale-transporte · outros descontos · líquido.

**Etapas da memória:** base previdenciária → contribuição por faixa (uma linha por faixa) → total previdenciário → base do imposto (bruto − previdência − dependentes − pensão) → imposto pela tabela → redutor aplicável, quando houver → imposto devido → desconto de vale-transporte (`RN-027`) → líquido.

**Regras:** `RN-008` a `RN-014`, `RN-027`.

---

### 3.2 CALC-002 — Rescisão sem justa causa

**Objetivo.** Estimar as verbas devidas na demissão sem justa causa.

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `admissao` * | Data | "Data de admissão" | ≤ desligamento | vazio |
| `desligamento` * | Data | "Data do desligamento" | ≥ admissão; ≤ hoje | vazio |
| `salario` * | Monetário | "Último salário bruto" | > 0 | vazio |
| `avisoPrevio` * | Seleção | "Aviso prévio" | "Indenizado" / "Trabalhado" | "Indenizado" |
| `feriasVencidas` | Seleção | "Tem férias vencidas não gozadas?" | "Não" / "Sim" | "Não" |
| `saldoFGTS` | Monetário | "Saldo do FGTS (se souber)" | ≥ 0 | vazio |
| `dependentes` | Inteiro | "Número de dependentes" | 0 a 20 | 0 |

**Saída principal:** "Total líquido estimado da rescisão".
**Detalhamento:** saldo de salário · aviso prévio · 13º proporcional · férias vencidas + 1/3 · férias proporcionais + 1/3 · multa do FGTS · descontos previdenciários e de imposto por verba · total.

**Etapas da memória:** tempo de serviço → projeção do aviso indenizado (`RN-019`) → dias do aviso proporcional (`RN-020`) → saldo de salário → avos de 13º (`RN-015`, `RN-016`) → avos de férias → terço constitucional → depósitos estimados de FGTS (`RN-021`) → multa (`RN-022`) → incidências por verba → total.

**Comportamento específico:** quando `saldoFGTS` está vazio, o bloco de FGTS exibe o aviso adicional de §1.6 e é rotulado "estimado".

**Regras:** `RN-015` a `RN-023`.

---

### 3.3 CALC-003 — Rescisão por pedido de demissão

Mesma estrutura de CALC-002, com as diferenças:

- `avisoPrevio` passa a: "Vou cumprir" / "Não vou cumprir".
- Quando "Não vou cumprir": o aviso é **descontado** do trabalhador e exibido em vermelho no detalhamento, com rótulo "Desconto de aviso prévio não cumprido".
- Não há multa de FGTS. O bloco correspondente não é exibido — e não é exibido zerado, para não sugerir erro.
- Nota fixa abaixo do resultado: "No pedido de demissão não há multa de FGTS nem direito ao saque, salvo nas hipóteses previstas em lei."

**Regras:** `RN-018`, `RN-019`.

---

### 3.4 CALC-004 — Férias

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salario` * | Monetário | "Salário bruto mensal" | > 0 | vazio |
| `tipo` * | Seleção | "Tipo de férias" | "Integrais (30 dias)" / "Proporcionais" | "Integrais (30 dias)" |
| `mesesTrabalhados` | Inteiro | "Meses trabalhados no período aquisitivo" | 1 a 12 | 12 |
| `diasGozados` | Inteiro | "Dias de férias que vai tirar" | 5 a 30 | 30 |
| `abonoPecuniario` | Seleção | "Vender 1/3 das férias (abono)?" | "Não" / "Sim" | "Não" |
| `adiantar13` | Seleção | "Adiantar a 1ª parcela do 13º?" | "Não" / "Sim" | "Não" |
| `dependentes` | Inteiro | "Número de dependentes" | 0 a 20 | 0 |

**Habilitação:** `mesesTrabalhados` só aparece com `tipo` = "Proporcionais".

**Saída principal:** "Valor líquido estimado a receber".
**Etapas:** base → proporcionalidade por avos → terço constitucional → abono, quando houver → adiantamento do 13º, quando houver → incidências → líquido.

---

### 3.5 CALC-005 — 13º salário

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salario` * | Monetário | "Salário bruto mensal" | > 0 | vazio |
| `mesesTrabalhados` * | Inteiro | "Meses trabalhados no ano" | 1 a 12 | 12 |
| `parcela` * | Seleção | "O que quer calcular" | "Total do ano" / "1ª parcela" / "2ª parcela" | "Total do ano" |
| `mediaVariaveis` | Monetário | "Média de horas extras e comissões" | ≥ 0 | 0 |
| `dependentes` | Inteiro | "Número de dependentes" | 0 a 20 | 0 |

**Nota fixa:** "A 1ª parcela é adiantamento e não sofre desconto de INSS nem de Imposto de Renda. Os descontos incidem na 2ª parcela, sobre o valor total do 13º."

**Regras:** `RN-010`, `RN-015`, `RN-016`.

---

### 3.6 CALC-006 — Horas extras

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salario` * | Monetário | "Salário bruto mensal" | > 0 | vazio |
| `jornadaSemanal` * | Seleção | "Jornada semanal" | "44h" / "40h" / "36h" / "30h" / "20h" | "44h" |
| `horasExtras50` | Horas | "Horas extras a 50%" | ≥ 0 | 0 |
| `horasExtras100` | Horas | "Horas extras a 100%" | ≥ 0 | 0 |
| `horasNoturnas` | Horas | "Horas noturnas" | ≥ 0 | 0 |
| `refletirDSR` | Seleção | "Calcular reflexo no DSR?" | "Sim" / "Não" | "Sim" |
| `diasUteis` | Inteiro | "Dias úteis no mês" | 1 a 27 | 25 |
| `diasDescanso` | Inteiro | "Dias de descanso no mês" | 1 a 10 | 5 |

**Habilitação:** `diasUteis` e `diasDescanso` só aparecem com `refletirDSR` = "Sim".

**Etapas:** divisor da jornada → valor da hora normal → horas a 50% → horas a 100% → adicional noturno com hora reduzida → reflexo no descanso semanal (`RN-025`) → total.

**Regras:** `RN-024` a `RN-026`.

---

### 3.7 CALC-007 — FGTS

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salario` * | Monetário | "Salário bruto mensal" | > 0 | vazio |
| `mesesTrabalhados` * | Inteiro | "Meses de contrato" | 1 a 600 | vazio |
| `incluir13` | Seleção | "Incluir 13º salário no cálculo?" | "Sim" / "Não" | "Sim" |
| `motivoSaida` * | Seleção | "Motivo da saída" | "Ainda trabalhando" / "Demissão sem justa causa" / "Pedido de demissão" / "Acordo mútuo" | "Ainda trabalhando" |

**Comportamento:** o bloco de multa só aparece quando o motivo a comporta. Aviso adicional de §1.6 sempre presente.

**Regras:** `RN-021` a `RN-023`.

---

### 3.8 CALC-015 — IRRF mensal

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `rendimentoBruto` * | Monetário | "Rendimento bruto do mês" | > 0 | vazio |
| `inss` | Monetário | "Contribuição previdenciária descontada" | ≥ 0 | calculado |
| `dependentes` | Inteiro | "Número de dependentes" | 0 a 20 | 0 |
| `pensao` | Monetário | "Pensão alimentícia (desconto judicial)" | ≥ 0 | 0 |

**Comportamento:** `inss` é pré-preenchido pelo cálculo automático e editável. Quando editado, exibe: "Usando o valor que você informou."

**Etapas:** deduções legais → base pelas deduções → desconto simplificado → base simplificada → escolha da base mais favorável com justificativa (`RN-012`) → imposto pela tabela → redutor, quando aplicável (`RN-013`) → imposto devido, nunca negativo (`RN-014`).

---

### 3.9 CALC-016 — INSS mensal

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `salarioContribuicao` * | Monetário | "Salário de contribuição" | > 0 | vazio |
| `tipoSegurado` * | Seleção | "Tipo de segurado" | "Empregado / doméstico / avulso" | fixo no v1 |

**Nota:** contribuinte individual e facultativo ficam para CALC-050 (v3). A opção existe desabilitada com "Em breve" para não sugerir que a calculadora cobre casos que não cobre.

**Etapas:** uma linha por faixa, com a parcela do salário incidente, a alíquota e o valor — depois o total e a alíquota efetiva.

**Saída secundária:** "Alíquota efetiva: X,XX%" — porque é a informação que mais surpreende o usuário e a que mais gera desconfiança quando não explicada.

---

### 3.10 CALC-022 — Juros compostos com aportes

| Campo | Tipo | Rótulo | Validação | Padrão |
|---|---|---|---|---|
| `valorInicial` * | Monetário | "Valor inicial" | ≥ 0 | 0 |
| `aporteMensal` | Monetário | "Aporte mensal" | ≥ 0 | 0 |
| `taxa` * | Percentual | "Taxa de juros" | > 0; ≤ 100 | sugerido |
| `periodoTaxa` * | Seleção | "Período da taxa" | "Ao mês" / "Ao ano" | "Ao ano" |
| `prazo` * | Inteiro | "Prazo" | 1 a 600 | 12 |
| `periodoPrazo` * | Seleção | "Unidade do prazo" | "Meses" / "Anos" | "Meses" |

**Sugestão de taxa (`RF-012`, `RN-032`, `RN-033`):** ao carregar, `taxa` vem pré-preenchida com o indicador de referência mais recente, acompanhado de: "Sugerido: taxa básica de juros de {valor}% ao ano, referente a {data}. Você pode alterar."
Se o dado tiver mais de 30 dias: "Este indicador pode estar desatualizado."
Se nunca foi obtido: campo vazio, sem sugestão, sem mensagem de erro.

**Saída:** montante final · total investido · total em juros · tabela de evolução por período, com paginação a cada 12 linhas.

**Nota fixa:** "Este cálculo não considera imposto de renda, taxas de administração nem inflação."

---

## 4. Guias e FAQ

Cada calculadora do v1 tem no mínimo 4 perguntas de FAQ, respondidas em até 3 parágrafos, e um guia associado.

| Guia | Calculadoras ligadas |
|---|---|
| Como o desconto do INSS é calculado | CALC-016, CALC-001 |
| Imposto de renda na folha: como chegar ao valor | CALC-015, CALC-001 |
| Salário bruto e líquido: por que a diferença surpreende | CALC-001 |
| Rescisão sem justa causa: o que compõe o valor | CALC-002 |
| Pedido de demissão: o que muda no que você recebe | CALC-003 |
| Férias: integrais, proporcionais e abono | CALC-004 |
| 13º salário: as duas parcelas e os descontos | CALC-005 |
| Horas extras e o reflexo no descanso semanal | CALC-006 |
| FGTS: depósitos, multa e o que é saldo real | CALC-007 |
| Juros compostos: por que o tempo importa mais que a taxa | CALC-022 |

---

## 5. Páginas legais

| Página | Conteúdo essencial |
|---|---|
| Privacidade | Ausência de coleta de dado de cálculo (`RN-030`); análise sem cookie; base legal; contato |
| Termos | Natureza informativa; ausência de vínculo; limitação de responsabilidade |
| Cookies | Quais existem; consentimento; como revogar |
| Aviso legal | Texto reforçando `RN-028`, com link a partir de cada calculadora |

**Texto do aviso legal (final):**

> "O Cálculo Oficial é uma ferramenta informativa e educacional. Os resultados são estimativas produzidas a partir dos dados que você informa e dos parâmetros legais vigentes no período selecionado. Não constituem aconselhamento jurídico, contábil ou financeiro, nem substituem a orientação de um profissional habilitado. Para decisões que envolvam direitos, contratos ou dinheiro, procure um profissional."
