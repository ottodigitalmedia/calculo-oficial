import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // `output: 'standalone'` pertence a T-002, não a este ticket, e não é uma
  // linha solta: `next start` NÃO serve a saída autônoma — é preciso
  // `node .next/standalone/server.js`, com `.next/static` e `public` copiados
  // para dentro dela. Como o `webServer` do Playwright usa `next start`,
  // ativar standalone aqui deixaria a suíte e2e subindo um servidor quebrado
  // desde já, e o sintoma só apareceria em T-033, longe da causa.
  //
  // T-002 ativa os dois lados no mesmo commit: a opção e o comando de serviço.

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
