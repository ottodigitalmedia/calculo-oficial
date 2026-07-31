# `content/` — reservado

Estava previsto para guias e FAQ em MDX. **Não é mais o caminho**: `ADR-009`
decidiu guia como dado declarativo em `src/lib/guias/`, e o FAQ vive na
definição de cada calculadora.

O motivo não é preferência de formato. Um valor legal escrito na prosa de um
guia é constante legal fora de `lib/params/` — a regra inviolável nº 1 — e
produz o pior modo de falha do projeto: a portaria nova entra, a calculadora
passa a usá-la, e o guia continua exibindo a tabela velha sem nada falhar.

A pasta fica porque `ADR-009` registra o gatilho de reversão: entrada de alguém
que escreva conteúdo e não código, ou passar de ~10 guias. Nesse caso MDX volta
— com G-1 preservada, que é a parte que importa.
