# Cálculo Aberto

Calculadoras trabalhistas, tributárias e financeiras para o Brasil, com um diferencial: **cada resultado mostra a conta**.

Toda estimativa vem acompanhada do passo a passo, do parâmetro legal aplicado, da vigência dele e do link para a norma. O usuário pode conferir o número em vez de acreditar nele.

## Arquitetura em 10 linhas

1. Site estático em Next.js, gerado no build, servido por contêiner numa VPS.
2. Todo o cálculo executa no navegador. Não há servidor de aplicação.
3. Não há banco de dados, autenticação ou sessão — nenhum dado do usuário é armazenado.
4. As constantes legais vivem em `src/lib/params/`, versionadas por período de vigência.
5. Todo parâmetro carrega a norma e a URL oficial de origem, verificadas no build.
6. O motor de cálculo é um pacote puro, sem dependência de runtime, em `src/lib/engine/`.
7. Valores monetários são inteiros em centavos; alíquotas, inteiros em basis points.
8. Toda função do motor devolve o resultado e o traço que alimenta a memória de cálculo.
9. O estado do formulário vive na URL, o que permite compartilhar um cálculo sem conta.
10. Casos-ouro conferidos contra fonte oficial bloqueiam o deploy.

## Requisitos

Node 20 ou superior · npm · Docker (apenas para build de imagem)

## Instalação

```bash
git clone <url-do-repositorio>
cd calculo-aberto
npm install
cp .env.example .env.local
npm run dev
```

Disponível em `http://localhost:3000`. Nenhuma variável é obrigatória para desenvolvimento.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run validate:params` | Verificações estruturais dos parâmetros legais |
| `npm run test` | Unidade e casos-ouro |
| `npm run test:golden` | Somente casos-ouro |
| `npm run test:e2e` | Ponta a ponta |
| `npm run test:leak` | Verificação de não vazamento de dado |
| `npm run lint` | Análise estática, incluindo regras de segurança de tipo monetário |
| `npm run check` | Tudo acima, na ordem do pipeline |

Execute `npm run check` antes de qualquer commit.

## Variáveis de ambiente

Todas documentadas em `.env.example`. Detalhamento por ambiente em `docs/13-deployment.md` §5.

Variáveis com prefixo `NEXT_PUBLIC_` ficam visíveis no navegador. **Nunca coloque segredo em uma delas.**

## Deploy

Automático: todo commit na branch principal dispara o pipeline, que roda as verificações, constrói a imagem etiquetada com o hash do commit e publica.

Rollback: reimplantar a etiqueta anterior pelo painel. Procedimento completo em `docs/13-deployment.md` §9.

## Documentação

A documentação é o artefato principal deste projeto — o código deriva dela.

Índice em [`docs/README.md`](docs/README.md).

| Documento | Assunto |
|---|---|
| `00-catalogo-calculadoras` | Escopo: quais calculadoras existem e quais nunca existirão |
| `00-product-brief` | Problema, público, concorrência, métricas, hipóteses |
| `01-prd` | Requisitos e regras de negócio |
| `03-functional-spec` | Campos, validações e textos de tela |
| `04-architecture` | Diagramas e decisões estruturais |
| `05-data-model` | Modelo de parâmetros e vigências |
| `07-security` | Privacidade, LGPD, modelo de ameaça |
| `12-test-plan` | Casos-ouro e critérios de bloqueio |
| `15-runbook` | O que fazer quando algo quebra |
| `16-adr/` | Por que as decisões foram tomadas |

Se você vai alterar código, leia antes o `CLAUDE.md` na raiz.

## Contribuindo

Antes de qualquer alteração relevante:

1. Confirme que a calculadora está no catálogo com ID atribuído.
2. Leia as regras invioláveis em `CLAUDE.md`.
3. Escreva os casos-ouro antes de considerar o trabalho pronto.
4. Nunca ajuste o valor esperado de um caso-ouro para fazê-lo passar.

**Parâmetro legal só é aceito com fonte oficial.** Tabela copiada de blog, de software de terceiro ou de site concorrente é rejeitada na revisão — é assim que o erro se propaga no mercado, e este projeto existe para não fazer isso.

## Aviso

As ferramentas deste projeto são informativas e educacionais. Os resultados são estimativas produzidas a partir dos dados informados e dos parâmetros legais vigentes no período selecionado. Não constituem aconselhamento jurídico, contábil ou financeiro.

## Licença

> ⚠️ VERIFICAR: definir antes da publicação do repositório.
