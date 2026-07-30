# CLAUDE.md

Contexto permanente do projeto. Leia antes de qualquer alteração.

## O que é

**Cálculo Aberto** — webapp público de calculadoras trabalhistas, tributárias e financeiras para o Brasil.

Diferencial único: **memória de cálculo auditável**. Cada resultado mostra o passo a passo, o parâmetro legal usado, a vigência dele e o link para a norma. É a razão de o produto existir; qualquer decisão que a enfraqueça está errada.

Monetização exclusiva por anúncio. Sem conta de usuário, sem pagamento, sem banco de dados.

## Documentação

Tudo em `docs/`. Comece por `docs/README.md`.

| Preciso de | Leia |
|---|---|
| Escopo, calculadoras, categorias | `docs/00-catalogo-calculadoras.md` |
| Regras de negócio (`RN-*`) | `docs/01-prd.md` §3 |
| Campos, validações, textos de tela | `docs/03-functional-spec.md` |
| Por que a arquitetura é assim | `docs/04-architecture.md` + `docs/16-adr/` |
| Como modelar parâmetro | `docs/05-data-model.md` |
| O que testar | `docs/12-test-plan.md` |
| Algo quebrou | `docs/15-runbook.md` |

**Ao implementar, cite a regra.** Um `RN-*` implementado sem referência no código é um `RN-*` que ninguém consegue auditar depois.

## Stack

Next.js App Router · TypeScript · Tailwind · shadcn/ui · MDX · Vitest · Playwright · Docker · VPS com EasyPanel · GitHub Actions.

Sem banco na aplicação. Sem ORM. Sem autenticação. Sem IA.

## Estrutura

```
src/
├── app/            rotas
├── components/
├── content/        MDX: guias e FAQ
└── lib/
    ├── engine/     motor de cálculo — puro, zero dependência
    ├── params/     parâmetros legais por vigência
    └── format/     formatação pt-BR
tests/
├── golden/         casos-ouro
├── e2e/
└── leak/           testes de não vazamento
```

## Regras invioláveis

Cada uma deriva de uma decisão registrada. Quebrar qualquer uma delas quebra uma propriedade do sistema, não uma preferência de estilo.

| # | Regra | Origem |
|---|---|---|
| 1 | **Nenhuma constante legal fora de `lib/params/`.** Todo parâmetro tem vigência, fonte e URL oficial | `ADR-001`, `RN-001` |
| 2 | **Valor monetário é inteiro em centavos.** Ponto flutuante sobre dinheiro é proibido. Alíquota em basis points | `ADR-004`, `RN-005` |
| 3 | **`lib/engine/` não importa nada de `app/`, `components/` ou `format/`.** Zero dependência de runtime | `ADR-003` |
| 4 | **O motor não lê relógio, rede nem ambiente.** Data de referência é sempre parâmetro explícito | `ADR-003` C-M2 |
| 5 | **Toda função do motor retorna resultado E traço.** Não existe cálculo sem memória | `ADR-003` C-M1 |
| 6 | **Nenhum valor digitado sai do navegador.** Nem em log, nem em erro, nem em analytics | `RN-030` |
| 7 | **Data sem cobertura de vigência bloqueia o cálculo.** Nunca extrapolar a tabela mais recente | `RN-003` |
| 8 | **Nunca escrever "você tem direito a".** Sempre "estimativa com base nos dados informados" | `RN-028` |
| 9 | **Anúncio nunca acima do resultado nem dentro da memória de cálculo** | `RF-009`, MC-5 |
| 10 | **Caso-ouro nunca vem de outro site.** Só fonte oficial, exemplo oficial ou documento real | CO-1 |

## Nunca faça

- Adicionar banco, autenticação ou sessão sem reverter `ADR-002` conscientemente.
- Adicionar dependência ao motor de cálculo.
- Ajustar o valor esperado de um caso-ouro para fazê-lo passar. Se falhou, ou o código está errado ou o caso está errado — descubra qual.
- Marcar teste como pendente para desbloquear entrega.
- Implementar calculadora que não esteja no catálogo com ID atribuído.
- Criar calculadora de saúde, gerador de contrato ou cálculo dependente de dado municipal — estão fora em definitivo, com motivo registrado.
- Reverter commit de parâmetro incorreto. Corrija para a frente e registre no changelog (`RB-06`).
- Usar curinga na política de segurança de conteúdo.
- Copiar tabela legal de blog, software de terceiro ou concorrente. Só fonte oficial.

## Comandos

```bash
npm run dev              # desenvolvimento
npm run validate:params  # verificações estruturais BV-01 a BV-12
npm run test             # unidade + casos-ouro
npm run test:golden      # só casos-ouro
npm run test:e2e         # ponta a ponta
npm run test:leak        # não vazamento (TC-040 a TC-043)
npm run lint             # inclui BV-10 e BV-11
npm run build
npm run check            # tudo acima, na ordem do pipeline
```

Antes de qualquer commit: `npm run check`.

## Commits

Formato convencional. Escopo obrigatório.

```
feat(calc-001): adiciona calculadora de salário líquido
fix(engine): corrige arredondamento na 3ª faixa previdenciária
test(golden): adiciona casos de fronteira de isenção
docs(adr): registra decisão sobre cache da série externa
```

**Commit de parâmetro legal tem formato próprio e obrigatório:**

```
params(<parametro-id>): vigência a partir de <inicio>

Fonte: <norma e dispositivo>
URL: <url oficial>
Verificado contra: <como foi conferido>
Casos-ouro afetados: <ids>
```

Verificado no CI. Sem isso, o commit é rejeitado.

## Ao adicionar uma calculadora

1. Confirmar que está no catálogo com ID e fase.
2. Ler a seção correspondente em `03-functional-spec.md` — os textos de tela já estão escritos, use-os literalmente.
3. Cadastrar os parâmetros em `lib/params/` com fonte oficial, cobrindo no mínimo dois exercícios.
4. Implementar no motor, retornando traço.
5. Escrever os casos-ouro **antes** de considerar pronto, conferidos contra fonte oficial.
6. Construir a página com todos os estados de `03-functional-spec.md` §1.5.
7. Adicionar FAQ com no mínimo 4 perguntas e ligar ao guia.
8. Definir as calculadoras relacionadas.
9. `npm run check`.

## Ao atualizar um parâmetro legal

1. Abrir a **fonte oficial**. Não o site que diz o que a fonte oficial diz.
2. Adicionar nova vigência. Encerrar a anterior com `vigencia_fim`. Nunca sobrescrever.
3. Adicionar casos-ouro da nova vigência.
4. Confirmar que os casos-ouro das vigências anteriores continuam passando com os mesmos valores.
5. Commit no formato `params(...)`.
6. Registrar em `docs/17-changelog.md`.
7. Após o deploy, executar um cálculo de conferência em produção.

## Contexto de decisão

Quando estiver em dúvida entre duas opções, o critério é este, nesta ordem:

1. **Correção do cálculo** vence tudo.
2. **Privacidade do usuário** vence conveniência de implementação.
3. **Verificabilidade** vence elegância.
4. **Menos componentes** vence mais recursos.
5. **Receita** é a última prioridade — o produto funciona integralmente sem anúncio, e essa propriedade é deliberada.

O erro mais provável neste projeto não é técnico: é publicar um número errado com aparência de certo. Toda a arquitetura existe para tornar isso difícil.
