/**
 * EP-016 — verificação de saúde (13-deployment §10, regra D-4).
 *
 * Consumida pelo orquestrador a cada 30s e pelo passo de verificação após o
 * deploy, que dispara o rollback automático quando ela não responde
 * (13-deployment §4 e §9).
 *
 * Responde apenas se o processo está de pé. Não consulta parâmetro, não
 * calcula e não toca dependência externa: uma verificação de saúde que falha
 * por causa de terceiro derruba um site que estava funcionando — e aqui
 * nenhum terceiro participa do caminho crítico (regra R-4 de 06-api-spec).
 *
 * Não devolve versão, ambiente nem configuração. Verificação de saúde é
 * pública por natureza, e enumerar o que roda aqui só ajuda quem está
 * procurando o que atacar.
 */

// Sem isto a rota é pré-renderizada no build e passa a responder 200 mesmo
// com o processo em estado ruim — o que a torna pior que inútil.
export const dynamic = 'force-dynamic'

export function GET(): Response {
  return Response.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate',
        'x-robots-tag': 'noindex',
      },
    },
  )
}
