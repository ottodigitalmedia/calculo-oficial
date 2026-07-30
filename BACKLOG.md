# BACKLOG

Tickets implementáveis do v1, ordenados por **dependência técnica**. Cada um é entregável e verificável isoladamente.

**Definition of Done global** — aplica-se a todo ticket, além dos critérios próprios:

- [ ] `npm run check` verde
- [ ] Regras de negócio implementadas citam o `RN-*` correspondente no código
- [ ] Nenhuma regra inviolável de `CLAUDE.md` foi quebrada
- [ ] Documentação atualizada quando o ticket alterar comportamento documentado

---

## Fatia F-0 — Esqueleto em produção

### T-001 · Inicializar repositório e ferramental
**Contexto.** Base do projeto, com as regras de qualidade ativas desde o primeiro commit.
**Arquivos.** `package.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`

- **Dado** um clone limpo, **quando** rodo `npm install && npm run dev`, **então** a aplicação sobe sem erro
- **Dado** o projeto, **quando** rodo `npm run lint`, **então** as regras de fronteira de módulo e de tipo monetário estão ativas
- **Dado** TypeScript, **quando** verifico a configuração, **então** o modo estrito está ativo

**Estimativa.** 0,5 dia · **DoD.** Comandos de `CLAUDE.md` respondem, ainda que alguns sejam esboço.

---

### T-002 · Contêiner e composição
**Contexto.** Empacotar a aplicação para a VPS.
**Arquivos.** `Dockerfile`, `docker-compose.yml`, `.dockerignore`

- **Dado** o Dockerfile, **quando** construo a imagem, **então** a imagem final não contém código-fonte nem dependências de desenvolvimento (regra D-1)
- **Dado** o contêiner em execução, **quando** consulto a rota de saúde, **então** recebo 200 (D-4)
- **Dado** a imagem, **quando** inspeciono o usuário do processo, **então** ele não tem privilégio (D-2)

**Estimativa.** 0,5 dia · **Depende de.** T-001

---

### T-003 · Pipeline de integração e entrega
**Contexto.** Publicação automatizada por commit, com os bloqueios na ordem correta.
**Arquivos.** `.github/workflows/ci.yml`

- **Dado** um commit na branch principal, **quando** o pipeline roda, **então** ele executa na ordem de `13-deployment` §4
- **Dado** uma verificação estrutural falhando, **quando** o pipeline roda, **então** ele interrompe antes do build
- **Dado** o pipeline concluído, **quando** a imagem é publicada, **então** a etiqueta é o hash do commit (D-5)
- **Dado** a coleta da série externa falhando, **quando** o pipeline roda, **então** ele prossegue com aviso (regra R-3)

**Estimativa.** 1 dia · **Depende de.** T-002

---

### T-004 · Provisionar VPS, domínio e TLS
**Contexto.** Ambiente de produção acessível.
**Arquivos.** Configuração no painel; documentar em `13-deployment` §7

- **Dado** o domínio, **quando** acesso por HTTPS, **então** o site responde com certificado válido
- **Dado** HTTP, **quando** acesso, **então** sou redirecionado para HTTPS
- **Dado** o painel, **quando** verifico, **então** a renovação automática do certificado está confirmada

**Estimativa.** 0,5 dia · **Depende de.** T-003
**DoD.** Um commit chega ao ar sem intervenção manual. **Encerra F-0.**

---

## Fatia F-1 — A primeira calculadora completa

### T-005 · Tipos e utilitários monetários
**Contexto.** Fundação aritmética de todo o motor. Nada é calculado antes disso.
**Arquivos.** `src/lib/engine/money.ts`, `src/lib/engine/types.ts`, `tests/golden/money.test.ts`

- **Dado** dois valores em centavos, **quando** somo, **então** o resultado é exato (`RN-005`)
- **Dado** um valor e uma alíquota em basis points, **quando** multiplico, **então** o arredondamento aplicado é o declarado na assinatura da função (A-4)
- **Dado** código com operação de ponto flutuante sobre tipo monetário, **quando** rodo o lint, **então** a regra BV-11 acusa erro
- **Dado** o módulo, **quando** inspeciono, **então** ele não tem dependência de runtime (`ADR-003`)

**Estimativa.** 1 dia · **Depende de.** T-001

---

### T-006 · Modelo e carregador de parâmetros por vigência
**Contexto.** Entidade central do sistema (`ADR-001`).
**Arquivos.** `src/lib/params/schema.ts`, `src/lib/params/registry.ts`, `scripts/validate-params.ts`

- **Dado** um parâmetro sem fonte ou sem URL, **quando** valido, **então** a validação falha (BV-01)
- **Dado** duas vigências do mesmo parâmetro cobrindo a mesma data, **quando** valido, **então** falha (BV-02)
- **Dado** faixas com lacuna entre si, **quando** valido, **então** falha (BV-05)
- **Dado** uma URL de fonte fora de domínio oficial, **quando** valido, **então** falha (BV-07)
- **Dado** uma data de referência coberta, **quando** consulto, **então** recebo exatamente a vigência correspondente (`RN-002`)
- **Dado** uma data sem cobertura, **quando** consulto, **então** recebo erro tipado com o intervalo disponível (`RN-003`)

**Estimativa.** 1,5 dia · **Depende de.** T-005

---

### T-007 · Cadastrar parâmetros de INSS e IRRF
**Contexto.** Trabalho de pesquisa normativa, não de programação. É a tarefa de maior risco do projeto.
**Arquivos.** `src/lib/params/data/inss.ts`, `src/lib/params/data/irrf.ts`, `src/lib/params/data/fontes.ts`

> ⚠️ Cada valor é lido da **fonte oficial**. Copiar de blog, software de terceiro ou concorrente invalida o ticket.

- **Dado** os parâmetros, **quando** valido, **então** há cobertura de no mínimo dois exercícios (`05-data-model` §8)
- **Dado** cada vigência, **quando** inspeciono, **então** ela declara norma e URL oficial
- **Dado** cada valor cadastrado, **quando** confiro contra a fonte, **então** confere dígito a dígito
- **Dado** o commit, **quando** o CI verifica a mensagem, **então** ela segue o formato `params(...)` (BV-12)

**Estimativa.** 1,5 dia · **Depende de.** T-006

---

### T-008 · Motor: contribuição previdenciária
**Arquivos.** `src/lib/engine/inss.ts`, `tests/golden/inss.test.ts`

- **Dado** um salário, **quando** calculo, **então** a apuração é progressiva por faixa (`RN-008`)
- **Dado** um salário acima do teto, **quando** calculo, **então** a contribuição é limitada (`RN-009`)
- **Dado** qualquer cálculo, **quando** inspeciono o retorno, **então** ele traz resultado e traço (C-M1)
- **Dado** os casos-ouro TC-001 a TC-004, **quando** rodo, **então** todos passam
- **Dado** o mesmo salário em duas vigências diferentes, **quando** calculo, **então** os resultados diferem corretamente

**Estimativa.** 1 dia · **Depende de.** T-007

---

### T-009 · Motor: imposto de renda retido na fonte
**Contexto.** O cálculo de maior risco do sistema. A regra vigente combina tabela progressiva, escolha entre bases e possível redutor por faixa.
**Arquivos.** `src/lib/engine/irrf.ts`, `tests/golden/irrf.test.ts`

- **Dado** rendimento e deduções, **quando** calculo, **então** a base segue `RN-011`
- **Dado** que o desconto simplificado é mais favorável, **quando** calculo, **então** ele é aplicado e o traço registra por quê (`RN-012`)
- **Dado** faixa com redutor vigente, **quando** calculo, **então** ele é aplicado após a tabela e aparece como etapa separada (`RN-013`)
- **Dado** um cenário que resultaria em imposto negativo, **quando** calculo, **então** o devido é zero (`RN-014`)
- **Dado** TC-005 a TC-010, **quando** rodo, **então** todos passam

**Estimativa.** 1,5 dia · **Depende de.** T-008

---

### T-010 · Motor: salário líquido (CALC-001)
**Arquivos.** `src/lib/engine/calculadoras/salario-liquido.ts`, `tests/golden/salario-liquido.test.ts`

- **Dado** as entradas de `03-functional-spec` §3.1, **quando** calculo, **então** obtenho o líquido e o traço completo
- **Dado** vale-transporte informado, **quando** calculo, **então** o desconto respeita o limite de `RN-027`
- **Dado** o traço, **quando** o percorro, **então** ele contém todas as etapas listadas em §3.1
- **Dado** os casos-ouro da calculadora, **quando** rodo, **então** todos passam

**Estimativa.** 0,5 dia · **Depende de.** T-009

---

### T-011 · Componentes de formulário e formatação
**Arquivos.** `src/lib/format/`, `src/components/campos/`

- **Dado** um campo monetário, **quando** digito, **então** a máscara pt-BR é aplicada e o valor interno é em centavos
- **Dado** um campo com erro, **quando** perde o foco, **então** a mensagem exata de `03-functional-spec` §1.4 aparece e é vinculada ao campo por descrição acessível
- **Dado** um campo em dispositivo móvel, **quando** foco, **então** o teclado correto é acionado e não há zoom automático
- **Dado** qualquer campo, **quando** navego por teclado, **então** o foco é visível

**Estimativa.** 1 dia · **Depende de.** T-005

---

### T-012 · Componente de memória de cálculo
**Contexto.** O diferencial do produto. Especificação em `10-ux-ui-spec` §4.
**Arquivos.** `src/components/MemoriaCalculo.tsx`, `src/components/CitacaoParametro.tsx`

- **Dado** um traço, **quando** renderizo, **então** cada etapa aparece numerada, em ordem, com fórmula, parâmetro e resultado (MC-1, MC-2)
- **Dado** uma etapa com parâmetro legal, **quando** renderizo, **então** vigência e link de fonte aparecem (MC-3, `RN-029`)
- **Dado** os valores, **quando** renderizo, **então** estão em fonte monoespaçada, alinhados à direita (MC-4)
- **Dado** o bloco expandido, **quando** comparo com o detalhamento, **então** os valores são idênticos (MC-8)
- **Dado** um leitor de tela, **quando** navego, **então** a estrutura é lida como sequência de etapas (TC-047)

**Estimativa.** 1,5 dia · **Depende de.** T-010

---

### T-013 · Página de calculadora e seletor de vigência
**Arquivos.** `src/app/calculadora/[slug]/page.tsx`, `src/components/SeletorVigencia.tsx`, `src/components/BlocoResultado.tsx`, `src/components/AvisoEstimativa.tsx`

- **Dado** campos válidos preenchidos, **quando** saio do último, **então** o resultado aparece sem clique
- **Dado** obrigatório vazio, **quando** olho, **então** vejo o estado pendente sem número parcial (TC-022)
- **Dado** entrada inválida, **quando** ocorre, **então** o resultado anterior é limpo (TC-023)
- **Dado** que altero a vigência, **quando** recalculo, **então** resultado e parâmetros exibidos mudam (TC-024)
- **Dado** vigência sem cobertura, **quando** seleciono, **então** vejo a mensagem de §1.4 e o cálculo é bloqueado
- **Dado** qualquer resultado, **quando** olho a mesma dobra, **então** vejo o aviso de estimativa (`RN-028`)

**Estimativa.** 1,5 dia · **Depende de.** T-011, T-012
**DoD.** `/calculadora/salario-liquido` no ar e utilizável por uma pessoa real. **Encerra F-1 · MR-1.**

---

## Fatia F-2 — Bloco trabalhista

### T-014 · Motor: proporcionalidade e tempo de serviço
**Contexto.** Base compartilhada por todas as calculadoras de F-2. Aritmética de calendário é a fonte mais provável de defeito sutil.
**Arquivos.** `src/lib/engine/tempo.ts`, `tests/golden/tempo.test.ts`

- **Dado** período de exatamente 15 dias no mês, **quando** apuro avos, **então** conta como avo integral (TC-011)
- **Dado** período de 14 dias, **quando** apuro, **então** não conta (TC-012)
- **Dado** `n` avos, **quando** calculo o proporcional, **então** aplico `RN-016`
- **Dado** aviso indenizado, **quando** projeto, **então** o período soma ao tempo de serviço (`RN-019`, TC-013)
- **Dado** contrato acima do limite do aviso proporcional, **quando** calculo, **então** o limite é respeitado (`RN-020`, TC-014)

**Estimativa.** 1,5 dia · **Depende de.** T-010

---

### T-015 · CALC-002 Rescisão sem justa causa
**Contexto.** A mais complexa do catálogo. Vem primeiro de propósito.
**Arquivos.** `src/lib/engine/calculadoras/rescisao-sem-justa-causa.ts`, rota correspondente

- **Dado** as entradas de §3.2, **quando** calculo, **então** obtenho todas as verbas de `RN-017`
- **Dado** o resultado, **quando** olho o detalhamento, **então** cada verba aparece separada, com incidências
- **Dado** que o saldo de FGTS não foi informado, **quando** olho, **então** vejo o aviso adicional de §1.6 (`RN-023`, TC-033)
- **Dado** os casos-ouro da calculadora, **quando** rodo, **então** todos passam

**Estimativa.** 2 dias · **Depende de.** T-014

---

### T-016 · CALC-003 Pedido de demissão
**Arquivos.** `src/lib/engine/calculadoras/pedido-demissao.ts`, rota

- **Dado** aviso não cumprido, **quando** calculo, **então** ele é descontado, não creditado (`RN-018`, TC-015)
- **Dado** esta modalidade, **quando** olho o resultado, **então** o bloco de multa de FGTS não aparece — nem zerado (§3.3)
- **Dado** o resultado, **quando** olho, **então** vejo a nota fixa sobre ausência de multa

**Estimativa.** 0,75 dia · **Depende de.** T-015

---

### T-017 · CALC-004 Férias
**Arquivos.** `src/lib/engine/calculadoras/ferias.ts`, rota

- **Dado** férias proporcionais, **quando** calculo, **então** aplico avos e terço constitucional
- **Dado** abono pecuniário selecionado, **quando** calculo, **então** ele aparece como etapa separada
- **Dado** tipo "Integrais", **quando** olho, **então** o campo de meses trabalhados não aparece (TC-034)

**Estimativa.** 1 dia · **Depende de.** T-014

---

### T-018 · CALC-005 Décimo terceiro
**Arquivos.** `src/lib/engine/calculadoras/decimo-terceiro.ts`, rota

- **Dado** "1ª parcela", **quando** calculo, **então** não há desconto previdenciário nem de imposto
- **Dado** "2ª parcela", **quando** calculo, **então** os descontos incidem sobre o total (`RN-010`)
- **Dado** meses trabalhados, **quando** calculo, **então** aplico `RN-015` e `RN-016`

**Estimativa.** 0,75 dia · **Depende de.** T-014

---

### T-019 · CALC-006 Horas extras
**Arquivos.** `src/lib/engine/calculadoras/horas-extras.ts`, rota

- **Dado** uma jornada, **quando** calculo, **então** uso o divisor correspondente (`RN-024`, TC-020)
- **Dado** reflexo em descanso ativado, **quando** calculo, **então** aplico `RN-025`
- **Dado** horas noturnas, **quando** calculo, **então** aplico adicional e redução da hora (`RN-026`)
- **Dado** reflexo desativado, **quando** olho, **então** os campos de dias não aparecem

**Estimativa.** 1,25 dia · **Depende de.** T-014

---

### T-020 · CALC-007 FGTS
**Arquivos.** `src/lib/engine/calculadoras/fgts.ts`, rota

- **Dado** salário e meses, **quando** calculo, **então** aplico o percentual vigente (`RN-021`)
- **Dado** motivo que comporta multa, **quando** calculo, **então** ela incide sobre o total (`RN-022`)
- **Dado** motivo sem multa, **quando** olho, **então** o bloco não aparece
- **Dado** qualquer resultado, **quando** olho, **então** vejo o aviso de estimativa de depósitos (`RN-023`)

**Estimativa.** 0,75 dia · **Depende de.** T-014

---

### T-021 · Calculadoras relacionadas
**Arquivos.** `src/components/Relacionadas.tsx`

- **Dado** qualquer calculadora, **quando** rolo até o fim, **então** vejo de 2 a 4 relacionadas da mesma categoria (US-013)

**Estimativa.** 0,25 dia · **Depende de.** T-020
**DoD. Encerra F-2.**

---

## Fatia F-3 — Fechar o catálogo do v1

### T-022 · CALC-015 IRRF isolado e CALC-016 INSS isolado
**Arquivos.** Rotas correspondentes

- **Dado** CALC-015, **quando** o INSS é pré-preenchido e eu o edito, **então** vejo "Usando o valor que você informou" (§3.8)
- **Dado** CALC-016, **quando** vejo o resultado, **então** há uma linha por faixa e a alíquota efetiva (§3.9)
- **Dado** CALC-016, **quando** olho o seletor de tipo de segurado, **então** as opções não cobertas estão desabilitadas com "Em breve"

**Estimativa.** 1 dia · **Depende de.** T-013

---

### T-023 · Integração com a série econômica
**Arquivos.** `scripts/fetch-serie.ts`, `src/lib/serie/`, cache versionado

- **Dado** a coleta bem-sucedida, **quando** o build roda, **então** o valor e a data são embutidos
- **Dado** falha ou tempo limite, **quando** o build roda, **então** ele prossegue com o cache e registra aviso (regra R-3, TC-035)
- **Dado** resposta em formato inesperado, **quando** valido, **então** rejeito e uso o cache
- **Dado** valor com mais de 30 dias, **quando** renderizo, **então** exibo o aviso (`RN-033`, TC-036)
- **Dado** a integração, **quando** inspeciono, **então** nenhum dado do usuário é enviado (S-7)

**Estimativa.** 1 dia · **Depende de.** T-003

---

### T-024 · CALC-022 Juros compostos
**Arquivos.** `src/lib/engine/calculadoras/juros-compostos.ts`, rota

- **Dado** valor inicial, aporte, taxa e prazo, **quando** calculo, **então** obtenho montante, total investido e total em juros
- **Dado** o resultado, **quando** olho, **então** vejo a tabela de evolução paginada a cada 12 linhas
- **Dado** a sugestão de taxa, **quando** carrego, **então** vejo o valor com a data e a nota de que é editável
- **Dado** o resultado, **quando** olho, **então** vejo a nota fixa sobre o que o cálculo não considera

**Estimativa.** 0,75 dia · **Depende de.** T-023

---

### T-025 · Permalink de cálculo
**Arquivos.** `src/lib/url-state.ts`

- **Dado** um formulário preenchido, **quando** olho a URL, **então** ela contém o estado (TC-028)
- **Dado** essa URL aberta em contexto novo, **quando** carrega, **então** o mesmo resultado aparece (TC-029)
- **Dado** query com valor inválido, **quando** carrega, **então** o campo cai no padrão com aviso (TC-030)
- **Dado** query presente, **quando** inspeciono a página, **então** há `noindex` e canônica sem query (TC-031)
- **Dado** um evento de análise, **quando** inspeciono, **então** a query não é transmitida (regra R-2)

**Estimativa.** 0,75 dia · **Depende de.** T-013

---

### T-026 · Home, categorias e busca local
**Arquivos.** `src/app/page.tsx`, `src/app/categoria/[slug]/page.tsx`, `src/components/BuscaCatalogo.tsx`

- **Dado** a home, **quando** busco por termo comum, **então** vejo as calculadoras correspondentes sem requisição de rede (US-011)
- **Dado** busca sem resultado, **quando** ocorre, **então** vejo a mensagem e o link para o catálogo, e o evento `busca_sem_resultado` é registrado
- **Dado** qualquer calculadora, **quando** parto da home, **então** chego em no máximo dois cliques

**Estimativa.** 1 dia · **Depende de.** T-024
**DoD. Encerra F-3 · MR-2.**

---

## Fatia F-4 — Conteúdo e descoberta

### T-027 · Infraestrutura de conteúdo MDX
**Arquivos.** `src/content/`, `src/app/guia/[slug]/page.tsx`, `src/components/FAQ.tsx`

- **Dado** um guia em MDX, **quando** acesso a rota, **então** ele renderiza com os componentes da lista permitida (`07-security` §7)
- **Dado** um guia, **quando** leio, **então** encontro o link para a calculadora correspondente
- **Dado** uma calculadora, **quando** rolo, **então** encontro FAQ e o link para o guia

**Estimativa.** 1 dia · **Depende de.** T-026

---

### T-028 · Escrever FAQ das dez calculadoras
**Contexto.** Redação, não programação.

- **Dado** cada calculadora, **quando** olho o FAQ, **então** há no mínimo 4 perguntas respondidas em até 3 parágrafos
- **Dado** qualquer resposta, **quando** leio, **então** não há linguagem prescritiva de direito (`RN-028`)

**Estimativa.** 1,5 dia · **Depende de.** T-027

---

### T-029 · Escrever os dez guias
**Contexto.** Redação. É o insumo de M-1.

- **Dado** cada guia da lista de `03-functional-spec` §4, **quando** leio, **então** ele explica o conceito em linguagem comum e conduz à calculadora
- **Dado** os guias, **quando** conto, **então** são dez

**Estimativa.** 2,5 dias · **Depende de.** T-028

---

### T-030 · SEO técnico
**Arquivos.** metadata por rota, `sitemap.ts`, `robots.txt`, dados estruturados

- **Dado** cada rota do v1, **quando** inspeciono, **então** há título, descrição e canônica próprios
- **Dado** o sitemap, **quando** consulto, **então** todas as rotas indexáveis estão nele e nenhuma com query
- **Dado** a memória de cálculo, **quando** inspeciono, **então** há dados estruturados de procedimento

**Estimativa.** 1 dia · **Depende de.** T-029
**DoD.** Sitemap submetido. **Encerra F-4 · MR-3. Define M-1.**

---

## Fatia F-5 — Acabamento

### T-031 · Design definitivo
**Contexto.** Tokens e componentes de `10-ux-ui-spec` §2 e §3 aplicados às dez páginas.

- **Dado** qualquer página, **quando** meço contraste, **então** atende 4,5:1 em texto e 3:1 em contorno
- **Dado** o detalhamento, **quando** olho, **então** crédito e débito se distinguem por sinal e rótulo, não só por cor
- **Dado** qualquer área dinâmica, **quando** carrega, **então** a altura já estava reservada

**Estimativa.** 2 dias · **Depende de.** T-030

---

### T-032 · Acessibilidade
- **Dado** as rotas de calculadora, **quando** rodo o verificador, **então** não há violação de nível A nem AA (TC-044)
- **Dado** o teclado apenas, **quando** percorro a página inteira, **então** completo o fluxo sem armadilha de foco (TC-045)
- **Dado** um leitor de tela, **quando** o resultado atualiza, **então** ele é anunciado sem interromper a digitação (TC-046)
- **Dado** zoom a 200%, **quando** navego, **então** não há rolagem horizontal (TC-048)

**Estimativa.** 1 dia · **Depende de.** T-031

---

### T-033 · Testes de ponta a ponta e orçamento de performance
- **Dado** TC-037 a TC-039, **quando** rodo, **então** passam em desktop e mobile
- **Dado** o orçamento, **quando** o bundle excede 120 KB por rota, **então** o pipeline falha (TC-051)
- **Dado** terceiros bloqueados, **quando** uso o produto, **então** tudo funciona (TC-053)

**Estimativa.** 1 dia · **Depende de.** T-032

---

### T-034 · Teste de não vazamento de dado
**Contexto.** Implementa o controle C-07. Precisa existir **antes** do primeiro script de terceiro.
**Arquivos.** `tests/leak/`

- **Dado** valores marcadores únicos em todas as calculadoras, **quando** intercepto o tráfego, **então** nenhum marcador aparece (TC-040)
- **Dado** um erro provocado, **quando** inspeciono o envio, **então** não há valor de campo nem query (TC-041)
- **Dado** um evento de análise, **quando** inspeciono, **então** contém apenas calculadora e tipo (TC-042)

**Estimativa.** 0,75 dia · **Depende de.** T-033

---

### T-035 · Observabilidade
- **Dado** a ferramenta de erro, **quando** verifico, **então** E-1 a E-5 estão configurados
- **Dado** a análise, **quando** verifico, **então** os eventos de `14-observability` §4.3 estão instrumentados
- **Dado** os alertas AL-01 a AL-12, **quando** verifico, **então** estão configurados com canal e destino

**Estimativa.** 0,25 dia · **Depende de.** T-034
**DoD. Encerra F-5.**

---

## Fatia F-6 — Monetização

### T-036 · Consentimento e páginas legais
- **Dado** primeiro acesso, **quando** a página carrega, **então** nenhum script de terceiro executa antes da decisão (US-014)
- **Dado** as páginas legais, **quando** leio, **então** o conteúdo de `03-functional-spec` §5 está presente
- **Dado** qualquer calculadora, **quando** olho, **então** há link para o aviso legal

**Estimativa.** 1 dia · **Depende de.** T-035

---

### T-037 · Slot de anúncio
- **Dado** consentimento dado, **quando** o anúncio carrega, **então** nada se desloca (TC-050)
- **Dado** qualquer página, **quando** olho, **então** o anúncio está abaixo do resultado e nunca dentro da memória (MC-5)
- **Dado** o anúncio ativo, **quando** rodo TC-043, **então** nenhum valor digitado vaza
- **Dado** o anúncio ativo, **quando** meço, **então** `RNF-001` e `RNF-002` continuam atendidos

**Estimativa.** 1 dia · **Depende de.** T-036
**DoD.** Se as métricas não se sustentarem com o anúncio e não houver ajuste, o anúncio sai (critério de reversão de F-6).

---

### T-038 · Política de segurança de conteúdo com terceiros
- **Dado** a política, **quando** inspeciono, **então** as origens do anúncio estão listadas explicitamente, sem curinga
- **Dado** a política ativa, **quando** uso o produto, **então** nada é bloqueado indevidamente

**Estimativa.** 0,5 dia · **Depende de.** T-037
**DoD. Encerra F-6.**

---

## Fatia F-7 — Lançamento

### T-039 · Auditoria completa de parâmetros
**Contexto.** Bloqueador de lançamento. É a atividade que define `M-3`.

- **Dado** cada parâmetro com vigência aberta, **quando** confiro contra a fonte oficial, **então** não há divergência
- **Dado** cada link de fonte, **quando** abro, **então** ele carrega a norma correta
- **Dado** a auditoria, **quando** concluo, **então** registro em `17-changelog` com o tempo gasto (insumo de HIP-04)

**Estimativa.** 1 dia · **Depende de.** T-038

---

### T-040 · Verificação pré-lançamento
- **Dado** a lista de `12-test-plan` §13, **quando** percorro, **então** todos os itens estão marcados
- **Dado** a restauração de `13-deployment` §8.1, **quando** executo, **então** o site sobe a partir de cópia limpa
- **Dado** o `15-runbook`, **quando** reviso, **então** os endereços genéricos foram substituídos pelos reais

**Estimativa.** 1 dia · **Depende de.** T-039
**DoD. Encerra F-7 · MR-4. Produto no ar.**

---

## Resumo

| Fatia | Tickets | Dias |
|---|---|---|
| F-0 | T-001 a T-004 | 2,5 |
| F-1 | T-005 a T-013 | 11 |
| F-2 | T-014 a T-021 | 8,25 |
| F-3 | T-022 a T-026 | 4,5 |
| F-4 | T-027 a T-030 | 6 |
| F-5 | T-031 a T-035 | 5 |
| F-6 | T-036 a T-038 | 2,5 |
| F-7 | T-039, T-040 | 2 |
| | **40 tickets** | **41,75 dias** |

> 📌 A soma dos tickets (41,75) excede a estimativa por bloco do GATE 1 (37). A diferença de ~13% é granularidade: estimar ticket a ticket expõe trabalho que a estimativa por bloco absorve. **41,75 é o número mais confiável dos dois.**

**Caminho crítico.** T-005 → T-006 → T-007 → T-008 → T-009 → T-010 → T-012 → T-013 → T-014 → T-015. Dez tickets, todos em F-1 e F-2. Atraso em qualquer um empurra o lançamento inteiro.

**T-007 é o ticket de maior risco do projeto.** É pesquisa normativa, não programação, e é o único cujo erro não é detectado por nenhum teste — porque os testes verificam que o código faz o que os parâmetros dizem, nunca se os parâmetros estão certos.

---

## Primeiro comando de implementação

```
Implemente o ticket T-001 seguindo docs/13-deployment.md §2 e as regras
invioláveis de CLAUDE.md. Não implemente nenhuma calculadora ainda.
```
