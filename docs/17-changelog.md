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

## Lançamento — 31/07/2026

**MR-2 alcançado.** Produto público em `https://calculoficial.com.br`. Começa a
contagem dos 90 dias de medição.

**No ar:** 4 calculadoras · 3 guias · busca · permalink · memória de cálculo
auditável · 4 páginas legais · sitemap e robots.

### Conferência pós-deploy em produção

Passo 7 de "Ao atualizar um parâmetro legal" (`CLAUDE.md`). Salário bruto de
R$ 5.000,00, refeito à mão a partir dos números da **fonte**, não do código:

| Etapa | À mão | Produção |
|---|---|---|
| INSS faixa 1 · 1.621,00 × 7,5% | 121,58 | |
| INSS faixa 2 · 1.281,84 × 9% | 115,37 | |
| INSS faixa 3 · 1.451,43 × 12% | 174,17 | |
| INSS faixa 4 · 645,73 × 14% | 90,40 | |
| **INSS total** | **501,51** | **R$ 501,51** ✅ |
| IRRF · desconto simplificado, base 3.891,29 | 200,05 | |
| IRRF · deduções legais, base 4.498,49 | 336,67 — descartado, pior | |
| Redutor, §1º: min(312,89 ; 200,05) | 200,05 | |
| **IRRF devido** | **0,00** | **R$ 0,00** ✅ |
| **Líquido** | **4.498,49** | **R$ 4.498,49** ✅ |

A memória de cálculo em produção cita as três normas corretas: Portaria MPS/MF
13/2026, Lei 15.191/2025 e o Art. 3º-A na redação da Lei 15.270/2025.

A tabela do guia de INSS é renderizada a partir de `lib/params/` e traz o link
oficial ao lado (`ADR-009` G-2), confirmando que o conteúdo não tem valor legal
digitado à mão.

### Cabeçalhos verificados no ar

`Referrer-Policy: strict-origin` · `X-Content-Type-Options: nosniff` ·
`X-Frame-Options: DENY` · `Permissions-Policy`. As 16 rotas respondem 200.

### O que ficou de fora, com o motivo

| O quê | Por quê |
|---|---|
| `Content-Security-Policy` | Depende das origens exatas do provedor de anúncio; curinga anularia a proteção contra AM-02 |
| `Strict-Transport-Security` | `13-deployment` §7 condiciona à estabilidade do TLS. Ativar no próximo ciclo — HSTS mal configurado tira o site do ar por meses |
| Deploy automático | Decisão registrada em `13-deployment` §4 |
| `www.calculoficial.com.br` | Não servido pelo EasyPanel |
| Vale-transporte (`RN-027`) | Percentual legal não localizado em fonte oficial |
| Anúncio, análise de uso, série do Banco Central | `ADR-008` |

---

## Auditoria de parâmetros — 31/07/2026

- **Ciclo:** pré-lançamento (T-108)
- **Escopo:** os 9 parâmetros com vigência aberta
- **Divergências encontradas:** 0
- **Links de fonte verificados:** 5 · quebrados e corrigidos: 0
- **Tempo gasto:** ~0,4 h — insumo para `HIP-04`

Conferência dígito a dígito contra a fonte oficial, não contra o que outra
página diz que a fonte oficial contém.

### `inss-tabela-progressiva` · a partir de 2026-01-01

Fonte: Portaria Interministerial MPS/MF nº 13, de 09/01/2026, Anexo II.
Conferido na página institucional do INSS, que atribui os valores expressamente
a essa portaria e informa aplicação a partir da competência janeiro/2026 — o
PDF da portaria é digitalizado, sem camada de texto.

| Cadastrado | Fonte oficial | |
|---|---|---|
| até 1.621,00 · 7,50% | Até R$ 1.621,00 · 7,5% | ✅ |
| 1.621,01 a 2.902,84 · 9,00% | De R$ 1.621,01 a R$ 2.902,84 · 9% | ✅ |
| 2.902,85 a 4.354,27 · 12,00% | De R$ 2.902,85 até R$ 4.354,27 · 12% | ✅ |
| 4.354,28 a 8.475,55 · 14,00% | De R$ 4.354,28 até R$ 8.475,55 · 14% | ✅ |

### `salario-minimo` · a partir de 2026-01-01

Cadastrado R$ 1.621,00. A mesma página o usa como salário de contribuição do
contribuinte individual, facultativo e MEI. ✅

### `irrf-tabela-progressiva` · a partir de 2025-05-01

Fonte: Lei nº 15.191, de 11/08/2025. Conferido na tabela publicada pela Receita
Federal para 2026, que cita essa lei.

| Cadastrado | Fonte oficial | |
|---|---|---|
| até 2.428,80 · isento | Até R$ 2.428,80 · — | ✅ |
| 2.428,81 a 2.826,65 · 7,50% · deduzir 182,16 | idem | ✅ |
| 2.826,66 a 3.751,05 · 15,00% · deduzir 394,16 | idem | ✅ |
| 3.751,06 a 4.664,68 · 22,50% · deduzir 675,49 | idem | ✅ |
| acima de 4.664,68 · 27,50% · deduzir 908,73 | idem | ✅ |

### `irrf-deducao-dependente` e `irrf-desconto-simplificado` · a partir de 2025-05-01

R$ 189,59 e R$ 607,20. Ambos conferem com a mesma página da Receita. ✅

### Redutor do Art. 3º-A · a partir de 2026-01-01

Fonte: Lei nº 9.250/1995 com a redação da Lei nº 15.270, de 26/11/2025.
Conferido contra o texto publicado no Legin da Câmara.

| Parâmetro | Cadastrado | Texto da norma | |
|---|---|---|---|
| `irrf-reducao-limite-integral` | R$ 5.000,00 | "até R$ 5.000,00" | ✅ |
| `irrf-reducao-valor-maximo` | R$ 312,89 | "até R$ 312,89 (de modo que o imposto devido seja zero)" | ✅ |
| `irrf-reducao-constante` | R$ 978,62 | "R$ 978,62 − (0,133145 × rendimentos…)" | ✅ |
| `irrf-reducao-coeficiente` | 133145/1000000 | "0,133145" | ✅ |
| `irrf-reducao-limite-aplicacao` | R$ 7.350,00 | §2º "superior a R$ 7.350,00 … não terão redução" | ✅ |

O §1º — redução limitada ao imposto determinado pela tabela — confere com
`RN-013.1` e com o comportamento verificado por mutação no T-102.

**Achado sem divergência, para o backlog.** O §3º estende a redução ao imposto
do décimo terceiro salário. Não afeta nenhuma calculadora publicada; precisa
ser considerado quando CALC-005 for construída.

### Links de fonte

As 5 URLs distintas respondem 200 e carregam a norma correta. Todas em domínio
oficial, conforme `BV-07`.

### TLS

Certificado de `calculoficial.com.br` emitido por Let's Encrypt em 30/07/2026,
válido até 28/10/2026. **A renovação automática está confirmada por evidência**,
não por configuração: o certificado anterior foi substituído sozinho, sem
intervenção.

---

## [Não lançado]

### Adicionado
- Fundação documental do projeto: catálogo, PRD, arquitetura, modelo de dados, segurança, testes, deploy, observabilidade, runbook e seis registros de decisão arquitetural.
- `RN-031.1` — exceção única e exaustiva a `RN-031`, cobrindo o evento `busca_sem_resultado`. Antes a exceção existia apenas em `14-observability` §4.3, sem contrapartida no PRD nem no critério de TC-042.
- `00-catalogo-calculadoras` §17 — registro das nove calculadoras que não satisfazem a regra 4 de crescimento do catálogo, com regra de resolução antes da abertura de cada fase.
- `EP-016` `/api/health` — rota de verificação de saúde, exigida pela regra D-4 de `13-deployment` §3 e consumida pelo passo pós-deploy que dispara o rollback automático. Única rota não estática do sistema; registrada em `06-api-spec` §2.2 e na matriz de autorização de `07-security` §3, porque rota nova precisa ser alteração visível na documentação e não acréscimo silencioso.
- Ferramental (T-001) e empacotamento em contêiner (T-002): as regras invioláveis de `CLAUDE.md` passam a ser verificadas mecanicamente por lint, e a imagem de produção é construída em múltiplos estágios, sem código-fonte nem dependência de desenvolvimento, com processo sem privilégio.
- Pipeline de integração e entrega (T-003), na ordem de `13-deployment` §4, com a assimetria de R-3 preservada: parâmetro legal inválido interrompe antes do build; falha da série econômica prossegue com aviso.
- `ADR-007` — unidade `fracao` para coeficiente legal que não cabe em basis points. O redutor do Art. 3º-A da Lei nº 9.250/1995 usa `0,133145`, que em basis points seria `1331,45` — não inteiro. Emenda a `ADR-004`, que permanece válido em tudo o mais.
- `ADR-008` — escopo enxuto para o lançamento. O plano anterior contradizia o próprio marco MR-1: declarava a tese demonstrável ao fim da primeira calculadora e construía mais nove antes de lançar.
- `RN-013.1` — forma exata do redutor do imposto mensal, conferida contra o texto do art. 3º-A. A redação genérica anterior não capturava que a faixa de até R$ 5.000 usa teto fixo e não a fórmula, divergência de R$ 133 num rendimento de R$ 4.000.
- `ADR-009` — guia é dado declarativo em `lib/guias/`, não MDX. A decisão não é de formato: um valor legal escrito na prosa de um guia é constante legal fora de `lib/params/` (regra inviolável nº 1) e produz o pior modo de falha do projeto — a portaria nova entra, a calculadora passa a usá-la, e o guia segue exibindo a tabela velha, com aparência de correto e sem nada falhar. Regra **G-1** proíbe; `tests/unit/guias.test.ts` verifica.
- **Regra inviolável nº 11** em `CLAUDE.md`, decorrente de G-1.
- **EP-005, EP-006, EP-013 e EP-014** (T-106): `/guias`, `/guia/{slug}`, `/sitemap.xml` e `/robots.txt`. As rotas do sitemap são derivadas dos registros de calculadoras e de guias — publicar uma calculadora a coloca no sitemap no mesmo commit. Uma calculadora publicada e ausente do sitemap seria invisível para o único canal de aquisição do produto, sem nada quebrar.
- **Três guias**: como o INSS é calculado · imposto de renda na folha · salário bruto e líquido. As tabelas e valores exibidos vêm de `lib/params/`, com norma, vigência e link ao lado de cada um.
- **Dados estruturados** `WebSite`, `WebApplication`, `FAQPage`, `Article` e `BreadcrumbList`, montados a partir dos mesmos objetos que a página renderiza — não há como o marcado divergir do exibido. Registrada em `DadosEstruturados.tsx` a pendência de contemplar o `<script>` por hash quando a política de segurança de conteúdo entrar.
- **TC-040 e TC-041 implementados** (`tests/leak/vazamento.spec.ts`) — o controle C-07 de `07-security` §4.2, único mecanismo que torna `RN-030` executável. Marcadores nos quatro formulários, todo o tráfego interceptado, e a busca por eles em URL, corpo, cabeçalhos e Base64. TC-042 e TC-043 não têm objeto (`ADR-008` adiou análise e anúncio) e foram substituídos por um teste de linha de base que **reprova no dia em que o objeto surgir**.
- **Cabeçalhos de segurança** em `next.config.ts`: `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy`. `Content-Security-Policy` e `Strict-Transport-Security` continuam adiadas, cada uma com o motivo registrado.
- **Auditoria de acessibilidade** (`tests/e2e/acessibilidade.spec.ts`): varredura A e AA em 13 rotas e no estado com resultado na tela, mais os percursos que ferramenta nenhuma vê — ordem de tabulação, ausência de armadilha de foco, indicador visível de foco, região dinâmica cortês, associação de erro ao campo e alvo de toque.
- **BV-12 implementado** (`npm run validate:commits`): formato convencional com escopo obrigatório para todo commit, e os quatro campos de fonte exigidos em commit de parâmetro legal. Era a única verificação estrutural declarada e sem execução.

### Alterado
- **`11-roadmap` e `BACKLOG` reescritos na versão 2.0** por `ADR-008`: lançamento com 4 calculadoras em ~12 dias-dev, contra 10 calculadoras em 36,75 dias. 40 tickets viraram 8. Nada removido do projeto — reordenado, com o que foi adiado declarado no ADR.
- Estrutura de arquivos restaurada para a forma que `CLAUDE.md` e `docs/README.md` assumem: documentos em `docs/`, ADRs em `docs/16-adr/`. Estavam achatados na raiz, o que quebrava todos os links relativos entre documentos.
- `README.md` da raiz passa a ser o README do produto; o índice da documentação volta para `docs/README.md`. Os dois estavam trocados.
- `00-catalogo-calculadoras` §15 — quebra por fase corrigida de 10/16/25/24 para **10/17/28/20**, conferida contra a coluna `Fase` das tabelas §4 a §13. O total (75) já estava correto.
- `04-architecture` §9 — o ponto de quebra de auditoria deixa de afirmar que o catálogo cabe no limite. Contagem real de calculadoras com parâmetro versionado, acumulada por fase: 9 · 16 · 24 · **29**, contra um teto declarado de ~25. O limite é cruzado em v4.
- `12-test-plan` §7 — TC-042 passa a admitir `busca_sem_resultado` e a verificar que ela é a única exceção; escopo dos marcadores de TC-040 e TC-043 restrito aos formulários de calculadora. Como estava, o teste bloqueador reprovava comportamento especificado.
- **`Referrer-Policy` corrigida de `strict-origin-when-cross-origin` para `strict-origin`.** O valor documentado em `07-security` §5 **não** mitigava a ameaça que ele mesmo declarava: preserva a URL completa em requisição de mesma origem, e aqui todas as requisições de recurso são de mesma origem. Encontrado por TC-040 — ao digitar o salário, `replaceState` o punha na query e o `Referer` o levava ao registro de acesso do servidor.
- **`--color-text-secondary` corrigida de `#55607190` para `#556071`.** Os dois dígitos finais eram 56% de transparência; sobre branco o contraste caía para **2,5:1** contra os 4,5:1 de `RNF-006`. Reprovava na linha de contexto, no detalhamento, no texto de ajuda de campo e em todas as respostas do FAQ — ou seja, em toda a prosa secundária do site.
- **`--color-accent` nunca existiu.** Três usos apontavam para um token inexistente, incluindo a borda de foco dos campos e a cor do link para a norma dentro da memória de cálculo. Trocados por `--color-brand`.
- **Alvo de toque das migalhas e do rodapé** subiu de 19 px para 28 px — WCAG 2.2 (2.5.8) exige 24.
- **`--passWithNoTests` removido** de `test:golden`, `test:e2e` e `test:leak`. Era a máscara que permitiria a suíte inteira desaparecer sem o pipeline notar.
- **TC-051 passou a medir** (`npm run check:orcamento`). Do T-003 ao T-105 o passo era um `echo` justificado por "ainda não há rota de calculadora para medir" — havia desde o T-103, e o `echo` continuou passando, que é exatamente o que o comentário ao lado dele advertia. Hoje soma o JavaScript comprimido por rota a partir do manifesto do build e bloqueia acima de 120 kB. Rota de calculadora: **117,6 kB**, folga de 2,4 kB.
- **`relacionadas` passou a ser renderizado** na página de calculadora. Era critério de aceite do T-104: as quatro calculadoras declaravam relacionadas desde então e nenhuma página as exibia.
- **Rodapé** deixou de anunciar como "em breve" INSS, Imposto de Renda e juros compostos — as três publicadas no T-104. Passou a derivar do registro; a divergência não tem como voltar.
- **Home 7,6 kB mais leve** (112,6 → 105,0 kB comprimidos). A busca importava o registro completo de calculadoras e, por ele, o motor de cálculo e as tabelas de INSS e IRRF, para filtrar quatro nomes. Passou a usar `calculadoras/indice.ts`, mantido em sincronia por `tests/unit/catalogo.test.ts`.
- **Deploy manual passou a ser estado esperado, não falha.** O webhook do EasyPanel só é alcançável pelo domínio do painel, que é configuração do servidor inteiro — e a VPS hospeda outros projetos, com o painel já em domínio próprio. O passo tenta e avisa; falhar deixaria o pipeline permanentemente vermelho por condição esperada, e vermelho permanente ensina a ignorar vermelho.
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
