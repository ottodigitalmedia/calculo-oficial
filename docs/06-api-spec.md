---
doc: 06-api-spec
projeto: Cálculo Aberto
versao: 1.0
status: draft
depende_de: [04-architecture, 05-data-model]
---

# Especificação de Rotas e Integrações

## 1. Natureza deste documento

O produto **não expõe API**. Não há endpoint de aplicação, autenticação, paginação de recursos nem versionamento de contrato público.

Este documento especifica o que de fato existe:

1. As **rotas públicas** do site — que são o contrato com o buscador e com o usuário, e mudá-las tem custo real.
2. A **interface do motor de cálculo** — contrato interno entre a camada de apresentação e o núcleo puro.
3. A **integração de saída** com a fonte externa de série econômica, com seu plano de falha.

## 2. Rotas públicas

### 2.1 Convenções

| Aspecto | Regra |
|---|---|
| Idioma da URL | Português, sem acento, em `kebab-case` |
| Prefixo | Sem prefixo de idioma nem de versão |
| Barra final | Ausente; redirecionamento permanente quando presente |
| Maiúsculas | Redirecionamento permanente para minúsculas |
| Estado do formulário | Query string, nunca segmento de caminho |
| Indexação | Rota sem query string é indexável; com query string, `noindex` |

**Regra R-1.** Slug publicado nunca muda. Se mudar, é obrigatório redirecionamento permanente registrado em `17-changelog` (restrição C-2 de `05-data-model`).

### 2.2 Mapa de rotas

| ID | Rota | Tipo | Indexável |
|---|---|---|---|
| EP-001 | `/` | Estática | Sim |
| EP-002 | `/calculadoras` | Estática | Sim |
| EP-003 | `/categoria/{categoria}` | Estática por categoria | Sim |
| EP-004 | `/calculadora/{slug}` | Estática por calculadora | Sim, sem query |
| EP-005 | `/guias` | Estática | Sim |
| EP-006 | `/guia/{slug}` | Estática por guia | Sim |
| EP-007 | `/sobre` | Estática | Sim |
| EP-008 | `/contato` | Estática | Sim |
| EP-009 | `/privacidade` | Estática | Sim |
| EP-010 | `/termos` | Estática | Sim |
| EP-011 | `/cookies` | Estática | Sim |
| EP-012 | `/aviso-legal` | Estática | Sim |
| EP-013 | `/sitemap.xml` | Gerada no build | — |
| EP-014 | `/robots.txt` | Estática | — |
| EP-015 | `/404` | Estática | Não |
| EP-016 | `/api/health` | Dinâmica | **Não** |

**EP-016 — verificação de saúde.** Única rota não estática do sistema. Existe para a regra D-4 de `13-deployment` §3 e é consumida pelo orquestrador a cada 30s e pelo passo pós-deploy que dispara o rollback automático (§4 e §9).

Responde `{"status":"ok"}` com 200 se o processo está de pé. **Não** consulta parâmetro, não calcula e não toca dependência externa: verificação de saúde que falha por causa de terceiro derruba um site que estava funcionando, e nenhum terceiro participa do caminho crítico (regra R-4). Não devolve versão, ambiente nem configuração — a rota é pública, e enumerar o que roda aqui só orienta quem procura o que atacar.

Fora do sitemap e com `x-robots-tag: noindex`.

**Autorização.** Todas as rotas são públicas e anônimas. Não existe rota autenticada, administrativa ou restrita. A matriz de autorização em `07-security` registra isso formalmente para cada rota, de modo que a introdução futura de qualquer rota não pública seja uma alteração visível na documentação, e não um acréscimo silencioso.

### 2.3 EP-004 em detalhe

**Rota:** `/calculadora/{slug}`
**Slugs do v1:** `salario-liquido` · `rescisao-sem-justa-causa` · `pedido-de-demissao` · `ferias` · `decimo-terceiro` · `horas-extras` · `fgts` · `irrf` · `inss` · `juros-compostos`

**Query string** — estado do formulário (`RF-006`):

| Parâmetro | Formato | Observação |
|---|---|---|
| `ref` | `AAAA-MM-DD` | Data de referência. Ausente = data atual |
| Campos da calculadora | Nome do campo conforme `03-functional-spec` | Valores monetários em centavos, sem separador |

Exemplo: `/calculadora/salario-liquido?salarioBruto=450000&dependentes=2&ref=2026-03-01`

**Comportamento na leitura da query string:**

| Situação | Comportamento |
|---|---|
| Parâmetro desconhecido | Ignorado silenciosamente |
| Valor fora do domínio válido | Campo recebe o padrão; o aviso de validação correspondente é exibido |
| `ref` sem cobertura de vigência | Mensagem de `03-functional-spec` §1.4; cálculo bloqueado (`RN-003`) |
| Query string presente | `noindex` na página; canônica aponta para a rota sem query |

**Regra R-2.** A query string nunca é enviada a terceiros. O identificador de página reportado à ferramenta de análise é a rota sem query, porque a query contém salário e dados de contrato do usuário (`RN-030`, `RN-031`).

### 2.4 Formato de erro

Não há resposta JSON de erro, porque não há API. Erros são estados de interface, especificados em `03-functional-spec` §1.5.

| Código | Quando | Resposta |
|---|---|---|
| 200 | Rota existente | Página |
| 301 | Slug alterado, barra final, maiúsculas | Redirecionamento |
| 404 | Rota inexistente | EP-015, com busca e link para o catálogo |
| 5xx | Falha do container | Página de erro estática servida pelo proxy |

## 3. Interface do motor de cálculo

Contrato interno, versionado por semântica dentro do repositório. Não é público, mas é o contrato mais importante do sistema.

### 3.1 Assinatura geral

```
calcular(entradas: EntradasDaCalculadora, dataReferencia: Data)
  → ResultadoOk { valores, traco, vigenciasAplicadas }
  | ResultadoErro { motivo, detalhe }
```

**Contrato C-M1.** Toda função pública retorna resultado **e** traço. Não existe caminho sem traço (restrição T-1 de `05-data-model`).

**Contrato C-M2.** O motor é puro: mesma entrada e mesma data de referência produzem sempre a mesma saída. Não lê relógio, não lê rede, não lê ambiente. A data de referência é sempre parâmetro explícito, nunca `agora()` implícito — sem isso, os casos-ouro passariam a falhar sozinhos na virada do exercício.

**Contrato C-M3.** O motor nunca lança exceção para erro de domínio. Data sem cobertura, entrada fora de intervalo e parâmetro ausente retornam `ResultadoErro` tipado. Exceção significa defeito, e é o que dispara o estado de erro inesperado de `03-functional-spec` §1.5.

**Contrato C-M4.** O motor não formata. Retorna centavos e basis points; a formatação em pt-BR pertence à camada de apresentação. Isso mantém o motor testável por igualdade exata de inteiros.

### 3.2 Motivos de erro

| Motivo | Significado | Regra |
|---|---|---|
| `vigencia_ausente` | Data fora da cobertura do parâmetro | `RN-003` |
| `entrada_invalida` | Valor fora do domínio | `03-functional-spec` §1.3 |
| `entrada_incompleta` | Campo obrigatório ausente | §1.5 |
| `inconsistencia_temporal` | Data final anterior à inicial | §1.4 |

## 4. Integração de saída

### 4.1 INT-001 — Série econômica do Banco Central

| Item | Definição |
|---|---|
| Uso | Sugestão de taxa em CALC-022 (`RF-012`) |
| Quando | No build e em revalidação incremental diária |
| Onde **não** ocorre | No caminho crítico do cálculo. Nunca em resposta a interação do usuário |
| Autenticação | Nenhuma; serviço público |
| Dado enviado | Apenas identificador de série e intervalo de datas. **Nenhum dado do usuário** |
| Criticidade | Baixa |

> ⚠️ VERIFICAR: endereço-base do serviço, identificador da série a ser usada, formato de resposta e eventual limite de requisições, na documentação oficial do provedor, antes de implementar. Não assumir a partir de exemplos de terceiros.

### 4.2 Plano de falha

| Cenário | Comportamento | Regra |
|---|---|---|
| Tempo limite (3s) | Aborta; usa último valor conhecido | `RN-032` |
| Erro 5xx | Idem, sem repetição imediata | `RN-032` |
| Resposta em formato inesperado | Validação por schema rejeita; usa último valor | `RN-032` |
| Valor fora de intervalo plausível | Rejeita; usa último valor; registra alerta | `14-observability` |
| Sem valor em cache (primeira execução falha) | Campo sem sugestão, sem mensagem de erro ao usuário | `03-functional-spec` §3.10 |
| Último valor com mais de 30 dias | Exibe aviso de possível desatualização | `RN-033` |

**Tentativas.** Duas, com espera de 2s entre elas, apenas no contexto de build. Nunca em requisição de usuário — não há requisição de usuário para esta integração.

**Regra R-3.** Falha desta integração **nunca** falha o build. O build prossegue com o valor em cache e registra aviso. Um parâmetro legal errado deve quebrar o build; um indicador econômico indisponível, não — a assimetria é deliberada e reflete a diferença de dano.

## 5. Integrações de terceiro no navegador

| ID | Integração | Carrega quando | Se falhar |
|---|---|---|---|
| INT-002 | Plataforma de consentimento | Sempre, antes de qualquer outro terceiro | Nenhum terceiro carrega. Produto funciona integralmente |
| INT-003 | Rede de anúncio | Somente após consentimento | Slot permanece com a altura reservada e vazio. Sem deslocamento (`RNF-002`) |
| INT-004 | Registro de erro | Sempre, sem cookie | Erro não é reportado. Nenhum impacto ao usuário |
| INT-005 | Análise de uso autohospedada | Sempre, sem cookie | Evento perdido. Nenhum impacto |

**Regra R-4.** Nenhuma integração de terceiro participa do caminho crítico de renderização ou de cálculo. `RNF-007` exige que o produto funcione integralmente com todas elas bloqueadas.

**Regra R-5.** INT-004 e INT-005 nunca recebem valores de formulário, nem em contexto de erro (`RN-030`). A configuração de captura de erro deve remover explicitamente query string e conteúdo de campos antes do envio.

## 6. Webhooks

Não há webhook recebido nem emitido. Não há pagamento, conta de usuário ou serviço externo que precise notificar o sistema.
