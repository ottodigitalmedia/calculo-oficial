---
doc: ADR-006
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [06-api-spec]
---

# ADR-006 — Série econômica consumida em build, com fallback em cache

## Contexto

A calculadora de juros compostos (CALC-022) fica melhor se sugerir a taxa básica de juros corrente em vez de deixar o campo vazio. Fases futuras do catálogo dependem de séries econômicas de forma mais central — correção monetária, reajuste de aluguel, comparação de renda fixa.

Isso introduz a única dependência externa de dado do sistema. A decisão de **onde e quando** consumi-la determina se ela pode derrubar o produto.

Vale registrar a diferença essencial: parâmetro legal e indicador econômico parecem a mesma coisa e não são.

| | Parâmetro legal | Indicador econômico |
|---|---|---|
| Origem | Norma publicada | Série divulgada |
| Se estiver errado | Cálculo errado, dano real | Sugestão imprecisa que o usuário sobrescreve |
| Se estiver ausente | Cálculo impossível | Campo vazio |
| Tratamento | Versionado, auditado, bloqueia o build | Cache, degrada em silêncio |

## Opções consideradas

**A. Consumo em tempo real, no navegador.** Sempre atual. Coloca uma dependência externa no caminho crítico do usuário, adiciona latência, exige tratamento de erro na interface e — o pior — cria uma requisição de terceiro a partir de uma página onde o usuário digita salário, o que amplia a superfície de AM-02.

**B. Rota de servidor com cache.** Isola o navegador da fonte externa. Exige servidor de aplicação, contradizendo `ADR-002`.

**C. Consumo em build, com revalidação periódica e valor em cache versionado como fallback.**

## Decisão

**Opção C.**

| # | Regra |
|---|---|
| S-1 | Coleta ocorre no pipeline e em revalidação incremental diária. Nunca em resposta a interação do usuário |
| S-2 | O último valor obtido é versionado no repositório como fallback |
| S-3 | Falha da coleta **não interrompe o build** (regra R-3 de `06-api-spec`) |
| S-4 | Resposta validada por schema e por intervalo plausível antes de ser aceita |
| S-5 | O valor exibido sempre acompanha a data a que se refere |
| S-6 | Valor com mais de 30 dias exibe aviso ao usuário (`RN-033`) |
| S-7 | Nenhum dado do usuário é enviado à fonte externa |

## Consequências positivas

- **Zero dependência externa no caminho crítico.** O usuário nunca espera por rede para calcular, e nunca vê erro por causa de um serviço de terceiro.
- A página da calculadora não abre conexão externa, o que reduz a superfície de exfiltração no ponto mais sensível.
- A assimetria de S-3 é deliberada e correta: parâmetro legal errado deve quebrar o build; indicador indisponível, não. Tratar os dois com o mesmo rigor tornaria o pipeline frágil sem reduzir risco real.
- S-5 e S-6 transformam a defasagem em informação exibida, em vez de imprecisão silenciosa — coerente com a tese do produto.
- Funciona sem rede após o primeiro carregamento.

## Consequências negativas

- O valor pode estar defasado por até um dia em condições normais, e mais em caso de falha prolongada. Mitigado por S-5 e S-6.
- Exige lógica de cache e fallback que não existiria com consumo direto.
- O valor em cache versionado no repositório gera commits automáticos, poluindo o histórico. Mitigado por prefixo de mensagem que os distingue dos commits de parâmetro.
- Se o formato ou o endereço da fonte mudarem, a falha é silenciosa até o alerta AL-05 disparar. Aceito: o dano é baixo.

## Custo de reversão

**Baixo.** Migrar para consumo em tempo real exigiria adicionar tratamento de erro na interface — de 1 a 2 dias-dev — mas reintroduziria os problemas que motivaram a decisão.

**Gatilho de revisão:** se as fases v2 e v3 trouxerem calculadoras cuja precisão dependa de série intradiária, esta decisão deve ser reavaliada para essas calculadoras especificamente. As de correção monetária, previstas para v3, usam séries mensais e continuam bem servidas por este modelo.
