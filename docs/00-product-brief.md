---
doc: 00-product-brief
projeto: Cálculo Aberto
versao: 1.0
status: aprovado
depende_de: [00-catalogo-calculadoras]
---

# Product Brief

## 1. Problema

O brasileiro que precisa saber quanto vai receber na rescisão, quanto sobra do salário ou quanto rende um aporte encontra dezenas de sites que devolvem um número — e nada além do número.

Três falhas se repetem no mercado atual:

**1.1 O resultado não é verificável.** O site informa "R$ 4.312,80" sem mostrar qual alíquota de INSS foi aplicada, qual tabela de IRRF, qual base de cálculo. O usuário não consegue conferir contra o holerite nem entender por que o valor mudou.

**1.2 A vigência é opaca.** Parâmetros trabalhistas e tributários mudam a cada exercício. A maioria dos sites calcula apenas "hoje" e não informa qual tabela usou. Quem precisa recalcular um período passado — a maioria dos casos de rescisão e conferência — não tem como.

**1.3 A interface trabalha contra o usuário.** Anúncio acima do resultado, deslocamento de layout durante o carregamento, catálogo de centenas de ferramentas que dilui a confiança em todas.

> **Status da evidência:** as falhas 1.1 e 1.2 são **observação direta** dos sites concorrentes listados no §5. A falha 1.3 é observação direta em parte do mercado, não em todo ele.
> 📌 PREMISSA: assume-se que essas falhas incomodam o usuário o suficiente para gerar preferência. Isso é **hipótese** (ver HIP-02), não fato medido.

## 2. Público

### Persona primária — "conferindo o número"

Pessoa física com vínculo CLT, 25 a 50 anos, acesso majoritariamente por celular. Chega por busca orgânica em um momento de tensão: foi demitida, vai pedir demissão, recebeu um holerite que não bate, está negociando salário.

Comportamento: sessão curta, alta ansiedade, baixa tolerância a fricção. Não vai se cadastrar. Não vai instalar nada. Quer um número e, se o número for surpreendente, quer entender de onde ele veio.

O que a faz confiar: ver o passo a passo, reconhecer os valores do próprio holerite dentro do cálculo, e a citação da norma.

### Persona secundária — "conferindo o de outra pessoa"

Profissional que calcula com alguma recorrência: RH ou departamento pessoal de empresa pequena, contador em início de carreira, síndico, autônomo que gere a própria folha. Volume maior, exigência maior de rastreabilidade.

**Não é público-alvo do v1** — não há funcionalidade paga nem conta de usuário. É registrada aqui porque é a persona que justificaria uma eventual monetização direta no futuro, e porque suas necessidades não devem ser ativamente bloqueadas pelas decisões de v1.

### Não é público

Advogado trabalhista, perito judicial e calculista. Esse segmento é atendido por software profissional pago, com liquidação de sentença, correção por índice de tribunal e memória de cálculo processual. Competir ali exigiria outro produto e outra estrutura.

## 3. Proposta de valor

> **Um número que você pode conferir:** cada cálculo mostra o passo a passo, o parâmetro legal usado, a vigência dele e o link para a norma.

## 4. Diferenciais

Ordenados por dificuldade de cópia.

| # | Diferencial | Por que é defensável |
|---|---|---|
| D-1 | **Memória de cálculo auditável** — cada linha do resultado expandível, com parâmetro, valor, vigência e link para a norma | Exige arquitetura de dados desde o início. Um concorrente com fórmulas hardcoded não adiciona isso sem refatorar o produto inteiro |
| D-2 | **Seletor de vigência** — recalcular qualquer cálculo com a tabela de exercícios anteriores | Consequência direta de D-1. Os gratuitos calculam só o presente; os que fazem retroativo cobram por isso |
| D-3 | **Velocidade em mudança legal** — parâmetro novo é um commit, não uma refatoração | O motor de vigências transforma manutenção anual em trabalho de dados |
| D-4 | **Densidade de anúncio contida** — um slot, abaixo do resultado, com altura reservada | Facilmente copiável, mas incompatível com o modelo de receita de quem depende de volume de impressão |
| D-5 | **Catálogo curado** — 75 calculadoras auditadas, não 300 abandonadas | Copiável em princípio; na prática exige abrir mão de tráfego já indexado |

**Diferencial que já não é diferencial:** "ser gratuito", "não exigir cadastro", "estar atualizado", "ter boa interface". Concorrentes já reivindicam todos os quatro. São preço de entrada.

## 5. Concorrência — e como perdemos para ela

Levantamento do mercado brasileiro de calculadoras públicas.

### 5.1 Agregadores generalistas de alto volume

Sites com centenas de calculadoras, monetização por anúncio, cobertura ampla e profundidade rasa.

**Como perdemos para eles:**
- Anos de indexação e autoridade de domínio. Um domínio novo não ranqueia contra isso em consultas genéricas no curto prazo.
- Cobertura 4x maior. Para qualquer busca de cauda longa que não esteja no nosso catálogo, eles ganham por padrão.
- Já capturaram os termos de cabeça ("calculadora de rescisão", "salário líquido").

**Onde eles são vulneráveis:** profundidade. Nenhum explica bem o cálculo. Nenhum permite retroativo. Vários mantêm calculadoras que já não atualizam.

### 5.2 Especialistas verticais em cálculo trabalhista

Sites focados em CLT, com atualização diligente, citação de base legal e às vezes data de última revisão visível.

**Como perdemos para eles:**
- São bons no que fazem e diretamente comparáveis a nós.
- Alguns têm mais de uma década de operação e credibilidade acumulada.
- Alguns são mantidos por profissional com formação contábil — competência de domínio que precisamos suprir com pesquisa.

**Onde eles são vulneráveis:** o passo a passo do cálculo raramente é exposto de forma navegável, e o retroativo por vigência é incomum.

### 5.3 Software profissional pago com calculadoras gratuitas de topo de funil

Plataformas de cálculo jurídico e trabalhista por assinatura, que publicam calculadoras gratuitas para captar assinantes.

**Como perdemos para eles:**
- Têm equipe, receita recorrente e advogados internos. Podem investir em conteúdo e SEO num nível que um mantenedor solo não alcança.
- As calculadoras gratuitas deles são um custo de aquisição, não um centro de resultado. Podem operá-las no prejuízo indefinidamente.
- Têm autoridade de marca no segmento profissional.

**Onde eles são vulneráveis:** as ferramentas gratuitas são deliberadamente limitadas para não canibalizar a assinatura. A limitação é o modelo de negócio deles, não um descuido — e é exatamente o espaço onde cabemos.

### 5.4 O concorrente estrutural: a resposta direta do buscador

Consultas simples de calculadora são cada vez mais respondidas na própria página de resultados ou por assistentes conversacionais, sem clique.

**Como perdemos:** para "quanto é 15% de 200", já perdemos. Para "quanto vou receber na rescisão com 3 anos de casa e salário de X", ainda não — a resposta depende de entradas demais e o usuário quer ver a conta.

**Consequência para a estratégia:** o catálogo deve pesar para cálculos multivariados e explicáveis, e não para respostas de uma linha. Isso já está refletido na priorização do catálogo (ver [00-catalogo-calculadoras](00-catalogo-calculadoras.md) §13).

## 6. Métricas de sucesso

### North Star

**Cálculos concluídos com a memória de cálculo expandida.**

Mede a tese inteira do produto. Se as pessoas calculam mas nunca abrem o passo a passo, o diferencial D-1 não tem valor percebido, e o projeto é um concorrente a mais com layout melhor — hipótese que precisa ser refutada cedo, não descoberta tarde.

### Secundárias

| # | Métrica | Meta v1 | Janela |
|---|---|---|---|
| M-1 | Sessões orgânicas por mês | `guias publicados × 40 sessões/mês`. Fixada ao fim da fatia F-4, quando o volume real de conteúdo é conhecido. Ver `11-roadmap` §2, F-4 | 90 dias após indexação |
| M-2 | LCP no p75 mobile | ≤ 2,0s | Contínuo |
| M-3 | Divergências encontradas na auditoria contra fonte oficial | **Zero** | Trimestral |

M-3 é a única métrica sem tolerância. Uma divergência confirmada em produção dispara o procedimento de incidente descrito em `15-runbook`.

### Métricas deliberadamente não perseguidas

- **Número de calculadoras.** É a métrica que produziu o mercado atual.
- **Tempo na página.** Um bom produto aqui é um produto rápido de usar. Sessão longa provavelmente significa confusão.
- **Receita por sessão no v1.** Otimizar anúncio antes de existir tráfego é otimização sem medição.

## 7. Escopo

Escopo detalhado no catálogo. Resumo:

**IN (v1):** 10 calculadoras · motor de parâmetros versionado por vigência · memória de cálculo expansível · seletor de vigência · FAQ contextual e 10 guias em MDX · um slot de anúncio com consentimento · páginas legais · suíte de casos-ouro bloqueadora de deploy.

**OUT em definitivo:** documentos jurídicos de qualquer natureza · calculadoras de saúde · cálculos hiperlocais · tributário empresarial complexo · calculadoras de lazer e entretenimento · linguagem prescritiva de direito.

**OUT do v1, reavaliável:** autenticação · assinatura e pagamento · banco de dados · exportação em PDF · as 65 calculadoras das fases v2 a v4.

## 8. Hipóteses a validar

O projeto repousa sobre quatro hipóteses. Nenhuma está validada.

| ID | Hipótese | Como falha | Como testar | Prazo |
|---|---|---|---|---|
| **HIP-01** | É possível conquistar tráfego orgânico relevante com domínio novo, contra incumbentes indexados, em um cenário de respostas diretas no buscador | Tráfego estagnado após indexação completa | Medir sessões orgânicas contra M-1 | 90 dias pós-indexação |
| **HIP-02** | O usuário valoriza a memória de cálculo o suficiente para preferir este produto | Taxa de expansão da memória permanece marginal | Medir a North Star desde o lançamento | 60 dias |
| **HIP-03** | O RPM do nicho sustenta o custo de manutenção do catálogo | Receita não cobre nem o tempo de atualização anual | Painel de anúncios, RPM por categoria | 90 dias |
| **HIP-04** | Um mantenedor solo consegue auditar 10 calculadoras por exercício sem degradar M-3 | Auditoria atrasa ou encontra divergência | Cronometrar a primeira auditoria completa | Primeira virada de exercício |

**HIP-01 é a hipótese de maior risco do projeto.** Se ela falhar, nenhuma das outras importa — e a falha não é técnica, é de canal. Vale registrar que o produto pode ser tecnicamente excelente e comercialmente irrelevante por essa razão isolada.

**Critério de continuidade.** Ao fim de 90 dias, se HIP-01 e HIP-02 forem ambas refutadas, a decisão correta é descontinuar ou reposicionar — não adicionar calculadoras. Adicionar cobertura é a resposta instintiva e é a que produziu o mercado atual.
