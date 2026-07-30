# `leak/` — não vazamento de dado

TC-040 a TC-043 (`12-test-plan` §7). Implementa o controle C-07 de
`07-security` §4.2 — o único que transforma a promessa central do produto em
verificação executável.

Critério: preencher com valores marcadores únicos, interceptar todo o tráfego
de saída, **falhar se qualquer marcador aparecer**.

Os marcadores vão apenas nos campos de formulário das calculadoras, nunca no
campo de busca do catálogo (`RN-031.1`).

Configuração em `playwright.leak.config.ts`. Começa em T-034 — antes do
primeiro script de terceiro entrar.
