---
doc: ADR-007
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [16-adr/ADR-004-aritmetica-em-centavos, 01-prd]
emenda: ADR-004
---

# ADR-007 — Coeficiente legal em fração exata

## Contexto

`ADR-004` fixou duas unidades para o motor: **centavos** para dinheiro e
**basis points** para alíquota. A premissa implícita era que toda constante
legal multiplicativa cabe em basis points, isto é, tem no máximo quatro casas
decimais.

A premissa é falsa, e a exceção apareceu no primeiro parâmetro pesquisado.

O **Art. 3º-A da Lei nº 9.250/1995**, inserido pela Lei nº 15.270/2025,
estabelece a redução do imposto mensal para a faixa intermediária como:

> R$ 978,62 − (0,133145 × rendimentos tributáveis sujeitos à incidência mensal)

O coeficiente **0,133145** tem seis casas decimais. Em basis points seria
`1331,45` — não é inteiro. Não há arredondamento aceitável: truncar para `1331`
ou subir para `1332` altera o imposto de milhões de contribuintes, e o erro
cresce com o rendimento.

Vale registrar que o coeficiente **está no texto da norma**, conferido contra a
publicação oficial e corroborado pelos exemplos numéricos da Receita Federal.
Não é derivação de implementador que se pudesse simplificar.

## Opções consideradas

**A. Ampliar a unidade para mais casas — "parts per million" ou similar.**
Resolve este caso e adia o próximo. A escolha de seis casas seria tão
arbitrária quanto a de quatro, e a próxima norma com sete casas exigiria a
mesma conversa. Pior: mudaria a unidade de *todas* as alíquotas, invalidando o
que já foi construído em T-005 e todos os casos-ouro futuros por uma exceção.

**B. Ponto flutuante só para coeficiente.** É o que faz a implementação de
referência que consultamos (`0.133145` como `number`). Reintroduz exatamente o
que `ADR-004` eliminou, no ponto mais sensível — a apuração do imposto — e
seria barrado por BV-11 de qualquer modo.

**C. Fração exata: numerador e denominador inteiros.** `0,133145` vira
`133145/1000000`. Sem casas decimais, sem ponto flutuante, sem escolher uma
precisão universal.

## Decisão

**Opção C.**

Fica criada a unidade `fracao`, com `numerador` e `denominador` inteiros, para
constante legal multiplicativa que não caiba em basis points.

| # | Regra |
|---|---|
| F-1 | `numerador` e `denominador` são inteiros; `denominador` diferente de zero |
| F-2 | A fração é registrada **como a norma a expressa**, sem simplificar. `133145/1000000`, não `26629/200000` — a simplificação esconde a correspondência com o texto legal e quebra a conferência dígito a dígito da auditoria |
| F-3 | A aplicação usa `proporcao(base, numerador, denominador, politica)`, já existente desde T-005: multiplica antes de dividir e arredonda uma única vez |
| F-4 | **Basis points continua sendo o padrão.** `fracao` é exceção, e usá-la onde `bp` serve é ruído — 7,5% é `750`, nunca `75/1000` |
| F-5 | A política de arredondamento continua obrigatória e explícita (`A-4`) |

`ADR-004` permanece válido em tudo o mais. Esta é uma emenda, não uma
revogação: `A-1` (centavos), `A-3` (soma exata), `A-6` (proibição de ponto
flutuante) e `A-7` (conversão só na fronteira) seguem inalterados.

## Consequências positivas

- **Nenhuma linha do T-005 muda.** `proporcao()` foi construída para avos e
  serve à fração sem alteração — o que sugere que a abstração estava certa.
- A proibição de ponto flutuante (`A-6`) sobrevive intacta no ponto de maior
  risco do sistema.
- `F-2` mantém a auditoria conferível: quem abre a norma vê `978,62` e
  `0,133145` e encontra os mesmos dígitos no parâmetro.
- Absorve normas futuras com qualquer número de casas, sem nova decisão.

## Consequências negativas

- Duas unidades multiplicativas em vez de uma. `F-4` existe para conter a
  proliferação, mas depende de disciplina — e disciplina erode.
- `fracao` é menos legível que `750` na leitura do parâmetro.
- A validação de build ganha um caso a mais (`BV-06` precisa reconhecer o novo
  tipo).

## Custo de reversão

**Baixo.** É acréscimo, não substituição: nada que hoje usa basis points muda.
Reverter significaria remover a unidade e voltar a não conseguir representar o
redutor — ou seja, não é uma reversão desejável, é a ausência de solução.

## Alcance imediato

Um parâmetro: o coeficiente do redutor do imposto mensal (`RN-013`). Nenhum
outro parâmetro do v1 precisa de `fracao`.
