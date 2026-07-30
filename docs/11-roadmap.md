---
doc: 11-roadmap
projeto: Cálculo Aberto
versao: 1.0
status: draft
depende_de: [00-product-brief, 01-prd]
---

# Roadmap

## 1. Princípio

Fatias verticais, não camadas horizontais. Cada fatia coloca algo em produção e é utilizável por um usuário real. Não existe "sprint de backend" nem "sprint de design" — existe "a primeira calculadora está no ar e funciona".

Sem datas absolutas. As fatias são numeradas e a unidade é dia-dev.

## 2. Fatias

### F-0 — Esqueleto em produção · 2 dias

**Entrega.** Uma página no ar, no domínio definitivo, com TLS, servida pelo contêiner, publicada por commit.

| Inclui | Não inclui |
|---|---|
| Repositório, TypeScript, estilo, contêiner | Qualquer cálculo |
| Publicação automatizada por commit | Conteúdo |
| Domínio, DNS, TLS | Design final |
| Página inicial provisória | Anúncio |

**Pronto quando:** um commit na branch principal aparece no ar sem intervenção manual.

**Por que primeiro.** Publicação quebrada descoberta na semana sete custa uma semana. Descoberta no dia dois custa duas horas.

---

### F-1 — A primeira calculadora completa · 8 dias

**Entrega.** `/calculadora/salario-liquido` no ar, com memória de cálculo, seletor de vigência e FAQ.

Esta é a fatia mais importante do projeto. Ela constrói, de uma vez, o motor de parâmetros, o motor de cálculo, o componente de memória e o modelo de página — tudo validado por um caso real de ponta a ponta.

| Inclui | Não inclui |
|---|---|
| Motor de parâmetros com vigência (`RF-001`) | Outras calculadoras |
| Motor de cálculo: INSS e IRRF (`RF-002`) | Anúncio |
| Memória de cálculo (`RF-003`) | Busca |
| Seletor de vigência com dois exercícios (`RF-004`) | Permalink |
| Página completa com todos os estados (`RF-005`) | Guias longos |
| Casos-ouro de INSS e IRRF, bloqueadores no CI | |
| FAQ com 4 perguntas | |

**Pronto quando:** o resultado bate com os casos-ouro conferidos contra fonte oficial, a memória permite reproduzir a conta à mão, e alterar a vigência muda o resultado corretamente.

**Marco MR-1.** Ao fim de F-1, a tese do produto está demonstrável para uma pessoa real. Se ela não convencer aqui, mais calculadoras não vão resolver.

---

### F-2 — O bloco trabalhista · 7 dias

**Entrega.** Rescisão sem justa causa, pedido de demissão, férias, 13º, horas extras e FGTS no ar.

| Inclui | Não inclui |
|---|---|
| CALC-002 a CALC-007 | Anúncio |
| Regras de proporcionalidade e verbas (`RN-015` a `RN-026`) | Conteúdo longo |
| Casos-ouro de cada uma | |
| Navegação entre calculadoras relacionadas | |

**Pronto quando:** as seis passam nos casos-ouro e a navegação entre elas funciona.

**Nota de sequência.** Rescisão sem justa causa é a mais complexa do catálogo e vem antes das mais simples de propósito: se o motor não a comporta, é melhor descobrir com quatro calculadoras pela frente do que com uma.

---

### F-3 — Fechar o catálogo do v1 · 4 dias

**Entrega.** IRRF isolado, INSS isolado e juros compostos. Catálogo do v1 completo.

| Inclui | Não inclui |
|---|---|
| CALC-015, CALC-016, CALC-022 | Anúncio |
| Integração com a série econômica e seu fallback (`RF-012`) | |
| Busca local no catálogo (`RF-007`) | |
| Permalink de cálculo (`RF-006`) | |
| Páginas de categoria | |

**Pronto quando:** as dez calculadoras estão no ar, a busca funciona sem rede e um link compartilhado reproduz o cenário.

---

### F-4 — Conteúdo e descoberta · 6 dias

**Entrega.** Guias, FAQ completo e SEO técnico. O produto passa a ser encontrável.

| Inclui | Não inclui |
|---|---|
| 10 guias em MDX, ligados às calculadoras (`RF-008`) | Anúncio |
| FAQ completo em todas as dez páginas | |
| Metadata, sitemap, dados estruturados (`RF-011`) | |
| Home definitiva | |

**Pronto quando:** o sitemap está submetido e todas as rotas do v1 estão indexáveis.

**Marco MR-3.** Início da contagem de 90 dias para medir HIP-01.

**Definição de M-1 (sessões orgânicas), pendente em `00-product-brief`:** a meta é fixada na conclusão de F-4, quando o volume real de conteúdo publicado é conhecido. Fórmula: `número de guias publicados × 40 sessões/mês por guia`, medida ao fim de 90 dias.
> 📌 PREMISSA: 40 sessões mensais por guia após indexação é hipótese de mercado para conteúdo de cauda longa em domínio novo, sem autoridade acumulada. É o número mais frágil do roadmap e existe para haver um alvo falseável, não para ser preciso. Dono: mantenedor. Prazo: fim de F-4.

---

### F-5 — Acabamento e acessibilidade · 5 dias

**Entrega.** O produto passa a ser bom, não apenas correto.

| Inclui |
|---|
| Design definitivo aplicado às dez páginas |
| Auditoria de acessibilidade e correções (`RNF-008`) |
| Orçamento de performance no CI (`RNF-001` a `RNF-004`) |
| Teste de ponta a ponta dos três fluxos críticos |
| Teste C-07 — verificação de não vazamento de dado (`07-security` §4.2) |
| Observabilidade: erros e uso |

**Pronto quando:** as metas de `RNF-001` a `RNF-004` e `RNF-008` são atingidas em produção e C-07 passa.

**Nota.** C-07 fica aqui e não em F-6 de propósito: a linha de base do teste precisa existir **antes** de o primeiro script de terceiro entrar.

---

### F-6 — Monetização · 3 dias

**Entrega.** Anúncio no ar, com consentimento, sem degradar as métricas.

| Inclui |
|---|
| Plataforma de consentimento (`INT-002`) |
| Slot único com altura reservada (`RF-009`) |
| Páginas legais definitivas (`RF-010`) |
| Reexecução de C-07 **com o anúncio ativo** |
| Reverificação de CLS e LCP com o anúncio ativo |

**Pronto quando:** `RNF-002` continua atingido com o anúncio carregado e C-07 continua passando.

**Critério de reversão.** Se o anúncio degradar `RNF-001` ou `RNF-002` além da meta e não houver ajuste que resolva, o anúncio sai. A métrica de produto tem precedência sobre a receita nesta fase, porque sem tráfego não há receita a proteger.

---

### F-7 — Lançamento e observação · 2 dias

| Inclui |
|---|
| Lista de verificação pré-lançamento de `12-test-plan` |
| Primeira auditoria completa de parâmetros contra fonte oficial |
| Painéis de acompanhamento configurados |
| `15-runbook` revisado com o ambiente real |

**Pronto quando:** a auditoria retorna zero divergência (`M-3`).

---

## 3. Resumo

| Fatia | Dias | Acumulado | Entrega ao usuário |
|---|---|---|---|
| F-0 | 2 | 2 | — |
| F-1 | 8 | 10 | **Primeira calculadora utilizável** |
| F-2 | 7 | 17 | Bloco trabalhista completo |
| F-3 | 4 | 21 | Catálogo do v1 completo |
| F-4 | 6 | 27 | **Produto encontrável** |
| F-5 | 5 | 32 | Produto acessível e rápido |
| F-6 | 3 | 35 | Receita ativa |
| F-7 | 2 | **37** | **Lançamento** |

> 📌 PREMISSA: 37 dias-dev é hipótese, não medição. F-1 e F-2 concentram o risco de estouro, porque envolvem leitura de norma — trabalho que não acelera com assistência de IA na mesma proporção que código.

**Se o prazo apertar,** nesta ordem: reduzir os guias de F-4 de 10 para 5 (−2,5 dias) · adiar CALC-022 e a integração externa para depois do lançamento (−2 dias) · adiar o permalink (−1 dia).
**Nunca cortar:** os casos-ouro de F-1 a F-3, a auditoria de F-7, ou o teste C-07 de F-5. São o que separa este produto do que ele critica.

## 4. Marcos

> **Nota de nomenclatura.** Marcos usam o prefixo `MR-`. O prefixo `M-` é reservado às métricas de sucesso definidas em `00-product-brief` §6 (`M-1` sessões orgânicas, `M-2` LCP, `M-3` divergências de auditoria). Os dois conjuntos são distintos.

| Marco | Fatia | Significa |
|---|---|---|
| MR-1 · Tese demonstrável | F-1 | Uma pessoa real consegue conferir a própria conta |
| MR-2 · MVP funcional | F-3 | As dez calculadoras funcionam |
| MR-3 · Encontrável | F-4 | Começa a contagem de HIP-01 |
| MR-4 · Lançado | F-7 | Produto público, monetizado, auditado |
| MR-5 · Decisão | F-7 + 90 dias | Avaliação de HIP-01 a HIP-03 |

## 5. MR-5 — critério de decisão

Noventa dias após MR-3, com dados reais:

| Cenário | Decisão |
|---|---|
| HIP-01 e HIP-02 confirmadas | Avançar para o catálogo v2, priorizando as verticais de maior valor publicitário |
| HIP-01 confirmada, HIP-02 refutada | Há tráfego, mas o diferencial não é percebido. Investigar antes de expandir — pode ser problema de apresentação, não de tese |
| HIP-01 refutada, HIP-02 confirmada | O produto é bom e ninguém chega nele. Problema de canal, não de produto. Reavaliar aquisição; **não** adicionar calculadoras |
| Ambas refutadas | Descontinuar ou reposicionar. Adicionar cobertura é a resposta instintiva e é a que produziu o mercado atual (`00-product-brief` §8) |

## 6. Depois do v1

Sem estimativa, porque dependem de MR-5.

**v2 — 16 calculadoras.** Abre crédito, imóveis, investimentos, MEI, veículos e utilitários. Introduz dependência de série econômica em mais calculadoras, o que torna o cache um componente de primeira classe.

**v3 — 25 calculadoras.** Profundidade nos clusters e a categoria de correção monetária — o diferencial técnico mais defensável do catálogo, e o que mais se aproxima do que hoje só existe em produto pago.

**v4 — 24 calculadoras.** Cauda longa.

**Fora do roadmap até que uma hipótese o justifique:** conta de usuário, assinatura, exportação em PDF, aplicativo. Cada um exige reverter uma decisão arquitetural registrada, e reverter por hipótese não testada é como se constrói produto que ninguém pediu.

## 7. Manutenção recorrente

Não é fatia; é rotina permanente, e é o custo real do produto.

| Tarefa | Frequência | Esforço |
|---|---|---|
| Auditoria de parâmetros contra fonte oficial | Trimestral | 0,5 dia |
| Atualização de parâmetros na virada de exercício | Anual | 1 a 2 dias |
| Revisão de dependências e vulnerabilidades | Mensal | 0,25 dia |
| Revisão de conteúdo desatualizado | Semestral | 0,5 dia |

Total estimado: **4 a 6 dias-dev por ano** para manter dez calculadoras. Esse número é o que limita o crescimento do catálogo e deve ser medido na primeira virada de exercício para validar HIP-04.
