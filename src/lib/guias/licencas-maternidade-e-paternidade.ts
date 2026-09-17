/**
 * Guia — "Licença-maternidade e paternidade: prazos, Empresa Cidadã e a lei
 * nova".
 *
 * Lote 2 da expansão do catálogo, ligado a CALC-086, CALC-087 e CALC-088. Um
 * guia para as três pelo critério de `CLAUDE.md` passo 9: a pergunta do leitor
 * é uma só — o que muda no trabalho quando nasce ou chega um filho —, e as três
 * calculadoras respondem pedaços dela.
 *
 * **A paternidade não tem bloco de valor vigente, de propósito.** O bloco
 * mostra a vigência MAIS RECENTE do parâmetro, e a mais recente da paternidade
 * é a de 2028: em 2026 a página exibiria um prazo que ainda não vale. A duração
 * de cada data fica com a calculadora, que resolve pelo dia do nascimento.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const LICENCAS_MATERNIDADE_E_PATERNIDADE: Guia = {
  slug: 'licenca-maternidade-e-paternidade',
  titulo: 'Licença-maternidade e paternidade: prazos, Empresa Cidadã e a lei nova',
  tituloSeo: 'Licença-maternidade e paternidade: prazos e lei nova',
  subtitulo:
    'Quanto tempo cada um fica afastado, quando a contagem começa, o que a Empresa Cidadã acrescenta — e a mudança na licença do pai a partir de 2027.',
  descricaoSeo:
    'Como contar a licença-maternidade e a paternidade, a prorrogação da Empresa Cidadã, a lei que amplia a licença do pai e o salário-família.',
  atualizadoEm: '2026-09-17',
  calculadoras: ['licenca-maternidade', 'licenca-paternidade', 'salario-familia'],

  secoes: [
    {
      id: 'a-licenca-da-mae',
      titulo: 'A licença da mãe: duração e início',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A duração da licença-maternidade está na Constituição, e não depende de convenção nem da vontade da empresa. Os dias são corridos: fins de semana e feriados dentro do período contam normalmente.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'licenca-maternidade-dias',
          legenda: 'Dias de licença-maternidade.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O afastamento pode começar antes do parto, mediante atestado médico, ou no próprio dia do parto. Se o bebê nasce antes da data prevista para o afastamento, a licença começa no parto.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'licenca-maternidade-inicio-antes-do-parto',
          legenda: 'Até quantos dias antes do parto o afastamento pode começar.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Durante a licença, a empregada recebe o salário-maternidade, que corresponde à sua remuneração integral. Quem paga é a empresa, que depois compensa o valor nas contribuições que recolhe à Previdência.',
        },
        {
          tipo: 'chamada',
          slug: 'licenca-maternidade',
          texto:
            'A calculadora de licença-maternidade mostra o último dia e a data de retorno, e confere se o início escolhido cabe no prazo permitido.',
        },
      ],
    },

    {
      id: 'o-que-pode-estender',
      titulo: 'O que pode estender a licença',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'Atestado médico pode aumentar em duas semanas o repouso antes do parto e em duas semanas o repouso depois dele.',
            'Internação da mãe ou do recém-nascido ligada ao parto, que passe dessas duas semanas, estende a licença até depois da alta — regra incluída na CLT em 2025.',
            'Nascimento ou adoção de criança com deficiência permanente decorrente de síndrome congênita associada ao vírus Zika prorroga a licença, por regra também incluída em 2025.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Os três casos dependem de documento — atestado, comprovação da internação ou laudo — e por isso não entram na conta padrão. Quando algum deles acontece, a data de retorno muda.',
        },
      ],
    },

    {
      id: 'a-licenca-do-pai',
      titulo: 'A licença do pai muda a partir de 2027',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Desde 1988 a licença-paternidade seguia uma regra provisória da Constituição, prevista para durar até que uma lei tratasse do assunto. A lei veio em 2026: ela amplia a licença em duas etapas, uma para nascimentos a partir de 1º de janeiro de 2027 e outra a partir de 1º de janeiro de 2028.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A mesma lei prevê uma terceira ampliação para 2029, mas condicionada ao cumprimento de meta fiscal. Se a meta não for cumprida, a mudança fica para mais tarde. Por isso nenhuma estimativa séria consegue dizer hoje qual será a duração para quem nasce a partir de 2029.',
        },
        {
          tipo: 'lista',
          itens: [
            'O que decide a duração é a data do nascimento, da adoção ou da guarda — não a data em que o pedido é feito.',
            'A partir de 2027, a lei manda contar o período a partir dessa data.',
            'A partir de 2027, a licença passa a ser paga como salário-paternidade, benefício da Previdência Social, e o pai fica protegido contra dispensa sem justa causa desde o início da licença até um mês após o fim.',
            'Também a partir de 2027, o pai deve comunicar a empresa com antecedência, apresentando o atestado com a data provável do parto; em parto antecipado, o afastamento é imediato.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'licenca-paternidade',
          texto:
            'A calculadora de licença-paternidade aplica a duração certa para a data do nascimento e mostra o dia de retorno.',
        },
      ],
    },

    {
      id: 'empresa-cidada',
      titulo: 'Empresa Cidadã: a prorrogação que depende do empregador',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O Programa Empresa Cidadã prorroga as duas licenças nas empresas que aderem a ele. A empresa tributada pelo lucro real deduz do imposto a remuneração paga nos dias de prorrogação. A adesão é da empresa: nem todo empregador participa, e a prorrogação só existe onde houve adesão.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'empresa-cidada-maternidade-dias',
          legenda: 'Dias acrescidos à licença-maternidade na Empresa Cidadã.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'empresa-cidada-paternidade-dias',
          legenda: 'Dias acrescidos à licença-paternidade na Empresa Cidadã.',
        },
        {
          tipo: 'lista',
          itens: [
            'A mãe precisa pedir até o fim do primeiro mês após o parto; a prorrogação começa logo depois da licença.',
            'O pai precisa pedir em até dois dias úteis após o parto e comprovar participação em programa ou atividade de orientação sobre paternidade responsável.',
            'Nos dias de prorrogação a remuneração é integral, mas é proibido exercer atividade remunerada, e a criança deve ficar sob os cuidados de quem está de licença.',
          ],
        },
      ],
    },

    {
      id: 'o-salario-familia',
      titulo: 'Depois do nascimento: o salário-família',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O salário-família é uma cota paga por filho de até quatorze anos, ou inválido de qualquer idade, ao empregado de remuneração mais baixa. A empresa paga junto com o salário e compensa o valor nas contribuições. Os valores mudam todo ano, pela portaria que reajusta os benefícios.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-familia-cota',
          legenda: 'Valor da cota por filho.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-familia-limite',
          legenda: 'Remuneração mensal máxima para receber a cota.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O limite funciona como um degrau, e não como uma rampa: dentro dele, a cota é inteira; um centavo acima, não há cota nenhuma. Um aumento pequeno pode, portanto, reduzir o total recebido no mês.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-familia',
          texto:
            'A calculadora de salário-família compara a remuneração com o limite do ano e mostra a folga até ele.',
        },
      ],
    },
  ],
}
