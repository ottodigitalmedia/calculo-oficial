# Estado do projeto — Cálculo Oficial

> Documento de continuidade. Escrito em **31/07/2026**, no dia do lançamento, e
> atualizado no mesmo dia após a primeira sessão pós-lançamento.
> Serve para uma sessão nova começar sem reconstruir contexto.
>
> **O que mudou depois do lançamento:** HSTS ativo · `www` servido e
> redirecionando · fonte do INSS 2026 passou a ser o texto da portaria ·
> orçamento de JavaScript passou a ser por calculadora · deploy automático ·
> sobreposição com o projeto irmão decidida (§6.4) · **CALC-002 publicada**,
> com a pesquisa de incidências fechada em fonte primária (`docs/19`) ·
> **o v2 chegou ao fim do que dava para construir sem dependência externa**, com
> CALC-031 (§4.2) — e a próxima decisão de maior alcance passou a ser `ADR-006`.
>
> **Leia antes:** `CLAUDE.md` (regras invioláveis) e `docs/README.md` (índice).
> Este arquivo não substitui nenhum dos dois — diz onde as coisas pararam.

---

## 1. Onde o projeto está

**Lançado.** `https://calculoficial.com.br` está público desde 31/07/2026.
O marco **MR-2** foi atingido e a contagem de 90 dias de medição começou.

| | |
|---|---|
| Tickets | 8 de 8 concluídos (T-101 a T-108, mais T-001 a T-006) |
| Calculadoras no ar | **69** de 75 — v1 completo, o bloco de desligamento fechado, **sete de crédito**, **cinco de imóveis**, **cinco de veículos**, quatro de consumo, cinco utilitárias, duas de investimentos, a primeira de autônomo, quatro de índice e a primeira do lado do empregador |
| Guias no ar | 3 de 10 |
| Testes | 1.357 de unidade · 575 ponta a ponta · 3 de vazamento |
| Auditoria de parâmetros | 85 vigências, **0 divergências** (06/08/2026). Uma fonte abaixo do padrão — ver §5.1 |
| Orçamento de JavaScript | 129,4 kB de **150** na pior rota — e **16,2 kB de 30** de parte variável. Limite revisado em 01/08/2026 com medição, ver §7.27 |
| Vulnerabilidades | 0 |

### No ar hoje

- As **10 do v1**: salário líquido · rescisão (sem justa causa e pedido de demissão) · férias · 13º · horas extras · FGTS · INSS · IRRF · juros compostos
- **Trabalhista do v2:** rescisão por acordo mútuo · rescisão do doméstico · aviso prévio proporcional · seguro-desemprego · custo do funcionário
- **Crédito:** CET · amortização SAC vs. Price · quitação antecipada · rotativo do cartão · cheque especial · plano de quitação · portabilidade · financiamento de reforma · consignado
- **Imóveis:** capacidade de financiamento · financiamento imobiliário completo · amortização extra · rentabilidade de aluguel · alugar ou comprar · custo de aquisição · ganho de capital
- **Investimentos:** reserva de emergência · meta de independência financeira · quanto rende por mês · rendimento da poupança · Tesouro IPCA+ · CDB, LCI e LCA · dividend yield · comparador de aplicações
- **Autônomo:** precificação de hora · INSS do autônomo e do facultativo · DAS-MEI · limite do MEI · carnê-leão · pró-labore
- **Câmbio:** conversor de moeda com IOF
- **Índices:** correção por índice · poder de compra · reajuste de salário · reajuste de aluguel · valor futuro
- **Consumo:** orçamento doméstico 50/30/20 · consumo de energia por aparelho · botijão de gás · conta de água
- **Veículos:** álcool ou gasolina · custo de viagem · custo mensal do carro · elétrico ou combustão · depreciação · financiamento
- **Utilitárias:** porcentagem · regra de três · divisão de conta · média ponderada · conversor de unidades · dias úteis
- `/guias` e os três guias
- `/privacidade` · `/termos` · `/cookies` · `/aviso-legal`
- `/sitemap.xml` · `/robots.txt` · `/api/health`

### Como trabalhar

```bash
npm run dev              # desenvolvimento
npm run check            # TUDO, na ordem do pipeline. Obrigatório antes de commitar
```

O `check` encadeia: validação de parâmetros → tipos → lint (com BV-10 e BV-11) →
testes com cobertura → auditoria de dependências → build → orçamento de
performance → e2e → vazamento.

### Deploy

**Automático desde 31/07/2026.** O fluxo é: push em `main` → o pipeline roda as
verificações → publica a imagem etiquetada com o hash → dispara o webhook do
painel → confere `/api/health` por até 2 min → **reverte sozinho** se não
responder.

O que destravou: o segredo `DEPLOY_WEBHOOK_URL` e a variável
`NEXT_PUBLIC_SITE_URL` no repositório. O passo `Implantar` já existia e estava
inteiro — só ficava avisando que não estava configurado.

> A nota antiga dizia que o deploy era manual "por decisão, não por pendência",
> porque o webhook do EasyPanel só seria alcançável pelo domínio do painel. O
> painel **tem** domínio próprio e público (`painel2.axonflow.com.br`), então
> nada precisava mudar no servidor. A decisão continua válida para *clicar no
> painel*; o caminho pelo pipeline é melhor, porque tem verificação de saúde e
> rollback — que o clique não tem.

**Se o pipeline ficar vermelho, nada vai ao ar.** `Publicar` e `Implantar`
dependem de `Verificar`. Foi o que aconteceu com o commit `1f46ee4`: mensagem
sem escopo reprovou em `BV-12`, e os dois commits seguintes ao lançamento nunca
chegaram em produção.

---

## 2. As sete decisões que governam tudo

Quem for mexer aqui precisa conhecer estas, ou vai lutar contra a arquitetura:

| # | Decisão | Onde |
|---|---|---|
| 1 | Parâmetro legal só existe versionado por vigência, com fonte e URL oficial | `ADR-001` |
| 2 | Sem banco, sem autenticação, sem sessão | `ADR-002` |
| 3 | O motor é puro: não importa nada de `app/`, `components/` ou `format/`; não lê relógio nem rede; toda função devolve resultado **e** traço | `ADR-003` |
| 4 | Dinheiro é inteiro em centavos; alíquota em basis points | `ADR-004` |
| 5 | Coeficiente que não cabe em basis points vira fração exata, **como a norma o escreve** | `ADR-007` |
| 6 | Uma definição declarativa por calculadora + **uma** página genérica | `ADR-008` E-1 |
| 7 | Guia é dado declarativo, e **nenhum valor legal na prosa** | `ADR-009` G-1 |

As regras invioláveis estão em `CLAUDE.md` e são verificadas por lint e por
teste, não por disciplina.

---

## 3. Como adicionar a próxima calculadora

O molde funciona. A segunda, terceira e quarta calculadoras não criaram nenhum
arquivo de rota. O caminho é:

1. Confirmar o ID no catálogo (`docs/00-catalogo-calculadoras.md`).
2. Ler a seção correspondente em `docs/03-functional-spec.md` — **os textos de
   tela já estão escritos e são finais**.
3. Cadastrar parâmetros em `src/lib/params/data/`, com fonte oficial, cobrindo
   no mínimo dois exercícios. Commit no formato `params(...)`.
4. Implementar no motor (`src/lib/engine/`), devolvendo traço.
5. Escrever os casos-ouro **antes** de considerar pronto.
6. Acrescentar a definição em `src/lib/calculadoras/`, com `calcular` como
   **exportação de topo** — não como método do literal (§7.6 diz por quê).
7. Registrá-la em **três** lugares: `index.ts`, `indice.ts` e `calculo.ts`. O
   teste `catalogo.test.ts` cobra os três, e o de `calculo.ts` compara por
   identidade de função.
8. FAQ com no mínimo 4 perguntas e `relacionadas` preenchido.
9. `npm run check`.

**Nada além disso.** Sitemap, rodapé, busca e links internos são derivados do
registro e se atualizam sozinhos. Nenhum arquivo de rota é criado.

> **O orçamento não é mais problema de quem entra depois.** Cada calculadora
> paga o próprio pacote: a rota nova nasce em ~113 kB e as existentes não se
> mexem. Se `check:orcamento` reclamar, é da **sua** calculadora — não do
> acúmulo das anteriores.
>
> A exceção é quando a calculadora nova traz dependência **compartilhada**:
> CALC-002 acrescentou o campo de data e os parâmetros trabalhistas ao casco, e
> isso subiu ~1,9 kB em TODAS as rotas. Vale medir antes e depois quando o
> contrato crescer.

---

## 4. Calculadoras pendentes — 6 de 75

**Sessenta publicadas.** A lista nominal saiu daqui de propósito: ela divergia
da realidade a cada publicação, que é o mesmo defeito descrito em §4.2. O que
vale é o que as definições dizem, e o comando que as lê está em §4.3.

### 4.1 O v1 fechou em 31/07/2026

As dez calculadoras do v1 estão no ar. A pesquisa de incidências que as
sustenta está em `docs/19-incidencias-verbas-rescisorias.md`, em fonte
primária, e continua servindo a toda trabalhista que vier.

**O próximo bloco é o v2** — §4.2. E `docs/18-levantamento-calculadoras.md`
mostrava que **33 das restantes não dependiam de nada** — nem de pesquisa em
norma, nem de série externa. Isso valia quando foi escrito, e em 06/08/2026
deixou de valer: **elas foram construídas**. Das 15 que sobram, só CALC-038
dispensa pesquisa em norma.

### 4.2 A lista de pendentes é UMA, e está em §4.3

Havia aqui uma tabela do v2 e outra do v3, e as duas divergiam da realidade:
listavam como bloqueadas calculadoras já publicadas — CALC-039, CALC-040 e
CALC-041 entre elas, todas no ar desde 02/08/2026. O motivo é o mesmo que
`catalogo.test.ts` combate no código: **duas listas do mesmo conjunto divergem**,
e aqui nenhum teste as comparava.

Restou uma só, em §4.3, e o comando que a confere contra as definições está lá.
O v2 e o v3 continuam sendo o corte de prioridade do catálogo; o que deixou de
existir é a contagem paralela.

### 4.3 As 6 que faltam, e o que trava cada uma

**Esta seção substitui as tabelas por versão que existiam aqui.** Elas listavam
como pendentes calculadoras já publicadas — CALC-011, CALC-012 e CALC-013 entre
elas —, porque cada publicação tirava a linha de uma tabela e esquecia a outra.
Uma lista derivada à mão de duas fontes diverge, que é exatamente o defeito que
`catalogo.test.ts` impede no código e que aqui ninguém impedia.

**Para conferir esta lista contra a verdade**, o comando é comparar os `id:` das
definições com os IDs do catálogo:

```bash
grep -rh "^  id: 'CALC-" src/lib/calculadoras/*.ts | grep -o "CALC-[0-9]*" | sort
```

| ID | Calculadora | O que trava |
|---|---|---|
| CALC-014 | Rescisão — contrato intermitente | Pesquisa em norma: art. 452-A e a forma de apurar média |
| CALC-017 | Restituição estimada do IRPF anual | A tabela ANUAL do ano-calendário 2025 não foi localizada — §8, item 3 |
| CALC-019 | Comparador simplificado vs. completo | Mesma fonte de CALC-017 |
| CALC-021 | IR sobre criptoativos | Pesquisa em norma, e regra em mudança |
| CALC-048 | Comparador CLT vs. PJ vs. MEI | Anexos III e V do Simples, fator R **e a tributação de dividendos da Lei 15.270/2025** — ver §7.49 |
| CALC-066 | Retorno de energia solar | A geração vira campo do usuário, mas o Fio B da Lei 14.300/2022 não — ver §7.40 |

**Nenhuma das dez dispensa pesquisa em norma.** O trecho do catálogo que dizia
haver 33 calculadoras sem dependência valia quando foi escrito; elas foram
construídas, e CALC-038 — a última delas — saiu em 06/08/2026. O que restou é
tributário, previdenciário ou preso a um calendário, e **o próximo passo do
projeto deixou de ser código**.

> **CALC-050 saiu desta lista em 06/08/2026, e mostrou que a barreira é
> menor do que parece.** A pesquisa foi de uma tarde: o texto consolidado da
> Lei nº 8.212/1991 no Planalto traz o art. 21 inteiro, e as três alíquotas
> saíram de lá com dispositivo e vigência. O que exige cuidado é ler a redação
> CERTA — ver §7.42.

### 4.5 Fora do catálogo, em definitivo

Saúde · jurídico-documental · hiperlocal (dado municipal) · tributário
empresarial complexo · ruído. Motivos em `docs/00-catalogo-calculadoras.md` §14.
**Não reabrir sem reverter aquela seção conscientemente.**

### 4.6 Guias pendentes — 7 de 10

Rescisão sem justa causa · pedido de demissão · férias · 13º salário · horas
extras · FGTS · juros compostos. Cada um vinculado à calculadora correspondente
(`docs/03-functional-spec.md` §4).

---

## 5. Pendências conhecidas

Nenhuma delas bloqueia o produto. Todas estão registradas onde precisam estar;
esta lista é só o resumo.

### 5.1 Precisa de pesquisa em fonte oficial

| O quê | Situação |
|---|---|
| **Vale-transporte (`RN-027`)** em CALC-001 | O percentual legal não foi localizado em fonte oficial. O campo **não existe** na calculadora — não foi estimado. Resolver antes de anunciar CALC-001 como completa |
| **Incidência de INSS e IRRF sobre verbas rescisórias** | Pré-requisito de CALC-002 a CALC-005. Ver §6.2 |
| **`RN-006`** — arredondamento da faixa intermediária do redutor | Indeterminado. Só afeta rendimentos entre R$ 5.000,01 e R$ 7.350,00 |
| **A portaria da tabela do seguro-desemprego de 2026** | ⚠️ **A fonte mais fraca do projeto.** Os valores estão no portal do próprio MTE, publicados em 13/01/2026 com vigência declarada a partir de 11/01/2026 — mas o ato normativo que os formaliza não foi localizado. Foram tentados a busca do DOU por período e por órgão, o JSON diário de 09 a 14/01/2026 e a página de serviço do MTE. **Trocar pela norma na próxima auditoria**, como foi feito com o INSS em 31/07/2026. Ver a nota em `MTE_TABELA_SEGURO_DESEMPREGO` |

### 5.2 Citação de fonte — ✅ resolvido em 31/07/2026

O `inss-tabela-progressiva` de 2026 citava a página institucional do INSS. Agora
cita o PDF da portaria, e o Anexo II foi conferido **nele**, faixa a faixa.

A justificativa antiga dizia que o PDF era inconferível por ser digitalizado.
**Estava errada.** `pdftotext` devolve vazio, sim — mas rasterizar a página e
ler a imagem funciona:

```bash
pdftoppm -png -r 130 -f 4 -l 4 portaria.pdf pag   # o Anexo II está na p. 4
```

Vale para a próxima auditoria: **norma digitalizada não é norma inconferível.**

> Os dois PDFs de portaria recusam requisição sem cabeçalho de navegador (403),
> e o de 2026 recusa `HEAD`. Um verificador de link ingênuo reporta as duas
> fontes como quebradas, e elas não estão.

### 5.3 Técnicas

| O quê | Detalhe |
|---|---|
| ~~**Orçamento em 2,4 kB de folga**~~ | ✅ **Resolvido em 31/07/2026.** Cada rota carrega só o seu cálculo. Pior rota em 113,4 kB, folga de 6,6 kB — e **a próxima calculadora só afeta a própria rota**. Ver §7.6 |
| `Content-Security-Policy` | Adiada — depende das origens exatas do provedor de anúncio. **Curinga anula a proteção contra AM-02**. Quando entrar, o `<script>` de JSON-LD precisa de hash `sha256`, nunca `'unsafe-inline'` |
| ~~`Strict-Transport-Security`~~ | ✅ **Ativado em 31/07/2026**, `max-age=31536000; includeSubDomains`. **Sem `preload`** — porta de mão única, e exige `www` servido. Coberto por `tests/e2e/cabecalhos.spec.ts` |
| ~~`www.calculoficial.com.br`~~ | ✅ **Servido desde 31/07/2026.** O DNS já estava certo — só faltava o domínio no serviço do EasyPanel, que é o que faz o Traefik pedir o certificado. Responde 308 para o ápice, por `next.config.ts` |
| MCP da Hostinger | A configuração foi corrigida em `~/.claude.json`, mas exige reinício do app para valer. Não verificado |

### 5.4 Adiado por `ADR-008`, com teste que cobra

Anúncio · consentimento · análise de uso autohospedada · série econômica do
Banco Central.

**Atenção:** `tests/leak/vazamento.spec.ts` tem um teste de linha de base que
**reprova no dia em que qualquer um deles entrar**. É deliberado: quem
introduzir análise ou anúncio precisa escrever TC-042 e TC-043 no mesmo commit.
A mensagem de falha diz isso.

---

## 6. O projeto irmão — o que reaproveitar

Caminho: `../../App - 40 MicroSaaS APIs Públicas/`

É um monorepo de 24 aplicações sobre APIs públicas brasileiras, com uma pasta
`docs/fontes/` onde cada fonte tem uma ficha **medida com requisições reais** —
latência, limite de taxa, comportamento em erro, licença e armadilhas.

### 6.0 A regra que vale acima de tudo aqui

> **`CLAUDE.md`, regra 10 e `CO-1`:** valor legal e caso-ouro **só** de fonte
> oficial. O projeto irmão **não é fonte oficial** — é um projeto de terceiro,
> ainda que seu.

Isso significa, na prática:

| Pode | Não pode |
|---|---|
| Usar as fichas como **mapa** de qual API existe, onde e como se comporta | Copiar tabela legal de lá para `lib/params/` |
| Aproveitar armadilhas medidas (formato de data, limite de taxa, paginação) | Usar número de lá como valor esperado de caso-ouro |
| Seguir os **links para as normas** que as fichas citam, e abrir cada um | Confiar no resumo da ficha sem abrir a norma |
| Reaproveitar padrões de código (conector, cache, fallback) | — |

As fichas são ponteiro de pesquisa. Elas encurtam a **busca**, nunca a
**conferência**.

### 6.1 BCB SGS — a fonte mais reaproveitável

`docs/fontes/bcb-sgs.md`. Resolve `ADR-006` (série econômica) e destrava **12**
calculadoras: CALC-034, CALC-037, CALC-039 a CALC-042, CALC-045 e CALC-060 a
CALC-064.

> **A contagem já esteve errada aqui, e o erro custava fila.** Este parágrafo
> dizia 13, listando "CALC-039 a CALC-045" em bloco. `docs/18` §5.2 conferiu
> contra a coluna `Fonte` do catálogo: **CALC-043 e CALC-044 não dependem de
> série nenhuma** — são matemática pura, do bloco A. Em compensação CALC-034
> depende e ficou de fora da lista. Somar mal aqui não é detalhe: mantém no
> bloqueado duas calculadoras que não estão. **CALC-044 foi publicada no mesmo
> dia em que a correção foi lida**, o que é a demonstração mais curta do custo do
> erro de contagem: ela estava a poucas horas de trabalho e figurava como
> bloqueada por uma API.

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{N}?formato=json
```

Sem autenticação. Códigos de série: **IGP-M `189` · IPCA `433` · Selic `11` e
`4189` · INPC `188`**.

**Armadilhas já medidas — cada uma custaria um defeito para descobrir:**

1. `valor` vem como **string** com ponto decimal (`"0.41"`), não número.
2. `data` é `dd/MM/aaaa`, **não ISO**. Fazer parsing explícito — e aqui isso
   casa com a nossa regra de nunca usar `new Date(string)`.
3. **Janela máxima de 10 anos** por requisição. Intervalo maior devolve 400 ou
   vazio; séries longas exigem fatiar e concatenar.
4. **Defasagem de ~1 mês** nos índices. Em 24/07/2026 o último dado fechado era
   junho/2026. A tela precisa dizer qual é o último mês disponível, e não fingir
   que tem o mês corrente.
5. Existe limite de taxa não publicado. Bibliotecas comunitárias limitam a ~5
   conexões paralelas.
6. **Atribuição:** o BCB *republica* IGP-M (FGV) e IPCA/INPC (IBGE). Creditar o
   produtor original, não só o BCB.

> Isso **não** muda `ADR-006`: a coleta continua sendo de build, com cache, e a
> falha dela não interrompe o pipeline (regra R-3). O que a ficha entrega é o
> endpoint certo e as seis armadilhas.

### 6.2 Tabelas trabalhistas — ponteiros, não valores

`docs/fontes/tabelas-trabalhistas.md`. **Não copie as tabelas de lá** — as
nossas já estão auditadas contra a fonte e conferem.

O que vale é o mapa de **incidência sobre verbas rescisórias**, que é onde as
calculadoras concorrentes mais divergem. A ficha aponta para:

- **RFB, página "Fui Demitido"** — lista o que é isento de IR na rescisão
- **Súmula 386 do STJ** — férias indenizadas e o terço
- A divergência **STJ × STF** sobre o terço constitucional, que vale para férias
  **gozadas**, não para as **indenizadas** da rescisão

Cada um desses tem de ser aberto e conferido antes de virar parâmetro nosso.
E a divergência entre tribunais é exatamente o tipo de coisa que a nossa memória
de cálculo deve **declarar**, não esconder.

### 6.3 Padrões de código que valem olhar

`packages/datasources/src/base/connector.ts` — classe base com cache
(fresco / obsoleto-enquanto-revalida / negativo), *single-flight*, tempo limite
com repetição, normalização e cadeia de reserva. A ideia da **versão do
normalizador na chave de cache** é boa: mudou o formato, o cache invalida
sozinho.

`docs/fontes/_TEMPLATE.md` — o modelo de ficha de fonte, com campos de medição
real. Se formos consumir qualquer API, vale adotar o mesmo formato.

### 6.4 Sobreposição de produto — ✅ decidido em 31/07/2026

**Decisão: construir CALC-002 assim mesmo.**

O quadro é mais concreto do que "duas aplicações previstas": as três de lá
**já estão no ar**, e antes do nosso lançamento — `reajuste-aluguel` em 26/07,
`corrigir-divida` em 27/07, `calculadora-rescisao` em 28/07.

O que sustenta a decisão: `calculadora-rescisao` vive em
`calculadora-rescisao.appzila.net`, subdomínio de um domínio genérico e de
propósito único. `calculoficial.com.br` é domínio de marca `.com.br`, com
profundidade temática — catálogo, guias, links internos — e com a memória de
cálculo auditável, que é o diferencial declarado em `CLAUDE.md`. Em busca
orgânica, que é o único canal de aquisição, essa é a posição mais forte.

O que isso obriga a acompanhar, já que o risco é real e não some por decisão:

- Os 90 dias de medição do MR-2 devem olhar as **duas** propriedades na mesma
  consulta. Se a canibalização aparecer, a resposta é consolidar — não insistir.
- `calculadora-rescisao` monetiza por laudo pago; aqui a monetização é anúncio.
  Não são o mesmo produto para o mesmo momento, e isso é argumento a favor de
  manter as duas — desde que a diferença fique visível para quem chega.

CALC-060 (`corrigir-divida`) e CALC-037 (`reajuste-aluguel`) estão no v2/v3 e
não precisam de decisão agora — mas herdam esta, e devem ser reavaliadas com o
que os 90 dias mostrarem.

Três aplicações do projeto irmão fazem o que o nosso catálogo também prevê:

| Lá | Aqui |
|---|---|
| `calculadora-rescisao` | CALC-002, CALC-003 · no ar lá desde 28/07/2026 |
| `corrigir-divida` | CALC-060 · no ar lá desde 27/07/2026 |
| `reajuste-aluguel` | CALC-037 · no ar lá desde 26/07/2026 |

Nunca foi problema técnico — é decisão de produto: dois sites seus competindo
pela mesma busca. Tomada acima.

### 6.5 Fontes de lá sem uso aqui

ANEEL (tarifas de energia) só interessa a CALC-065 e CALC-066, ambas no v3.
ANS, CMED, Hórus, DataJud, PNCP, Querido Diário, SICONFI, PGFN, DOU, CNPJ,
Compras.gov e TransfereGov **não** têm correspondência no nosso catálogo — e
várias caem nas categorias que `§14` excluiu em definitivo.

---

## 7. Coisas que vão morder quem não souber

### 7.1 O §3º do Art. 3º-A

A redução do imposto **também se aplica ao 13º salário**, cobrado
exclusivamente na fonte. Descoberto na auditoria de 31/07/2026, sem divergência
porque nenhuma calculadora publicada é afetada.

**Entra em CALC-005.** Está registrado em `docs/17-changelog.md`.

### 7.2 O `ref=` na URL

`src/lib/url-state.ts` só escreve a data de referência na query **quando ela
muda do padrão**. Não é detalhe de estilo: query implica `noindex`, e escrever a
referência padrão daria query a toda página recém-aberta — tirando todas as
calculadoras do índice. Silenciosamente, e o único canal de aquisição é busca
orgânica.

### 7.3 `Referrer-Policy: strict-origin`

Não é o valor "padrão razoável" — é o único que resolve. O
`strict-origin-when-cross-origin` **preserva a URL completa em requisição de
mesma origem**, e aqui todas as requisições de recurso são de mesma origem. Com
ele, o salário digitado ia parar no registro de acesso do servidor.

Há teste de regressão em `tests/leak/vazamento.spec.ts`, com prova de mutação.
**Não "simplifique" esse valor.**

### 7.4 O molde é a razão de o prazo fechar

Quatro calculadoras, zero arquivos de rota. Se aparecer a tentação de criar uma
página própria para uma calculadora específica, é sinal de que o contrato de
`src/lib/calculadoras/tipos.ts` precisa crescer — não de que o molde deve ser
contornado.

### 7.5 Verificador que sempre passa é pior que verificador ausente

Aconteceu duas vezes neste projeto: o `echo` que fingia ser o TC-051 do T-003 ao
T-105, e o `--passWithNoTests` que deixaria a suíte inteira sumir sem ninguém
notar. Os dois foram corrigidos.

Se algo não pode ser testado ainda, o padrão adotado é um teste que **reprova
quando o objeto surgir** — como o de linha de base em `vazamento.spec.ts`.

---

### 7.6 A rota carrega o que a rota usa

Desde 31/07/2026, adicionar uma calculadora **não engorda as outras rotas**.
Três peças sustentam isso, e quebrar qualquer uma devolve o problema:

1. `src/app/calculadora/[slug]/page.tsx` entrega `formularioDe(definicao, registro)`
   como propriedade — inclusive os anos disponíveis e a cobertura, já resolvidos.
   **O registro de parâmetros vive no servidor e nos módulos adiados**, nunca no
   pacote estático: cada definição monta o seu, com os conjuntos que consome. O componente de calculadora **não pode** voltar a importar o
   registro — se importar, as definições de todas voltam ao pacote. **Verificado
   por lint**, não por lembrança: `REGISTRO_FORA_DO_CLIENTE` em
   `eslint.config.js`. A volta seria um import de uma linha, e nenhum teste
   funcional a pegaria — tudo continuaria funcionando, só mais pesado.
   Componente de cliente novo precisa entrar naquela lista de arquivos.
2. `src/lib/calculadoras/calculo.ts` adia a função de cálculo, uma por
   calculadora. Toda calculadora nova precisa de uma linha ali; o teste cobra.
3. `calcular` é **exportação de topo** em cada definição, e o import adiado usa
   `webpackExports`. Como método do literal, o objeto inteiro — FAQ e textos de
   SEO junto — volta para o pedaço.

O formulário continua saindo pronto no HTML estático, e isso é a condição de
tudo: se um dia a medição melhorar às custas disso, a troca é ruim.

`verificar-orcamento.ts` mede o pedaço adiado junto, e **reprova** se uma
calculadora publicada não tiver pedaço. Sem isso, o orçamento passaria a mentir
para melhor — ver §7.5, é o mesmo erro de novo.

### 7.7 O orçamento mede o que o navegador baixa — e já mentiu duas vezes

`RNF-004` foi revisado de 120 para **135 kB** em 31/07/2026, com medição: React
e Next ocupam **100,5 kB**, 84% do teto antigo. Sobravam 19,5 kB para o produto
inteiro. Não era orçamento apertado — era orçamento consumido por dependência
que não se escolhe por rota. Quem mede a experiência é `TC-049` (LCP).

**Duas vezes o verificador relatou menos do que o navegador baixa**, e as duas
no mesmo dia:

1. Media só o manifesto da rota, ignorando os pedaços adiados.
2. Corrigido, passou a localizar o pedaço pelo NOME (`calc-<slug>.js`) — e
   quando o empacotador extraiu o motor compartilhado das duas calculadoras de
   rescisão para um pedaço anônimo, a rota **caiu** de 118,2 para 113,7 kB no
   relatório sem mudar nada para o usuário.

Hoje a medição segue o grafo real de dependências e resolve o nome do arquivo
pelo **runtime do empacotador**. Se a extração parar de reconhecer o formato, o
script falha alto. **Não confie em medição de pacote que melhora sozinha** —
verifique o que ela deixou de contar.

### 7.8 O molde cresce por necessidade medida, nunca por antecipação

Três calculadoras de 01/08/2026 exigiram três ampliações do contrato, e cada
uma tem um defeito concreto por trás:

| O que entrou | O defeito que ela impede |
|---|---|
| `Unidade` em `Etapa` e em `SaidaCalculadora` | A memória imprimiria **R$ 25,00** onde a resposta de CALC-070 é **25,00%**. Número certo com unidade errada é a forma mais convincente de estar errado |
| `TipoCampo` `'decimal'` | O campo de km/l de CALC-054 desenharia "R$ 12,50" ao lado de "km por litro" |
| Aviso de estimativa em duas redações | A frase única alegava *"parâmetros legais vigentes em <data>"* no CET, na amortização e nos juros compostos — que **não consultam parâmetro legal nenhum**. Alegar fundamento onde não há é o pior tipo de imprecisão num produto cuja tese é a auditabilidade |

`principal` continua tipado como `Centavos` mesmo quando a unidade não é moeda,
e isso é decisão, não descuido: o invariante que a marca protege — inteiro,
dentro do inteiro seguro, sem zero negativo — vale nas três unidades, e trocá-la
por `number` cru desprotegeria as doze calculadoras monetárias para acomodar
duas que não são.

### 7.9 A suíte de ponta a ponta só é confiável com as portas livres

**Antes de rodar `npm run check`, libere 3100 e 3101.** No PowerShell:

```powershell
foreach ($p in 3100,3101) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }
```

Com uma delas ocupada, a corrida de 01/08/2026 devolveu **34 de 250** e cinco
minutos e meio; com as portas livres, **243 passaram em 39 segundos**. O
sintoma engana: as falhas aparecem como `locator.fill: Test timeout`,
`/guias sem h1 único` e `strict-transport-security: undefined` — todas
parecendo defeito de aplicação, nenhuma sendo.

**Como distinguir em cinco segundos.** Suba o servidor à mão e peça uma rota:

```bash
PORT=3100 npm run start
```

Se `/calculadora/salario-liquido` responde 200 com dezenas de kB, a aplicação
está sã e o problema é o ambiente da suíte.

### 7.10 Teste genérico com valor fixo reprova calculadora certa

O teste "calcula de verdade" preenche todo campo obrigatório com um valor fixo
para provar que cada calculadora publicada de fato computa. Um valor fixo não
cabe em toda faixa: R$ 3.000,00 é um salário plausível e é um preço de
combustível absurdo, que a validação de CALC-054 recusa **com razão** — e o
teste reprovava a calculadora por ela estar correta.

A tentação era afrouxar o limite do campo para caber no teste. O certo foi o
inverso: `campos.tsx` expõe `data-maximo` nos quatro campos numéricos e o teste
limita o valor ao teto de cada campo. **Quando o teste e o produto discordam,
verifique qual dos dois está errado antes de mudar o produto.**

### 7.11 A norma às vezes muda a ESTRUTURA da conta, não só um número

CALC-023 é o caso mais claro do catálogo até aqui. A conta "óbvia" do rotativo —
aplicar a taxa da fatura por doze meses — descreve algo que a **Resolução CMN nº
4.549/2017 proíbe desde 2017**: o art. 1º limita o rotativo ao vencimento da
fatura seguinte, e o art. 2º obriga a migração para um parcelamento
comprovadamente mais barato. Um mês de rotativo, e o resto parcelado.

E há um teto. A **Lei nº 14.690/2023, art. 28, § 1º** determina que juros e
encargos não podem exceder o valor original da dívida — em vigor desde
**03/01/2024**, decorridos os 90 dias que o próprio dispositivo concede à
autorregulação que nunca foi aprovada. A **Resolução CMN nº 5.112/2023**, que
alterou a 4.549, fecha a porta dos fundos: na migração do rotativo para o
parcelamento, o valor original continua sendo o montante inicial do rotativo e os
juros são contados **desde o início dele** (art. 2º-A, parágrafo único, I e II).
Sem essa regra, bastaria reparcelar para zerar a contagem do teto.

**A lição para as próximas.** Antes de escrever a fórmula, pergunte se a norma
diz algo sobre a *forma* da operação, e não só sobre alíquota. Aqui, ler só a lei
do teto e ignorar a resolução do Banco Central teria produzido uma calculadora
que erra por larga margem — para cima, que é o erro que assusta o usuário
endividado sem ajudá-lo.

**O que foi recusado por falta de fonte.** Uma pergunta do FAQ afirmava que o
pagamento mínimo de 15% foi revogado em 2017. É provavelmente verdade, e não foi
possível confirmar em fonte oficial nas tentativas feitas — a pergunta foi
**substituída**, não suavizada. `CLAUDE.md`, regra 10: na dúvida, a afirmação não
existe.

### 7.12 Cada número certo, a soma errada — o pior defeito possível aqui

Encontrado à mão em produção, em 01/08/2026, minutos depois de CALC-023 subir.
Com o teto legal cortando, a tela mostrava:

```
Saldo que entrou no rotativo      R$ 1.000,00
Juros de um mês de rotativo     − R$   150,00
Juros do parcelamento           − R$ 2.888,00
Total a pagar                     R$ 2.000,00
```

Todo número correto isoladamente: os juros abertos são os **sem teto**, o total
é o **limitado**. E a soma não fecha. Quem lê não tem como saber por quê — lê
como defeito de cálculo, que é a leitura mais destrutiva possível num produto
cuja tese é confiança.

**Nenhum caso-ouro do motor pegaria isso**, porque o motor devolvia os dois
valores corretamente; o defeito nasceu ao escolher **quais** exibir. O teste que
o trava roda a função da *definição*, não a do motor, e afirma que a soma das
linhas é a última linha — nos dois cenários, com e sem teto.

**A lição.** Quando o motor devolve tanto o valor bruto quanto o limitado,
decida explicitamente qual deles vai para a tela, e teste a identidade da tela.
Vale para todo teto, piso e arredondamento que vier.

### 7.13 A frase que constrói confiança dizia 1990

Defeito pré-existente, descoberto ao conferir CALC-023: o FGTS anunciava
*"parâmetros legais vigentes em **15/06/1990**"*. Literalmente verdadeiro — a
alíquota de 8% vige desde 1990 e nunca mudou — e lido como produto abandonado,
na exata frase que existe para dizer ao visitante que o cálculo é atual.

A origem é `anosDisponiveis`: com uma única vigência aberta, o único ano
disponível é o de início, e a data de referência sintética vira `1990-06-15`.

**A correção não foi mexer na data, foi parar de citá-la.** Quando há um só
exercício, o seletor de período já fica escondido — ou seja, a data **não é
escolha do usuário**, e pinar um dia dentro do intervalo não informa nada. O
aviso passa a citar o **intervalo de vigência**: *"parâmetros legais em vigor a
partir de 11/05/1990"*. Quando há mais de um exercício, a data volta, porque aí
ela é escolha e muda o resultado.

Afetava CALC-006, CALC-007 e CALC-023.

### 7.14 O pipeline ficou verde com o deploy não tendo acontecido

Em 01/08/2026 o webhook do EasyPanel devolveu **HTTP 000** — falha de conexão do
runner ao painel — e o job `Implantar` terminou **success**. A correção de dois
defeitos ficou uma hora parada em produção, e o único sintoma visível era o site
continuar servindo o commit anterior. Os três deploys anteriores do mesmo dia
responderam 200; foi transitório.

**Por que passava batido.** O passo tratava resposta não-2xx como aviso, com uma
razão escrita e boa: quando o webhook **não está configurado**, falhar deixaria o
pipeline permanentemente vermelho por uma condição esperada — e vermelho
permanente é como se aprende a ignorar vermelho. Mas esse caso já era separado
pelo `if` do próprio passo. Dentro dele, o webhook está configurado, e não
responder é **incidente**, não estado esperado.

Agora são três tentativas com 15 s de intervalo, e falha se todas caírem. A
repetição vem antes da falha porque o 000 foi transitório: a mesma requisição,
reexecutada minutos depois, devolveu 200.

**Como diagnosticar isso rápido da próxima vez:**

```bash
gh run view "$(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --log | grep -oE "(Deploy disparado \(HTTP [0-9]+\)|Webhook respondeu HTTP [0-9]+)"
```

E para reexecutar só o deploy, sem commit novo:

```bash
gh run rerun --job "$(gh run view "$(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --json jobs --jq '.jobs[] | select(.name=="Implantar") | .databaseId')"
```

**Aconteceu de novo em 02/08/2026, e o comportamento novo funcionou.** O deploy
do commit de `ADR-006` respondeu HTTP 000 nas **três** tentativas e o job caiu —
corretamente, com a mensagem certa. A imagem tinha sido publicada; só a
implantação não disparou.

E ele se resolveu sozinho no push seguinte: a corrida de CALC-060, oito minutos
depois, disparou o webhook com sucesso, e como o EasyPanel puxa a imagem mais
recente, **os dois commits subiram juntos**. Vale saber disso antes de reexecutar
o job à mão: se houver outro push logo atrás, ele carrega o anterior.

**O intervalo entre o webhook responder 200 e produção servir o build novo é de
cerca de um minuto**, medido: a rota de CALC-060 respondeu 404 às 08:16 e 200 às
08:17. Conferir imediatamente depois do deploy dá falso negativo.

> **A verificação de saúde não teria pego.** Ela só roda quando o disparo dá
> certo. E mesmo rodando, `/api/health` responde igual em toda versão — ela
> aprova o contêiner ANTIGO. Expor o hash do commit em `rev` e comparar continua
> pendente (§8), e é o que fecharia o buraco de vez.

### 7.15 A terceira modalidade custou 40 linhas porque as duas primeiras foram feitas certo

CALC-008 é a rescisão por acordo do art. 484-A. Ela muda **três coisas** em
relação à dispensa sem justa causa: aviso indenizado pela metade, multa do FGTS
pela metade, saque limitado a 80%. Tudo o mais — saldo, 13º, férias, e sobretudo
as **incidências de INSS e IRRF verba a verba** — é idêntico.

Reaproveitar `calcularRescisao` com uma terceira `Modalidade` custou cerca de 40
linhas. Uma calculadora própria teria copiado `docs/19` inteiro, que é a parte
cara, a que levou uma sessão de pesquisa em fonte primária, e a única que não
pode divergir entre duas implementações.

**Dois defeitos latentes apareceram no caminho**, os dois pela mesma causa —
constante escrita à mão onde havia parâmetro:

| O que estava lá | O que aconteceria |
|---|---|
| `formula: \`${reais(baseFgts)} × 40,00%\`` | A memória exibiria **40,00%** ao lado de uma multa de 20% no instante em que o acordo entrasse. A fórmula contradizendo o próprio resultado |
| `parametroId: 'fgts-multa-sem-justa-causa'` fixo | O link da memória levaria ao art. 18 da Lei 8.036 numa etapa fundamentada no art. 484-A |

Nenhum dos dois quebrava nada **antes** de CALC-008. É o padrão a procurar
quando uma calculadora ganha uma variante: valores que vinham de parâmetro
resolvido continuam certos; textos que descrevem o parâmetro, não.

**Onde a norma foi lida com cuidado.** O inciso I diz "por metade: a) o aviso
prévio, **se indenizado**". Duas armadilhas num período:

1. O **se** exclui o aviso trabalhado — que é salário do período, e salário não
   se paga pela metade.
2. O que é reduzido é a **verba**, não o **prazo**. Os dias continuam sendo os da
   Lei nº 12.506/2011, e o art. 487, § 1º integra ao tempo de serviço "o período
   do aviso prévio" — que não foi encurtado. Logo a projeção, e os avos de 13º e
   férias, não mudam.

O item 2 é o ponto em que rescisões por acordo mais divergem na prática. A
leitura está **declarada na memória de cálculo**, com link para o dispositivo, e
travada por caso-ouro que compara as duas modalidades com a mesma entrada.

### 7.16 `Destaque.valor` é texto livre — e por isso escapa da formatação

`Tempo de serviço projetado até: **2026-08-29**` esteve no ar desde que CALC-002
foi publicada. Não era erro de cálculo, e nenhum caso-ouro pegaria: o motor
devolve `DataISO` porque é o tipo certo para ele devolver.

A causa é estrutural. Todo valor **numérico** do resultado atravessa
`formatarValor` no componente, e por isso não tem como sair sem formatação. Mas
`Destaque.valor` é `string` — a escotilha que existe para grandezas que o molde
não modela —, e o que passa por ela sai na tela exatamente como foi escrito.

**Ao criar um `Destaque`, pergunte se o valor já passou por `lib/format/`.** Foi
o que faltou em três lugares, todos escritos em momentos diferentes e todos com o
mesmo descuido.

### 7.17 Publicar com a fonte que existe, dizendo qual é

CALC-009 tem duas metades com auditabilidade muito diferente, e isso está na
cara do código.

O **número de parcelas** sai do art. 4º, § 2º da Lei nº 7.998/1990, lido no
Planalto. Fonte de primeira, como todo o resto do projeto.

O **valor** depende de limites que o art. 5º expressa em **BTN** — moeda extinta
em 1991. Os valores em reais são reajustados todo ano pelo INPC e divulgados pelo
MTE. Foram encontrados no portal do próprio órgão, com vigência declarada a
partir de 11/01/2026; **a portaria que os formaliza não foi localizada**, depois
de tentar a busca do DOU por período e por órgão, o JSON diário de 09 a 14/01 e a
página de serviço do ministério.

**O que decidiu publicar assim, em vez de parar:**

1. É fonte oficial — portal do órgão emissor —, o que satisfaz BV-07 e a
   convenção de `fontes.ts`, ainda que seja mais fraca que texto normativo.
2. Há **conferência cruzada**: o piso declarado ali, R$ 1.621,00, coincide com
   `salario-minimo` de 2026, conferido no PDF da portaria interministerial. Um
   erro de transcrição teria de coincidir com outro documento para passar.
3. A fraqueza está **declarada em três lugares** — no comentário da fonte, na
   `observacao` da vigência e em §5.1 — em vez de dissolvida no silêncio.

O contraste com o que foi **recusado** em CALC-023 no mesmo dia é o que define a
régua: lá a afirmação sobre o pagamento mínimo de 15% não tinha nenhuma fonte, e
a pergunta foi removida. Aqui há fonte do órgão, e ela é nomeada pelo que é.

> **Não confunda as duas situações.** "Sem fonte" não se publica. "Fonte oficial
> mais fraca que o ideal" se publica **dizendo que é**, e entra na lista de
> pendências para ser trocada.

### 7.18 O caso-ouro que estava errado — e virou o melhor caso do arquivo

`R$ 2.000,00 × 0,8 = R$ 1.600,00` reprovou. O motivo: R$ 1.600,00 fica **abaixo
do salário mínimo**, e o art. 5º, § 2º eleva o benefício ao piso. O cálculo
estava certo; o caso é que fora mal desenhado — escolheu um salário que dispara o
piso para testar a fórmula da 1ª faixa.

`CLAUDE.md` proíbe ajustar o valor esperado para o caso passar; manda descobrir
qual dos dois está errado. Aqui era o caso — e ele não foi apagado, foi
**movido** para o bloco do piso, onde vira a informação mais útil da calculadora:
como o fator da 1ª faixa é 0,8, o benefício só ultrapassa o mínimo a partir de
uma média de **R$ 2.026,25**. Abaixo disso, que cobre boa parte dos salários do
país, todo mundo recebe exatamente o mesmo valor.

### 7.19 Preenchedor genérico não vence regra ENTRE campos

O teste "calcula de verdade" preenche todo campo obrigatório com um valor que
respeita o tipo e o teto daquele campo. CALC-009 quebrou essa premissa: o mínimo
de "meses trabalhados" **depende de qual solicitação é** — 12 na primeira, 9 na
segunda, 6 da terceira em diante. Com os 5 meses do preenchedor, a calculadora
recusou. E estava certa.

Nenhum ajuste no preenchedor resolve, porque a restrição não é de um campo: é
entre dois. E pôr `minimo: 12` no campo bloquearia quem legitimamente tem 6 meses
na terceira solicitação — distorcer o produto para caber no teste, que §7.10 já
tinha registrado como o caminho errado.

**A saída usou o que o produto já tem:** o estado do formulário na URL
(`RF-006`). Um mapa pequeno e visível no próprio arquivo de teste declara a
combinação válida por slug, e a calculadora é exercitada por permalink.

Quando a próxima calculadora tiver campos que interagem, o lugar de declarar isso
é `ENTRADAS_QUE_INTERAGEM`.

### 7.20 A norma revogada que quase virou parâmetro

CALC-030 quase publicou uma cobrança extinta há cinco anos.

A Resolução CMN nº 4.765/2019 é famosa por duas coisas: o teto de 8% ao mês para
o cheque especial (art. 3º) e a tarifa de 0,25% sobre o limite acima de R$ 500
(art. 2º). **A segunda não existe mais.** O art. 2º foi revogado a partir de
1º/11/2021 pela Resolução CMN nº 4.962/2021 e declarado **inconstitucional** pelo
STF na ADI 6.407-DF.

Toda descrição secundária que se encontra por aí ainda cita a tarifa, porque
descreve o texto de 2019. O PDF **consolidado** do Banco Central traz as duas
tarjas no corpo do artigo, e é só por isso que a armadilha apareceu.

> **A regra "abra a fonte oficial, não o site que diz o que ela diz" cobrou o
> próprio preço aqui.** E há um corolário: a fonte oficial precisa ser a versão
> **consolidada**. O texto original publicado no DOU em 2019 traria o art. 2º
> vivo, sem nenhuma marca de que ele morreu depois.

O comentário na vigência de `cheque-especial-teto-juros-mes` avisa quem for
atualizar: aquele artigo não é parâmetro deste sistema, e não deve virar um.

### 7.21 A fronteira do §14, atravessada por dentro

`docs/18` marcava CALC-011 como **alta** dificuldade, com um motivo específico:
as alíquotas de terceiros (Sistema S) variam por código FPAS, e persegui-las
levaria a calculadora para o *tributário empresarial complexo* que `00-catalogo`
§14 excluiu em definitivo.

A saída estava no próprio §14, escrita para a categoria hiperlocal: *"onde o dado
é indispensável, ele entra como campo preenchido pelo usuário"*. Terceiros virou
campo. Ficaram como parâmetro apenas as alíquotas que estão **no corpo da Lei nº
8.212/1991** — patronal de 20% e RAT de 1, 2 ou 3% —, que só mudam por alteração
legislativa.

E o que fica de fora fica **declarado**: Simples Nacional, desoneração da folha e
FAP aparecem em nota, no aviso e no FAQ. Uma calculadora que não diz o que ignora
é pior que uma que ignora menos.

**O padrão a reaproveitar:** quando uma calculadora do catálogo encostar numa
categoria excluída, procure primeiro a saída que a própria exclusão prescreve,
antes de concluir que a calculadora não cabe.

### 7.22 Dois casos-ouro errados no mesmo dia, pelo mesmo motivo

Em CALC-009, `R$ 2.000,00 × 0,8 = R$ 1.600,00` — e o piso do salário mínimo
elevava para R$ 1.621,00.

Em CALC-030, `1,08^12 − 1 = 15.182` basis points — e `anualizar` trunca a divisão
inteira do `BigInt`, devolvendo 15.181.

**Os dois vieram de fazer a conta de cabeça e esquecer uma regra do próprio
sistema.** Nos dois o código estava certo. A tentação em ambos era mexer no
motor — pôr arredondamento em `anualizar` teria movido um número que CALC-024
publica desde 31/07/2026, por sete milésimos de ponto percentual.

Ao escrever caso-ouro, refaça a conta **pelo caminho do sistema**, não pelo
caminho da calculadora de bolso: com a política de arredondamento declarada, com
os pisos e tetos aplicados, na ordem em que o motor os aplica.

### 7.23 Texto de tela é texto — e o hábito de escrever markdown vaza

`**Simples Nacional**` foi ao ar em CALC-011 com os asteriscos à mostra. As
`notas`, os `destaques`, o FAQ e a ajuda dos campos são renderizados como **texto
puro**: não há interpretador de markdown em nenhum deles, e `ADR-009` decidiu
isso de propósito.

O hábito de escrever documentação em markdown atravessou para a string de
produto, e nada no sistema reclamou — não é erro de tipo, não é erro de cálculo,
e o teste genérico de ponta a ponta não olha ortografia. **A única coisa que
pegou foi abrir a página.**

Agora `catalogo.test.ts` varre todo texto de tela de toda calculadora publicada e
reprova asterisco de ênfase e acento grave de código. Custa duas asserções e
fecha a classe inteira, para todas as calculadoras que vierem.

### 7.24 O eixo ortogonal custa menos que a quarta modalidade

CALC-012 poderia ter virado uma quarta `Modalidade` — e teria ficado errada.
`Modalidade` responde **quem rompeu o contrato**; um doméstico também pode ser
dispensado, pedir demissão ou fazer acordo. Empilhar "doméstico" ali criaria
combinações impossíveis de representar.

Entrou como `regime: 'clt' | 'domestico'`, **eixo ortogonal**, e o que ele muda é
pequeno e nomeável:

1. **Não existe multa de 40%.** A LC 150/2015, art. 22, afasta por remissão
   negativa os §§ 1º a 3º do art. 18 da Lei nº 8.036 e põe no lugar um fundo de
   3,2% da remuneração, formado mês a mês em variação distinta da conta.
2. O aviso prévio tem **norma própria** — art. 23 —, com os mesmos números.

**O campo entrou como obrigatório, e o compilador cobrou de todo chamador.** Seis
literais de entrada, em três definições e três arquivos de caso-ouro, pararam de
compilar até declararem o regime. É o oposto de um valor padrão silencioso: nada
passou a ser doméstico ou celetista por omissão.

### 7.25 Números iguais, fundamentos distintos — quando duplicar é o certo

Os três parâmetros de aviso prévio do doméstico repetem 30, 3 e 90 — exatamente
os da Lei nº 12.506/2011. Duplicação deliberada.

A regra geral do projeto continua valendo: *duas verdades sobre o mesmo número
divergem na primeira manutenção*. Mas ela é sobre o mesmo número **no mesmo
contexto**. Aqui os contextos são dois estatutos, e reaproveitar os parâmetros da
CLT faria a memória de uma rescisão doméstica **citar uma lei que não rege aquele
contrato**, com um link que leva o leitor ao lugar errado.

Um caso-ouro trava exatamente isso: a etapa de dias no regime doméstico cita a
Lei Complementar e **não** cita a 12.506; no celetista, o inverso.

> O critério, quando aparecer o próximo número repetido: **os dois casos podem
> mudar separadamente?** Se sim, são dois parâmetros. Se não — o FGTS de 8%, que
> o art. 34, IV remete à própria Lei nº 8.036 —, é um só.

### 7.26 A coincidência que não virou fórmula

3,2% é exatamente 40% de 8%. O legislador dimensionou o fundo do doméstico para
chegar ao mesmo lugar da multa, e um caso-ouro registra que os dois valores ficam
a menos de um real de distância.

**E ainda assim o motor não calcula um a partir do outro.** Os 3,2% saem da
remuneração acumulada, não do saldo do FGTS — porque são contas vinculadas
distintas, cada uma com correção própria, e a igualdade se desfaz no instante em
que o usuário informa o saldo real de uma delas.

Coincidência aritmética é atalho tentador e raciocínio errado. Registre-a no
teste; não a use na conta.

### 7.27 Subir o teto sem mover o guarda-corpo é só afrouxar

`RNF-004` foi revisado de 135 para 150 kB em 01/08/2026, com autorização do
mantenedor. A medição que motivou:

    rota mais leve (juros compostos)     112,1 kB   piso + calculadora trivial
    rota mais pesada (rescisão)          129,1 kB   piso + 17,0 kB de motor
    folga sobre 135                        5,9 kB

As três rescisões subiram 5,6 kB numa única sessão — o motor compartilhado ganhou
a extinção por acordo e o regime doméstico — e a folga caiu de 11,5 para 5,9 kB.
A próxima calculadora a tocar aquele motor estouraria **sem ter feito nada
errado**.

**Mas o propósito de `RNF-004` não é desempenho.** Isso está escrito em
`12-test-plan` desde a revisão anterior: quem mede a experiência é `TC-049`
(LCP ≤ 2,0s). `RNF-004` é guarda-corpo contra crescimento por descuido — e um
guarda-corpo que se afasta toda vez que alguém encosta nele não é guarda-corpo.

Por isso entrou junto um **segundo limite, que é o que de fato pega o descuido**:
a *parte variável* de cada rota, medida contra a rota mais leve. O piso é o mesmo
em toda rota e não cresce com o catálogo desde que a carga passou a ser por slug;
o que varia é o motor e as tabelas de cada calculadora, e é aí que uma
dependência indevida apareceria.

Hoje: **16,7 kB de 30 permitidos**, na rescisão doméstica.

> **O padrão, para a próxima vez que um limite apertar:** pergunte o que ele
> existe para pegar. Se o número que está apertando não é o que pega aquilo,
> suba-o — e ponha no lugar um que pegue.

### 7.28 Eu sugeri uma calculadora bloqueada, e o levantamento já dizia

Sugeri CALC-019 afirmando que ela "reaproveita as tabelas de IRRF e não esbarra
no ano-calendário problemático". **Estava errado.** `docs/18` registra, em uma
linha: *"CALC-019 | Simplificado vs. completo | v3 | **É CALC-017 rodado duas
vezes**"*.

O comparador é entre os dois modelos da declaração **anual** — e depende
exatamente da tabela anual que fez CALC-017 ser adiada. O que me confundiu foi
CALC-016, que já mostra a escolha entre deduções e desconto simplificado no
cálculo **mensal**; concluí do mensal para o anual sem abrir o levantamento.

> **O levantamento existe para ser consultado antes de sugerir, não depois.**
> `docs/18-levantamento-calculadoras.md` tem uma linha por calculadora restante
> com a dependência de cada uma. Custa dez segundos e teria evitado isto.

### 7.29 Onde o molde vai apertar de novo

CALC-028 (bola de neve vs. avalanche) é a próxima do bloco de crédito sem
dependência de fonte — e ela **não cabe no molde atual**. Precisa de uma lista de
dívidas de tamanho variável, e `Campo` modela campo único, não grupo repetido.

As duas saídas, quando chegar a hora:

1. **Campos fixos para N dívidas** — cinco blocos de três campos, com `visivelSe`
   escondendo os vazios. Cabe hoje, sem tocar no contrato, e fica feio.
2. **Fazer o contrato crescer** com um tipo de campo repetível. É a resposta
   certa se mais de uma calculadora precisar — CALC-028 e CALC-040 (comparador
   de investimentos) precisam.

Como §7.4 registra, o molde cresce por **necessidade medida**. Duas calculadoras
que precisam é medida; uma é palpite.

> **Resolvido em 06/08/2026, pela saída 2.** Três calculadoras precisavam —
> CALC-028, CALC-073 e CALC-075 —, e o contrato cresceu: `TipoCampo` ganhou
> `'lista'`, `Campo` ganhou `colunas`, `linhasIniciais` e `maximoDeLinhas`, e o
> valor continua sendo **uma string serializável para a URL** (`RF-006`), no
> formato `saldo,taxa,parcela;saldo,taxa,parcela`. A correção da nota acima
> registrava que CALC-040 **não** precisava do campo; ela continua valendo.
>
> As três estão no ar. A saída 1 — blocos fixos com `visivelSe` — teria custado
> quinze campos por calculadora e não sobreviveria a CALC-074.

### 7.30 A unidade do sistema não cabia no dado — e o dado do usuário resolveu

CALC-031 precisava do prêmio do MIP, que a seguradora expressa como taxa sobre o
saldo devedor. As taxas praticadas ficam na casa de **0,025% ao mês**, e o basis
point tem resolução de 0,01%: `ADR-004` A-2 simplesmente **não representa esse
número**. Arredondar para 0,02% ou 0,03% moveria o prêmio em 20% a 50% — e num
produto cuja tese é auditabilidade, um encargo errado por metade é pior que
encargo ausente.

O reflexo seria ampliar a unidade. Seria caro e errado: `BasisPoints` atravessa
as vinte e seis calculadoras, e mexer nela para acomodar uma desprotegeria todas.

**A saída veio de perguntar que dado o usuário de fato tem em mãos.** Ele não
tem a alíquota — tem a simulação do banco, que traz o prêmio em reais na
primeira prestação. O campo passou a pedir isso, e o motor reduz o valor na
proporção do saldo, que é o que "incide sobre o saldo devedor" significa. No
primeiro mês a proporção devolve exatamente o número informado; nenhuma alíquota
é inferida e exibida como se fosse do contrato.

> **O padrão, quando a unidade do sistema não couber num parâmetro novo:**
> antes de mexer na unidade, verifique se o usuário sequer possui a grandeza que
> ela não representa. Com frequência o que ele tem é o **resultado** da taxa, não
> a taxa — e aí a conta muda de direção, não de unidade.

### 7.31 Verificador que falha pelo próprio limite custa a sessão errada

`verificar-orcamento.ts` lia o mapa de hashes do empacotador dentro de uma janela
fixa de **2.000 caracteres** a partir de `.u=`. O primeiro dicionário daquele
trecho — o dos nomes de pedaço — cresce **uma entrada por calculadora**, e com
trinta e cinco publicadas o segundo dicionário, o dos hashes, caiu fora da janela.

O script fez o que devia e **falhou alto**, com a mensagem certa. Mas a mensagem
descrevia um sintoma do build (*"o formato da saída do empacotador provavelmente
mudou"*), e o defeito era do próprio recorte — o que manda quem diagnostica para
o lugar errado.

O recorte passou a ir de `.u=` até o `".js"` que **fecha a função**, que é limite
estrutural e não estimado.

> **O complemento de §7.5.** Verificador que sempre passa é o pior caso. O que
> falha pelo próprio limite é melhor, e ainda assim caro: ele gasta uma sessão
> procurando um problema que não existe. Quando escrever recorte, ancore no que a
> estrutura garante, não no tamanho que ela tem hoje.

### 7.33 A fonte oficial que **não resolve** — e o que fazer então

§7.20 registrou que a fonte oficial precisa ser a versão **consolidada**, porque
o texto original não mostra o que foi revogado depois. CALC-062 encontrou o caso
seguinte: **a consolidada também pode não responder.**

O art. 15-B do Decreto nº 6.306/2007 fixa a alíquota de IOF sobre câmbio. O texto
consolidado no Planalto, lido em 03/08/2026, exibe ao mesmo tempo:

| O que aparece | Marca |
|---|---|
| Redação do Decreto nº 12.499/2025 | **Sustado pelo Decreto Legislativo nº 176/2025** |
| Redação anterior, do Decreto nº 8.325/2014 | **Restabelecido pelo Decreto Legislativo nº 176/2025** |
| Redação do Decreto nº 12.499/2025, de novo | **Vide Decreto Legislativo nº 176/2025** · **Vide ADC nº 96** |

Ou seja: o Congresso sustou o decreto do Executivo, o Executivo levou a questão
ao Supremo, e a página oficial mostra as três camadas lado a lado sem dizer qual
vige. **Não é ambiguidade de leitura — é disputa em curso.**

**O que foi feito.** Nenhuma alíquota entrou em `lib/params/`. A calculadora foi
publicada com o IOF como **campo**, seguindo o que `00-catalogo` §14 prescreve
para dado que o produto não pode fundamentar — o mesmo caminho de CALC-011 com
terceiros e de CALC-057 com o IPVA. O FAQ explica a disputa citando exatamente o
que o texto consolidado mostra, e não afirma alíquota nenhuma.

**E há um segundo motivo, que sobreviveria mesmo sem a disputa:** a alíquota não
é a mesma para espécie, cartão, transferência e remessa. Um número único para
todas seria errado de qualquer jeito.

> **A régua que isto fixa.** Quando a fonte oficial não resolve, há três saídas,
> e só duas são aceitáveis. Publicar um número escolhido entre as versões é a
> inaceitável. As outras são **não publicar a calculadora** ou **publicá-la sem o
> valor, dizendo por quê** — e a segunda só vale quando a página continua útil
> sem ele, que é o caso aqui: a cotação efetiva, que é o que a página existe para
> mostrar, não depende de qual alíquota vige.

### 7.34 Preço não cabe na máquina de séries, e isso ficou declarado

CALC-062 seria a candidata natural a puxar a cotação do dólar da série 1 do BCB,
que existe e foi medida. Não puxa, e o motivo é de contrato: a máquina de séries
deste projeto é feita para **percentual** — escala fixa de quatro casas e
conversão para basis points. Cotação é **preço**.

A medição de 03/08/2026 tornou isso concreto: o dólar (série 1) vem com quatro
casas decimais e o euro (série 21619) com **sete**. O normalizador recusaria a
segunda, corretamente, por exceder a escala declarada.

Encaixar preço ali exigiria escala por série e um tipo não percentual. É
ampliação de contrato, e §7.8 manda que ela venha de **necessidade medida**: uma
calculadora que precisa é palpite. Fica registrado para quando a segunda
aparecer.

### 7.35 `Number()` aceita coisas que a sua tela nunca produz

O leitor da lista usava `Number(celula)` com um teste de finitude e sinal. Parece
suficiente, e não é: `Number('1e9')` são um bilhão, `Number('0x10')` são dezesseis
e `Number(' 5 ')` são cinco. Nada disso sai do editor de lista — sai de uma URL
colada ou editada à mão, que é a única entrada do sistema que vem do mundo.

O caso que expôs isso foi o teste de célula ininteligível: `1e9` entrou como
1.000.000.000 de centavos e, em CALC-028, virou saldo que os juros multiplicaram
até **estourar o inteiro seguro** — `centavos()` lançou, e a página quebraria.

Agora só dígito puro vale (`/^\d{1,15}$/`), que é exatamente o que
`escreverLista` produz e o que `FORMATO_DE_LISTA` aceita. **As três formas
coincidem de propósito**: se uma aceitasse o que a outra não escreve, o permalink
devolveria um formulário diferente do compartilhado.

### 7.36 Simulação que não converge tem de PARAR, não estourar

`simularPlano` tinha um teto de 600 meses e uma guarda de "sem progresso" que
comparava o disponível com o desembolso. As duas eram insuficientes: com
pagamento **abaixo** dos juros, há progresso — paga-se algo todo mês — e o saldo
cresce assim mesmo, exponencialmente. Muito antes dos 600 meses, o número
ultrapassa o inteiro seguro da linguagem.

Medido com R$ 10.000,00 a 15% ao mês e parcela mínima de R$ 1,00: exceção de
`RangeError` no lugar de resposta.

A guarda certa não olha o disponível, olha o **saldo somado**: se ele terminou o
mês igual ou maior do que começou, o plano não anda, e a simulação para com
`quitou: false`. A página então diz "esse valor por mês não quita as dívidas" —
que é a resposta útil, e a única honesta.

> **O padrão, para a próxima simulação iterativa.** Teto de iterações protege
> contra laço infinito, não contra divergência. Quem itera sobre juros precisa de
> uma medida de progresso do próprio saldo.

### 7.37 Duas casas decimais são a resposta certa para dinheiro e a errada para medida

Todo valor do sistema é inteiro escalado por cem, e para real isso é exato — não
existe terceira casa. CALC-074 quebrou a premissa sem quebrar a regra:
**conversão de unidade atravessa doze ordens de grandeza**. Um milímetro em
quilômetros é 0,000001, e com duas casas a página imprimiria **0,00** para uma
pergunta legítima.

A saída foi `SaidaCalculadora.casasDecimais`: a escala continua **declarada**, e
a diferença é que agora quem declara é o cálculo, e não o tipo. `Centavos` segue
protegendo o que sempre protegeu — inteiro, seguro, sem zero negativo.

**A regra de escolha da escala importa mais que o campo.** A primeira versão
usava "casas suficientes para quatro algarismos", e ela mostrava a libra como
453,59 g — escondendo cinco algarismos que a definição da unidade garante. A
regra certa é: **mostrar o número que a conversão TEM**. Se a fração termina em
cinco casas, são cinco casas; quando ela não termina — 500 GB em GiB não
terminam —, aí sim a régua passa a ser legibilidade.

E há uma armadilha no formatador: **escala e casas exibidas são coisas
diferentes**. Um resultado inteiro — 100 TB em bytes — chega com escala zero, e
tratar a escala como se fosse o mínimo de casas exibidas dividiria o número por
cem.

### 7.38 Onde os números grandes podem morar

`BV-10` reprova literal ≥ 100 dentro de `engine/`, porque número grande ali quase
sempre é constante legal disfarçada. A tabela de unidades de CALC-074 tem
quarenta deles — 40.468.564.224 centímetros quadrados no acre —, e desativar a
regra quarenta vezes é o caminho para desativá-la uma vez a mais onde ela
importava (§7.5).

A saída já existia no projeto e bastava reconhecê-la: `lib/params/` é isento de
`BV-10` porque as constantes **são o conteúdo do módulo**. As razões entre
unidades também são, e por isso foram para `src/lib/unidades/`, com a mesma
isenção declarada na configuração — onde é revisável — e não espalhada em
comentários.

**Elas não são parâmetro legal, e por isso não cabiam em `params/`:** a polegada
é 25,4 mm por acordo internacional de 1959, não por norma com vigência. Não
expiram, não mudam por decreto e não têm fonte oficial brasileira. O que varia
por região está no RÓTULO — alqueire paulista e mineiro são áreas diferentes com
o mesmo nome, e aparecem separados.

`BV-11` continua valendo no módulo novo: as razões são frações de inteiros, nunca
decimais.

### 7.39 A calculadora que não devia pedir a resposta

`docs/18` §8 registrava a dúvida sobre CALC-059 existir: sem a tabela FIPE, que
tem licenciamento restrito, o caminho fácil seria pedir ao usuário a taxa de
depreciação. Um produto que faz isso não calcula nada — ele devolve o que
recebeu com outra roupa.

A saída é pedir o que o dono do carro **tem**: quanto pagou, quanto o carro vale
hoje (consulta pública e gratuita na FIPE) e há quanto tempo. Desses três a
bisseção descobre a taxa real daquele carro, que vale mais que qualquer média de
mercado.

**O padrão vale para o que vier.** Antes de concluir que uma calculadora depende
de fonte inacessível, vale perguntar qual dado o usuário já tem em mãos e o que
se pode derivar dele. Foi o mesmo movimento de CALC-068 com a duração do botijão
e de CALC-057 com o IPVA.

### 7.40 O que impede CALC-066, e por que ela não foi construída junto

CALC-066 (retorno de energia solar) aparece como "Fonte: —, Manutenção: Nula" no
catálogo, e a leitura fácil é que basta código. Não basta, e o motivo merece
ficar escrito antes que alguém a construa.

A geração do sistema em kWh depende de irradiação local, e a saída já estava
decidida: **vira campo do usuário**, porque a proposta do instalador traz o
número. Até aí, é o padrão de CALC-067 e CALC-057.

O problema é outro. A **Lei nº 14.300/2022** instituiu cobrança gradual pelo uso
da rede sobre a energia injetada — o chamado Fio B —, com percentual que cresce
ano a ano. Uma calculadora de retorno que ignore isso devolve payback **otimista
com aparência de exato**, que é precisamente o dano que este produto existe para
evitar. E o percentual é valor legal: não pode ser inventado nem estimado, e
transformá-lo em campo do usuário empurra para ele uma pergunta que ele não tem
como responder.

**O que destrava:** confirmar em fonte oficial o cronograma da Lei 14.300/2022 e
cadastrá-lo em `lib/params/` com vigência, como qualquer parâmetro legal. É
trabalho de leitura, não de código — e é por isso que ela ficou fora do lote de
06/08/2026, junto com as outras que dependem de norma.

### 7.41 Duas listas do mesmo conjunto divergem — inclusive as minhas

`indice.ts` existe porque a home não podia importar as definições, e
`catalogo.test.ts` existe porque duas listas do mesmo conjunto divergem. A lição
estava escrita no código desde 31/07/2026, e este documento a violava em três
lugares ao mesmo tempo: §4, §4.2 e §4.3 mantinham contagens paralelas das
calculadoras pendentes, atualizadas à mão.

O resultado foi previsível. Em 06/08/2026 as tabelas listavam CALC-011, CALC-012,
CALC-013, CALC-039, CALC-040 e CALC-041 como pendentes — **todas publicadas**, as
três primeiras havia dias. Eu li a tabela, acreditei nela e informei ao mantenedor
uma fila de trabalho que não existia.

A correção foi deixar **uma** lista, com o comando que a confere ao lado:

```bash
grep -rh "^  id: 'CALC-" src/lib/calculadoras/*.ts | grep -o "CALC-[0-9]*" | sort
```

> **O padrão, para qualquer contagem neste documento.** Se um número pode ser
> derivado do código, ou ele é derivado na hora de usar, ou ele vai divergir. Não
> existe terceira opção — e documento não tem suíte de testes.

### 7.42 O texto consolidado empilha redações — e a vigente é a última

O Planalto publica os textos consolidados com as redações sucessivas **uma
abaixo da outra**, sem riscar as revogadas. No art. 21 da Lei nº 8.212/1991 o
`§ 2º` aparece **quatro vezes** na mesma página: a redação original da LC
123/2006, a da MP 529/2011, e a da Lei 12.470/2011 — e ainda o caput em duas
versões, uma delas falando de "segurados empresários, facultativo, trabalhador
autônomo", categorias que a Lei 9.876/1999 substituiu por "contribuinte
individual".

Quem lê de cima para baixo e para na primeira ocorrência cadastra uma alíquota
revogada com fonte oficial correta — o pior tipo de erro possível aqui, porque
ele passa em toda conferência de procedência.

**A regra: na página consolidada, a redação vigente é a ÚLTIMA de cada
dispositivo**, e a nota entre parênteses diz qual lei a deu. Confira sempre a
lei citada na nota, e confira nela a cláusula de vigência — a Lei 12.470/2011
tem art. 5º com efeitos escalonados: 1º/05/2011 para uns dispositivos, a data da
publicação para os demais.

### 7.43 A calculadora que existe para desfazer uma confusão

CALC-050 não é uma variação de CALC-016. A tabela progressiva de 7,5% a 14% é a
do segurado **empregado**; quem recolhe por conta própria paga **alíquota
única** — e a base dos planos reduzidos é fixa no salário mínimo, por lei.

Isso produz um comportamento que parece defeito e não é: **no plano simplificado,
mudar a renda não muda o valor a pagar.** O § 2º manda a alíquota incidir "sobre
o limite mínimo mensal do salário de contribuição", e ponto. A página diz isso em
três lugares — na ajuda do campo, na justificativa da etapa e na primeira nota —
porque é a dúvida que traz a pessoa até aqui, e um caso-ouro trava a propriedade
contra alguém "consertar" a conta no futuro.

**O que ela recusa a fazer, e por quê.** A complementação do § 3º sai sem os
juros moratórios do art. 5º, § 3º, da Lei nº 9.430/1996: eles dependem da Selic
acumulada da competência a ser complementada até o recolhimento. Exibir a
diferença de alíquota chamando-a de "valor a pagar" erraria para menos — então
ela é exibida com o nome do que é, e a nota explica que o valor real é maior.

### 7.44 Negar fundamento legal onde há é tão grave quanto alegá-lo onde não há

CALC-050 foi ao ar calculando **certo** e exibindo, abaixo do resultado, o aviso
de *"esta calculadora não consulta parâmetro legal com vigência"*. Ela consulta
quatro.

A causa foi outra lista escrita à mão — a mesma classe de §7.41. O registro do
**servidor**, que resolve a cobertura de vigências, era montado dentro da página
com os conjuntos enumerados um a um. Conjunto novo que não fosse acrescentado ali
não tinha cobertura resolvida, e sem cobertura o componente escolhe a redação de
calculadora sem fundamento legal.

**O que torna este defeito pior do que parece.** `Calculadora.tsx` já registrava
ter corrigido DUAS vezes o erro inverso — alegar parâmetro legal onde não havia.
Este é o mesmo dano na direção oposta, num produto cuja tese inteira é a
auditabilidade, e ele passou por toda a suíte: os casos-ouro conferem o número,
não a frase ao lado dele.

Encontrado rodando a calculadora **em produção**, que é o passo 7 do roteiro de
parâmetro legal em `CLAUDE.md`. O roteiro existe por isto.

A correção tem duas partes, e a segunda é a que importa:

1. `src/lib/params/data/todos.ts` — uma lista só, e a página monta o registro com
   `construirRegistro(...TODOS_OS_CONJUNTOS)`.
2. `tests/unit/parametros-do-servidor.test.ts` — para toda calculadora que
   declara `parametrosRequeridos`, a cobertura combinada tem de resolver; e todo
   conjunto em disco tem de estar na lista. Verificado que ele **reprova** com um
   conjunto removido, antes de ser aceito (§7.5).

> **O padrão.** Toda vez que o produto escolhe uma FRASE conforme o estado do
> cálculo, essa escolha precisa de teste. O número tem casos-ouro; o texto ao
> lado dele não tinha nenhum, e é ele que o usuário lê para decidir se confia.

### 7.45 A norma manda ler OUTRA norma — e o "Vide" é o aviso

O art. 18-A da LC 123/2006 traz os valores fixos do MEI: R$ 1,00 de ICMS, R$ 5,00
de ISS. Copiá-los e publicar teria sido rápido, e teria sido errado — as alíneas
carregam a marca **"(Vide Lei Complementar nº 214, de 2025)"**, e o texto
consolidado não diz o que ela muda nem quando.

A LC 214/2025 é a regulamentação da reforma tributária. O art. 516 dela substitui
as alíneas por remissões a um **Anexo VII**, com ICMS, ISS, CBS e IBS ano a ano.
Se ela já estivesse em vigor para o MEI, publicar R$ 1,00 e R$ 5,00 seria
publicar valor revogado com fonte oficial correta.

**Quem resolveu foi o próprio Anexo VII**, que declara a vigência de cada linha —
a primeira começa em **1º/1/2027**. Os valores atuais valem até 31/12/2026.

A tabela inteira até 2033 chegou a ser cadastrada, e foi **removida** pelo motivo
de §7.48. Ela volta quando o salário mínimo dos anos correspondentes existir.

> **O padrão.** "Vide" no texto consolidado não é nota de rodapé: é a norma
> avisando que ela sozinha não responde. Toda vez que ele aparecer sobre um valor
> que se pretende cadastrar, a lei citada precisa ser lida — inclusive a cláusula
> de vigência dela, que é onde a resposta costuma estar.

### 7.46 Dois valores legais que não cabem no invariante de centavos

O Anexo VII discrimina, para 2027-2028, **CBS de R$ 0,994 e IBS de R$ 0,006** —
três casas decimais, contra as duas de `ADR-004` A-1.

A soma é exatamente R$ 1,00, e é ela que sai do bolso do MEI: a divisão entre os
dois tributos é repartição de receita entre entes federativos, não valor a pagar.
Foi cadastrado o que se paga, com a decomposição na `observacao` da vigência —
somar dois números exatos não é simplificar.

**O que isso indica para o futuro.** A reforma tributária vai trazer mais
coeficientes com três ou mais casas, e nem todos vão somar redondo. Quando
aparecer o primeiro que não some, o caminho já existe e está no contrato: o tipo
`fracao` de `ValorParametro`, criado por `ADR-007` exatamente para "coeficiente
que não cabe em basis points, registrado como a norma o expressa".

### 7.47 O texto da lei diz R$ 45,65, e ninguém paga isso

A alínea "a" do art. 18-A, § 3º, V fixa a parcela de INSS do MEI em **R$ 45,65**
— valor de 2008. Cadastrá-lo como está seria copiar a lei corretamente e errar o
número em quase quarenta reais.

O § 11 do mesmo artigo é que resolve: manda reajustar o valor "de forma a manter
equivalência com a contribuição de que trata o § 2º do art. 21 da Lei nº 8.212" —
os 5% sobre o limite mínimo, que este projeto já tinha cadastrado por CALC-050 no
dia anterior. Por isso o parâmetro do MEI é um **percentual**, não um valor: é o
percentual que a norma determina, e o valor em reais é consequência.

> **Valor nominal antigo com regra de atualização ao lado é armadilha comum na
> legislação tributária.** Antes de cadastrar qualquer valor em reais escrito numa
> lei antiga, vale procurar o parágrafo que manda reajustá-lo — ele costuma estar
> no mesmo artigo, e é ele que vale.

### 7.48 Cadastrar vigência futura de UM parâmetro estraga o seletor de todos

A LC 214/2025 fixa os valores do MEI ano a ano até 2033. Cadastrar a tabela
inteira parecia virtude: a lei já está publicada, e a calculadora atravessaria a
transição sozinha.

**Medido em produção, o efeito foi outro.** O seletor de período de uma
calculadora é derivado das vigências dos parâmetros que ela usa. Com ICMS e ISS
cadastrados até 2033 e o salário mínimo existindo só até 2026, a página do
DAS-MEI abria em **2033**, anunciava "parâmetros legais vigentes em 15/06/2033" e
calculava o INSS com o salário mínimo de **2026** — porque a vigência de 2026 é
aberta, e vigência aberta resolve qualquer data futura.

É a extrapolação que `RN-003` existe para impedir, entrando pela porta dos
fundos: nenhuma regra foi violada, e mesmo assim a página afirmou um ano e usou
outro.

> **A regra de julgamento.** Não cadastre vigência futura de um parâmetro se os
> outros parâmetros da mesma calculadora não a têm. Vigência aberta significa
> "vale até segunda ordem", não "valerá em 2033" — e a diferença só aparece
> quando alguém oferece 2033 na tela.

**Por que não escrevi um teste para isto.** Tentei, e as invariantes que testei
reprovariam calculadoras corretas: um parâmetro perene (a alíquota de FGTS, de
1990) ao lado de um anual limitaria o seletor a 1990. Distinguir "parâmetro que
reajusta todo ano" de "parâmetro perene" é conhecimento de domínio, não estrutura
— e um verificador com heurística frágil ensina a ignorá-lo (§7.5).

O que ficou no lugar é um caso-ouro específico: o seletor do DAS-MEI não oferece
ano além de 2026. É menos do que eu queria, e é o que dá para afirmar com
honestidade.

### 7.49 A isenção de dividendos acabou — e isso muda CALC-048 inteira

Fui construir CALC-048 (CLT vs. PJ vs. MEI) e comecei pela premissa que todo
comparador desse tipo usa: **distribuição de lucros é isenta de imposto de
renda**. Ela era verdadeira desde 1996, pelo art. 10 da Lei nº 9.249/1995.

Não é mais. O art. 10 ganhou nova redação da **Lei nº 15.270/2025** — a mesma
que este projeto já conhecia pelo desconto simplificado do IRRF — e passou a
condicionar a não incidência aos arts. 6º-A e 16-A da Lei nº 9.250/1995.

O **art. 6º-A** é curto e pesado:

> A partir do mês de janeiro do ano-calendário de 2026, o pagamento [...] de
> lucros e dividendos por uma mesma pessoa jurídica a uma mesma pessoa física
> residente no Brasil em montante superior a R$ 50.000,00 [...] em um mesmo mês
> fica sujeito à retenção na fonte [...] à alíquota de 10% [...] **sobre o total
> do valor pago**.

Três coisas que só aparecem lendo com atenção:

1. **Os 10% incidem sobre o TOTAL, não sobre o excedente.** Distribuir
   R$ 50.000,00 custa zero; distribuir R$ 50.000,01 custa R$ 5.000,00. É um
   degrau, não uma rampa — e é exatamente o tipo de armadilha que este produto
   existe para mostrar.
2. **É por PJ e por sócio**, no mesmo mês. A estrutura societária muda o
   resultado.
3. **O § 3º preserva o passado**: resultados apurados até 2025, distribuição
   aprovada até 31/12/2025 e valores exigíveis nos termos da aprovação ficam
   fora.

> **Por que isto bloqueia CALC-048 e não a destrava.** Um comparador que trate
> dividendos como isentos superestima o lado PJ para qualquer sócio que retire
> mais de R$ 50 mil por mês — e é justamente na faixa alta que a comparação
> CLT × PJ interessa. Publicá-la com a premissa antiga seria publicar um número
> errado com aparência de certo, para o público que mais decide com base nele.

**O que falta para construí-la**, em ordem: os Anexos III e V do Simples
Nacional com o fator R, o art. 6º-A acima, e o art. 16-A (que ainda não li). São
três frentes de pesquisa, e nenhuma delas é código.

### 7.50 A calculadora que corria risco de ser um duplicado

CALC-038 estava no catálogo com "Fonte: —, Manutenção: Nula", e era a última que
não dependia de pesquisa em norma. Também era a que mais corria risco de não
merecer existir: financiar uma reforma é tomar crédito, e CALC-024 já calcula o
custo de tomar crédito. Publicar uma segunda página para a mesma conta canibaliza
a primeira na busca e não ajuda ninguém.

**O que a salvou foi mudar a pergunta.** O CET simula UMA operação, para quem já
escolheu onde tomar. Quem vai reformar não está nesse ponto: tem o orçamento na
mão e várias portas abertas — garantia de imóvel, consignado, pessoal, cartão —
com taxas que se separam por um fator de cinco. A página compara **as
modalidades para a mesma obra**, e acrescenta a porta que não aparece na mesa do
banco: esperar e pagar à vista.

Duas decisões que vieram junto:

**Modalidade em branco não vira linha na tabela.** Campo vazio significa "não
tenho essa opção" — e uma linha com taxa zero apareceria como a mais barata de
todas, inventando uma porta que a pessoa não tem. Um caso-ouro trava isso.

**O rendimento da alternativa de esperar começa em zero.** Supor rendimento
otimista enviesaria a comparação a favor de esperar; zero enviesa a favor de
financiar, mas é o cenário que o usuário controla e que a tela declara.

> **O teste que vale para a próxima "calculadora óbvia".** Se a resposta a "por
> que isto não é a calculadora X que já existe?" for uma diferença de rótulo,
> não é calculadora nova. Se for uma diferença de PERGUNTA, é.

### 7.51 O bloqueio D-5 não era o calendário de feriados

`docs/18` registrava CALC-072 como bloqueada por "D-5: o calendário de
feriados", e a leitura natural era que faltava uma fonte de dados — alguma
tabela de feriados a obter e manter.

**Não faltava.** Os feriados nacionais estão em três leis federais, e são nove:

| Data | Lei |
|---|---|
| 1º/1, 1º/5, 7/9, 15/11, 25/12 | Lei nº 662/1949, art. 1º |
| 21/4 e 2/11 | mesma lei, redação da Lei nº 10.607/2002 |
| 12/10 | Lei nº 6.802/1980 |
| 20/11 | Lei nº 14.759/2023 |

E os móveis não precisam de tabela nenhuma: derivam da Páscoa, que é o cômputo
gregoriano — aritmética pura, sem fonte a citar, como o ano bissexto que
`datas.ts` já implementa.

**O que o bloqueio realmente escondia era uma questão de produto**, e ela é mais
interessante que o dado: **Carnaval, Sexta-feira Santa e Corpus Christi não são
feriados nacionais.** A Lei nº 9.093/1995 diz que feriados civis são os
declarados em lei federal (art. 1º) e que a Sexta-Feira da Paixão é feriado
RELIGIOSO, declarado em lei MUNICIPAL, dentro de um limite de quatro (art. 2º).
Os outros dois são ponto facultativo.

Quase toda calculadora de dias úteis os soma como se fossem nacionais. Somá-los
erra para quem trabalha em cidade que não os declara; ignorá-los erra para quem
trabalha em cidade que declara. A saída foi **oferecê-los por escolha, com a
natureza declarada no próprio rótulo** — e é isso que a página tem de próprio.

### 7.52 A data de referência não servia, e a correção mudou a pergunta

O molde tem UMA data de referência por cálculo: "com que regras eu calculo".
Aqui as regras dependem de **cada dia do período**, e não da data em que se
consulta — os dias úteis de 2020 se contam com os feriados de 2020, mesmo que a
pergunta seja feita hoje.

A primeira versão resolvia os nove feriados na data de referência. Duas
consequências, as duas ruins:

1. O seletor de período ofereceria **2023** como único ano, porque
   `anosDisponiveis` deriva dos anos de início das vigências — e a última é a da
   Lei nº 14.759/2023.
2. Contar um período de 2020 aplicaria a lista de hoje, incluindo um feriado que
   não existia. É a extrapolação de `RN-003` com o sinal trocado.

A correção foi passar a resolver **na data de cada dia contado**. E ela teve uma
etapa intermediária errada que os testes pegaram: resolver por ANO, com cache,
usando 31 de dezembro. Como as três leis que ampliaram a lista foram publicadas
em dezembro, o cache por ano transformava 20/11/2023 em feriado retroativo — o
dia é anterior à publicação da lei, em 22/12/2023.

> **A pergunta certa era por dia, e a resposta também.** Quando o custo de uma
> otimização é mudar a granularidade da pergunta, ela deixou de ser otimização.

### 7.53 Um tipo novo de valor legal: a data que se repete

`ValorParametro` ganhou `data_fixa`, e a decisão merece registro porque a
alternativa parecia mais barata.

Codificar um feriado como inteiro — `421` para 21 de abril — teria cabido no
contrato atual sem tocar em nada. Seria o encoding que §7.30 já registrou como
caminho errado: o dado deixa de ser legível, a validação de faixa deixa de
valer, e quem lê o arquivo precisa saber decodificar.

**E feriado PRECISA da máquina de vigências**, que é o que o distingue das
razões entre unidades físicas de §7.38: aquelas não expiram, estas mudaram três
vezes em setenta anos. Sem vigência, contar 2020 com o feriado de 2023 seria
impossível de impedir.

Nove parâmetros que precisam — bem acima da necessidade medida de §7.8.

### 7.54 O número que ninguém sabe de onde vem

Todo sócio que recebe pró-labore vê **11%** de INSS no recibo, e nenhuma norma
escreve "11%". O número é o encontro de duas regras:

  Art. 22, III da Lei nº 8.212/1991 — a empresa recolhe **20%** sobre a
  remuneração paga a contribuinte individual que lhe presta serviço.

  Art. 30, § 4º — o segurado deduz da sua contribuição "quarenta e cinco por
  cento da contribuição da empresa [...] **limitada a dedução a nove por cento**
  do respectivo salário-de-contribuição".

Como 45% de 20% dão exatamente 9%, o teto é alcançado e os 20% do caput viram
11%.

**A tentação era cadastrar 11% e seguir.** Caberia no contrato, passaria em toda
verificação, e produziria o número certo. O que ela custaria é a única coisa que
este produto vende: quem abrisse a memória de cálculo veria "11%, art. 21" e não
teria como conferir — porque o art. 21 diz 20%.

Foram cadastrados **a patronal e o teto da dedução**, e a subtração é feita no
motor, à vista, com etapa própria na memória. Um caso-ouro exige que a etapa
exista e cite as duas parcelas.

> **O padrão.** Quando a alíquota praticada é resultado de uma conta entre
> dispositivos, cadastre os dispositivos e faça a conta. Cadastrar o resultado
> transforma um cálculo auditável num número mágico — e o produto inteiro existe
> para não ter números mágicos.

### 7.55 A patronal não tem teto, e o desconto do sócio tem

A diferença que mais surpreende quem compara pró-labore com salário: o INSS
descontado do sócio para no limite máximo do salário-de-contribuição, e a
contribuição patronal de 20% incide sobre o **pró-labore inteiro**.

A partir do teto, os dois deixam de crescer juntos: dobrar o pró-labore não muda
o desconto do sócio e dobra o custo da empresa. É o número que decide entre
pró-labore e distribuição de lucros — e por isso o destaque "do que a empresa
gasta, chega ao sócio" existe.

### 7.56 A margem estava na lei; a BASE dela é que quase ninguém lê

A margem consignável é o número que todo mundo cita — 40% — e o que quase
ninguém cita é sobre o quê. O art. 2º, § 2º, I da Lei nº 10.820/2003, com a
redação da Lei nº 14.431/2022, diz "40% da **remuneração disponível**". E o
inciso VIII do mesmo artigo define remuneração disponível como "os vencimentos,
subsídios, soldos, salários ou remunerações, **descontadas as consignações
compulsórias**".

É o líquido de INSS e IRRF, não o bruto. E a diferença **cresce com o salário**,
porque os descontos obrigatórios crescem junto — um caso-ouro trava exatamente
essa progressão.

A página parte do bruto e deduz, em vez de pedir o líquido. Pedir seria mais
simples e menos confiável: o usuário informaria o que ACHA que é o líquido.
Reaproveitar os motores de INSS e IRRF, que já existem e já são conferidos, é o
que garante que esta página nunca divirja de CALC-015 e CALC-016.

### 7.57 Uma MP em trânsito, e o recorte que ela obrigou

O cabeçalho da Lei nº 10.820/2003 no Planalto traz "(Vide Medida Provisória nº
1.355, de 2026)". Seguindo §7.45, fui ler: o art. 23 dela altera o **art. 6º** —
o consignado de aposentados e pensionistas do INSS —, fixando limite global de
40% com reservas de 5% para cartão consignado e 5% para cartão de benefício, e
35% para o BPC.

**O art. 2º, que é o do empregado CLT, ela não toca.**

Isso definiu o recorte: a calculadora cobre o CLT, cuja margem está em lei
firme, e **declara na tela** que aposentados e pensionistas têm regra própria em
alteração por MP, e que servidor público segue regulamento do próprio ente.

> **Por que não publicar a do INSS com o número da MP.** Medida provisória tem
> eficácia imediata e prazo de conversão — ela pode cair. Publicar um número que
> pode deixar de valer antes de a página ser lida é o mesmo risco do IOF em
> §7.33, e a resposta é a mesma: o campo não existe, e o motivo fica escrito.

## 9. CALC-020 — construída em 06/08/2026

**A pesquisa desta seção virou código no mesmo dia.** Ela fica aqui como registro
do que foi conferido, e das duas decisões técnicas que ela obrigou (§7.58 e
§7.59). As lacunas declaradas foram fechadas: a Lei nº 11.196/2005 foi publicada
no **DOU de 22/11/2005**, e o custo de aquisição é campo do usuário.

**Esta seção existe para a próxima sessão começar construindo, não pesquisando.**
Os quatro dispositivos abaixo foram lidos no Planalto em 06/08/2026 e conferidos
um a um. O que falta é código.

Era a calculadora tributária mais complexa das que restavam — fatores de redução
com exponenciação, três isenções que interagem e uma tabela progressiva nova.

### 9.1 As alíquotas — progressivas por faixa

**Lei nº 8.981/1995, art. 21, com a redação da Lei nº 13.259, de 2016:**

| Faixa do ganho | Alíquota |
|---|---|
| até R$ 5.000.000,00 | 15% |
| de R$ 5.000.000,01 a R$ 10.000.000,00 | 17,5% |
| de R$ 10.000.000,01 a R$ 30.000.000,00 | 20% |
| acima de R$ 30.000.000,00 | 22,5% |

O texto diz "sobre a parcela dos ganhos que…" — é **progressiva por faixa**, como
o INSS, e cabe no tipo `tabela_faixas` que já existe. `somarAliquotasPorFaixa`
resolve.

> **Armadilha de leitura, e é a de §7.42.** O art. 21 aparece com três redações
> empilhadas. A da **MP nº 692/2015** traz faixas completamente diferentes —
> 15%/20%/25%/30% com corte em R$ 1 milhão — e ela NÃO é a vigente: a Lei nº
> 13.259/2016 a substituiu. Quem parar na primeira ocorrência cadastra alíquota
> que nunca valeu.

### 9.2 As isenções

**Imóvel único — Lei nº 9.250/1995, art. 23:** isento o ganho na alienação "do
único imóvel que o titular possua, cujo valor de alienação seja de até
R$ 440.000,00 [...] desde que não tenha sido realizada qualquer outra alienação
nos últimos cinco anos". Texto original, sem marcador de MP.

**Reinvestimento — Lei nº 11.196/2005, art. 39:** isento o ganho na venda de
imóveis residenciais se o produto for aplicado, em **180 dias**, na aquisição de
imóveis residenciais no País. Três regras que a calculadora precisa respeitar:

- § 2º — aplicação PARCIAL tributa proporcionalmente à parcela não aplicada;
- § 3º — na compra de mais de um imóvel, a isenção alcança só a parcela empregada
  em residenciais;
- § 5º — o benefício vale **uma vez a cada cinco anos**.

### 9.3 Os fatores de redução — o que quase nenhuma calculadora faz

**Lei nº 11.196/2005, art. 40.** A base é o ganho multiplicado por dois fatores:

    FR1 = 1 / 1,0060^m1
    FR2 = 1 / 1,0035^m2

`m1` são os meses entre a aquisição e o mês da publicação da lei; `m2`, os meses
entre o mês seguinte ao da publicação (ou o da aquisição, se posterior) e o da
alienação. O § 2º manda aplicar o FR1 a partir de 1º/01/1996 para imóveis
adquiridos até 31/12/1995.

**O caminho técnico já existe no projeto:** `fatorDeCapitalizacao`, em
`financeira.ts`, calcula (1+i)^n com `BigInt` e escala — 0,60% e 0,35% são 60 e
35 basis points. Os fatores são o inverso dele, e não há ponto flutuante em
lugar nenhum.

### 9.4 As duas lacunas, e como foram fechadas

**A data de publicação da Lei nº 11.196/2005** é o **DOU de 22/11/2005**,
confirmada no próprio texto. Dela saem os dois marcos: `m1` conta até novembro de
2005 e `m2` a partir de dezembro.

**O custo de aquisição é campo do usuário**, e a tela diz que benfeitorias
comprovadas e corretagem podem integrá-lo. O que ficou de fora, declarado na
página, é a **redução do art. 18 da Lei nº 7.713/1988** para imóveis adquiridos
até 1988 — o § 2º do art. 40 a preserva expressamente, e não aplicá-la faz o
imposto sair MAIOR que o devido. A calculadora avisa na tela quando a aquisição é
anterior a 1989.

### 7.58 Converter para a unidade de exibição ANTES de aplicar custa dinheiro

Os fatores de redução do art. 40 são coeficientes entre zero e um, e a primeira
versão do motor fazia o óbvio: calculava `1/(1+i)^m`, convertia para basis
points e aplicava com `proporcao`.

**Basis points têm resolução de 0,0001.** Sobre um ganho de oitocentos mil reais
isso é mais de cem reais de base — e o imposto sai errado por dezenas de reais,
num produto cuja tese é a exatidão da conta.

A correção foi separar as duas coisas: os fatores são aplicados **em inteiro
grande**, dividindo pelo `(1+i)^m` que `fatorDeCapitalizacao` devolve na escala
de `financeira.ts`, e só depois convertidos para basis points **para aparecer na
tela**. A base passou a bater ao centavo com a conta de referência.

> **Quem revelou foi um caso-ouro exigente demais.** A asserção pedia quatro
> casas decimais do fator e falhava por 7×10⁻⁵. A leitura preguiçosa seria
> afrouxar a tolerância; a leitura certa foi perguntar por que o número não era
> exato — e a resposta estava na ordem das operações, não no teste.
>
> O teste final ficou dividido em dois: a BASE é conferida ao centavo, e o
> fator EXIBIDO à resolução que ele de fato tem. Cobrar do rótulo o que só a
> conta tem é outra forma de teste errado.

### 7.60 Um passo da memória que não se reproduz é pior que passo nenhum

A CALC-020 passou nos 1.356 testes, subiu, e em produção a memória de cálculo
dizia:

    R$ 800.000,00 × 65,78% = R$ 526.297,54

Quem conferisse na calculadora do celular chegaria a R$ 526.240,00. **Cinquenta
e sete reais de diferença, dentro da memória auditável** — a tela que existe
justamente para o usuário conferir.

Nenhum número estava errado. O fator EXIBIDO é arredondado a quatro casas; o
APLICADO é a divisão exata em inteiro grande, que §7.58 acabara de corrigir. Os
dois estão certos e não se multiplicam um pelo outro.

A correção foi escrever o passo como a lei o escreve, na forma que se reproduz:

    R$ 800.000,00 ÷ 1,0060^70 = R$ 526.297,54

E o caso-ouro que guarda isso não compara strings por comparar: ele **refaz a
conta em ponto flutuante**, do jeito que alguém faria numa calculadora comum, e
exige que dê o centavo exibido. É a única forma de o teste medir a promessa —
que a memória se reproduz — em vez de medir o texto.

> **O defeito de novo passou pela suíte inteira e apareceu ao abrir a página**,
> como em §7.44. E de novo porque caso-ouro confere o número, não a frase ao
> lado dele. O passo 7 do roteiro de parâmetros — rodar em produção — pagou
> sozinho o terceiro defeito desta sessão.

### 7.59 Marcos de data não são parâmetros

O art. 40 divide a vida do imóvel em dois trechos, usando a publicação da Lei nº
11.196/2005 como divisor, e o § 2º fixa 1996 como piso do primeiro. Três datas
dentro do motor — e BV-10 reclamou das três.

**Elas não viraram parâmetros, e a distinção importa.** Um parâmetro é um valor
que a norma pode trocar mantendo a mesma regra: a alíquota muda, a conta
continua a mesma. Estas datas são a própria estrutura da regra — trocar
novembro de 2005 por outra data não é atualizar um parâmetro, é outro artigo.

O que É parâmetro ali são os coeficientes de 0,60% e 0,35%, e esses estão
cadastrados com vigência a partir da publicação da lei. As datas ficaram no
motor, com a justificativa ao lado — que é exatamente o que BV-10 pede quando o
número não é constante legal disfarçada.

## 8. Sugestão de ordem para a próxima sessão

Feito na sessão de 31/07/2026, pós-lançamento: ~~ativar HSTS~~ ✅ · ~~trocar a
fonte do INSS 2026~~ ✅ · ~~reduzir o pacote da rota de calculadora~~ ✅ ·
~~decidir a sobreposição com o projeto irmão~~ ✅ (§6.4) · ~~servir `www`~~ ✅.

Feito em 01/08/2026: ~~CALC-026~~ ✅ · ~~CALC-070~~ ✅ · ~~CALC-054~~ ✅ ·
~~o aviso de estimativa que alegava parâmetro legal onde não havia~~ ✅ (§7.8) ·
~~CALC-023~~ ✅ (§7.11) · ~~CALC-010~~ ✅ · ~~CALC-008~~ ✅ (§7.15) ·
~~o pipeline que ficava verde sem implantar~~ ✅ (§7.14) · ~~CALC-031~~ ✅ (§7.30),
que **fechou o v2 até onde ele ia sem dependência externa** — ver §4.2 · e as
fila do bloco A: ~~CALC-036~~ ✅ · ~~CALC-035~~ ✅ · ~~CALC-044~~ ✅ ·
~~CALC-071~~ ✅ · ~~CALC-055~~ ✅ · ~~CALC-057~~ ✅ · ~~CALC-043~~ ✅ ·
~~CALC-065~~ ✅ · ~~CALC-069~~ ✅ · ~~CALC-049~~ ✅ · e ~~o recorte fixo que fazia
`verificar-orcamento.ts` falhar por limite próprio~~ ✅ (§7.31).

O que sobrou, em ordem:

1. ~~**Implementar `ADR-006`**~~ ✅ **feito em 02/08/2026.** A coleta está no
   pipeline, o cache é versionado, o plano de falha foi exercitado de verdade, e
   **as doze que ele destrava estão no ar**: CALC-060, CALC-061,
   CALC-063, CALC-037, CALC-042, CALC-041, CALC-064, CALC-045, CALC-039, CALC-040,
   CALC-034 e CALC-062 — esta última **sem** a alíquota de IOF, pela razão em
   §7.33.

   **Nenhuma falta.**

   | ID | Calculadora | O que falta |
   |---|---|---|

   > **O padrão que CALC-041 abriu vale para as próximas.** A regra de
   > remuneração da poupança está em lei, e transcrevê-la criaria constante legal
   > fora de `lib/params/`. Em vez disso, a calculadora usa a taxa que o Banco
   > Central **já publica apurada**. Antes de cadastrar parâmetro para uma
   > calculadora de investimento, verifique se a série não entrega o número
   > pronto.

   **Selic e TR na correção por índice continuam pendentes** de uma decisão: as
   duas são séries diárias na
   origem, e virar fator mensal é convenção a definir — estão declaradas como
   "Em breve" no campo, e não escondidas.
2. **Fechar a fonte da tabela do seguro-desemprego** (§5.1). É a única pendência
   do projeto que toca a tese do produto, e ela ficou aberta com uma calculadora
   publicada em cima.
3. **CALC-017 · restituição estimada do IRPF anual.** ⚠️ **Sondada e adiada em
   01/08/2026, por fonte.** A página de tabelas da Receita traz a progressiva
   ANUAL do ano-calendário **2026** — e a declaração que se entrega hoje é a do
   ano-calendário **2025**, ano em que a tabela mensal mudou em maio. A anual de
   2025 é, portanto, um conjunto próprio de números, que **não foi localizado**.
   Construir sobre a tabela do ano errado produziria exatamente o dano que o
   projeto existe para evitar. Resolver a fonte antes de escrever qualquer linha.
   **CALC-019 está bloqueada pela mesma fonte** — `docs/18` registra que ela "é
   CALC-017 rodado duas vezes".
4. ~~**O campo de LISTA**~~ ✅ **feito em 06/08/2026.** `Campo` modelava um valor
   por campo, e **três** calculadoras publicáveis dependiam de grupo repetido:
   CALC-028 (N dívidas), CALC-073 (N pessoas) e CALC-075 (N notas). §7.4 diz que
   duas que precisam é medida e uma é palpite — com três, o contrato cresceu, e
   **as três estão no ar**. O caminho e os dois defeitos que ele revelou estão em
   §7.29, §7.35 e §7.36.

   > **O desenho não é trivial, e é por isso que ele merece sessão própria.** As
   > três precisam de lista de **registros**, não de escalares: CALC-028 pede
   > trios (saldo, taxa, parcela), CALC-075 pede pares (nota, peso). E o valor
   > precisa continuar serializável para a URL (`RF-006`) e validável por campo.
   > Tocar `tipos.ts`, `campos.tsx`, `Calculadora.tsx` e `url-state.ts` de uma
   > vez é o tipo de mudança que não se faz no fim de uma sessão longa.

   > **Correção de um erro deste documento.** Uma versão anterior desta seção
   > dizia que CALC-040 também precisava do campo de lista, e citava §7.29 como
   > apoio. **Não precisa**, e §7.29 não diz isso: `docs/18` §7 lista quatro
   > calculadoras com essa necessidade — CALC-028, CALC-073, CALC-075 e, em menor
   > grau, CALC-074 —, e CALC-040 não está entre elas. Ela compara três produtos
   > fixos. O erro mantinha uma calculadora na fila errada.
5. **`/api/health` que responde igual em toda versão.** O passo de verificação
   do pipeline pode aprovar contra o contêiner ANTIGO enquanto o EasyPanel ainda
   constrói. Expor o hash do commit em `rev` e comparar resolve — o projeto
   irmão já faz assim.
6. **Um comparativo "acordo vs. dispensa"** — CALC-008 e CALC-009 já produzem
   tudo o que ele precisa, e juntas respondem a pergunta que o usuário de fato
   faz. Não está no catálogo com ID; exige decisão do mantenedor.
7. **Vale-transporte (`RN-027`)** em CALC-001, se a fonte aparecer (§5.1).
8. **Os 7 guias restantes** (§4.6).

> **O deploy deixou de ser um clique.** O segredo `DEPLOY_WEBHOOK_URL` e a
> variável `NEXT_PUBLIC_SITE_URL` estão configurados no repositório, então o
> passo `Implantar` do pipeline dispara sozinho a cada push em `main` — com
> verificação de saúde e rollback automático, que o clique manual não tinha.
> `13-deployment` §4 descrevia o deploy manual como decisão; a decisão continua
> válida para o **painel**, mas o caminho pelo pipeline é melhor e já existia.
