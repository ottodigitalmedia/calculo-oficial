---
doc: ADR-005
projeto: Cálculo Aberto
versao: 1.0
status: aprovado
depende_de: [07-security, 14-observability]
---

# ADR-005 — Análise de uso autohospedada e sem cookie

## Contexto

O projeto precisa medir a North Star — cálculos com a memória expandida — e o tráfego orgânico, para testar HIP-01 e HIP-02. Sem isso, não há como decidir no marco M-5.

Duas restrições limitam a escolha:

1. **`RN-030` e `RN-031`.** Nenhum valor digitado pode ser transmitido. A query string contém salário e dados de contrato, então nem o identificador de página pode ser enviado com ela.
2. **Coerência de discurso.** Um produto que promete não coletar dados do usuário e carrega uma plataforma de rastreamento de terceiros por padrão contradiz a própria promessa no primeiro carregamento.

## Opções consideradas

**A. Plataforma de análise gratuita hospedada por terceiro.** Sem custo direto, recursos abundantes, familiar. Exige cookie e consentimento próprio; envia a URL completa por padrão, o que **viola R-2 de `06-api-spec`** salvo com configuração cuidadosa; e transfere dados de navegação a um terceiro cujo modelo de negócio é dado.

**B. Nenhuma análise.** Máxima coerência com a promessa. Torna a decisão de M-5 impossível: o produto não saberia se HIP-01 e HIP-02 foram confirmadas ou refutadas, e a alternativa seria decidir por intuição.

**C. Ferramenta autohospedada, sem cookie, na mesma infraestrutura.**

## Decisão

**Opção C.** Análise autohospedada na própria VPS, em subdomínio, sem cookie e sem identificador persistente.

| # | Regra |
|---|---|
| AN-1 | Identificador de página é sempre a rota **sem query string** (R-2) |
| AN-2 | Eventos contêm apenas identificador de calculadora e nome do evento (`14-observability` §4.3) |
| AN-3 | Sem cookie e sem identificador persistente entre sessões |
| AN-4 | Único evento que transmite entrada do usuário é `busca_sem_resultado`, exceção registrada e declarada na política de privacidade |
| AN-5 | Falha da ferramenta não afeta a aplicação em nada |
| AN-6 | Verificado por TC-042 a cada deploy |

## Consequências positivas

- **Dispensa consentimento para a análise.** Sem cookie e sem identificador persistente, o tratamento se apoia em legítimo interesse — o banner só existe por causa do anúncio, não da medição.
- Dado de navegação não sai da infraestrutura própria.
- Coerência entre o que o produto promete e o que ele carrega.
- Custo marginal zero: roda no contêiner ao lado, na VPS que já existe.
- Peso de script menor, o que ajuda `RNF-001` e `RNF-004`.

## Consequências negativas

- **Cria a única dependência de banco de dados da infraestrutura.** Não é da aplicação, mas existe: precisa de backup, ocupa disco e pode saturar recurso na mesma VPS. É o item que mais aproxima a arquitetura de contradizer `ADR-002`, e por isso está registrado explicitamente.
- Recursos analíticos mais limitados: sem funil elaborado, sem coorte, sem atribuição multitoque.
- Sem identificador persistente, não há medição de retorno do usuário ao longo do tempo — perda aceita e coerente.
- Manutenção da ferramenta é responsabilidade do mantenedor: atualização, disponibilidade, retenção.
- Se a VPS cair, perde-se a medição do período. Aceitável: é o único dado do sistema cuja perda é tolerada (`13-deployment` §8.1).

## Custo de reversão

**Baixo.** Trocar por outra ferramenta significa substituir um script e reconfigurar eventos — de 0,5 a 1 dia-dev. O histórico não migra, mas o valor da medição está na tendência a partir do lançamento, não no arquivo.

**Gatilho de revisão:** se a ferramenta consumir recurso a ponto de degradar `RNF-001` na VPS compartilhada, movê-la para fora ou substituí-la. A aplicação tem precedência sobre a medição.
