# Estado do projeto — Cálculo Oficial

> Documento de continuidade. Escrito em **31/07/2026**, no dia do lançamento, e
> atualizado no mesmo dia após a primeira sessão pós-lançamento.
> Serve para uma sessão nova começar sem reconstruir contexto.
>
> **O que mudou depois do lançamento:** HSTS ativo · `www` servido e
> redirecionando · fonte do INSS 2026 passou a ser o texto da portaria ·
> orçamento de JavaScript passou a ser por calculadora · deploy automático ·
> sobreposição com o projeto irmão decidida (§6.4) · **CALC-002 publicada**,
> com a pesquisa de incidências fechada em fonte primária (`docs/19`).
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
| Calculadoras no ar | **18** de 75 — v1 completo, quatro de crédito, três de rescisão e as duas primeiras sem cifrão nenhum |
| Guias no ar | 3 de 10 |
| Testes | 514 de unidade · 265 ponta a ponta · 3 de vazamento |
| Auditoria de parâmetros | 12 vigências abertas, **0 divergências** (01/08/2026) |
| Orçamento de JavaScript | 127,0 kB de **135** na pior rota (rescisão) — folga de 8,0 kB. Limite revisado com medição, ver §7.7 |
| Vulnerabilidades | 0 |

### No ar hoje

- As **10 do v1**: salário líquido · rescisão (sem justa causa e pedido de demissão) · férias · 13º · horas extras · FGTS · INSS · IRRF · juros compostos
- **Trabalhista do v2:** rescisão por acordo mútuo · aviso prévio proporcional
- **Crédito:** CET · amortização SAC vs. Price · quitação antecipada · rotativo do cartão
- **Utilitárias:** porcentagem · álcool ou gasolina
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

## 4. Calculadoras pendentes — 57 de 75

Publicadas: **CALC-001 a CALC-008, CALC-010, CALC-015, CALC-016, CALC-022 a CALC-026, CALC-054 e CALC-070**.

### 4.1 O v1 fechou em 31/07/2026

As dez calculadoras do v1 estão no ar. A pesquisa de incidências que as
sustenta está em `docs/19-incidencias-verbas-rescisorias.md`, em fonte
primária, e continua servindo a toda trabalhista que vier.

**O próximo bloco é o v2** — §4.2. E `docs/18-levantamento-calculadoras.md`
mostra que **33 das restantes não dependem de nada**: nem de pesquisa em norma,
nem de série externa. Entre elas estão as de maior valor publicitário do
catálogo.

### 4.2 v2 — 17 calculadoras

**Trabalhista**
| ID | Calculadora |
|---|---|
| CALC-008 | Rescisão — acordo mútuo (art. 484-A da CLT) |
| CALC-009 | Seguro-desemprego — parcelas e valor |
| CALC-010 | Aviso prévio proporcional (Lei 12.506/2011) |

**Tributos PF**
| ID | Calculadora |
|---|---|
| CALC-017 | Restituição estimada do IRPF anual |
| CALC-018 | IR sobre renda fixa — tabela regressiva |

**Crédito e dívidas**
| ID | Calculadora |
|---|---|
| CALC-023 | Juros do rotativo do cartão — custo real |
| CALC-024 | CET — custo efetivo total de um empréstimo |
| CALC-025 | Amortização — tabela completa SAC vs. Price |

**Imóveis**
| ID | Calculadora |
|---|---|
| CALC-031 | Financiamento imobiliário — SAC vs. Price completo |
| CALC-032 | Capacidade de financiamento (renda × parcela) |

**Investimentos** — as quatro dependem de série externa (ver §6.1)
| ID | Calculadora |
|---|---|
| CALC-039 | CDB/LCI/LCA — rendimento líquido com IR |
| CALC-040 | Comparador: Tesouro Selic vs. CDB vs. Poupança |
| CALC-041 | Rendimento da poupança |

**Autônomo, MEI e PJ**
| ID | Calculadora |
|---|---|
| CALC-047 | DAS-MEI — valor mensal por atividade |
| CALC-048 | Comparador CLT vs. PJ vs. MEI — renda líquida real |

**Veículos e utilitários**
| ID | Calculadora |
|---|---|
| CALC-054 | Álcool vs. gasolina — qual compensa |
| CALC-070 | Porcentagem — aumento, desconto, variação |

### 4.3 v3 — 28 calculadoras

| ID | Calculadora | Categoria |
|---|---|---|
| CALC-011 | Custo real do funcionário (encargos + provisões) | TRB |
| CALC-012 | Rescisão — empregado doméstico (LC 150/2015) | TRB |
| CALC-013 | Banco de horas e jornada acumulada | TRB |
| CALC-019 | Comparador: modelo simplificado vs. completo | TRI |
| CALC-020 | IR sobre ganho de capital em venda de imóvel | TRI |
| CALC-026 | Quitação antecipada — economia de juros | CRD |
| CALC-027 | Empréstimo consignado — margem e parcela | CRD |
| CALC-028 | Plano de quitação (bola de neve vs. avalanche) | CRD |
| CALC-033 | Custo total de aquisição de imóvel | IMV |
| CALC-034 | Alugar vs. comprar — comparativo de longo prazo | IMV |
| CALC-035 | Rentabilidade de imóvel para locação | IMV |
| CALC-036 | Amortização extra no financiamento | IMV |
| CALC-037 | Reajuste de aluguel por índice contratual | IMV |
| CALC-042 | Quanto rende X reais por mês | INV |
| CALC-043 | Meta de independência financeira | INV |
| CALC-044 | Reserva de emergência — dimensionamento | INV |
| CALC-049 | Precificação de hora — freelancer e autônomo | AUT |
| CALC-050 | INSS do contribuinte individual e facultativo | AUT |
| CALC-055 | Consumo e custo de viagem por combustível | VEI |
| CALC-056 | Financiamento de veículo — parcela e CET | VEI |
| CALC-057 | Custo mensal real de ter um carro | VEI |
| CALC-060 | Correção por índice (IPCA, INPC, IGP-M, SELIC, TR) | IDX |
| CALC-061 | Poder de compra ao longo do tempo | IDX |
| CALC-062 | Conversor de moeda com IOF | IDX |
| CALC-065 | Consumo de energia por aparelho — custo mensal | CSM |
| CALC-066 | Retorno de investimento em energia solar | CSM |
| CALC-071 | Regra de três simples e composta | UTI |
| CALC-072 | Dias úteis entre datas (com feriados nacionais) | UTI |

### 4.4 v4 — 20 calculadoras

| ID | Calculadora | Categoria |
|---|---|---|
| CALC-014 | Rescisão — contrato intermitente (art. 452-A) | TRB |
| CALC-021 | IR sobre criptoativos | TRI |
| CALC-029 | Portabilidade de crédito — vale a pena? | CRD |
| CALC-030 | Cheque especial — custo real | CRD |
| CALC-038 | Financiamento de reforma | IMV |
| CALC-045 | Tesouro IPCA+ — rendimento real projetado | INV |
| CALC-046 | Dividend yield e renda passiva | INV |
| CALC-051 | Pró-labore e encargos do sócio | AUT |
| CALC-052 | Faturamento máximo do MEI e desenquadramento | AUT |
| CALC-053 | Carnê-leão — recolhimento mensal do autônomo | AUT |
| CALC-058 | Carro elétrico vs. combustão — custo por km | VEI |
| CALC-059 | Depreciação de veículo | VEI |
| CALC-063 | Reajuste de salário por inflação acumulada | IDX |
| CALC-064 | Valor futuro corrigido — projeção por índice | IDX |
| CALC-067 | Conta de água — consumo estimado | CSM |
| CALC-068 | Duração e custo do botijão de gás | CSM |
| CALC-069 | Orçamento doméstico — regra 50/30/20 | CSM |
| CALC-073 | Divisão de conta entre pessoas | UTI |
| CALC-074 | Conversor de unidades | UTI |
| CALC-075 | Média ponderada e média escolar | UTI |

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

`docs/fontes/bcb-sgs.md`. Resolve `ADR-006` (série econômica) e destrava 13
calculadoras: CALC-037, CALC-039 a CALC-045, CALC-060 a CALC-064.

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

## 8. Sugestão de ordem para a próxima sessão

Feito na sessão de 31/07/2026, pós-lançamento: ~~ativar HSTS~~ ✅ · ~~trocar a
fonte do INSS 2026~~ ✅ · ~~reduzir o pacote da rota de calculadora~~ ✅ ·
~~decidir a sobreposição com o projeto irmão~~ ✅ (§6.4) · ~~servir `www`~~ ✅.

O que sobrou, em ordem:

Feito em 01/08/2026: ~~CALC-026~~ ✅ · ~~CALC-070~~ ✅ · ~~CALC-054~~ ✅ ·
~~o aviso de estimativa que alegava parâmetro legal onde não havia~~ ✅ (§7.8) ·
~~CALC-023~~ ✅ (§7.11) · ~~CALC-010~~ ✅ · ~~CALC-008~~ ✅ (§7.15) ·
~~o pipeline que ficava verde sem implantar~~ ✅ (§7.14).

O que sobrou, em ordem:

1. **CALC-009 · seguro-desemprego.** Virou a mais valiosa que resta: CALC-008
   diz ao usuário que ele **perde** o seguro-desemprego, e não diz quanto isso
   vale. As duas juntas respondem "compensa aceitar o acordo?", que é a pergunta
   real. Depende de faixas de valor com vigência, publicadas em resolução do
   CODEFAT — pesquisa em fonte oficial antes de qualquer linha de código.
2. **CALC-030 · cheque especial.** `docs/18` registra que é praticamente o mesmo
   motor de CALC-023, que agora existe.
3. **CALC-011 · custo real do funcionário.** Reaproveita FGTS, 13º e férias, que
   já existem, e é a de maior valor publicitário do bloco trabalhista.
4. **`/api/health` que responde igual em toda versão.** O passo de verificação
   do pipeline pode aprovar contra o contêiner ANTIGO enquanto o EasyPanel ainda
   constrói. Expor o hash do commit em `rev` e comparar resolve — o projeto
   irmão já faz assim.
5. **Vale-transporte (`RN-027`)** em CALC-001, se a fonte aparecer (§5.1).
6. **Os 7 guias restantes** (§4.6).

> **O deploy deixou de ser um clique.** O segredo `DEPLOY_WEBHOOK_URL` e a
> variável `NEXT_PUBLIC_SITE_URL` estão configurados no repositório, então o
> passo `Implantar` do pipeline dispara sozinho a cada push em `main` — com
> verificação de saúde e rollback automático, que o clique manual não tinha.
> `13-deployment` §4 descrevia o deploy manual como decisão; a decisão continua
> válida para o **painel**, mas o caminho pelo pipeline é melhor e já existia.
