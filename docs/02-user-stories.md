---
doc: 02-user-stories
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: [01-prd]
---

# User Stories

Agrupadas por épico. Cada história rastreia o requisito funcional de origem.

---

## Épico E-1 — Calcular

### US-001 — Obter um resultado `RF-005`

Como pessoa que precisa de um número, quero informar meus dados e ver o resultado imediatamente, para não perder tempo.

- **Dado** que estou em uma calculadora com todos os campos obrigatórios preenchidos de forma válida
- **Quando** termino de digitar o último campo
- **Então** o resultado aparece sem que eu precise clicar em nada, em menos de 50ms

- **Dado** que um campo obrigatório está vazio
- **Quando** os demais estão preenchidos
- **Então** vejo o estado de resultado pendente, com indicação de qual campo falta, e nenhum número parcial é exibido

### US-002 — Ser impedido de entrar com dado inválido `RF-005` `RN-028`

Como usuário leigo, quero ser avisado quando digito algo impossível, para não confiar em um resultado errado.

- **Dado** que informo uma data de admissão posterior à data de desligamento
- **Quando** o campo perde o foco
- **Então** vejo a mensagem de erro específica junto ao campo, o cálculo não é executado e o resultado anterior é limpo

- **Dado** que informo um valor de salário negativo ou não numérico
- **Quando** digito
- **Então** o campo rejeita a entrada e explica o formato esperado

### US-003 — Calcular com a tabela de outro período `RF-004` `RN-002` `RN-003`

Como pessoa que precisa conferir um cálculo antigo, quero escolher a data de referência, para usar a tabela que valia na época.

- **Dado** que altero a data de referência para um período coberto
- **Quando** o cálculo é refeito
- **Então** o resultado usa os parâmetros daquela vigência e a memória de cálculo exibe qual vigência foi aplicada

- **Dado** que escolho uma data anterior à cobertura disponível
- **Quando** confirmo
- **Então** o cálculo é bloqueado e vejo o intervalo de datas disponível — nenhum valor é estimado por extrapolação

### US-004 — Não ser surpreendido por parâmetro desatualizado `RN-029` `RN-033`

Como usuário que não acompanha mudança de lei, quero ver de quando é a tabela usada, para saber se posso confiar.

- **Dado** que um cálculo foi executado
- **Quando** olho o resultado
- **Então** vejo, sem precisar expandir nada, a vigência dos parâmetros aplicados

---

## Épico E-2 — Confiar

### US-005 — Ver o passo a passo `RF-003`

Como pessoa que recebeu um número inesperado, quero ver como ele foi calculado, para conferir contra o meu holerite.

- **Dado** que um resultado foi exibido
- **Quando** aciono a memória de cálculo
- **Então** vejo cada etapa em ordem, com a fórmula, os valores de entrada e o valor de saída de cada uma

- **Dado** que a memória está aberta
- **Quando** reproduzo as etapas manualmente com uma calculadora comum
- **Então** chego exatamente ao mesmo resultado final

### US-006 — Ir até a norma `RF-003` `RN-029`

Como pessoa que quer confirmar a informação, quero chegar ao texto legal, para verificar por conta própria.

- **Dado** que a memória de cálculo exibe um parâmetro legal
- **Quando** aciono o link da fonte
- **Então** sou levado à norma de origem, em nova aba, com identificação do dispositivo

### US-007 — Entender que é estimativa `RF-010` `RN-028`

Como pessoa em situação de tensão, quero saber os limites do que estou vendo, para não tomar decisão indevida.

- **Dado** que um resultado foi exibido
- **Quando** olho a tela
- **Então** vejo, na mesma dobra do resultado, que se trata de estimativa com base nos dados informados

- **Dado** qualquer texto do produto
- **Quando** ele se refere ao resultado
- **Então** não afirma direito nem obrigação de terceiro

### US-008 — Distinguir estimativa de saldo real `RN-023`

Como pessoa calculando FGTS, quero saber que o valor mostrado não é o meu saldo real, para não me frustrar depois.

- **Dado** que não informei o saldo real da conta vinculada
- **Quando** o resultado de FGTS é exibido
- **Então** ele é rotulado como estimativa de depósitos e explica que o saldo real inclui correção

---

## Épico E-3 — Compartilhar e voltar

### US-009 — Compartilhar um cálculo `RF-006`

Como pessoa que quer mostrar o cálculo a outra, quero enviar um link, para não pedir que redigite tudo.

- **Dado** que preenchi um cálculo
- **Quando** copio a URL da barra de endereço
- **Então** ela contém o estado do formulário

- **Dado** que alguém abre essa URL
- **Quando** a página carrega
- **Então** os campos vêm preenchidos e o mesmo resultado é exibido

### US-010 — Retomar depois `RF-006`

Como pessoa interrompida no meio, quero voltar ao meu cálculo, para não recomeçar.

- **Dado** que salvei a URL nos favoritos
- **Quando** a abro em outro momento
- **Então** o cenário é reproduzido, com a mesma data de referência

---

## Épico E-4 — Encontrar e aprender

### US-011 — Encontrar a calculadora certa `RF-007`

Como pessoa que não sabe o nome técnico do que procura, quero buscar por termos comuns, para chegar à ferramenta.

- **Dado** que estou na home
- **Quando** digito um termo do dia a dia na busca
- **Então** vejo as calculadoras correspondentes, com busca funcionando sem nova requisição de rede

### US-012 — Entender o conceito `RF-008`

Como pessoa que não entende o cálculo, quero uma explicação em linguagem comum, para aprender e não só obter um número.

- **Dado** que estou em uma calculadora
- **Quando** rolo além do resultado
- **Então** encontro perguntas frequentes específicas daquele cálculo e o link para o guia completo

- **Dado** que estou lendo um guia
- **Quando** chego ao ponto em que o cálculo é explicado
- **Então** encontro o link direto para a calculadora correspondente

### US-013 — Seguir para o próximo cálculo `RF-007`

Como pessoa que acabou de calcular a rescisão, quero ver o que mais é relevante, para completar meu entendimento.

- **Dado** que um resultado foi exibido
- **Quando** rolo até o fim
- **Então** vejo de duas a quatro calculadoras relacionadas da mesma categoria

---

## Épico E-5 — Privacidade e anúncio

### US-014 — Não ser rastreado sem consentir `RF-009` `RN-030`

Como pessoa que digita meu salário, quero saber que esse dado não sai do meu navegador, para me sentir seguro.

- **Dado** que estou usando qualquer calculadora
- **Quando** inspeciono o tráfego de rede
- **Então** nenhum valor digitado é transmitido

- **Dado** que ainda não decidi sobre consentimento
- **Quando** a página carrega
- **Então** nenhum script de terceiro é executado

### US-015 — Usar o produto com anúncio sem atrapalho `RF-009` `RNF-002`

Como usuário, quero que o anúncio não interfira na leitura do resultado, para conseguir usar a ferramenta.

- **Dado** que consenti com anúncios
- **Quando** a página carrega e o anúncio aparece
- **Então** nenhum conteúdo se desloca — o espaço já estava reservado

- **Dado** que o anúncio está presente
- **Quando** olho a tela
- **Então** ele está abaixo do resultado, nunca acima nem no meio da memória de cálculo

### US-016 — Usar com bloqueador ativo `RNF-007`

Como pessoa que usa bloqueador de anúncios, quero que o site funcione, para não ser punida por isso.

- **Dado** que tenho bloqueador ativo
- **Quando** uso qualquer calculadora
- **Então** cálculo, memória e navegação funcionam integralmente, sem aviso, muro ou degradação

---

## Épico E-6 — Acessibilidade

### US-017 — Operar por teclado `RNF-008`

Como pessoa que não usa mouse, quero navegar e calcular apenas com o teclado, para conseguir usar o produto.

- **Dado** que estou na página de uma calculadora
- **Quando** navego por tabulação
- **Então** todos os campos, o seletor de vigência e a memória de cálculo são alcançáveis, com foco sempre visível

### US-018 — Usar com leitor de tela `RNF-008`

Como pessoa com deficiência visual, quero que o resultado seja anunciado, para saber que o cálculo terminou.

- **Dado** que preenchi os campos
- **Quando** o resultado é atualizado
- **Então** a mudança é anunciada por região dinâmica, sem interromper a digitação

- **Dado** que a memória de cálculo é expandida
- **Quando** navego por ela
- **Então** a estrutura é lida como sequência de etapas, com rótulos que fazem sentido fora do contexto visual

---

## Rastreabilidade

| Épico | Histórias | Requisitos cobertos |
|---|---|---|
| E-1 Calcular | US-001 a US-004 | RF-004, RF-005 |
| E-2 Confiar | US-005 a US-008 | RF-003, RF-010 |
| E-3 Compartilhar | US-009, US-010 | RF-006 |
| E-4 Encontrar | US-011 a US-013 | RF-007, RF-008 |
| E-5 Privacidade e anúncio | US-014 a US-016 | RF-009, RNF-007 |
| E-6 Acessibilidade | US-017, US-018 | RNF-008 |

Requisitos sem história de usuário — são infraestrutura sem interação direta, validados por teste automatizado: `RF-001`, `RF-002`, `RF-011`, `RF-012`.
