---
doc: ADR-008
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [11-roadmap, 00-product-brief]
---

# ADR-008 — Escopo enxuto para o lançamento

## Contexto

A fundação documental foi dimensionada em Tier 2 porque *"o risco dominante do
projeto não é escala nem pagamento: é cálculo incorreto publicado em escala"*.
A premissa continua verdadeira.

O que não se sustentou foi a conclusão prática: 24 documentos, 40 tickets, 11
procedimentos de incidente e um catálogo de 10 calculadoras **antes** do
primeiro usuário. Construídos os seis primeiros tickets, ficou visível que a
maior parte desse peso não reduz o risco dominante — apenas o acompanha.

Três observações concretas, todas do próprio material:

1. **O plano contradizia o próprio marco.** MR-1 declara que *"ao fim de F-1 a
   tese está demonstrável; se ela não convencer aqui, mais calculadoras não vão
   resolver"* — e em seguida o roadmap constrói mais nove antes de lançar.
2. **A granularidade inflou a estimativa.** O BACKLOG registra que a soma dos
   tickets (41,75 dias) excede a estimativa por bloco (37) e atribui a
   diferença a granularidade. Ticket menor não é trabalho menor.
3. **O que protege o número é pequeno.** Parâmetro com vigência e fonte,
   casos-ouro contra fonte oficial e auditoria humana. São três coisas. O
   restante do aparato protege outras propriedades, quase todas ainda sem
   usuário para valer.

## Decisão

**Lançar com quatro calculadoras e adiar tudo que não prova a tese.**

### Entra no lançamento

| # | Por quê |
|---|---|
| Salário líquido | maior volume de busca; exige os motores de INSS e IRRF |
| INSS | motor já construído para a de cima; a página custa quase nada |
| IRRF | idem |
| Juros compostos | matemática pura, zero parâmetro legal, e a única do lançamento na vertical de maior valor publicitário |

Quatro calculadoras custam cerca de 1,75 dia a mais que uma, porque três delas
reaproveitam o motor e a página da primeira.

### Adiado para depois do lançamento

| O que | Motivo |
|---|---|
| Rescisão, férias, 13º, horas extras, FGTS | entram durante os 90 dias de medição, sem atrasar o início da contagem |
| 7 dos 10 guias | conteúdo é aditivo; menos guias baixa a meta M-1, não invalida HIP-01 |
| Anúncio e plataforma de consentimento | HIP-03 é a hipótese menos urgente, e o produto funciona integralmente sem receita — propriedade deliberada |
| Análise de uso autohospedada + Postgres | `ADR-005` já reconhece que ela *"cria a única dependência de banco da infraestrutura"*. Um contêiner, um banco, backup e retenção para medir tráfego que ainda não existe |
| Runbook completo | 11 procedimentos para um site sem banco e sem estado. Só `RB-06` (parâmetro incorreto) é procedimento de verdade |
| `ENT-005`, `ENT-006`, BV-08 e BV-09 | modelar calculadora e caso-ouro como entidades validadas é cerimônia; caso-ouro é arquivo de teste |

### Simplificações estruturais

| # | Regra |
|---|---|
| E-1 | **Uma definição declarativa por calculadora** — campos, cálculo e FAQ num objeto — e **uma página genérica** que renderiza qualquer uma. Calculadora nova deixa de ser "construir página" e passa a ser "declarar campos e escrever a função" |
| E-2 | Tokens de design definidos **antes** da primeira página, não aplicados a dez páginas prontas depois. Aplicar design a página pronta é refazer |
| E-3 | Acessibilidade embutida no componente, não auditada no fim |
| E-4 | Uma configuração de Playwright, não duas |
| E-5 | Casos-ouro são arquivos de teste, com a fonte declarada em comentário. Sem esquema, sem validação de entidade |

## O que NÃO é simplificado

Quatro coisas seguem intactas, e cortar qualquer uma delas descaracteriza o
produto:

| # | O quê | Por quê |
|---|---|---|
| 1 | **Memória de cálculo** | É o produto. Sem ela, é um concorrente a mais com layout melhor |
| 2 | **Parâmetro com vigência, fonte e URL oficial** | Sem isso não há memória de cálculo nem retroativo, e a promessa vira alegação |
| 3 | **Casos-ouro contra fonte oficial** | O único mecanismo que pega um número errado |
| 4 | **Não vazamento de dado digitado** | A promessa de privacidade; um teste basta, mas ele precisa existir antes do primeiro script de terceiro |

E a **auditoria humana de parâmetros** continua sendo a atividade mais
importante da manutenção — `M-3` mantém tolerância zero.

## Consequências positivas

- Lançamento em torno de **12 dias-dev** contra 36,75 do plano anterior.
- O relógio de 90 dias de HIP-01 começa quase três semanas antes.
- Quatro calculadoras, uma delas na vertical de maior valor publicitário.
- Menos superfície: sem banco, sem contêiner de análise, sem script de
  terceiro no lançamento — o que também simplifica `07-security` na prática.
- Calculadora nova passa a custar horas, não um dia.

## Consequências negativas

- **Menos superfície de SEO no lançamento.** É o custo real: HIP-01 fica mais
  difícil com 4 rotas do que com 10. Mitigado por começar a contagem antes e
  adicionar calculadoras durante a medição.
- **Sem medição própria no dia do lançamento.** Os primeiros dias de tráfego
  não serão observados em detalhe. Aceito: tráfego de domínio novo nos
  primeiros dias é ruído.
- Adiar o anúncio adia qualquer sinal sobre HIP-03.
- Documentos adiados continuam no repositório e podem envelhecer em relação ao
  código. Mitigado por este ADR declarar quais estão suspensos.

## Custo de reversão

**Nulo.** Nada é removido — é sequenciamento. Cada item adiado tem seu
documento e sua especificação prontos, e entra quando fizer sentido.

## Gatilho de revisão

Se, ao fim de 90 dias, HIP-01 se mostrar limitada por **cobertura de catálogo**
— tráfego crescendo mas concentrado, com busca sem resultado apontando para
calculadoras ausentes — a prioridade passa a ser ampliar o catálogo, e não
aprofundar as quatro existentes.
