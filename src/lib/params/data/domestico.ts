/**
 * Parâmetros do contrato de trabalho doméstico — Lei Complementar nº 150/2015.
 *
 * **Números iguais aos da CLT, fundamentos distintos.** Os três parâmetros de
 * aviso prévio repetem 30, 3 e 90 — exatamente os da Lei nº 12.506/2011 — e
 * ainda assim existem em separado. O contrato doméstico não é regido por aquela
 * lei; é regido pelo art. 23 desta.
 *
 * Reaproveitar os parâmetros da CLT pouparia quatro dúzias de linhas e faria a
 * memória de cálculo de uma rescisão doméstica **citar uma norma que não rege
 * aquele contrato**, com um link que leva o leitor ao lugar errado. Num produto
 * cuja tese é a auditabilidade, essa economia sai cara.
 *
 * A regra geral do projeto continua valendo — *duas verdades sobre o mesmo
 * número divergem na primeira manutenção*. Ela é sobre o mesmo NÚMERO no mesmo
 * CONTEXTO. Aqui os contextos são dois, e se um dia o Congresso mexer em um sem
 * mexer no outro, a duplicação é o que permite representar isso.
 *
 * O que **não** está aqui: a alíquota de FGTS de 8%, que é a mesma do art. 34,
 * IV, e já é `fgts-aliquota-deposito`. Ali o contexto é o mesmo — o depósito
 * mensal na conta vinculada — e a norma remete à própria Lei nº 8.036.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LC_150_ART_22, LC_150_ART_23 } from './fontes'

export const DOMESTICO: ConjuntoDeParametros = {
  fontes: [LC_150_ART_22, LC_150_ART_23],

  parametros: [
    {
      id: 'domestico-indenizacao-compensatoria',
      nome: 'Indenização compensatória do doméstico — depósito mensal',
      descricao:
        'Percentual sobre a remuneração devida no mês anterior, depositado em variação distinta da conta vinculada, destinado à indenização pela perda do emprego.',
      tipo: 'percentual',
    },
    {
      id: 'domestico-aviso-previo-dias-base',
      nome: 'Aviso prévio do doméstico — dias devidos até um ano de serviço',
      descricao: 'Prazo de aviso prévio para quem conta até um ano de serviço ao mesmo empregador.',
      tipo: 'inteiro',
    },
    {
      id: 'domestico-aviso-previo-dias-por-ano',
      nome: 'Aviso prévio do doméstico — dias acrescidos por ano de serviço',
      descricao: 'Dias somados ao prazo base por ano de serviço prestado ao mesmo empregador.',
      tipo: 'inteiro',
    },
    {
      id: 'domestico-aviso-previo-dias-maximo',
      nome: 'Aviso prévio do doméstico — total máximo em dias',
      descricao: 'Limite total do aviso prévio, somados o prazo base e os acréscimos.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Lei Complementar nº 150/2015, art. 22, caput
    //
    //   "O empregador doméstico depositará a importância de 3,2% (três inteiros
    //    e dois décimos por cento) sobre a remuneração devida, no mês anterior,
    //    a cada empregado, destinada ao pagamento da indenização compensatória
    //    da perda do emprego, sem justa causa ou por culpa do empregador, NÃO SE
    //    APLICANDO ao empregado doméstico o disposto nos §§ 1º a 3º do art. 18
    //    da Lei nº 8.036, de 11 de maio de 1990."
    //
    // A remissão negativa é o ponto: os §§ 1º a 3º do art. 18 são justamente os
    // da multa de 40%. No doméstico ela NÃO EXISTE — foi substituída por este
    // fundo, formado mês a mês.
    //
    // Vigência pelo art. 47: "esta Lei entra em vigor na data de sua
    // publicação", DOU de 2.6.2015.
    // -----------------------------------------------------------------------
    {
      id: 'domestico-indenizacao-2015',
      parametroId: 'domestico-indenizacao-compensatoria',
      fonteId: 'lc-150-2015-art-22',
      inicio: '2015-06-02',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 320 },
      observacao:
        'Depositado em variação distinta da conta vinculada (§ 3º) e movimentável apenas na rescisão. Na dispensa sem justa causa ou por culpa do empregador, quem movimenta é o trabalhador; no pedido de demissão, na justa causa, no fim de contrato por prazo determinado, na aposentadoria e no falecimento, quem movimenta é o empregador (§ 1º). Na culpa recíproca, metade para cada um (§ 2º).',
    },

    // -----------------------------------------------------------------------
    // Art. 23, § 1º e § 2º — mesmos números da Lei nº 12.506/2011, outra norma.
    //
    //   "§ 1º O aviso prévio será concedido na proporção de 30 (trinta) dias ao
    //    empregado que conte com até 1 (um) ano de serviço para o mesmo
    //    empregador.
    //    § 2º Ao aviso prévio previsto neste artigo, devido ao empregado, serão
    //    acrescidos 3 (três) dias por ano de serviço prestado para o mesmo
    //    empregador, até o máximo de 60 (sessenta) dias, perfazendo um total de
    //    até 90 (noventa) dias."
    //
    // Repare no "devido AO EMPREGADO" do § 2º: o acréscimo é do aviso concedido
    // a ele, não do que ele deve. O § 4º trata do caso inverso e não acresce
    // nada — mesma leitura que a Lei nº 12.506 exige, e pela mesma razão.
    // -----------------------------------------------------------------------
    {
      id: 'domestico-aviso-base-2015',
      parametroId: 'domestico-aviso-previo-dias-base',
      fonteId: 'lc-150-2015-art-23',
      inicio: '2015-06-02',
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
    },
    {
      id: 'domestico-aviso-por-ano-2015',
      parametroId: 'domestico-aviso-previo-dias-por-ano',
      fonteId: 'lc-150-2015-art-23',
      inicio: '2015-06-02',
      fim: null,
      valor: { tipo: 'inteiro', valor: 3 },
    },
    {
      id: 'domestico-aviso-maximo-2015',
      parametroId: 'domestico-aviso-previo-dias-maximo',
      fonteId: 'lc-150-2015-art-23',
      inicio: '2015-06-02',
      fim: null,
      valor: { tipo: 'inteiro', valor: 90 },
    },
  ],
}
