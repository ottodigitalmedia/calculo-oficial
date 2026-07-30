---
doc: 14-observability
projeto: Cálculo Aberto
versao: 1.0
status: draft
depende_de: [07-security, 13-deployment]
---

# Observabilidade

## 1. Restrição fundamental

Este produto tem uma restrição que a maioria não tem: **é proibido observar o que o usuário digita** (`RN-030`, `RN-031`).

Isso elimina os instrumentos mais convenientes — repetição de sessão, mapa de calor de formulário, registro de payload, telemetria de campo. A consequência prática é que a observabilidade aqui é mais pobre e precisa ser desenhada, não configurada por padrão. As configurações padrão da maioria das ferramentas violam a regra.

## 2. O que registrar e o que nunca registrar

### 2.1 Nunca

| Item | Por quê |
|---|---|
| Qualquer valor de campo | `RN-030` — é a promessa do produto |
| Query string de qualquer URL | Contém os valores (`07-security` §4.3) |
| Resultado de cálculo | Deriva dos valores |
| Corpo de requisição em relatório de erro | Pode conter valores |
| Endereço IP em análise de uso | Além do necessário |
| Cookie de identificação | Não existe |

### 2.2 Sempre

| Item | Onde |
|---|---|
| Erro não tratado, com pilha e rota **sem query** | Ferramenta de erro |
| Falha da integração externa, com motivo | Ferramenta de erro |
| Erro de domínio do motor, por tipo e calculadora | Ferramenta de erro, nível informativo |
| Evento de uso: calculadora + tipo de interação | Análise |
| Métricas de experiência web reais | Análise |
| Requisição HTTP: método, rota sem query, código, duração | Registro do servidor |
| Resultado do pipeline | Automação |

### 2.3 Configuração obrigatória da ferramenta de erro

Não é opcional nem detalhe: **é o controle que impede AM-04**, a ameaça de maior probabilidade em `07-security`.

| # | Configuração |
|---|---|
| E-1 | Remover query string de toda URL antes do envio |
| E-2 | Não capturar corpo de requisição |
| E-3 | Não capturar conteúdo de campos de formulário |
| E-4 | Remover valores de variáveis locais na pilha quando parecerem monetários |
| E-5 | Desativar repetição de sessão |
| E-6 | Verificado por TC-041 a cada deploy |

## 3. Métricas técnicas — SLIs e SLOs

| SLI | SLO | Como medir | Requisito |
|---|---|---|---|
| Disponibilidade | ≥ 99,5% mensal | Monitoramento externo, 1 min | `RNF-006` |
| LCP, p75 mobile | ≤ 2,0s | Métricas reais de usuário | `RNF-001` |
| CLS, p75 | ≤ 0,05 | Idem | `RNF-002` |
| INP, p75 | ≤ 200ms | Idem | `RNF-003` |
| Taxa de erro não tratado | ≤ 0,1% das sessões | Ferramenta de erro | — |
| Sucesso da coleta da série externa | ≥ 90% das tentativas | Registro do pipeline | `RF-012` |
| Idade do valor da série em cache | ≤ 30 dias | Verificação diária | `RN-033` |
| Duração do pipeline | ≤ 10 min | Automação | — |

**Orçamento de erro.** Com 99,5%, são cerca de 3,6 horas de indisponibilidade por mês. Consumido mais da metade, congelar mudanças não essenciais até o mês seguinte.

## 4. Métricas de produto

### 4.1 North Star

**Cálculos concluídos com a memória de cálculo expandida.**

| Aspecto | Definição |
|---|---|
| Numerador | Sessões em que o usuário expandiu a memória após um cálculo bem-sucedido |
| Denominador | Sessões com ao menos um cálculo bem-sucedido |
| Eventos | `calculo_concluido` e `memoria_expandida`, ambos com o identificador da calculadora |
| Dado transmitido | Identificador da calculadora e nome do evento. Nada mais |

Esta métrica testa HIP-02 diretamente. Se permanecer marginal, o diferencial existe na intenção e não na percepção.

### 4.2 Secundárias

| KPI | Testa | Fonte |
|---|---|---|
| Sessões orgânicas por mês | HIP-01 | Análise |
| Sessões por calculadora | Priorização do catálogo | Análise |
| Profundidade de sessão | Eficácia dos links entre calculadoras | Análise |
| Taxa de erro de vigência (`RN-003`) | Se a cobertura de vigência é insuficiente | Ferramenta de erro |
| Cliques em link de fonte normativa | Se a citação é usada ou é decorativa | Análise |
| Compartilhamentos por URL | Uso de `RF-006` | Análise |
| Receita e RPM por categoria | HIP-03 | Painel da rede de anúncio |

**Taxa de erro de vigência merece atenção.** Se muitos usuários pedem datas sem cobertura, a informação de produto é "estenda o histórico de parâmetros", e ela só aparece se esse erro for instrumentado.

### 4.3 Eventos

| Evento | Propriedades | Nunca inclui |
|---|---|---|
| `pagina_vista` | rota sem query | query string |
| `calculo_concluido` | id da calculadora, vigência aplicada | entradas, resultado |
| `memoria_expandida` | id da calculadora | conteúdo da memória |
| `fonte_acessada` | id do parâmetro | — |
| `vigencia_alterada` | id da calculadora, ano de destino | — |
| `erro_vigencia` | id da calculadora, ano solicitado | — |
| `url_compartilhada` | id da calculadora | query string |
| `busca_sem_resultado` | **termo buscado** | — |

**Exceção justificada.** `busca_sem_resultado` transmite o termo digitado, e é a única exceção à regra de não transmitir entrada. O campo de busca não recebe dado pessoal — recebe o nome de uma calculadora procurada — e o termo é a informação mais valiosa para decidir o que construir a seguir. A exceção é deliberada, não acidental, e a política de privacidade a menciona explicitamente.

**Onde a exceção é normativa.** A autoridade é `RN-031.1` de `01-prd` §3.11, não esta tabela. Ela é exaustiva: nenhum outro evento pode transmitir entrada do usuário, e ampliá-la exige alterar o requisito — nunca reconfigurar a ferramenta de análise. O limite é verificado por TC-042, que reprova se qualquer segundo evento carregar entrada.

## 5. Rastreamento distribuído

**Não se aplica.** Não há serviços a correlacionar: um contêiner servindo conteúdo estático e cálculo no cliente. Instrumentar rastreamento aqui adicionaria dependência e superfície sem responder a nenhuma pergunta que não seja respondida pelo registro de erro.

## 6. Alertas

Cada alerta define condição, canal e ação. Alerta sem ação definida vira ruído, e ruído vira alerta ignorado.

| ID | Condição | Canal | Ação |
|---|---|---|---|
| AL-01 | Site fora por > 2 min | Push imediato | `15-runbook` — aplicação fora do ar |
| AL-02 | Erro não tratado em > 1% das sessões, por 15 min | Push | `15-runbook` — pico de erros |
| AL-03 | Certificado expira em < 14 dias | E-mail diário | Verificar renovação automática |
| AL-04 | Disco da VPS acima de 80% | E-mail diário | `15-runbook` — disco cheio |
| AL-05 | Coleta da série externa falhando há > 3 dias | E-mail | `15-runbook` — fonte indisponível |
| AL-06 | Valor da série em cache com > 30 dias | E-mail | Idem, com aviso já visível ao usuário |
| AL-07 | Regressão de LCP ou CLS além do SLO por 24h | E-mail | Investigar; suspeita primária é o anúncio |
| AL-08 | Pipeline falhando na branch principal | Push | Corrigir antes de qualquer outra tarefa |
| AL-09 | Vulnerabilidade crítica em dependência | E-mail | `07-security` §8 |
| AL-10 | Pico anômalo de `erro_vigencia` | E-mail semanal | Avaliar estender cobertura de vigência |
| AL-11 | **Queda abrupta de receita sem queda de tráfego** | E-mail | Suspeita de suspensão da conta de anúncio — `15-runbook` |
| AL-12 | Lembrete de auditoria trimestral | Agenda | `12-test-plan` §11 |

**AL-12 é um alerta de calendário, não de sistema.** É o mais importante da lista, porque a falha que ele previne — parâmetro desatualizado silenciosamente — é a única que não gera erro, não gera queda de métrica e não é percebida por ninguém até que um usuário confie em um número errado.

## 7. Painéis

| Painel | Conteúdo | Frequência |
|---|---|---|
| Saúde | Disponibilidade, taxa de erro, Web Vitals, estado do pipeline | Diária |
| Produto | North Star, sessões, sessões por calculadora, profundidade, cliques em fonte | Semanal |
| Aquisição | Orgânico por rota, termos, páginas de entrada | Semanal |
| Receita | Receita, RPM por categoria, receita por sessão | Mensal |
| Manutenção | Idade dos parâmetros, data da última auditoria, vulnerabilidades abertas | Mensal |

O painel de manutenção é o menos glamouroso e o que protege `M-3`.

## 8. Custo monitorado

Sem IA e sem custo variável de infraestrutura, há apenas dois números a acompanhar:

| Item | Acompanhamento |
|---|---|
| Custo mensal de infraestrutura | Deve permanecer ≤ R$ 10 (`RNF-013`) |
| **Tempo de manutenção em horas por trimestre** | Testa HIP-04 e é o limite real de crescimento do catálogo |

O segundo é o único "custo" que importa neste projeto e não aparece em nenhuma fatura. Registrá-lo manualmente a cada auditoria é o que permitirá decidir, com dado, se o catálogo pode crescer.
