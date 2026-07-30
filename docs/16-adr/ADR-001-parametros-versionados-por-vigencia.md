---
doc: ADR-001
projeto: Cálculo Aberto
versao: 1.0
status: aprovado
depende_de: [01-prd]
---

# ADR-001 — Parâmetros legais versionados por vigência

## Contexto

O produto depende de dezenas de constantes definidas em norma: faixas e alíquotas previdenciárias, tabela do imposto, dedução por dependente, salário mínimo, teto, percentuais de FGTS, divisores de jornada. Praticamente todas mudam a cada exercício, e algumas mudam fora dele.

Duas necessidades tornam o tratamento ingênuo inviável:

1. **Rastreabilidade.** A tese do produto é que o usuário possa conferir o número. Isso exige exibir qual parâmetro foi usado, de quando ele é e onde está publicado.
2. **Retroatividade.** Boa parte dos casos reais — rescisão, conferência de holerite antigo — exige a tabela de um período passado, não a atual.

## Opções consideradas

**A. Constantes no código, atualizadas por edição.** Simples e imediato. Torna a retroatividade impossível sem condicional espalhada, não permite citar fonte e transforma cada atualização em risco de regressão silenciosa.

**B. Tabela em banco de dados, editada por painel.** Flexível e atualizável sem deploy. Exige banco, autenticação e painel — três componentes que o projeto não teria por nenhuma outra razão. Pior: transforma alteração de parâmetro legal em edição sem revisão nem histórico de justificativa.

**C. Módulos versionados no repositório, com vigência e fonte obrigatórias, validados no build.** Exige disciplina e um deploy por atualização.

## Decisão

**Opção C.**

Todo parâmetro legal é um registro com `vigencia_inicio`, `vigencia_fim`, `valor`, `fonte_norma` e `fonte_url`, versionado no repositório e validado no build quanto a formato, sobreposição, lacuna entre faixas e origem oficial da URL.

O motor recebe sempre uma data de referência explícita e seleciona a vigência correspondente. Data sem cobertura bloqueia o cálculo com mensagem — nunca extrapola.

## Consequências positivas

- Retroatividade é uma propriedade do modelo, não um recurso a construir depois.
- A citação de fonte na memória de cálculo é obrigatória por construção: parâmetro sem fonte não compila.
- Alteração de parâmetro é revisão de código, com autor, momento, diff e justificativa registrados.
- Casos-ouro por vigência detectam erro antes da publicação.
- Elimina banco, painel e autenticação do sistema.

## Consequências negativas

- Atualizar um parâmetro exige deploy. Mitigado pelo pipeline, que leva minutos.
- Só o mantenedor com acesso ao repositório atualiza. É restrição real, e aceitável em projeto solo.
- O conjunto de parâmetros cresce com o número de exercícios cobertos, impactando o bundle. Gatilho de mitigação definido em `05-data-model` §7.
- Exige disciplina de commit que uma edição em painel não exigiria. Essa fricção é deliberada: parâmetro legal não deveria ser fácil de mudar sem deixar rastro.

## Custo de reversão

**Baixo a médio.** Migrar para banco preservaria a estrutura de dados — as entidades já estão modeladas relacionalmente em `05-data-model`. Estimativa de 3 a 5 dias-dev, incluindo painel mínimo.

O caminho inverso, sair de constantes espalhadas para este modelo depois, custaria a reescrita do motor inteiro. É a assimetria que justifica adotar esta decisão desde o início.
