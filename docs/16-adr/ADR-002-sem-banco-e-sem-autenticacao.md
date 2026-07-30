---
doc: ADR-002
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [00-product-brief, 04-architecture]
---

# ADR-002 — Sem banco de dados e sem autenticação

## Contexto

A stack padrão do projeto prevê Postgres gerenciado, ORM e provedor de autenticação. Para este produto, é preciso decidir se esses componentes entram no v1.

Fatos que orientam a decisão:

- A monetização é exclusivamente por anúncio. Não há pagamento, plano nem cliente a identificar.
- O público primário é anônimo, chega por busca, permanece menos de dois minutos e não se cadastraria.
- Nenhuma das dez calculadoras do v1 exige estado persistido para funcionar.
- O produto trata dados sensíveis por natureza: salário, dependentes, datas de contrato.
- O mantenedor é uma pessoa, e cada componente adicional é manutenção que ela paga sozinha.

## Opções consideradas

**A. Stack completa desde o início.** Banco, ORM, autenticação e conta opcional. Prepara o terreno para funcionalidades futuras. Custo: aproximadamente uma semana do MVP em infraestrutura sem usuário, mais backup, migração, superfície de ataque e obrigações de LGPD sobre dado sensível — tudo isso antes de existir qualquer evidência de que alguém quer uma conta.

**B. Banco sem autenticação.** Permitiria registrar cálculos anonimamente. Resolveria pouco e criaria o pior dos mundos: armazenar dado sensível sem ter a quem atribuí-lo, sem função de produto que o justifique.

**C. Nenhum dos dois.** Cálculo no cliente, parâmetros no bundle, estado do formulário na URL.

## Decisão

**Opção C.** Sem banco de dados na aplicação, sem autenticação, sem sessão, sem persistência de dado do usuário.

A necessidade de "salvar o cálculo" é atendida pelo permalink (`RF-006`): o estado do formulário vive na query string, e a URL é copiável, compartilhável e salvável nos favoritos. É a mesma função, entregue sem infraestrutura.

O banco presente no diagrama de `04-architecture` serve exclusivamente à ferramenta de análise de uso e não é dependência da aplicação.

## Consequências positivas

- **A promessa de privacidade deixa de ser política e passa a ser propriedade técnica.** Não existe lugar onde o dado do usuário possa vazar de um banco, porque não existe banco.
- Elimina backup de dado de usuário, migração de schema, superfície de injeção, gestão de sessão e a maior parte das obrigações de LGPD.
- Reduz o custo de infraestrutura ao custo marginal de servir conteúdo estático.
- Elimina latência de rede do caminho crítico. `RNF-005` decorre da arquitetura, não de otimização.
- Libera aproximadamente uma semana do cronograma para o que diferencia o produto.
- O produto continua funcionando com o servidor de análise fora, com o anúncio bloqueado e sem rede após o primeiro carregamento.

## Consequências negativas

- Nenhuma funcionalidade que dependa de estado é possível: histórico, favoritos, comparação entre cálculos salvos, notificação de mudança de lei.
- **Assinatura é impossível sem reverter esta decisão.** Registrado explicitamente, porque foi avaliado e adiado por falta de viabilidade no curto prazo.
- A URL de compartilhamento contém dados sensíveis em texto claro. Mitigado em `07-security` §4.3.
- O usuário perde o cálculo se fechar a aba sem salvar a URL. Mitigado pela orientação de compartilhamento.
- Não há como medir comportamento individual ao longo do tempo. Aceito: é coerente com a promessa.

## Custo de reversão

**Baixo.** Estimativa de 5 a 8 dias-dev para adicionar Postgres, autenticação e persistência de cálculo.

O motor de cálculo não muda uma linha, porque é puro e não conhece persistência (`ADR-003`). O modelo de dados já está descrito em termos relacionais em `05-data-model`. A reversão é adição, não reescrita.

**Gatilho de reversão:** confirmação de HIP-02 combinada com demanda observável por histórico — medida por volume de compartilhamentos por URL e por pedidos no canal de contato. Nunca por suposição.
