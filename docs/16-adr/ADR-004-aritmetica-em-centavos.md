---
doc: ADR-004
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [01-prd]
---

# ADR-004 — Aritmética monetária em inteiros de centavos

## Contexto

Todo cálculo do produto é monetário e passa por múltiplas etapas encadeadas: base, faixas progressivas, deduções, proporcionalidades por avos, terços, adicionais. Um erro de centavo acumulado ao longo de dez etapas se torna um erro visível.

Isso importa mais aqui do que na média dos sistemas por uma razão específica: o usuário confere o resultado contra o holerite. Uma diferença de centavo não é arredondamento tolerável — é evidência, para ele, de que a ferramenta está errada. E a tese inteira do produto é confiabilidade.

Números de ponto flutuante não representam frações decimais exatamente. É por isso que `0,1 + 0,2` não resulta em `0,3` em praticamente nenhuma linguagem de uso corrente.

## Opções consideradas

**A. Ponto flutuante com arredondamento em cada etapa.** Natural de escrever e é o que a maioria dos sites faz. Acumula erro de forma imprevisível e torna o resultado dependente da ordem das operações.

**B. Biblioteca de decimal arbitrário.** Correta e expressiva. Custo: uma dependência de runtime no motor, o que contradiz `ADR-003` e reintroduz cadeia de dependências no ponto mais sensível do sistema.

**C. Inteiros em centavos, sem dependência.** Aritmética exata para soma e subtração; multiplicação e divisão exigem tratamento explícito de arredondamento.

## Decisão

**Opção C.**

| # | Regra |
|---|---|
| A-1 | Todo valor monetário é inteiro em centavos dentro do motor |
| A-2 | Alíquotas são inteiros em basis points — 7,5% é `750` |
| A-3 | Soma e subtração são exatas |
| A-4 | Multiplicação por alíquota arredonda explicitamente, com a política declarada na função |
| A-5 | O arredondamento de apresentação **não** propaga para a etapa seguinte, salvo quando a norma exigir (`RN-006`) |
| A-6 | Operação de ponto flutuante sobre valor monetário é proibida e verificada por análise estática (BV-11) |
| A-7 | A conversão para real ocorre apenas na camada de formatação (C-M4 de `ADR-003`) |

## Consequências positivas

- Soma e subtração exatas por construção, sem erro acumulado.
- Casos-ouro comparam inteiros por igualdade estrita. Não há tolerância a definir, e "quase igual" nunca passa despercebido.
- Nenhuma dependência adicionada ao motor, preservando `ADR-003`.
- A-5 concentra a decisão de arredondamento em pontos explícitos e documentados, em vez de deixá-la implícita em cada operação.
- BV-11 impede mecanicamente a reintrodução do problema por um commit distraído.

## Consequências negativas

- Menos legível: `450000` no lugar de `4500.00`. Mitigado por tipo nomeado e por convenção de sufixo nos nomes de campo.
- Divisão exige política de arredondamento explícita em cada ponto, e escolher errado produz divergência real. É trabalho de leitura de norma, não de código.
- A conversão na fronteira precisa ser aplicada sem exceção; esquecê-la produz valor absurdo na tela.
- Percentuais em basis points são pouco intuitivos na leitura dos parâmetros.

**Risco residual reconhecido.** A decisão elimina o erro de representação, mas não elimina o erro de **política de arredondamento**. Saber em quais etapas a norma exige arredondamento intermediário é pesquisa jurídica, e está marcado como verificação pendente em `RN-006`. Esta é a fonte mais provável de divergência de centavos que resta no sistema.

## Custo de reversão

**Muito alto.** Trocar a representação depois exigiria revisar cada operação do motor, cada caso-ouro e cada ponto de formatação — na prática, reescrever o motor com a suíte de testes inválida durante a transição.

É uma decisão de fundação. Tomada corretamente no início, custa legibilidade; tomada errado, custa o produto.
