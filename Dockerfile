# syntax=docker/dockerfile:1

# =============================================================================
# Cálculo Oficial — imagem de produção
#
# Build em múltiplos estágios (13-deployment §3). Cada princípio D-* está
# amarrado a uma linha concreta abaixo:
#
#   D-1  imagem final sem código-fonte, sem dependência de desenvolvimento e
#        sem histórico do repositório  → estágio `runner` copia apenas a saída
#                                        autônoma; ver também .dockerignore
#   D-2  processo sem privilégio       → USER calculo
#   D-3  nenhum segredo embutido       → nenhum ARG/ENV de segredo; o build
#                                        recebe só variáveis públicas
#   D-4  rota de saúde exposta         → HEALTHCHECK em /api/health (EP-016)
#   D-5  etiqueta = hash do commit     → responsabilidade do pipeline (T-003);
#                                        aqui só o rótulo que a registra
# =============================================================================

ARG NODE_IMAGE=node:22-alpine

# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
WORKDIR /app
# Sem telemetria: coerente com a promessa do produto, inclusive no build.
ENV NEXT_TELEMETRY_DISABLED=1


# -----------------------------------------------------------------------------
# deps — dependências completas, só para construir.
# Camada separada para não reinstalar a cada mudança de código-fonte.
# -----------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
# `npm ci` e não `npm install`: instala exatamente o que está no arquivo de
# trava. Fixação de versão é controle de AM-01 (07-security §8), não detalhe
# de performance — `npm install` poderia resolver uma versão diferente da que
# passou pela auditoria de dependências do pipeline.
RUN npm ci


# -----------------------------------------------------------------------------
# builder — produz a saída autônoma.
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis públicas precisam existir no build: o prefixo NEXT_PUBLIC_ é
# substituído no bundle, não lido em runtime. Nenhuma delas é segredo — é
# exatamente por isso que só elas aparecem aqui (D-3, 13-deployment §5).
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_AD_CLIENT_ID=""
ARG NEXT_PUBLIC_AD_SLOT_ID=""
ARG NEXT_PUBLIC_CMP_ID=""
# INT-005 passou a ser Google Tag Manager em 07/08/2026. As duas variáveis da
# análise autohospedada saíram daqui junto — mantê-las seria prometer no build
# uma integração que o código não consome mais.
#
# Sem valor, o componente de medição não renderiza nada e a imagem sai com zero
# terceiros. É `RNF-007`, e é o que faz o build de desenvolvimento continuar
# limpo sem ninguém precisar lembrar.
ARG NEXT_PUBLIC_GTM_ID=""
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_AD_CLIENT_ID=${NEXT_PUBLIC_AD_CLIENT_ID} \
    NEXT_PUBLIC_AD_SLOT_ID=${NEXT_PUBLIC_AD_SLOT_ID} \
    NEXT_PUBLIC_CMP_ID=${NEXT_PUBLIC_CMP_ID} \
    NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID}

# Identificador do build, para o pipeline PROVAR que o contêiner trocou.
#
# **Não é segredo e não é a revisão.** É um valor opaco, sorteado pelo pipeline
# a cada execução. `.next/static/<BUILD_ID>/` é servido publicamente, então
# depois do deploy basta pedir aquele caminho: 200 significa que o contêiner
# NOVO está no ar, 404 significa que ainda é o antigo.
#
# Opaco de propósito. Usar o hash do commit resolveria igual e publicaria a
# revisão em toda URL de recurso — o repositório é público, e `EP-016` recusa
# exatamente isso. Sorteado, não diz nada a quem o lê.
#
# Vazio, o Next sorteia o dele como sempre. Nada muda fora do CI.
ARG BUILD_ID=""
ENV BUILD_ID=${BUILD_ID}

ENV NODE_ENV=production
RUN npm run build


# -----------------------------------------------------------------------------
# runner — imagem final. Nada além do necessário para servir.
# -----------------------------------------------------------------------------
FROM base AS runner

# A revisão precisa estar disponível ao PROCESSO, e não só como rótulo da
# imagem: `EP-016` a devolve a quem apresenta credencial, para o pipeline saber
# se falou com o contêiner novo ou com o velho. Ver a nota da rota de saúde.
#
# O `ARG` é declarado de novo aqui porque argumento de build não atravessa
# estágio — este é outro `FROM`, e o valor do estágio anterior não vale nele.
ARG VCS_REF="desconhecido"
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP_REV=${VCS_REF}

# D-2 — usuário sem privilégio. Criado antes das cópias para que os arquivos
# já nasçam com o dono certo.
RUN addgroup -g 1001 -S calculo \
 && adduser -u 1001 -S calculo -G calculo

# D-1 — apenas a saída autônoma. Não entram: src/, docs/, tests/, .git/,
# node_modules de desenvolvimento, configurações de ferramenta.
# A saída autônoma já traz o subconjunto de node_modules que o servidor usa.
COPY --from=builder --chown=calculo:calculo /app/.next/standalone ./
# O Next deixa os estáticos fora da saída autônoma, por decisão dele.
COPY --from=builder --chown=calculo:calculo /app/.next/static ./.next/static

USER calculo

EXPOSE 3000

# D-4 — verificação de saúde (EP-016). `start-period` generoso porque um
# reinício em cascata durante a subida é pior que detectar a falha 20s depois.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

# D-5 — a etiqueta da imagem é o hash do commit e é aplicada pelo pipeline
# (T-003). Este rótulo existe para que a imagem carregue a própria origem:
# durante um incidente, `docker inspect` responde qual commit está no ar sem
# depender do painel de deploy (15-runbook RB-01).
ARG VCS_REF="desconhecido"
LABEL org.opencontainers.image.title="Cálculo Oficial" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="UNLICENSED"
