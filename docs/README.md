---
doc: README
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: []
---

# Documentação — Cálculo Oficial

Fundação documental do projeto. **A documentação é o artefato; o código deriva dela.**
Nenhuma linha de código de aplicação é escrita antes da auditoria de consistência (GATE 2).

## Tier adotado

**Tier 2 — PADRÃO.** O risco dominante do projeto não é escala nem pagamento: é cálculo incorreto publicado em escala. Isso torna obrigatórios plano de testes, observabilidade, runbook e registro de decisões arquiteturais, ainda que não haja banco de dados, autenticação ou dado pessoal.

## Índice

| # | Documento | Status | Descrição |
|---|---|---|---|
| — | [00-catalogo-calculadoras](00-catalogo-calculadoras.md) | ✅ aprovado | Escopo: as 75 calculadoras, categorias e fases |
| 00 | [00-product-brief](00-product-brief.md) | ✅ aprovado | Problema, público, valor, concorrência, métricas |
| 01 | [01-prd](01-prd.md) | ✅ gerado | RF, RN, RNF com IDs rastreáveis |
| 02 | [02-user-stories](02-user-stories.md) | ✅ gerado | US com critérios Given/When/Then |
| 03 | [03-functional-spec](03-functional-spec.md) | ✅ gerado | Uma seção por calculadora; microcopy final |
| 04 | [04-architecture](04-architecture.md) | ✅ gerado | Diagramas, stack por camada, limites |
| 05 | [05-data-model](05-data-model.md) | ✅ gerado | Modelo de parâmetros e vigências (sem SQL) |
| 06 | [06-api-spec](06-api-spec.md) | ✅ gerado | Rotas internas e integração com o SGS/BCB |
| 07 | [07-security](07-security.md) | ✅ gerado | LGPD, CSP, consentimento, ausência de PII |
| 10 | [10-ux-ui-spec](10-ux-ui-spec.md) | ✅ gerado | Tokens, estados, acessibilidade, memória de cálculo |
| 11 | [11-roadmap](11-roadmap.md) | ✅ gerado | Fatias verticais entregáveis |
| 12 | [12-test-plan](12-test-plan.md) | ✅ gerado | **Crítico.** Casos-ouro e critério de bloqueio |
| 13 | [13-deployment](13-deployment.md) | ✅ gerado | Docker, EasyPanel, CI/CD, rollback |
| 14 | [14-observability](14-observability.md) | ✅ gerado | Erros, Web Vitals, falha externa, KPIs |
| 15 | [15-runbook](15-runbook.md) | ✅ gerado | Procedimento por incidente provável |
| 16 | [16-adr/](16-adr/) | ✅ gerado | ADR-001 a ADR-006 |
| 17 | [17-changelog](17-changelog.md) | ✅ gerado | Inclui histórico de mudança de parâmetro legal |

**Não gerados neste projeto:**
`08`, `09`, `22` — não há IA no produto.
`18` a `21` — Tier 3: não há multi-tenant, dado regulado nem integração crítica.

## Handoff (gerado por último)

`CLAUDE.md` · `README.md` · `.env.example` · `BACKLOG.md`

## Convenções de rastreabilidade

| Prefixo | Significa |
|---|---|
| `CALC-` | Calculadora do catálogo |
| `RF-` | Requisito funcional |
| `RN-` | Regra de negócio |
| `RNF-` | Requisito não funcional |
| `US-` | User story |
| `ENT-` | Entidade do modelo de dados |
| `EP-` | Endpoint / rota |
| `TC-` | Caso de teste |
| `ADR-` | Registro de decisão arquitetural |
| `RSK-` | Risco |
| `HIP-` | Hipótese a validar |

IDs nunca são reciclados. Item descontinuado mantém o ID reservado.

## Marcadores usados nos documentos

- `> 📌 PREMISSA:` decisão tomada pelo autor do documento na ausência de definição externa. Revisável.
- `> ⚠️ VERIFICAR:` informação que não pode ser assumida e precisa ser confirmada em fonte primária antes de virar código.
