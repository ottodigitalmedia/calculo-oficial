import { expect, test } from '@playwright/test'

import { CATALOGO } from '../../src/lib/calculadoras/indice'

/**
 * Todas as calculadoras publicadas, sobre a mesma página genérica
 * (`ADR-008` E-1). Se o molde não fosse genérico de verdade, estes testes
 * exigiriam tratamento distinto por calculadora — e não exigem.
 *
 * **A lista É DERIVADA do registro, e isso não é conveniência.** Ela era fixa,
 * escrita no T-104 com as quatro do lançamento. As seis calculadoras
 * publicadas em 31/07/2026 nunca foram exercitadas de ponta a ponta — e foi
 * assim que CALC-006 foi ao ar sem calcular: a data de referência padrão caía
 * fora da vigência dos parâmetros de jornada, e nenhum teste abria a página.
 *
 * `indice.ts` é a lista leve, mantida em sincronia com as definições por
 * `catalogo.test.ts`. Derivar dela mantém este arquivo fora do pacote do
 * navegador e ainda assim completo.
 */

const CALCULADORAS = CATALOGO.map((c) => ({ slug: c.slug, titulo: c.nome }))

for (const c of CALCULADORAS) {
  test(`${c.slug} · abre, tem título único e aviso legal`, async ({ page }) => {
    await page.goto(`/calculadora/${c.slug}`)
    await expect(page.getByRole('heading', { name: c.titulo, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Perguntas frequentes' })).toBeVisible()
  })
}

/**
 * §1.5 · TODA CALCULADORA ABRE NO ESTADO VAZIO — E ISSO JÁ ESTAVA QUEBRADO.
 *
 * O estado inicial era decidido comparando cada valor com zero ou string vazia,
 * e por isso **um campo de seleção com padrão derrubava o estado vazio**: um
 * `padrao: 'ipca'` já difere de vazio na primeira renderização. A página abria
 * dizendo *"Falta preencher: ..."* a quem ainda não tinha tocado em nada.
 *
 * CALC-060 fazia isso desde que nasceu, sem ninguém notar; CALC-001 passou a
 * fazer ao ganhar o campo de vale-transporte, e foi um teste de fluxo que
 * denunciou. Esta varredura é o que impede a terceira vez — e ela vale para
 * toda calculadora, inclusive as que ainda não existem.
 *
 * O laço pula quem não tem campo obrigatório: essas calculam de saída, e o
 * estado vazio nunca aparece nelas.
 */
for (const c of CALCULADORAS) {
  test(`${c.slug} · abre no estado vazio, sem cobrar campo de quem não digitou`, async ({
    page,
  }) => {
    await page.goto(`/calculadora/${c.slug}`)
    const resultado = page.locator('[aria-live="polite"]')
    const vazio = resultado.getByText('Preencha os campos ao lado para ver o resultado.')

    // Quem já calcula sem entrada nenhuma não passa pelo estado vazio.
    if ((await vazio.count()) === 0) {
      await expect(
        resultado.getByText(/^Falta preencher:/),
        `"${c.slug}" abriu cobrando campo de quem ainda não digitou nada. ` +
          `O estado inicial de §1.5 é "vazio" — ver a nota em Calculadora.tsx.`,
      ).toHaveCount(0)
      return
    }

    await expect(vazio).toBeVisible()
  })
}

test('INSS · mostra a alíquota efetiva, que é a saída secundária de CALC-016', async ({ page }) => {
  await page.goto('/calculadora/inss')
  await page.getByLabel('Salário de contribuição').fill('500000')
  // Conferido à mão contra a tabela de 2026: R$ 501,51 sobre R$ 5.000,00.
  await expect(page.getByText('R$ 501,51').first()).toBeVisible()
  // Escopado ao bloco de resultado: "alíquota efetiva" também aparece na
  // linha de contexto e no FAQ, e sem escopo o localizador é ambíguo.
  const resultado = page.locator('[aria-live="polite"]')
  await expect(resultado.getByText('Alíquota efetiva:')).toBeVisible()
  await expect(resultado.getByText('10,03%')).toBeVisible()
})

test('IRRF · a contribuição é campo editável e a memória registra a origem', async ({ page }) => {
  await page.goto('/calculadora/irrf')
  await page.getByLabel('Rendimento bruto do mês').fill('600000')
  await expect(page.getByText(/calculada pela tabela do período/)).toBeVisible()

  await page.getByLabel('Contribuição previdenciária descontada').fill('64960')
  await expect(page.getByText(/valor de contribuição previdenciária que você informou/)).toBeVisible()
  // Exemplo 4 da Receita: imposto de R$ 382,88.
  await expect(page.getByText('R$ 382,88').first()).toBeVisible()
})

/**
 * §7.99 — zero no campo significava "calcule pela tabela", e quem não teve
 * desconto previdenciário não tinha como dizer isso. O Exemplo 5 da Receita
 * (INSS zero) não era reproduzível pela tela.
 */
test('IRRF · "sem contribuição" esconde o campo e reproduz o exemplo 5 da Receita', async ({
  page,
}) => {
  await page.goto('/calculadora/irrf')
  await page.getByLabel('Rendimento bruto do mês').fill('760720')
  await page
    .getByLabel('Houve desconto de contribuição previdenciária no mês?')
    .selectOption('nao')
  await expect(page.getByLabel('Contribuição previdenciária descontada')).toBeHidden()
  await expect(page.getByText(/Sem contribuição previdenciária no mês/)).toBeVisible()
  await expect(page.getByText('R$ 1.016,27').first()).toBeVisible()
})

/**
 * §7.99 — a página lia `'nao-cumprido'`, valor que o campo não oferece, e o
 * desconto do art. 23, § 4º, da LC 150 nunca aparecia para quem pede demissão.
 */
test('rescisão do doméstico · pedido de demissão sem cumprir aviso tem o desconto', async ({
  page,
}) => {
  await page.goto(
    '/calculadora/rescisao-domestico?admissao=2016-03-01&desligamento=2026-06-30&salario=300000&motivo=pedido-demissao',
  )
  const resultado = page.locator('[aria-live="polite"]')
  await expect(resultado.getByText('Desconto de aviso não cumprido')).toBeVisible()
})

test('juros compostos · não tem seletor de período, por não ter parâmetro legal', async ({
  page,
}) => {
  await page.goto('/calculadora/juros-compostos')
  await expect(page.getByLabel('Período de referência')).toBeHidden()

  await page.getByLabel('Valor inicial').fill('100000')
  await page.getByLabel('Taxa de juros').fill('100')
  // O padrão do período da taxa é "ao ano"; aqui queremos 1% AO MÊS.
  await page.getByLabel('Período da taxa').selectOption('mes')
  await expect(page.getByText('Evolução ano a ano')).toBeVisible()
  // R$ 1.000,00 a 1% ao mês por 12 meses, capitalizando mês a mês.
  await expect(page.getByText('R$ 1.126,84').first()).toBeVisible()
})

/**
 * O teste que teria pego CALC-006 quebrada.
 *
 * Abrir a página não basta: uma calculadora pode renderizar o formulário
 * inteiro e falhar no primeiro cálculo, que é exatamente o que aconteceu
 * quando a data de referência padrão caiu fora da vigência dos parâmetros.
 * Aqui todo campo obrigatório é preenchido e o resultado tem de aparecer.
 */
/**
 * Calculadoras cujos campos INTERAGEM, e que por isso não se satisfazem com um
 * preenchimento genérico.
 *
 * CALC-009 é a primeira: o valor mínimo de "meses trabalhados" depende de qual
 * solicitação é. Com 5 meses na primeira solicitação a calculadora recusa — **e
 * está certa**, porque a lei exige 12. Nenhum ajuste no preenchedor resolve
 * isso, porque a restrição não é de um campo: é entre dois.
 *
 * A saída usa o que o produto já tem — o estado do formulário na URL (`RF-006`).
 * A combinação válida fica declarada aqui, à vista, em vez de o campo ganhar um
 * mínimo que bloquearia quem legitimamente tem 6 meses na terceira solicitação.
 */
const ENTRADAS_QUE_INTERAGEM: Readonly<Record<string, string>> = {
  // O mínimo de meses depende de qual solicitação é: 12, 9 ou 6.
  'seguro-desemprego': '?salario1=300000&mesesTrabalhados=24&solicitacao=primeira',
  // Exige crédito OU débito, e os dois campos são opcionais isoladamente —
  // exigir um deles bloquearia quem só tem horas do outro tipo.
  'banco-de-horas': '?salario=220000&horasPositivas=1000&jornadaSemanal=44',
  /**
   * O mês final válido depende do ÍNDICE escolhido, e nenhum preenchedor
   * genérico sabe disso: cada índice é publicado no seu próprio calendário, com
   * defasagem de cerca de um mês, e o preenchedor usa uma data fixa no futuro.
   * A calculadora recusa com razão — recusar mês não publicado é o
   * comportamento correto, e afrouxá-lo para caber no teste seria distorcer o
   * produto (§7.10).
   */
  'correcao-por-indice': '?valorOriginal=100000&indice=ipca&de=2015-01-01&ate=2020-01-01',
  // As três abaixo caem no mesmo caso: o mês final válido depende do índice
  // escolhido, e o preenchedor usa uma data fixa que costuma estar à frente do
  // último mês publicado.
  'poder-de-compra': '?valor=100000&indice=ipca&de=2010-01-01&ate=2020-01-01',
  'reajuste-de-salario': '?salario=300000&indice=inpc&de=2023-01-01&ate=2024-01-01',
  'reajuste-de-aluguel': '?aluguel=200000&indice=igpm&de=2023-01-01&ate=2024-01-01',
  /**
   * As três de campo de lista. O preenchedor genérico enche `input` do
   * formulário, e as células da lista não são obrigatórias uma a uma — o
   * obrigatório é a lista, que só está satisfeita quando alguma célula tem
   * valor. Exigir cada célula seria pior que declarar a entrada aqui: bloquearia
   * a linha em branco, que é o que permite abrir o campo com linhas prontas.
   */
  'divisao-de-conta': '?consumos=3000;5000;2000&compartilhado=0&gorjeta=1000',
  'media-ponderada': '?notas=800,100;600,300',
  // A taxa vai em basis points e a parcela mínima em centavos, como na URL real.
  'plano-de-quitacao': '?dividas=500000,1200,25000;100000,300,10000&extraMensal=50000',
  /**
   * As faixas de tarifa são lista obrigatória, e valores redondos de propósito:
   * o produto não publica tarifa de concessionária real (`00-catalogo` §14), e um
   * teste com tabela real daria a impressão contrária.
   */
  'conta-de-agua': '?consumo=2500&faixas=1000,500;2000,1000;0,2000&esgoto=8000',
  /**
   * Exige ao menos UMA taxa de modalidade, e nenhuma delas é obrigatória
   * isoladamente — é assim de propósito: campo em branco significa "não tenho
   * essa opção", e tornar uma delas obrigatória inventaria uma porta de crédito
   * que a pessoa não tem.
   */
  'financiamento-de-reforma': '?valorDaObra=3000000&prazoMeses=24&garantiaImovel=120&pessoal=600',
  /**
   * As duas datas interagem: o fim previsto do contrato precisa ser posterior à
   * dispensa. O preenchedor dá a mesma data aos dois campos, e a calculadora
   * recusa com razão — contrato que chegou ao termo não gera a indenização.
   */
  'rescisao-contrato-de-experiencia': '?salario=300000&dataRescisao=2026-03-10&dataTermo=2026-04-09',
  // Mesmo caso do banco de horas: sobreaviso OU prontidão, nenhum dos dois
  // obrigatório isoladamente.
  'sobreaviso-e-prontidao': '?salario=220000&jornadaSemanal=44&horasSobreaviso=3000',
  /**
   * Nenhum campo é obrigatório isoladamente: o mês pode ter só operação comum,
   * só day trade, lucro ou prejuízo. O que a calculadora exige é UM resultado —
   * e exigir um campo específico inventaria uma operação que a pessoa não fez.
   */
  'ir-em-bolsa-de-valores': '?vendasComuns=2500000&ganhoComum=300000',
  /**
   * Mesmo caso do imposto em bolsa: o mês pode ter só rendimento, só venda de
   * cotas, ou os dois. Nenhum campo é obrigatório isoladamente.
   */
  'ir-em-fundos-imobiliarios': '?rendimentos=100000&cotistas=200&emBolsa=sim',
  /**
   * O campo que a calculadora exige depende da categoria escolhida, e o
   * preenchedor genérico não sabe disso: só a segurada especial dispensa
   * valor, porque o benefício dela é o piso.
   */
  'salario-maternidade-do-inss': '?categoria=demais&somaDoze=3600000',
  /**
   * Lote 6: idade e tempo de contribuição interagem — tempo maior que a idade é
   * recusado, e os pedágios exigem o tempo de 2019 menor ou igual ao de hoje e,
   * no de 50%, acima da porta de entrada. O preenchedor genérico põe o mesmo
   * número em tudo e cai nessas recusas, que estão certas.
   */
  'aposentadoria-idade-progressiva': '?sexo=mulher&idadeAnos=58&tempoAnos=30',
  'aposentadoria-pedagio-50': '?sexo=mulher&emendaAnos=29&tempoAnos=30',
  'aposentadoria-pedagio-100': '?sexo=mulher&idadeAnos=55&emendaAnos=25&tempoAnos=32',
  'aposentadoria-por-idade': '?sexo=mulher&filiacao=antes&idadeAnos=61&tempoAnos=15',
  'regras-de-aposentadoria': '?sexo=mulher&filiacao=antes&idadeAnos=57&tempoAnos=32&emendaAnos=25',
  // Lote 7: idade e magistério interagem; as férias exigem datas em ordem.
  'aposentadoria-do-professor': '?sexo=mulher&filiacao=antes&idadeAnos=50&tempoAnos=25&emendaAnos=19',
  'ferias-em-dobro': '?salario=300000&inicioAquisitivo=2024-03-10&inicioFerias=2026-02-24&dias=30',
  // Lote 8: o custo não pode passar do preço de forma absurda, e os horários precisam de ordem.
  'ganho-de-capital-na-venda-de-bens': '?valorDeVenda=6000000&custo=4500000',
  'horas-trabalhadas': '?entradaHora=8&saidaHora=17&saidaMinuto=48&intervalo=60&dias=5',
  // Lote 9: a receita do mês não pode passar do teto do Simples com o preenchedor genérico.
  'das-simples-nacional': '?atividade=comercio&rbt12=50000000&receitaDoMes=4000000',
  // Lote 15: a janela precisa de meses publicados, em ordem e com mais de trinta dias.
  'tesouro-selic': '?valorAplicado=2000000&primeiroMes=2025-08-01&ultimoMes=2026-07-31',
  // Lote 14: preço abaixo de R$ 1.000,00 e mais de trinta dias até o vencimento.
  'tesouro-prefixado': '?valorAplicado=100000&preco=74642&compra=2026-09-21&vencimento=2029-01-01',
  // Lote 11: as três datas da escala precisam de ordem e de estar depois de 11/11/2017.
  'escala-12x36': '?plantao=2026-06-01&inicio=2026-06-01&fim=2026-06-30',
}

for (const c of CALCULADORAS) {
  test(`${c.slug} · calcula de verdade, não só renderiza`, async ({ page }) => {
    const query = ENTRADAS_QUE_INTERAGEM[c.slug]
    if (query) {
      await page.goto(`/calculadora/${c.slug}${query}`)
      const caixa = page.locator('main [aria-live]')
      await expect(
        caixa.getByRole('button', { name: 'Ver como este valor foi calculado' }),
      ).toBeVisible()
      await expect(caixa).not.toContainText('Não foi possível calcular')
      return
    }

    await page.goto(`/calculadora/${c.slug}`)

    /**
     * O valor precisa respeitar o tipo do campo. Campo inteiro tem máximo
     * pequeno — 12 meses, 20 dependentes, 27 dias úteis —, e enchê-lo com o
     * mesmo número do campo monetário deixa o formulário em erro de validação,
     * não em resultado. `inputMode` distingue os dois: `numeric` é inteiro,
     * `decimal` é monetário ou percentual.
     */
    const entradas = page.locator('main form input')
    for (let i = 0; i < (await entradas.count()); i += 1) {
      const campo = entradas.nth(i)
      if (!(await campo.isVisible())) continue

      /**
       * Só os obrigatórios. Encher todo campo com o mesmo valor produz cenário
       * degenerado — no CET, tarifas iguais ao empréstimo inteiro, que a
       * calculadora recusa com razão. O que este teste verifica é se a
       * calculadora computa com a entrada MÍNIMA, que é o caminho por onde a
       * maioria dos visitantes passa.
       */
      if ((await campo.getAttribute('aria-required')) !== 'true') continue

      const tipo = await campo.getAttribute('type')
      if (tipo === 'date') {
        await campo.fill(i === 0 ? '2020-03-10' : '2026-07-15')
        continue
      }

      /**
       * O valor desejado é limitado ao teto do próprio campo.
       *
       * Um número fixo não cabe em toda faixa do catálogo: R$ 3.000,00 é um
       * salário plausível e é um preço de combustível absurdo, que CALC-054
       * recusa com razão — e o teste reprovava a calculadora por ela estar
       * certa. `data-maximo` vem de `campos.tsx` e existe exatamente para isto.
       */
      const teto = Number(await campo.getAttribute('data-maximo')) || Number.MAX_SAFE_INTEGER
      const preencher = (desejado: number) => campo.fill(String(Math.min(desejado, teto)))

      const modo = await campo.getAttribute('inputMode')
      if (modo === 'numeric') {
        // 5 cabe em todo mínimo inteiro do catálogo.
        await preencher(5)
        continue
      }

      // Monetário, percentual e decimal dividem `inputMode="decimal"`; o
      // placeholder separa o monetário dos outros dois. A taxa tem máximo de
      // 100%, e enchê-la com o valor do campo monetário deixa o formulário em
      // erro de validação.
      const marcador = await campo.getAttribute('placeholder')
      await preencher(marcador === 'R$ 0,00' ? 300_000 : 100)
    }

    /**
     * A prova de que calculou é a MEMÓRIA, não o cifrão.
     *
     * Era `toContainText('R$')`, o que funcionou enquanto toda calculadora
     * devolvia dinheiro. CALC-070 devolve número puro e CALC-070 na variação
     * devolve percentual — e um teste que exige cifrão passaria a reprovar a
     * calculadora justamente por ela estar certa. O acionador da memória de
     * cálculo só é renderizado no estado calculado, então ele prova o mesmo sem
     * presumir a unidade.
     */
    const resultado = page.locator('main [aria-live]')
    await expect(
      resultado.getByRole('button', { name: 'Ver como este valor foi calculado' }),
      'a calculadora renderizou mas não calculou — parâmetro sem cobertura na data padrão?',
    ).toBeVisible()
    await expect(resultado).not.toContainText('Não foi possível calcular')
  })
}

/**
 * O aviso de estimativa não pode citar uma data que ninguém escolheu.
 *
 * O FGTS anunciava "parâmetros legais vigentes em **15/06/1990**". A frase era
 * literalmente verdadeira — a alíquota de 8% vige desde 1990 e nunca mudou —, e
 * ainda assim se lia como produto abandonado, na exata frase que existe para
 * construir confiança. Quando há um só exercício o seletor fica escondido, a
 * data é sintética, e o que informa é o intervalo de vigência.
 */
test('o aviso de estimativa cita intervalo quando o período não é escolha', async ({ page }) => {
  await page.goto('/calculadora/fgts?salario=300000&mesesTrabalhados=12')
  const resultado = page.locator('main [aria-live]')
  await expect(resultado).toContainText('em vigor a partir de')
  await expect(resultado).not.toContainText('vigentes em 15/06/1990')
})

test('o aviso cita a data quando o período É escolha do usuário', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido?salarioBruto=500000')
  const resultado = page.locator('main [aria-live]')
  await expect(page.getByLabel('Período de referência')).toBeVisible()
  await expect(resultado).toContainText('parâmetros legais vigentes em')
})

/**
 * "− R$ 0,00" anuncia um desconto que não existe. Em CALC-005 ele aparecia ao
 * lado de verbas reais, e nesse contexto lê-se como defeito de cálculo — não
 * como ausência de imposto.
 */
test('valor zerado no detalhamento não leva sinal de menos', async ({ page }) => {
  await page.goto('/calculadora/decimo-terceiro?salario=300000&mesesTrabalhados=3')
  const detalhamento = page.locator('main [aria-live]')
  await expect(detalhamento).toContainText('R$')
  await expect(detalhamento).not.toContainText('− R$ 0,00')
  await expect(detalhamento).not.toContainText('+ R$ 0,00')
})

/**
 * Data em destaque sai em pt-BR, não em ISO.
 *
 * `Tempo de serviço projetado até: 2026-08-29` estava assim desde que CALC-002
 * foi ao ar. Não é erro de cálculo — é a única data do produto que escapava de
 * `formatarData`, porque `Destaque.valor` é texto livre e não passa pela
 * formatação do componente.
 */
test('a data projetada aparece em pt-BR, e não em ISO', async ({ page }) => {
  await page.goto(
    '/calculadora/rescisao-sem-justa-causa?admissao=2016-03-01&desligamento=2026-06-30&salario=300000',
  )
  const resultado = page.locator('main [aria-live]')
  await expect(resultado).toContainText('29/08/2026')
  await expect(resultado).not.toContainText('2026-08-29')
})
