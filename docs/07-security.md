---
doc: 07-security
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: [04-architecture, 06-api-spec]
---

# Segurança e Privacidade

## 1. Modelo de ameaça

A superfície de ataque deste produto é atipicamente pequena, e isso é resultado de decisão arquitetural, não de sorte.

**O que não existe e, por isso, não pode ser atacado:** banco de dados, autenticação, sessão, upload de arquivo, formulário que grava, painel administrativo, chave de API com privilégio, dado pessoal armazenado.

**O que resta como ameaça real:**

| ID | Ameaça | Impacto | Probabilidade |
|---|---|---|---|
| AM-01 | Comprometimento da cadeia de dependências (pacote malicioso) capturando dados digitados | **Crítico** — quebra a promessa central do produto | Baixa |
| AM-02 | Script de terceiro (anúncio) coletando o conteúdo dos formulários | **Crítico** | Média |
| AM-03 | Comprometimento do acesso à VPS ou ao repositório | Alto | Baixa |
| AM-04 | Vazamento de valores digitados por telemetria ou registro de erro mal configurado | Alto | **Média** |
| AM-05 | Adulteração de parâmetro legal por commit malicioso ou acidental | Alto | Baixa |
| AM-06 | Ataque de negação de serviço na VPS | Médio | Baixa |
| AM-07 | Clonagem do site em domínio semelhante, com anúncio agressivo | Médio | Média |

**AM-02 e AM-04 são os riscos dominantes.** Ambos vazam salário, dependentes e dados de contrato do usuário — exatamente o que o produto promete não coletar. Ambos vêm de dentro, por descuido, não de um invasor externo.

## 2. Autenticação e sessão

**Não há.** Todo acesso é anônimo. Não existe conta, sessão, token ou cookie de identificação.

**Consequência para o futuro:** qualquer introdução de autenticação exige revisão completa deste documento e reversão consciente de `ADR-002`. A ausência de autenticação não é um vazio a ser preenchido: é uma propriedade de segurança do sistema.

## 3. Matriz de autorização

| Recurso | Anônimo | Mantenedor |
|---|---|---|
| Todas as rotas EP-001 a EP-015 | Leitura | Leitura |
| EP-016 `/api/health` | Leitura | Leitura |
| Executar cálculo | Sim | Sim |
| Alterar parâmetro legal | **Não** | Via commit revisado no repositório |
| Publicar deploy | **Não** | Via automação, disparada por commit na branch principal |
| Acessar painel de análise de uso | **Não** | Autenticação própria da ferramenta, em subdomínio separado |
| Acessar painel de erros | **Não** | Autenticação própria da ferramenta |

A matriz tem duas colunas porque o sistema tem dois papéis, e um deles não interage com a aplicação em produção — interage com o repositório. Toda alteração de estado do sistema passa por commit, e commit é auditável.

## 4. Proteção do dado do usuário

Esta é a seção central do documento, porque é a promessa do produto.

### 4.1 Regra fundamental

**RN-030.** Nenhum valor digitado pelo usuário deixa o navegador. Nunca, por nenhum caminho.

### 4.2 Controles que implementam a regra

| # | Controle | Onde |
|---|---|---|
| C-01 | Cálculo executa integralmente no cliente; não há endpoint que receba dado de formulário | Arquitetura |
| C-02 | Ferramenta de erro configurada para remover query string, corpo de requisição e conteúdo de campos antes do envio | Configuração de INT-004 |
| C-03 | Eventos de análise contêm apenas identificador de calculadora e tipo de interação — nunca valores | Configuração de INT-005 |
| C-04 | Identificador de página reportado é a rota sem query string (regra R-2) | Camada de análise |
| C-05 | Política de segurança de conteúdo restringe destinos de conexão a uma lista explícita | Cabeçalhos HTTP |
| C-06 | Scripts de terceiro carregam em contexto isolado sempre que o provedor permitir | Camada de anúncio |
| C-07 | Teste automatizado que preenche formulário, captura todo o tráfego de saída e **falha se qualquer valor digitado aparecer** | `12-test-plan` |

**C-07 é o controle mais importante do documento.** É o único que transforma a promessa em verificação executável e que detecta regressão introduzida por dependência atualizada ou por mudança de configuração de terceiro.

### 4.3 Tratamento da query string

A query string contém dados sensíveis (`RF-006`). Controles:

- Nunca enviada a terceiros (R-2).
- Página com query string recebe `noindex`, para não ser indexada com dados de alguém.
- `Referrer-Policy: strict-origin-when-cross-origin`, de modo que a query não vaze no cabeçalho de referência ao clicar em anúncio ou link externo.
- Aviso no compartilhamento: "O link contém os valores que você preencheu. Compartilhe apenas com quem você quer que veja esses dados."

## 5. Cabeçalhos de segurança

| Cabeçalho | Valor | Ameaça mitigada |
|---|---|---|
| `Content-Security-Policy` | Lista explícita de origens; `connect-src` restrito | AM-01, AM-02, AM-04 |
| `Strict-Transport-Security` | Ativo, com subdomínios | Interceptação |
| `X-Content-Type-Options` | `nosniff` | Confusão de tipo |
| `X-Frame-Options` | `DENY` | Sobreposição de clique |
| `Referrer-Policy` | **`strict-origin`** | Vazamento de query string |
| `Permissions-Policy` | Nega câmera, microfone, geolocalização, sensores | Excesso de permissão de terceiro |

**Correção de `Referrer-Policy` no T-107.** A tabela pedia `strict-origin-when-cross-origin` e declarava como ameaça mitigada o vazamento de query string. **Esse valor não mitiga essa ameaça neste produto**: ele preserva a URL completa nas requisições de mesma origem, e aqui todas as requisições de recurso são de mesma origem.

O efeito real, encontrado por TC-040: ao digitar o salário, `replaceState` o coloca na query (`RF-006`); a partir daí, cada prefetch e cada pedaço de JavaScript sai com `Referer: /calculadora/salario-liquido?salarioBruto=…`. O salário chegava ao registro de acesso do servidor — que §11 descreve como contendo apenas IP, página e horário.

`strict-origin` envia só a origem, inclusive para nós mesmos. Nenhuma query viaja em cabeçalho, e os links para as normas oficiais continuam sabendo de onde vieram. Verificado por `referersComCaminho` em `tests/leak/vazamento.spec.ts`, com prova de mutação: revertendo o valor, o teste reprova.

**Estado dos demais.** `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy` entraram junto, em `next.config.ts`. `Content-Security-Policy` continua adiada por depender das origens do provedor de anúncio.

**`Strict-Transport-Security` ativado em 31/07/2026**, com `max-age=31536000; includeSubDomains`. A condição de `13-deployment` §7 — TLS estável — foi satisfeita por evidência: o certificado foi substituído sozinho em 30/07/2026, sem intervenção.

**Sem `preload`, por decisão.** A lista de pré-carga é porta de mão única: a remoção leva meses e depende do navegador, não de nós. Ela exige, além disso, que `www` responda em HTTPS, e `www.calculoficial.com.br` ainda não é servido. Enquanto o domínio não estiver completo, `preload` compra risco irreversível por uma proteção que só vale para a **primeira** visita de quem nunca esteve no site.

**Verificação.** `tests/e2e/cabecalhos.spec.ts` mede o que o servidor de produção envia — não o que o `next.config.ts` declara — em uma rota estática, uma de calculadora e uma de API. A asserção é de valor exato: `max-age` zerado, ou `includeSubDomains` perdido numa edição, deixa o cabeçalho presente e a proteção ausente, que é o formato preferido de regressão silenciosa. Um teste separado reprova se `preload` aparecer.

> ⚠️ VERIFICAR: a rede de anúncio exigirá origens adicionais na política de conteúdo. Levantar a lista exata na documentação do provedor e **não** recorrer a curinga como atalho — curinga na política anula a proteção contra AM-02, que é a ameaça mais provável do sistema.

## 6. Gestão de segredos

| Segredo | Onde vive | Onde nunca vai |
|---|---|---|
| Chave de deploy | Segredo do repositório | Código, imagem de contêiner |
| Credencial do painel de erros | Segredo do repositório | Bundle do cliente |
| Credencial do banco do Umami | Variável do contêiner, na VPS | Repositório |
| Acesso à VPS | Chave assimétrica, sem senha | — |

**Regras:** nenhum segredo no repositório, mesmo em arquivo de exemplo; `.env.example` contém apenas nomes e comentários; identificador público da rede de anúncio não é segredo e pode ficar no código; verificação automatizada de segredo vazado roda no CI.

## 7. Validação de entrada

Sem servidor, a validação protege o próprio usuário contra resultado incorreto, não o sistema contra invasão.

| Origem | Validação |
|---|---|
| Formulário | Schema tipado por calculadora, conforme `03-functional-spec` §1.3 |
| Query string | Mesmo schema; valor inválido cai no padrão com aviso (§2.3 de `06-api-spec`) |
| Conteúdo MDX | Renderização sem HTML arbitrário; componentes permitidos em lista explícita |
| Resposta da fonte externa | Schema + verificação de intervalo plausível (§4.2 de `06-api-spec`) |

**Nota sobre MDX:** é o único caminho pelo qual conteúdo se transforma em marcação renderizada. Como o conteúdo vem do próprio repositório, o risco é baixo — mas a lista explícita de componentes permitidos evita que uma dependência de conteúdo introduza execução inesperada.

## 8. Cadeia de dependências (AM-01)

O risco mais grave e o menos visível.

| Controle | Prática |
|---|---|
| Fixação de versão | Arquivo de trava obrigatório e versionado |
| Auditoria automatizada | Verificação de vulnerabilidade conhecida no CI; falha bloqueia deploy |
| Atualização | Revisão manual do diff em dependência que executa no cliente |
| Minimalismo | O motor de cálculo tem **zero dependência de runtime** — a parte que toca dado do usuário não tem cadeia a comprometer |
| Verificação de saída | C-07 detecta exfiltração independentemente de qual dependência a introduziu |

O motor sem dependência é uma decisão de segurança, não apenas de portabilidade (`ADR-003`).

## 9. Integridade do parâmetro legal (AM-05)

Adulterar um parâmetro produz cálculo errado em escala — o dano de maior alcance possível neste produto, e ele não exige invasor: um erro de digitação basta.

| Controle | Efeito |
|---|---|
| Validação de schema no build | Formato inválido não passa |
| Verificação de sobreposição e lacuna | Vigência inconsistente não passa (`V-1`, `FX-1`) |
| Restrição de domínio oficial na fonte | Fonte não oficial não passa (regra F-1) |
| Casos-ouro bloqueadores | Alteração que muda resultado conhecido não passa |
| Convenção de commit | Alteração sem fonte declarada não passa |
| Histórico imutável | Quem, quando e por quê ficam registrados |

## 10. Proteção contra abuso e negação de serviço

Não há limitação de taxa por usuário: não há operação cara no servidor a proteger. Conteúdo estático, com todo o custo no cliente.

Contra AM-06: proxy com limitação de conexões por origem; se a VPS se tornar alvo recorrente, colocar CDN à frente — mudança de infraestrutura, sem alteração de código.

## 11. LGPD

### 11.1 Dado pessoal tratado

| Dado | Tratado? | Observação |
|---|---|---|
| Valores digitados (salário, datas, dependentes) | **Não** | Permanecem no dispositivo; o produto não tem acesso |
| Nome, e-mail, telefone, documento | **Não** | Não são solicitados em nenhum ponto |
| Endereço IP | Indiretamente | Registro do servidor e da ferramenta de análise |
| Identificador publicitário | Sim, se consentido | Tratado pela rede de anúncio, na condição de controladora própria |
| Cookies | Somente os da rede de anúncio, após consentimento | A análise de uso não usa cookie |

### 11.2 Bases legais

| Tratamento | Base legal |
|---|---|
| Registro técnico de servidor | Legítimo interesse — segurança e operação |
| Análise de uso agregada e sem cookie | Legítimo interesse |
| Publicidade personalizada | **Consentimento**, coletado antes de qualquer carregamento |
| Mensagem enviada pelo formulário de contato | Consentimento, no ato do envio |

### 11.3 Retenção

| Dado | Retenção |
|---|---|
| Valores digitados | Não retidos |
| Registro de servidor | 30 dias |
| Análise agregada | 12 meses |
| Registro de erro | 30 dias |
| Mensagem de contato | 12 meses |

### 11.4 Direitos do titular

Sem cadastro, não há base de titulares a consultar. Ainda assim, o canal de contato atende pedidos de acesso, correção e eliminação, e a política de privacidade explica de forma direta que o produto **não guarda os dados do cálculo** — o que responde, de antemão, à maior parte dos pedidos.

**Portabilidade:** o usuário já a possui pela URL do cálculo (`RF-006`), que carrega o cenário completo e é exportável por copiar e colar.

### 11.5 Operadores

| Terceiro | Papel | Dado |
|---|---|---|
| Provedor de VPS | Operador | Registro de servidor |
| Rede de anúncio | **Controlador próprio** | Identificador publicitário, após consentimento |
| Ferramenta de erro | Operador | Registro técnico sem dado de formulário |
| Fonte de série econômica | Nenhum | Não recebe dado de usuário |

## 12. Resposta a incidente

| Incidente | Ação imediata | Procedimento |
|---|---|---|
| Suspeita de captura de dado por terceiro (AM-02) | **Remover o script de anúncio em produção**, antes de investigar | `15-runbook` |
| Dependência comprometida (AM-01) | Reverter para a versão anterior conhecida; auditar o que a versão comprometida acessava | `15-runbook` |
| Vazamento por telemetria (AM-04) | Desativar a integração; solicitar expurgo ao provedor; corrigir configuração; adicionar caso ao teste C-07 | `15-runbook` |
| Comprometimento de acesso (AM-03) | Rotacionar todas as credenciais; auditar commits recentes de parâmetro | `15-runbook` |
| Parâmetro incorreto em produção (AM-05) | Corrigir, publicar, registrar no changelog, adicionar caso-ouro | §6 de `05-data-model` |

**Comunicação.** Incidente que envolva dado de usuário é comunicado publicamente na página de aviso legal e no changelog, com o que ocorreu, o período de exposição e a correção. Em um produto cuja tese é confiabilidade, ocultar incidente custa mais do que o incidente.
