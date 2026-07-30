import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Saída autônoma: a imagem final não carrega código-fonte nem dependências
  // de desenvolvimento (13-deployment §3, regra D-1).
  //
  // `next start` NÃO serve esta saída. O caminho correto é
  // `node .next/standalone/server.js`, e o Next não copia `.next/static` nem
  // `public` para dentro dela — quem faz isso é `scripts/serve-standalone.mjs`
  // localmente e o Dockerfile em produção. Os dois lados andam juntos: mudar
  // um sem o outro produz um servidor que sobe e serve página sem estilo.
  output: 'standalone',

  // O rastreador de arquivos do Next inclui `typescript` na saída autônoma
  // porque este próprio arquivo é .ts. São 8,7 MB de dependência de
  // DESENVOLVIMENTO dentro da imagem de produção — violação direta de D-1,
  // verificada inspecionando a imagem construída.
  //
  // TypeScript é ferramenta de build e não participa de servir requisição.
  // A exclusão é conferida em T-002 subindo o contêiner e batendo em
  // /api/health e em /: se fosse necessário em runtime, o servidor não subiria.
  outputFileTracingExcludes: {
    '*': ['node_modules/typescript/**'],
  },

  // Barra final ausente; redirecionamento permanente quando presente
  // (06-api-spec §2.1).
  trailingSlash: false,

  reactStrictMode: true,

  // Falhar o build em erro de tipo ou de lint é deliberado: o pipeline de
  // 13-deployment §4 interrompe antes do build, e o build não deve ser a
  // primeira etapa complacente da cadeia.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
}

// Cabeçalhos de segurança (07-security §5) entram em T-004/T-038, junto com a
// política de conteúdo — que depende das origens exatas da rede de anúncio e
// não admite curinga.

export default nextConfig
