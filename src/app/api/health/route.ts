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
 * ## A RESPOSTA PÚBLICA CONTINUA SEM VERSÃO — E ISSO NÃO FOI REVISTO
 *
 * O texto original desta rota dizia: *"Não devolve versão, ambiente nem
 * configuração. Verificação de saúde é pública por natureza, e enumerar o que
 * roda aqui só ajuda quem está procurando o que atacar."*
 *
 * **Continua valendo, literalmente.** Sem credencial, esta rota responde
 * `{"status":"ok"}` e mais nada — exatamente como antes. `EP-016` não foi
 * revisto, e a decisão de segurança de `07-security` segue intacta.
 *
 * ## O QUE MUDOU, E O INCIDENTE QUE O EXIGIU
 *
 * Em 07/08/2026 o pipeline aprovou **duas vezes** um deploy que não aconteceu.
 * O log conta a história em duas linhas:
 *
 *     21:07:39  Deploy disparado (HTTP 200)
 *     21:07:41  Saudável na tentativa 1
 *
 * Um segundo e oito décimos. Nenhum orquestrador puxa imagem, sobe contêiner e
 * troca tráfego nesse tempo — a verificação bateu no contêiner **antigo**,
 * respondeu `ok` e o pipeline ficou verde com produção parada no commit
 * anterior. Só foi descoberto comparando o HTML servido byte a byte.
 *
 * **A causa é estrutural: uma resposta idêntica em toda versão não consegue
 * distinguir "o novo subiu" de "o velho respondeu".** Nenhuma quantidade de
 * tentativas conserta isso, porque o velho responde `ok` em todas elas.
 *
 * ## O DESENHO, E POR QUE ELE NÃO CUSTA A DECISÃO ANTERIOR
 *
 * A versão sai **apenas** para quem apresenta um segredo no cabeçalho
 * `x-health-token`. Quem não apresenta recebe a resposta de sempre. O pipeline
 * conhece o segredo; quem varre a internet, não.
 *
 * Falha fechada por construção: sem `HEALTH_TOKEN` configurado no ambiente, o
 * segredo é impossível de acertar e a rota nunca revela nada. Esquecer de
 * configurar degrada para "não sei a versão", nunca para "versão exposta".
 *
 * A comparação é de tempo constante. É exagero para um token de deploy, e
 * custa três linhas — o tipo de exagero que não vale discutir.
 */

/**
 * A revisão que está rodando, injetada no build a partir do hash do commit.
 *
 * **Sem prefixo `NEXT_PUBLIC_`, e isso é o ponto.** Esse prefixo faria o valor
 * ser substituído no pacote do navegador, publicando a versão para todo mundo
 * pela porta dos fundos — que é precisamente o que este desenho evita.
 */
/**
 * Lidas a cada requisição, e não no escopo do módulo.
 *
 * A leitura de topo provavelmente funcionaria — o pacote gerado preserva
 * `process.env.HEALTH_TOKEN`, sem substituição no build. Ela foi movida para
 * cá enquanto eu perseguia um sintoma cuja causa era outra: um servidor de
 * teste antigo, iniciado sem as variáveis, continuava atendendo a porta.
 *
 * Fica assim mesmo assim, e por um motivo válido: dentro do manipulador o
 * valor acompanha o processo em execução, sem depender de o empacotador nunca
 * mudar de comportamento quanto a `process.env`.
 */
function ambiente(): { revisao: string; segredo: string } {
  return {
    revisao: process.env.APP_REV ?? 'desconhecida',
    segredo: process.env.HEALTH_TOKEN ?? '',
  }
}

/**
 * Comparação de tempo constante.
 *
 * Um `===` vaza, pela duração, quantos caracteres iniciais o palpite acertou.
 * O risco real aqui é pequeno — o prêmio é saber uma versão —, mas o custo de
 * fechar é menor ainda que o de justificar não ter fechado.
 */
function credencialConfere(apresentado: string | null, segredo: string): boolean {
  // Segredo ausente: ninguém acerta. Falha fechada.
  if (segredo === '' || apresentado === null) return false
  if (apresentado.length !== segredo.length) return false

  let diferenca = 0
  for (let i = 0; i < segredo.length; i += 1) {
    diferenca |= segredo.charCodeAt(i) ^ apresentado.charCodeAt(i)
  }
  return diferenca === 0
}

// Sem isto a rota é pré-renderizada no build e passa a responder 200 mesmo
// com o processo em estado ruim — o que a torna pior que inútil.
export const dynamic = 'force-dynamic'

export function GET(request: Request): Response {
  const { revisao, segredo } = ambiente()
  const autorizado = credencialConfere(request.headers.get('x-health-token'), segredo)

  return Response.json(
    autorizado ? { status: 'ok', rev: revisao } : { status: 'ok' },
    {
      status: 200,
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate',
        'x-robots-tag': 'noindex',
        /*
          NÃO HÁ `Vary` AQUI, E A TENTATIVA FOI MEDIDA.
          Declarar `vary: x-health-token` não sobrevive: o Next sobrescreve o
          cabeçalho com os valores de roteamento dele. O risco que o `Vary`
          endereçaria — um intermediário servir a resposta autenticada a quem
          não apresentou credencial — já está coberto pelo `no-store` acima,
          que proíbe o armazenamento da resposta em qualquer cache.
        */
      },
    },
  )
}
