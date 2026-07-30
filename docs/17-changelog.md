---
doc: 17-changelog
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: [05-data-model]
---

# Changelog

Registro de mudanças do produto. Sem datas absolutas: as versões são a unidade de tempo.

Este documento tem uma seção que a maioria dos changelogs não tem — **correções de parâmetro legal** — e ela existe porque, neste produto, um valor errado é o incidente mais grave possível, e ocultá-lo custaria mais do que o próprio erro.

## Convenções

| Categoria | Uso |
|---|---|
| `Adicionado` | Calculadora, guia ou funcionalidade nova |
| `Alterado` | Mudança de comportamento existente |
| `Corrigido` | Defeito de software |
| **`Parâmetro`** | Nova vigência de parâmetro legal — rotina esperada |
| **`Correção de parâmetro`** | **Valor publicado estava incorreto.** Sempre com exposição declarada |
| `Auditoria` | Registro de auditoria periódica, mesmo sem divergência |
| `Removido` | Funcionalidade ou calculadora descontinuada |
| `Segurança` | Correção de segurança ou de privacidade |

**Regra obrigatória.** Toda entrada de `Correção de parâmetro` declara: o que estava errado, desde quando, quais calculadoras foram afetadas, qual a correção e qual caso-ouro foi adicionado para impedir a repetição. Sem exceção, sem eufemismo.

---

## [Não lançado]

### Adicionado
- Fundação documental do projeto: catálogo, PRD, arquitetura, modelo de dados, segurança, testes, deploy, observabilidade, runbook e seis registros de decisão arquitetural.
- `RN-031.1` — exceção única e exaustiva a `RN-031`, cobrindo o evento `busca_sem_resultado`. Antes a exceção existia apenas em `14-observability` §4.3, sem contrapartida no PRD nem no critério de TC-042.
- `00-catalogo-calculadoras` §17 — registro das nove calculadoras que não satisfazem a regra 4 de crescimento do catálogo, com regra de resolução antes da abertura de cada fase.
- `EP-016` `/api/health` — rota de verificação de saúde, exigida pela regra D-4 de `13-deployment` §3 e consumida pelo passo pós-deploy que dispara o rollback automático. Única rota não estática do sistema; registrada em `06-api-spec` §2.2 e na matriz de autorização de `07-security` §3, porque rota nova precisa ser alteração visível na documentação e não acréscimo silencioso.
- Ferramental (T-001) e empacotamento em contêiner (T-002): as regras invioláveis de `CLAUDE.md` passam a ser verificadas mecanicamente por lint, e a imagem de produção é construída em múltiplos estágios, sem código-fonte nem dependência de desenvolvimento, com processo sem privilégio.

### Alterado
- Estrutura de arquivos restaurada para a forma que `CLAUDE.md` e `docs/README.md` assumem: documentos em `docs/`, ADRs em `docs/16-adr/`. Estavam achatados na raiz, o que quebrava todos os links relativos entre documentos.
- `README.md` da raiz passa a ser o README do produto; o índice da documentação volta para `docs/README.md`. Os dois estavam trocados.
- `00-catalogo-calculadoras` §15 — quebra por fase corrigida de 10/16/25/24 para **10/17/28/20**, conferida contra a coluna `Fase` das tabelas §4 a §13. O total (75) já estava correto.
- `04-architecture` §9 — o ponto de quebra de auditoria deixa de afirmar que o catálogo cabe no limite. Contagem real de calculadoras com parâmetro versionado, acumulada por fase: 9 · 16 · 24 · **29**, contra um teto declarado de ~25. O limite é cruzado em v4.
- `12-test-plan` §7 — TC-042 passa a admitir `busca_sem_resultado` e a verificar que ela é a única exceção; escopo dos marcadores de TC-040 e TC-043 restrito aos formulários de calculadora. Como estava, o teste bloqueador reprovava comportamento especificado.
- `13-deployment` §5 — acrescentadas `NEXT_PUBLIC_AD_SLOT_ID`, `NEXT_PUBLIC_CMP_ID`, `BCB_API_BASE_URL` e `BCB_TIMEOUT_MS`, que existiam em `.env.example` e não na tabela, mais a regra de sincronia entre os dois.

---

## Modelo de entrada

Ao lançar cada versão, copiar a estrutura abaixo e preencher apenas as seções aplicáveis.

```markdown
## [v1.0] — Lançamento

### Adicionado
- CALC-001 Salário líquido, com memória de cálculo e seletor de vigência
- ... demais calculadoras do v1
- 10 guias em MDX

### Parâmetro
- Tabela progressiva do imposto — vigência a partir de {periodo}
  Fonte: {norma} · {url}
  Verificado contra: {como foi conferido}
  Casos-ouro: {ids}

### Auditoria
- Auditoria completa de parâmetros. Divergências: nenhuma.
```

---

## Modelo de correção de parâmetro

```markdown
### Correção de parâmetro

**{Nome do parâmetro} — valor incorreto na vigência {periodo}**

- **O que estava errado:** {descrição objetiva}
- **Publicado desde:** {versão}
- **Corrigido em:** {versão}
- **Calculadoras afetadas:** {ids}
- **Impacto estimado no resultado:** {faixa de divergência}
- **Correção:** {o que foi alterado}
- **Fonte conferida:** {norma} · {url}
- **Caso-ouro adicionado:** {id} — teria detectado este erro
- **Por que não foi detectado antes:** {análise honesta da lacuna}
```

O último campo é o mais importante. Sem ele, a correção conserta o valor e preserva a falha de processo que o produziu.

---

## Modelo de registro de auditoria

Registrado a cada ciclo, **mesmo quando nada muda**. "Auditado, sem divergência" é informação: prova que a verificação aconteceu e mantém `M-3` mensurável.

```markdown
### Auditoria

- **Ciclo:** {trimestral | virada de exercício}
- **Escopo:** {parâmetros com vigência aberta}
- **Divergências encontradas:** {número}
- **Links de fonte verificados:** {número} · quebrados e corrigidos: {número}
- **Tempo gasto:** {horas} — insumo para HIP-04
```

---

## Nota sobre versionamento

O produto usa versionamento semântico adaptado:

| Componente | Muda quando |
|---|---|
| Maior | Mudança que altera resultados de forma incompatível, ou remoção de calculadora |
| Menor | Calculadora nova, funcionalidade nova, nova vigência de parâmetro |
| Correção | Defeito de software, ajuste de conteúdo, correção de parâmetro |

**Observação deliberada.** Nova vigência de parâmetro é versão *menor*, não *correção* — porque o resultado para uma mesma data de referência não muda. É essa propriedade que `RF-004` garante e que os casos-ouro das vigências anteriores protegem (regra MG-2 de `13-deployment`).
