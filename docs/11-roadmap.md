---
doc: 11-roadmap
projeto: Cálculo Oficial
versao: 2.0
status: aprovado
depende_de: [00-product-brief, 01-prd, 16-adr/ADR-008-escopo-enxuto-para-lancamento]
substitui: 11-roadmap v1.0
---

# Roadmap

> **Versão 2.0.** Reescrito por `ADR-008`. A v1.0 previa 10 calculadoras e
> 36,75 dias-dev até o lançamento. Esta prevê **4 calculadoras e ~12 dias-dev**,
> adiando o que não prova a tese. Nada foi removido do projeto — foi reordenado.

## 1. Princípio

Fatias verticais. Cada uma coloca algo no ar e é utilizável por uma pessoa real.

E uma regra que a v1.0 não tinha: **nada entra antes do lançamento se puder
entrar depois sem prejuízo.** O custo de adiar é quase sempre zero; o custo de
antecipar é o relógio de HIP-01 parado.

## 2. O que já está pronto

| | Entrega |
|---|---|
| ✅ | Repositório, ferramental e regras de qualidade ativas por lint |
| ✅ | Imagem de contêiner sem código-fonte, com processo sem privilégio |
| ✅ | Publicação automatizada por commit, verificada em produção |
| ✅ | Aritmética monetária em centavos, com política de arredondamento explícita |
| ✅ | Modelo de parâmetros por vigência, com BV-01 a BV-07 valendo |
| ✅ | Pesquisa normativa de INSS e IRRF, 2025 e 2026, em fonte oficial |
| ✅ | Domínio registrado e DNS apontando para a VPS |

---

## 3. Fatias até o lançamento

### F-B · A primeira calculadora e o molde de todas · 6 dias

**Entrega.** `/salario-liquido` no ar, com memória de cálculo e seletor de
vigência.

É a fatia que mais importa, e por uma razão que a v1.0 não explicitava: ela não
constrói **uma** calculadora, constrói **o molde**. A página é genérica desde o
primeiro dia (`ADR-008` E-1), então as seguintes custam horas.

| Inclui | Não inclui |
|---|---|
| Tabelas de INSS e IRRF cadastradas, 2025 e 2026 | Outras calculadoras |
| Motores de INSS e IRRF, com traço | Anúncio |
| Definição declarativa de calculadora + página genérica | Guias longos |
| Memória de cálculo | Análise de uso |
| Tokens de design, aplicados desde o início (E-2) | |
| Casos-ouro dos exemplos oficiais da Receita | |

**Pronto quando:** o resultado bate com os casos-ouro conferidos contra fonte
oficial, a memória permite refazer a conta à mão, e mudar a vigência muda o
resultado corretamente.

**Marco MR-1 · a tese é demonstrável.** Se ela não convencer aqui, mais
calculadoras não resolvem — e desta vez o plano age de acordo.

---

### F-C · Mais três, quase de graça · 2 dias

**Entrega.** INSS, IRRF e juros compostos no ar.

As duas primeiras reaproveitam motores já construídos em F-B; a página é a
mesma. Juros compostos é matemática pura, sem parâmetro legal — e é a única do
lançamento na vertical de maior valor publicitário.

**Pronto quando:** as quatro passam nos casos-ouro e a navegação entre elas
funciona.

---

### F-D · Encontrável, acessível e no ar · 4 dias

**Entrega.** O produto público.

| Inclui |
|---|
| Home, busca local no catálogo e páginas legais |
| 3 guias em MDX, ligados às calculadoras |
| Metadata, sitemap, canônicas e dados estruturados |
| Permalink de cálculo pela query string |
| Serviço no EasyPanel, TLS e renovação automática confirmada |
| Verificação de acessibilidade e correções |
| **Teste de não vazamento de dado** |
| **Auditoria dos parâmetros contra fonte oficial** |

**Pronto quando:** a auditoria retorna zero divergência, o teste de vazamento
passa, e o sitemap está submetido.

**Marco MR-2 · lançado.** Começa a contagem de 90 dias de HIP-01 e HIP-02.

---

## 4. Resumo

| Fatia | Dias | Acumulado | Entrega |
|---|---|---|---|
| F-B | 6 | 6 | **Primeira calculadora utilizável** |
| F-C | 2 | 8 | Quatro calculadoras |
| F-D | 4 | **12** | **Produto público** |

> 📌 PREMISSA: 12 dias-dev é hipótese. O risco de estouro está concentrado em
> F-B, e não pelo motivo da v1.0 — a pesquisa normativa já está feita. O risco
> agora é a página genérica não se provar genérica de verdade, obrigando a
> refazer o molde ao construir a segunda calculadora.

**Se o prazo apertar,** nesta ordem: reduzir os guias de 3 para 1 · adiar o
permalink · adiar a busca local.

**Nunca cortar:** os casos-ouro, a auditoria de F-D, o teste de vazamento e a
memória de cálculo. São o que separa este produto do que ele critica.

---

## 5. Depois do lançamento

Sem estimativa, porque dependem da medição. Ordem sugerida:

| # | O quê | Gatilho |
|---|---|---|
| 1 | Rescisão sem justa causa | maior valor percebido do catálogo |
| 2 | Férias, 13º, horas extras, FGTS | compartilham o motor de proporcionalidade |
| 3 | Guias restantes | conforme `busca_sem_resultado` indicar demanda |
| 4 | Análise de uso | quando houver tráfego que justifique medir |
| 5 | Anúncio e consentimento | quando o tráfego der sinal sobre HIP-03 |
| 6 | Catálogo v2 em diante | conforme §6 |

A ordem de 1 e 2 é deliberada: rescisão é a mais complexa do catálogo e vem
primeiro de propósito. Se o motor não a comportar, é melhor descobrir com
quatro calculadoras no ar do que com dez pela frente.

---

## 6. MR-3 — critério de decisão, 90 dias após o lançamento

| Cenário | Decisão |
|---|---|
| HIP-01 e HIP-02 confirmadas | Avançar no catálogo, priorizando as verticais de maior valor publicitário |
| HIP-01 confirmada, HIP-02 refutada | Há tráfego e o diferencial não é percebido. Investigar apresentação antes de expandir |
| HIP-01 refutada, HIP-02 confirmada | O produto é bom e ninguém chega nele. Problema de canal. Reavaliar aquisição; **não** adicionar calculadoras |
| Ambas refutadas | Descontinuar ou reposicionar. Adicionar cobertura é a resposta instintiva e é a que produziu o mercado atual |

**Ressalva de `ADR-008`.** Se o tráfego crescer mas ficar concentrado, e
`busca_sem_resultado` apontar calculadoras ausentes, HIP-01 está limitada por
**cobertura**, não por canal — e aí ampliar o catálogo é a resposta certa, não a
instintiva. A distinção depende de instrumentar aquele evento, o que entra junto
da análise de uso.

---

## 7. Manutenção recorrente

Não é fatia; é o custo real do produto.

| Tarefa | Frequência | Esforço |
|---|---|---|
| Auditoria de parâmetros contra fonte oficial | Trimestral | 0,25 dia |
| Atualização de parâmetros na virada de exercício | Anual | 0,5 dia |
| Revisão de dependências | Mensal | 0,25 dia |

Com quatro calculadoras a manutenção anual fica em torno de **2 dias-dev**,
contra 4 a 6 estimados para dez. É o outro ganho do escopo enxuto, e é o que
`HIP-04` testa na primeira virada de exercício.

---

## 8. Relação com o catálogo

`00-catalogo-calculadoras` mantém as 75 calculadoras e a divisão em v1 a v4 como
**documento de escopo de longo prazo**. Este roadmap define apenas o que vai ao
ar no lançamento.

Correspondência: o lançamento leva CALC-001, CALC-015, CALC-016 e CALC-022. As
outras seis do v1 do catálogo passam a ser as primeiras do pós-lançamento.
