# BACKLOG

> **Versão 2.0**, reescrita por `ADR-008`. A v1.0 tinha 40 tickets e 41,75
> dias. Esta tem **8 tickets e ~12 dias** até o lançamento.
>
> A mudança não é de ritmo, é de granularidade e de escopo. O próprio BACKLOG
> anterior registrava que fatiar mais fino *inflou* a estimativa de 37 para
> 41,75 dias — ticket menor não é trabalho menor, é mais costura entre tickets.

**Definition of Done global** — vale para todo ticket:

- [ ] `npm run check` verde
- [ ] Regra de negócio implementada cita o `RN-*` correspondente no código
- [ ] Nenhuma regra inviolável de `CLAUDE.md` foi quebrada

---

## Concluído

| | Ticket | Entrega |
|---|---|---|
| ✅ | T-001 | Repositório e ferramental; regras invioláveis viram lint |
| ✅ | T-002 | Contêiner de produção e composição |
| ✅ | T-003 | Pipeline de integração e entrega |
| ✅ | T-005 | Tipos e aritmética monetária em centavos |
| ✅ | T-006 | Modelo e carregador de parâmetros por vigência |
| ✅ | T-101 a T-105 | Parâmetros, motores, molde, quatro calculadoras, busca e permalink |
| ✅ | T-106 | SEO técnico, três guias e orçamento de performance |

T-004 (VPS, TLS) foi absorvido por **T-108**. T-007 a T-040 foram substituídos
pelos tickets abaixo.

---

# F-B · A primeira calculadora e o molde de todas

## T-101 · Cadastrar INSS e IRRF, 2025 e 2026 · 1 dia

**O ticket de maior risco do projeto.** É transcrição de norma, não
programação, e é o único cujo erro nenhum teste detecta — os testes verificam
que o código faz o que os parâmetros dizem, nunca se os parâmetros estão certos.

A pesquisa já está feita e conferida em fonte oficial. Falta transcrever.

**Arquivos.** `src/lib/params/data/fontes.ts`, `inss.ts`, `irrf.ts`

- **Dado** os parâmetros, **quando** valido, **então** há cobertura de 2025 e 2026
- **Dado** cada vigência, **quando** inspeciono, **então** declara norma e URL oficial
- **Dado** cada valor, **quando** confiro contra a fonte, **então** confere dígito a dígito
- **Dado** o IRRF de 2025, **quando** consulto abril e maio, **então** obtenho tabelas diferentes
- **Dado** o commit, **quando** o CI verifica, **então** segue o formato `params(...)`

**Antes do commit:** apresentar cada número lado a lado com a fonte, para
conferência humana. É a etapa que `HIP-04` cronometra.

---

## T-102 · Motores de INSS e IRRF, com traço · 2 dias

**Arquivos.** `src/lib/engine/inss.ts`, `irrf.ts`, `tests/golden/`

- **Dado** um salário, **quando** calculo INSS, **então** a apuração é progressiva por faixa (`RN-008`)
- **Dado** salário acima do teto, **quando** calculo, **então** a contribuição é limitada (`RN-009`)
- **Dado** rendimento e deduções, **quando** calculo IRRF, **então** a base segue `RN-011`
- **Dado** que o desconto simplificado é mais favorável, **quando** calculo, **então** ele é aplicado e o traço registra por quê (`RN-012`)
- **Dado** rendimento até R$ 5.000, **quando** aplico o redutor, **então** uso o teto fixo, não a fórmula (`RN-013.1`)
- **Dado** cenário que daria imposto negativo, **quando** calculo, **então** o devido é zero (`RN-014`)
- **Dado** qualquer cálculo, **quando** inspeciono o retorno, **então** ele traz resultado **e** traço (`C-M1`)
- **Dado** os cinco exemplos oficiais da Receita, **quando** rodo, **então** todos passam

**Casos-ouro:** os cinco exemplos publicados pela Receita, mais fronteiras de
faixa (um centavo abaixo e acima), teto, isenção e o mesmo cenário em 2025 e
2026 produzindo resultados diferentes.

---

## T-103 · O molde: definição declarativa, página genérica e memória · 3 dias

**O ticket que decide se o plano de 12 dias se sustenta.** Se a página não sair
genérica de verdade, a segunda calculadora obriga a refazer o molde.

**Arquivos.** `src/lib/calculadoras/tipos.ts`, `salario-liquido.ts`,
`src/app/[slug]/page.tsx`, `src/components/`

- **Dado** uma calculadora declarada (campos, função, FAQ), **quando** acesso a rota, **então** a página renderiza sem código próprio dela (`E-1`)
- **Dado** campos válidos preenchidos, **quando** saio do último, **então** o resultado aparece sem clique
- **Dado** obrigatório vazio, **quando** olho, **então** vejo o estado pendente sem número parcial
- **Dado** entrada inválida, **quando** ocorre, **então** o resultado anterior é limpo
- **Dado** um traço, **quando** expando a memória, **então** vejo cada etapa numerada, com fórmula, parâmetro, vigência e link da fonte (`MC-1` a `MC-3`)
- **Dado** a memória aberta, **quando** refaço as contas à mão, **então** chego ao mesmo resultado
- **Dado** que altero a vigência, **quando** recalculo, **então** resultado e parâmetros exibidos mudam
- **Dado** vigência sem cobertura, **quando** seleciono, **então** o cálculo é bloqueado com o intervalo disponível (`RN-003`)
- **Dado** qualquer resultado, **quando** olho a mesma dobra, **então** vejo o aviso de estimativa (`RN-028`)
- **Dado** os tokens de design, **quando** meço contraste, **então** atende 4,5:1 em texto e 3:1 em contorno (`E-2`)

**DoD.** `/salario-liquido` no ar e utilizável por uma pessoa real. **MR-1.**

---

# F-C · Mais três, quase de graça

## T-104 · INSS, IRRF e juros compostos · 2 dias

**Arquivos.** `src/lib/calculadoras/{inss,irrf,juros-compostos}.ts`

- **Dado** INSS e IRRF, **quando** os declaro, **então** reaproveitam os motores de T-102 sem duplicar lógica
- **Dado** a calculadora de INSS, **quando** vejo o resultado, **então** há uma linha por faixa e a alíquota efetiva
- **Dado** a de IRRF, **quando** o INSS é pré-preenchido e eu o edito, **então** vejo "Usando o valor que você informou"
- **Dado** juros compostos, **quando** calculo, **então** obtenho montante, total investido, total em juros e a tabela de evolução
- **Dado** juros compostos, **quando** olho, **então** vejo a nota sobre o que o cálculo não considera
- **Dado** qualquer calculadora, **quando** rolo até o fim, **então** vejo as relacionadas

**Nota.** Juros compostos não tem parâmetro legal e não depende de série
externa: a taxa é digitada. A sugestão automática pelo Banco Central fica para
depois do lançamento.

---

# F-D · Encontrável, acessível e no ar

## T-105 · Home, busca, páginas legais e permalink · 1 dia

- **Dado** a home, **quando** busco por termo comum, **então** vejo as calculadoras sem requisição de rede
- **Dado** qualquer calculadora, **quando** parto da home, **então** chego em um clique
- **Dado** um formulário preenchido, **quando** olho a URL, **então** ela contém o estado
- **Dado** essa URL em contexto novo, **quando** carrega, **então** o mesmo resultado aparece
- **Dado** query presente, **quando** inspeciono, **então** há `noindex` e canônica sem query
- **Dado** as páginas legais, **quando** leio, **então** o conteúdo de `03-functional-spec` §5 está presente

---

## ✅ T-106 · SEO técnico e 3 guias · 1 dia

- [x] **Dado** cada rota, **quando** inspeciono, **então** há título, descrição e canônica próprios
- [x] **Dado** o sitemap, **quando** consulto, **então** todas as rotas indexáveis estão nele e nenhuma com query
- [x] **Dado** os guias, **quando** leio, **então** explicam o conceito em linguagem comum e conduzem à calculadora
- [x] **Dado** qualquer texto, **quando** leio, **então** não há linguagem prescritiva de direito (`RN-028`)

**Guias:** como o INSS é calculado · imposto de renda na folha · por que a
diferença entre bruto e líquido surpreende.

**Entregue além do combinado, e por quê:**

- `ADR-009` — guia é dado declarativo, não MDX. Valor legal na prosa seria
  constante legal fora de `lib/params/`, e o guia passaria a envelhecer em
  silêncio a cada portaria nova. Verificado por teste (regra G-1).
- **TC-051 passou a medir de verdade.** Era um `echo` desde o T-003, com a
  justificativa de que não havia rota a medir. Havia desde o T-103.
- **`relacionadas` renderizado.** Critério de aceite do T-104 que ficou por
  fazer: as quatro calculadoras declaravam relacionadas e nenhuma página as
  exibia.
- **Rodapé corrigido.** Anunciava "em breve" INSS, IRRF e juros compostos, as
  três publicadas no T-104. Passou a derivar do registro, e um teste impede a
  divergência de voltar.
- **Home 7,6 kB mais leve.** A busca importava o registro completo, e com ele o
  motor e as tabelas legais, para filtrar quatro nomes.

---

## T-107 · Acessibilidade, não vazamento e ponta a ponta · 1 dia

- **Dado** as rotas de calculadora, **quando** rodo o verificador, **então** não há violação de nível A nem AA
- **Dado** só o teclado, **quando** percorro a página, **então** completo o fluxo sem armadilha de foco
- **Dado** um leitor de tela, **quando** o resultado atualiza, **então** ele é anunciado sem interromper a digitação
- **Dado** valores marcadores em todas as calculadoras, **quando** intercepto o tráfego, **então** nenhum marcador aparece
- **Dado** um erro provocado, **quando** inspeciono o envio, **então** não há valor de campo nem query string
- **Dado** os fluxos críticos, **quando** rodo, **então** passam em desktop e mobile

**O teste de vazamento precisa existir antes do primeiro script de terceiro.**
Como o lançamento não tem anúncio, esta é a linha de base limpa.

---

## T-108 · Publicar, auditar e lançar · 1 dia

Absorve o antigo T-004.

- **Dado** o EasyPanel, **quando** crio o serviço, **então** ele serve a imagem publicada pelo pipeline
- **Dado** o domínio, **quando** acesso por HTTPS, **então** responde com certificado válido
- **Dado** o painel, **quando** verifico, **então** a renovação automática está confirmada
- **Dado** o segredo de deploy configurado, **quando** faço um commit, **então** ele chega ao ar sem intervenção
- **Dado** cada parâmetro com vigência aberta, **quando** confiro contra a fonte oficial, **então** não há divergência
- **Dado** cada link de fonte, **quando** abro, **então** carrega a norma correta
- **Dado** a auditoria, **quando** concluo, **então** registro em `17-changelog` com o tempo gasto (insumo de `HIP-04`)

**DoD.** Produto público. **MR-2** — começa a contagem de 90 dias.

---

## Resumo

| Fatia | Tickets | Dias |
|---|---|---|
| F-B | T-101 a T-103 | 6 |
| F-C | T-104 | 2 |
| F-D | T-105 a T-108 | 4 |
| | **8 tickets** | **12 dias** |

**Caminho crítico.** T-101 → T-102 → T-103. Três tickets, todos em F-B. Atraso
em qualquer um empurra o lançamento inteiro.

**T-101 continua sendo o de maior risco**, mesmo com a pesquisa pronta. A
transcrição é onde o erro entra, e nenhum teste o pega.

---

## Suspenso até depois do lançamento

Documentado, especificado e fora do caminho crítico (`ADR-008`):

| O quê | Onde está especificado |
|---|---|
| Rescisão, férias, 13º, horas extras, FGTS | `03-functional-spec` §3.2 a §3.7 |
| 7 guias restantes | `03-functional-spec` §4 |
| Anúncio e consentimento | `10-ux-ui-spec` §9, `RF-009` |
| Análise de uso autohospedada | `ADR-005`, `14-observability` |
| Série econômica do Banco Central | `ADR-006`, `RF-012` |
| Runbook completo | `15-runbook` — só `RB-06` vale antes do lançamento |
| `ENT-005`, `ENT-006`, BV-08, BV-09 | `05-data-model` |

Nada disso foi removido. Entra quando houver motivo para entrar.

---

## Primeiro comando de implementação

```
Implemente o ticket T-101. Antes de commitar, apresente cada valor
lado a lado com a fonte oficial para conferência.
```
