/**
 * A grade da página — **uma só, para todas as rotas**.
 *
 * ## O DEFEITO QUE ISTO CORRIGE ERA VISÍVEL E NINGUÉM MEDIA
 *
 * Até 08/08/2026 cada rota escolhia a própria largura à mão: a home em
 * `max-w-6xl`, a calculadora em `5xl`, `/guias` em `4xl`, e o guia e as cinco
 * páginas legais em `3xl`. O cabeçalho e o rodapé, esses, sempre em `6xl`.
 *
 * O resultado, medido em 1280 px: o logotipo começa em **x = 77** e o título de
 * `/contato` começa em **x = 269**. Cento e noventa e dois pixels de
 * desalinhamento entre o topo da página e o conteúdo dela — em cinco rotas, o
 * site parecia quatro modelos diferentes costurados.
 *
 * Nada acusava, porque não havia o que acusar: quatro números soltos em quatro
 * arquivos não formam uma regra que se possa quebrar.
 *
 * ## O QUE A ESPECIFICAÇÃO PEDE, E COMO AS DUAS COISAS CABEM JUNTAS
 *
 * `10-ux-ui-spec` §2.4 manda, em `lg`: *"conteúdo centralizado, largura máxima
 * de leitura"*. As duas exigências são de níveis diferentes, e é isso que
 * permite atendê-las ao mesmo tempo:
 *
 *   - **`GRADE` é centralizada** — `mx-auto` sobre `max-w-6xl`. A página, como
 *     bloco, fica no meio da tela, e alinhada com cabeçalho e rodapé.
 *   - **`LEITURA` limita a MEDIDA do texto** — a coluna de prosa não passa de
 *     ~70 caracteres por linha, que é o que a legibilidade pede. Ela é
 *     alinhada à esquerda DENTRO da grade, e é isso que põe a primeira letra
 *     do título na mesma vertical do logotipo.
 *
 * Centralizar também a coluna de leitura seria reproduzir o desalinhamento — foi
 * exatamente o que aconteceu.
 *
 * ## A MARGEM DO CELULAR NÃO MUDA, E ISSO IMPORTA
 *
 * `px-5` era o único valor que já estava igual em todas as rotas, e continua.
 * Abaixo de 1152 px nenhum `max-w-*` chega a valer, então **em telefone o
 * layout é exatamente o de antes** — a correção age só onde o defeito existia.
 * `w-full` está aí para que a grade não encolha dentro de um pai flex, que é o
 * caso de `layout.tsx`.
 */

/** Contêiner de página. Alinha com `Cabecalho` e `Rodape`. */
export const GRADE = 'mx-auto w-full max-w-6xl px-5'

/**
 * Coluna de leitura, dentro de `GRADE`.
 *
 * Sem `mx-auto`, de propósito: ver a nota acima.
 *
 * ## POR QUE 4xl, E NÃO 3xl NEM A GRADE INTEIRA
 *
 * Alinhar o conteúdo com o cabeçalho resolveu o desalinhamento e criou outro
 * efeito, que o mantenedor apontou: a sobra deixou de ser dos dois lados e
 * passou a ser toda de um. Ao lado de uma calculadora — que preenche a grade
 * com formulário **e** resultado — a página de texto parecia estreita.
 *
 * A saída **não** foi esticar o texto até a grade. Linha longa demais cansa e
 * faz o olho perder o início da seguinte; a 16px, a grade inteira daria mais de
 * 140 caracteres por linha, quase o dobro do confortável.
 *
 * O guia resolveu de verdade, ganhando uma segunda coluna com o sumário fixo —
 * ver `SumarioDoGuia`. As páginas que não têm o que pôr ao lado (legais,
 * contato, `/guias`) ganham esta largura intermediária: mais próxima da
 * calculadora sem entregar a legibilidade.
 */
export const LEITURA = 'max-w-4xl'
