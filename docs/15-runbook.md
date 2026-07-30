---
doc: 15-runbook
projeto: Cálculo Aberto
versao: 1.0
status: draft
depende_de: [13-deployment, 14-observability]
---

# Runbook

Um procedimento por incidente provável. Formato fixo: **sintoma → diagnóstico → ação → verificação → escalonamento.**

Escrito para ser lido às 23h por uma pessoa cansada que não lembra da arquitetura.

## Índice por gravidade

| Gravidade | Incidentes |
|---|---|
| **P0 — corrigir agora** | RB-01 aplicação fora do ar · RB-06 parâmetro legal incorreto · RB-07 suspeita de vazamento |
| **P1 — corrigir hoje** | RB-02 pico de erros · RB-08 dependência comprometida · RB-09 acesso comprometido |
| **P2 — corrigir esta semana** | RB-03 site lento · RB-04 fonte externa indisponível · RB-05 certificado · RB-10 disco cheio · RB-11 receita interrompida |

---

## RB-01 · Aplicação fora do ar — P0

**Sintoma.** AL-01 disparou. O site não responde ou retorna erro 5xx.

**Diagnóstico, nesta ordem:**

1. O domínio resolve? Se não, o problema é DNS — vá para o passo 5.
2. A VPS responde a ping e a acesso remoto? Se não, o problema é o provedor — passo 6.
3. O contêiner da aplicação está em execução? Se não — passo 7.
4. O contêiner está em ciclo de reinício? Se sim, ler os últimos registros — passo 8.

**Ação:**

| Passo | Situação | O que fazer |
|---|---|---|
| 5 | DNS não resolve | Conferir registro no provedor de domínio; propagação leva até 24h após alteração recente |
| 6 | VPS inacessível | Verificar o painel do provedor; se for falha do provedor, aguardar e comunicar; se for esgotamento de recurso, reiniciar |
| 7 | Contêiner parado | Subir pelo EasyPanel; se não subir, ver registros do último deploy |
| 8 | Ciclo de reinício | Quase sempre é o último deploy. **Reimplantar a etiqueta anterior** (`13-deployment` §9) |
| 9 | Nada acima resolve | Reconstruir em ambiente novo pelo procedimento de restauração (`13-deployment` §8.1) |

**Verificação.** Página inicial retorna 200. Uma calculadora abre e calcula. Rota de saúde responde. AL-01 encerra.

**Escalonamento.** Acima de 30 min sem causa identificada, executar a restauração completa em vez de continuar diagnosticando. Restaurar leva menos tempo que investigar, e não há dado a perder.

---

## RB-02 · Pico de erros — P1

**Sintoma.** AL-02 disparou.

**Diagnóstico.**

1. Agrupar os erros na ferramenta: é um erro repetido ou vários distintos?
2. Correlacionar com o horário do último deploy.
3. Identificar se ocorre em uma calculadora só ou em todas.
4. Identificar o tipo: falha no motor, falha de renderização, ou falha de script de terceiro.

**Ação:**

| Causa | Ação |
|---|---|
| Erro do motor em uma calculadora | Reproduzir localmente com as entradas indicadas. **Nota: o relatório não contém os valores** — reproduzir a partir da rota e da pilha. Corrigir, adicionar caso-ouro, publicar |
| Erro em todas após deploy | Reimplantar a etiqueta anterior; investigar sem pressa |
| Erro originado em script de terceiro | Verificar se é o anúncio. Se estiver quebrando o produto, **remover o anúncio** e reintroduzir depois |
| Erro de vigência (`RN-003`) em volume | Não é defeito: é demanda. Registrar e avaliar estender a cobertura de parâmetros |

**Verificação.** Taxa de erro volta abaixo de 0,1%.

**Escalonamento.** Se a causa for o motor e a correção não for evidente, **desabilitar a calculadora afetada** — exibir mensagem de manutenção — em vez de manter no ar produzindo resultado potencialmente errado. Uma calculadora indisponível é um inconveniente; uma calculadora errada é o dano que o projeto existe para evitar.

---

## RB-03 · Site lento ou métricas degradadas — P2

**Sintoma.** AL-07 disparou; LCP ou CLS fora do SLO.

**Diagnóstico.**

1. É todo o site ou uma rota?
2. Coincide com o deploy do anúncio ou com mudança de configuração dele?
3. O tamanho do bundle cresceu? Comparar com o orçamento de TC-051.
4. A VPS está com CPU ou memória saturadas?

**Ação:**

| Causa | Ação |
|---|---|
| Anúncio (causa mais provável) | Conferir altura reservada do slot; conferir se o formato mudou. Se não houver ajuste que recupere o SLO, **remover o anúncio** (`11-roadmap` F-6) |
| Bundle cresceu | Identificar a dependência responsável; avaliar carregamento sob demanda |
| VPS saturada | Verificar concorrência com a ferramenta de análise; se persistir, colocar CDN à frente |
| Muitas vigências carregadas | Aplicar o gatilho de §7 de `05-data-model` |

**Verificação.** Métricas reais voltam ao SLO em 48h.

---

## RB-04 · Fonte externa de série indisponível — P2

**Sintoma.** AL-05 ou AL-06 disparou.

**Diagnóstico.** Confirmar que o serviço está fora, e não que o identificador da série ou o endereço mudaram. Testar manualmente uma requisição.

**Ação:**

| Causa | Ação |
|---|---|
| Serviço temporariamente fora | Nenhuma. `RN-032` já cobre: o cache está em uso e o usuário vê a data do valor |
| Endereço ou formato mudou | Ajustar a integração; a validação por schema já impediu que dado inválido entrasse |
| Fora por mais de 30 dias | O aviso de `RN-033` já aparece ao usuário. Avaliar fonte alternativa oficial |

**Verificação.** Uma coleta bem-sucedida no pipeline; idade do valor volta a zero.

**Nota importante.** Este incidente **não afeta nenhum cálculo**. Afeta apenas a sugestão de taxa em CALC-022, e o usuário pode digitar o valor. É P2 por isso, apesar de gerar alerta.

---

## RB-05 · Certificado expirando ou expirado — P2 (P0 se já expirou)

**Sintoma.** AL-03 disparou, ou navegadores exibem aviso de segurança.

**Diagnóstico.** Verificar a data de validade e se a renovação automática está ativa no EasyPanel.

**Ação.** Forçar renovação pelo painel. Se falhar: confirmar que a porta 80 está acessível para o desafio de validação, e que o DNS aponta corretamente. Se ainda falhar, emitir manualmente.

**Verificação.** Certificado válido por mais de 60 dias; site abre sem aviso.

**Prevenção.** Certificado expirado é uma das falhas mais comuns em VPS autogerida e derruba o site inteiro. A verificação de `13-deployment` §7 existe para isso.

---

## RB-06 · Parâmetro legal incorreto em produção — P0

**Sintoma.** Divergência encontrada na auditoria, ou reportada por usuário, ou detectada em conferência contra fonte oficial.

**Este é o incidente mais grave do sistema.** Não derruba nada, não gera alerta automático e pode passar despercebido por meses — e é o único que causa dano real a pessoas.

**Diagnóstico:**

1. Confirmar a divergência contra a **fonte oficial**, não contra outro site.
2. Determinar qual vigência está incorreta e desde quando está publicada.
3. Determinar quais calculadoras usam esse parâmetro.
4. Estimar a exposição: volume de cálculos naquelas calculadoras no período.

**Ação:**

| # | Passo |
|---|---|
| 1 | Corrigir o valor. **Não reverter o commit** — corrigir para a frente (`13-deployment` §9) |
| 2 | Adicionar o caso-ouro que teria detectado o erro |
| 3 | Confirmar que os casos-ouro das demais vigências continuam passando (MG-2) |
| 4 | Publicar |
| 5 | Executar um cálculo de conferência em produção |
| 6 | Registrar em `17-changelog`, seção de correções de parâmetro: o que estava errado, desde quando, quais calculadoras, qual a correção |
| 7 | Se a exposição for relevante, publicar aviso na página de aviso legal |
| 8 | Revisar por que a auditoria não detectou antes e ajustar a cobertura de casos-ouro |

**Verificação.** Casos-ouro novos e antigos passam. Cálculo em produção bate com a fonte oficial. Changelog atualizado.

**Escalonamento.** Se a divergência afetar mais de uma calculadora ou mais de uma vigência, **desabilitar as calculadoras afetadas** até a correção. `M-3` tem tolerância zero.

---

## RB-07 · Suspeita de vazamento de dado do usuário — P0

**Sintoma.** TC-040 a TC-043 falharam; ou inspeção manual encontrou valor de campo saindo do navegador; ou relatório externo.

**Ação imediata, antes de qualquer diagnóstico:**

1. **Remover o script de anúncio de produção** (`07-security` §12). É a origem mais provável e a mais fácil de eliminar.
2. Publicar.
3. Confirmar que TC-040 volta a passar sem o anúncio.

**Diagnóstico, depois de estancar:**

| Suspeita | Como verificar |
|---|---|
| Anúncio (AM-02) | Reintroduzir em ambiente isolado com TC-043 ativo |
| Ferramenta de erro mal configurada (AM-04) | Revisar E-1 a E-5 de `14-observability` |
| Análise de uso | Inspecionar o payload dos eventos |
| Dependência comprometida (AM-01) | Ver RB-08 |

**Ação de correção.** Corrigir a configuração; adicionar caso específico a TC-040; solicitar expurgo ao provedor que recebeu os dados; só então reintroduzir o componente.

**Verificação.** Toda a suíte de vazamento passa, com o componente reintroduzido.

**Comunicação.** Publicar no changelog e na página de aviso legal: o que ocorreu, o período, quais dados, a correção. Em um produto cuja tese é confiabilidade, ocultar custa mais que o incidente.

---

## RB-08 · Dependência comprometida — P1

**Sintoma.** AL-09 disparou, ou aviso público sobre pacote em uso.

**Diagnóstico.** Identificar a versão afetada, se ela está no arquivo de trava, e se executa no cliente ou apenas no build. Dependência que executa no cliente e toca dado do usuário é P0, não P1.

**Ação.** Reverter para a última versão conhecida como íntegra; se não houver, remover a dependência ou substituí-la; reconstruir a partir de ambiente limpo; rotacionar segredos se a dependência rodava no CI com acesso a eles; executar TC-040 a TC-043.

**Verificação.** Auditoria de dependências limpa; suíte completa verde.

**Nota.** O motor de cálculo tem zero dependência de runtime (`ADR-003`). A parte do sistema que toca dado do usuário não tem cadeia a comprometer — este incidente atinge apenas a periferia.

---

## RB-09 · Acesso comprometido — P1

**Sintoma.** Acesso não reconhecido ao repositório, à VPS ou aos painéis; commit que ninguém fez.

**Ação:**

1. Rotacionar **todas** as credenciais: chaves de acesso, segredos do repositório, tokens de registro, senhas de painel.
2. Revogar sessões ativas em todos os serviços.
3. Auditar o histórico do repositório, com atenção especial a **commits de parâmetro** — é o vetor de maior dano (AM-05).
4. Reconstruir e reimplantar a partir de commit verificado.
5. Ativar segundo fator onde ainda não estiver ativo.

**Verificação.** Nenhum acesso não reconhecido; histórico auditado; casos-ouro passando, o que confirma integridade dos parâmetros.

---

## RB-10 · Disco cheio na VPS — P2

**Sintoma.** AL-04 disparou.

**Diagnóstico.** Identificar o consumo. Suspeitos habituais, em ordem: imagens de contêiner antigas, registros de log sem rotação, banco da ferramenta de análise.

**Ação.** Remover imagens além das 10 últimas etiquetas; confirmar rotação de registros; se for o banco da análise, aplicar a retenção de 12 meses de `07-security` §11.3.

**Verificação.** Uso abaixo de 70%.

**Prevenção.** Limpeza automática de imagens antigas e rotação de registro configuradas de uma vez, para que este incidente não retorne.

---

## RB-11 · Receita interrompida — P2

**Sintoma.** AL-11 disparou: receita caiu sem queda de tráfego.

**Diagnóstico.**

1. A conta de anúncio está ativa ou foi suspensa?
2. O script está carregando em produção?
3. A plataforma de consentimento mudou de comportamento e está bloqueando?
4. O slot está vazio por falta de anunciante ou por erro?

**Ação:**

| Causa | Ação |
|---|---|
| Conta suspensa | Ler o motivo no painel; corrigir o que for apontado; recorrer. **Não** contornar a política |
| Script não carrega | Verificar a política de segurança de conteúdo — origem nova do provedor pode estar sendo bloqueada (`07-security` §5) |
| Consentimento bloqueando | Verificar a configuração da plataforma |
| Sem anunciante | Nenhuma ação técnica |

**Verificação.** Receita retoma o patamar anterior.

**Nota de prioridade.** É P2, e não P1, porque não afeta nenhum usuário. O produto funciona integralmente sem anúncio. Tratar interrupção de receita como emergência é o começo do caminho que leva ao produto que este projeto critica.

---

## Contatos e acessos

| Recurso | Onde |
|---|---|
| Provedor de VPS | Painel do provedor |
| Registro de domínio | Painel do registrador |
| Repositório | Provedor de hospedagem de código |
| Ferramenta de erro | Painel próprio |
| Análise de uso | Subdomínio próprio |
| Rede de anúncio | Painel próprio |

> ⚠️ VERIFICAR: preencher com os endereços reais antes do lançamento. Runbook com endereço genérico não serve durante um incidente.
