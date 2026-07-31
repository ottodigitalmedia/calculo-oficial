---
adr: 009
titulo: Guias como dado declarativo, e não MDX
status: aceita
data: 2026-07-31
contexto_de: [ADR-008, ADR-001]
substitui: nada
---

# ADR-009 · Guias como dado declarativo, e não MDX

## Situação

`CLAUDE.md` e `src/content/README.md` previam os guias em **MDX**. O T-106 é o
primeiro ticket que de fato escreve guia, e a decisão precisava ser tomada
antes de três arquivos nascerem no formato errado.

Dois fatos mudaram desde que MDX foi escolhido:

1. `ADR-008` reduziu o lançamento a **três guias**, não dez.
2. O T-103 provou o padrão do **molde**: definição declarativa mais uma página
   genérica. As quatro calculadoras existem sem nenhum arquivo de rota próprio.

## Problema real, que não é formato de arquivo

Um guia sobre INSS quer dizer quanto é a alíquota da primeira faixa. Em MDX,
esse número é **texto digitado dentro do conteúdo** — e vira uma constante
legal fora de `lib/params/`, que é a regra inviolável nº 1.

A consequência não é teórica. Quando a portaria do ano seguinte sair, a
calculadora passa a usar a tabela nova no mesmo commit do parâmetro, e o guia
continua exibindo a tabela velha — com aparência de correto, sem nenhum teste
falhando. É exatamente o modo de falha que `CLAUDE.md` declara ser o mais
provável do projeto: **publicar um número errado com aparência de certo**.

MDX não impede isso. Só o formato do arquivo não decide nada; o que decide é de
onde o número vem.

## Decisão

**Guia é dado declarativo**, no mesmo padrão das calculadoras:
`src/lib/guias/` com um tipo `Guia`, uma lista de seções, e **uma** página
genérica em `/guia/[slug]`.

Regras:

| # | Regra |
|---|---|
| G-1 | Nenhum valor legal aparece na prosa do guia. Nem alíquota, nem faixa, nem teto, nem dedução |
| G-2 | Valor legal entra por bloco (`tabelaDeFaixas`, `valorVigente`) que **lê `lib/params/`** e renderiza norma, vigência e link junto |
| G-3 | G-1 é verificado por teste, não por disciplina: a prosa é varrida em busca de padrão monetário e percentual |
| G-4 | O guia exibe sempre a **vigência mais recente cadastrada**, resolvida de forma determinística — não pela data do build |

## Consequências

**Positivas.**

- A regra nº 1 passa a valer para o conteúdo, não só para o código. Atualizar a
  portaria atualiza o guia, sem ninguém lembrar de fazê-lo.
- Zero dependência nova. MDX traria carregador, plugins de remark e uma
  superfície de HTML arbitrário que `07-security` §7 obrigaria a restringir.
- Os dados estruturados (`Article`, `BreadcrumbList`) saem da mesma estrutura,
  sem duplicar título e resumo em frontmatter.
- G-4 mantém o build determinístico: dois builds do mesmo commit produzem o
  mesmo HTML.

**Negativas, e são reais.**

- Escrever guia exige editar TypeScript. Com um mantenedor, custa pouco; com um
  redator não técnico, custaria caro.
- A prosa fica em literais de string, sem destaque de sintaxe de texto.

**Gatilho para reverter.** Entrada de alguém que escreva conteúdo e não código,
ou passar de ~10 guias. Nesse caso, MDX volta — **com G-1 preservada**, que é a
parte que importa. O formato é negociável; a origem do número não é.

## Alternativas descartadas

**MDX com os números escritos na prosa.** Descartada: viola a regra nº 1 e cria
o modo de falha silencioso descrito acima.

**MDX com componentes que leem `lib/params/`.** Resolveria G-1 e G-2, e é a
opção que voltaria a valer se o gatilho acima ocorrer. Descartada agora só pelo
custo de infraestrutura para três arquivos.

**Guia como texto corrido, sem seções.** Descartada: sem seção não há âncora,
não há sumário e não há `BreadcrumbList` decente — e busca orgânica é o único
canal de aquisição do produto.
