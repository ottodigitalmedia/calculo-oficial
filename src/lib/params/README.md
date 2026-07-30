# `params/` — parâmetros legais por vigência

Entidade central do sistema (`ADR-001`, `05-data-model` §3).

Toda constante legal vive aqui, com `vigencia_inicio`, `vigencia_fim`, `valor`,
`fonte_norma` e `fonte_url` de domínio oficial. Nenhuma constante legal existe
fora deste diretório (`RN-001`, BV-10).

Vigência publicada nunca é sobrescrita: é encerrada com `vigencia_fim` e
permanece consultável para cálculo retroativo (`RF-004`).

Commit de parâmetro tem formato próprio e obrigatório — ver `CLAUDE.md`.

Começa em T-006. Os dados, em T-007.
