# `components/`

Biblioteca especificada em `docs/10-ux-ui-spec.md` §3.

O componente que carrega a tese do produto é `MemoriaCalculo` (§4, regras MC-1
a MC-8). Nenhum anúncio dentro dele, em nenhuma circunstância (MC-5).

## Os quatro componentes de cliente

`Calculadora` · `campos` · `MemoriaCalculo` · `BuscaCatalogo`.

Só eles têm `'use client'`, e é o código deles que o navegador baixa — por isso
`RNF-004` se decide aqui. Dois cuidados valem para os quatro:

1. **Não importar o registro de calculadoras** (`@/lib/calculadoras`). Ele
   arrasta as definições, os FAQ e os motores de todas para o pacote da rota.
   `Calculadora` recebe o formulário já resolvido, do servidor; `BuscaCatalogo`
   lê o índice leve de `calculadoras/indice.ts`. Verificado por lint —
   `REGISTRO_FORA_DO_CLIENTE` em `eslint.config.js`.
2. **Componente de cliente novo entra naquela lista** do `eslint.config.js`. A
   seleção é por caminho de arquivo, porque `'use client'` é diretiva de
   conteúdo e o ESLint não a enxerga.

Ver `ESTADO-DO-PROJETO.md` §7.6.
