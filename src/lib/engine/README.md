# `engine/` — motor de cálculo

Pacote puro. Quatro contratos, verificados por lint (`eslint.config.js`):

| | Regra | Origem |
|---|---|---|
| C-M1 | Toda função pública retorna resultado **e** traço | `ADR-003` |
| C-M2 | Puro: não lê relógio, rede nem ambiente | `ADR-003` |
| C-M3 | Erro de domínio retorna valor tipado, nunca exceção | `ADR-003` |
| C-M4 | Não formata: devolve centavos e basis points | `ADR-003` |

Zero dependência de runtime — decisão de segurança, não de portabilidade (`07-security` §8).

Começa em T-005.
