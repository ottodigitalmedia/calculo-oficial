/**
 * Coleta da série econômica externa — `INT-001`, `ADR-006`, `RF-012`.
 *
 * **Este script nunca falha o build.** É a regra R-3 de `06-api-spec`, e a
 * assimetria é deliberada: parâmetro legal errado deve quebrar o pipeline;
 * indicador econômico indisponível, não. Ele encerra com código 0 em qualquer
 * cenário e registra aviso — o passo do CI já é `continue-on-error`, e este
 * script fecha o buraco do outro lado.
 *
 * O que ele faz, na ordem:
 *
 *   1. lê o cache versionado que já está no repositório (`S-2`);
 *   2. busca cada série, com tempo limite de 3s e duas tentativas (§4.2);
 *   3. normaliza e valida por formato e por intervalo plausível (`S-4`);
 *   4. **mantém o ponto antigo** de toda série que falhou;
 *   5. reescreve o cache.
 *
 * Uso: `npm run fetch:serie`
 *
 * `S-7`: nada do usuário é enviado. O que sai daqui é código de série e
 * quantidade de pontos — não existe requisição de usuário nesta integração.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { normalizar } from '../src/lib/series/normalizar'
import {
  SERIES,
  VERSAO_DO_CACHE,
  type SerieId,
  type CacheDeSeries,
  type DefinicaoDeSerie,
  type SerieEmCache,
} from '../src/lib/series/tipos'
import type { DataISO } from '../src/lib/params/tipos'

const ARQUIVO = join('src', 'lib', 'series', 'dados', 'cache.json')
const ARQUIVO_COMPACTO = join('src', 'lib', 'series', 'dados', 'compacto.ts')

/**
 * As séries que precisam rodar **no navegador**, e por isso ganham uma segunda
 * forma, compacta.
 *
 * A correção por índice calcula no cliente, sobre o intervalo que o usuário
 * escolhe — não há como resolver isso no servidor como se faz com a sugestão de
 * taxa. E o cache completo tem 60 kB de objetos `{data, valor}`, o que sozinho
 * estouraria os 30 kB de parte variável que `RNF-004` permite a uma rota.
 *
 * A forma compacta troca 240 objetos por um mês inicial e um vetor de inteiros.
 * O conteúdo é o mesmo; o que muda é não repetir a chave e a data em cada ponto.
 */
const COMPACTAS: readonly SerieId[] = [
  'ipca-mensal',
  'inpc-mensal',
  'igpm-mensal',
  // A Selic acumulada no mês (4390) entrou em 07/08/2026. Ela passa na guarda
  // de calendário abaixo porque é mesmo mensal — ao contrário da poupança e da
  // TR, que são diárias na origem e caem no `ULTIMO_PONTO` ou em nada.
  'selic-mensal',
]

/**
 * Séries de que o navegador precisa apenas do **último ponto**.
 *
 * A poupança entrou aqui em CALC-040, depois de uma tentativa errada: ela foi
 * primeiro posta na lista acima, e a guarda de calendário do gerador a recusou
 * na hora — *"buraco no calendário: esperava 2026-08, veio 2026-07-10"*. Estava
 * certa. A série 195 é **diária**, e um vetor posicional por mês não a
 * representa.
 *
 * O que CALC-040 precisa dela é um número só: a taxa corrente. Ela não é oferta
 * de ninguém — não existe "poupança a 110% de nada" —, então não é campo do
 * usuário, e sim dado com data.
 */
const ULTIMO_PONTO: readonly SerieId[] = ['poupanca-mensal']

/** §4.2: tempo limite de 3 segundos. */
const TEMPO_LIMITE_MS = 3_000
/** §4.2: duas tentativas, com 2 segundos entre elas. */
const TENTATIVAS = 2
const ESPERA_ENTRE_TENTATIVAS_MS = 2_000

const BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

/**
 * Teto de `ultimos/N`, dito pelo próprio serviço no corpo do erro 400.
 *
 * Medido em 02/08/2026. Não é constante legal — é limite de uma API.
 */
const TETO_DE_ULTIMOS = 20

function avisar(mensagem: string): void {
  console.warn(`[series] ${mensagem}`)
}

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** A data de hoje, em ISO. Aqui é legítimo: script de build, não motor. */
function hoje(): DataISO {
  const agora = new Date()
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(agora.getUTCDate()).padStart(2, '0')
  return `${agora.getUTCFullYear()}-${mes}-${dia}` as DataISO
}

/** `dd/MM/aaaa`, que é o formato que o serviço aceita na consulta por intervalo. */
function paraFormatoDoProvedor(iso: DataISO): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Monta a URL da série conforme a janela declarada.
 *
 * As duas formas foram medidas em 02/08/2026, e a escolha entre elas não é de
 * gosto: `ultimos/N` **recusa N acima de 20**, e diz isso em texto no corpo do
 * erro — *"A quantidade máxima de valores deve ser 20"*. Foi assim que a
 * primeira versão deste script falhou nas seis séries de uma vez, com 400.
 */
function urlDaSerie(definicao: DefinicaoDeSerie, ate: DataISO): string {
  const raiz = `${BASE}.${definicao.codigoSgs}/dados`

  if (definicao.janela.tipo === 'ultimos') {
    return `${raiz}/ultimos/${Math.min(definicao.janela.quantidade, TETO_DE_ULTIMOS)}?formato=json`
  }

  const [ano, mes, dia] = ate.split('-') as [string, string, string]
  const inicio = `${Number(ano) - definicao.janela.anos}-${mes}-${dia}` as DataISO
  return (
    `${raiz}?formato=json` +
    `&dataInicial=${paraFormatoDoProvedor(inicio)}` +
    `&dataFinal=${paraFormatoDoProvedor(ate)}`
  )
}

function lerCache(): CacheDeSeries {
  if (!existsSync(ARQUIVO)) return { versao: VERSAO_DO_CACHE, series: [] }
  try {
    const lido = JSON.parse(readFileSync(ARQUIVO, 'utf8')) as CacheDeSeries
    if (lido.versao !== VERSAO_DO_CACHE) {
      avisar(`cache em versão ${lido.versao}, esperada ${VERSAO_DO_CACHE}; será refeito`)
      return { versao: VERSAO_DO_CACHE, series: [] }
    }
    return lido
  } catch {
    avisar('cache ilegível; será refeito')
    return { versao: VERSAO_DO_CACHE, series: [] }
  }
}

/**
 * Busca uma série, com tempo limite e repetição.
 *
 * Devolve `null` em qualquer falha — o chamador trata isso mantendo o cache, e
 * não interrompendo nada.
 */
async function buscar(definicao: DefinicaoDeSerie, ate: DataISO): Promise<unknown | null> {
  const url = urlDaSerie(definicao, ate)

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa += 1) {
    try {
      const resposta = await fetch(url, {
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        headers: { accept: 'application/json' },
      })

      /**
       * Série inexistente responde **502**, e não 404 — medido em 02/08/2026.
       * Por isso a checagem é por `ok`, e não por uma lista de códigos: supor
       * 4xx para "não encontrado" deixaria o 502 passar como erro transitório e
       * gastaria a segunda tentativa à toa.
       */
      if (!resposta.ok) {
        avisar(`${definicao.id}: HTTP ${resposta.status} na tentativa ${tentativa}`)
      } else {
        return (await resposta.json()) as unknown
      }
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      avisar(`${definicao.id}: falha na tentativa ${tentativa} — ${motivo}`)
    }

    if (tentativa < TENTATIVAS) await dormir(ESPERA_ENTRE_TENTATIVAS_MS)
  }

  return null
}

async function main(): Promise<void> {
  const cacheAtual = lerCache()
  const hojeIso = hoje()
  const atualizadas: SerieEmCache[] = []
  let falhas = 0

  for (const definicao of SERIES) {
    const anterior = cacheAtual.series.find((s) => s.id === definicao.id)
    const bruto = await buscar(definicao, hojeIso)

    if (bruto === null) {
      falhas += 1
      if (anterior) {
        avisar(`${definicao.id}: mantendo o cache de ${anterior.coletadoEm}`)
        atualizadas.push(anterior)
      } else {
        avisar(`${definicao.id}: sem cache anterior; ficará sem sugestão`)
      }
      continue
    }

    const { pontos, descartados } = normalizar(bruto, {
      minimo: definicao.minimoPlausivel,
      maximo: definicao.maximoPlausivel,
    })

    for (const motivo of descartados.slice(0, 3)) {
      avisar(`${definicao.id}: ponto descartado — ${motivo}`)
    }

    /**
     * Fora o mês em curso, quando a série o publica pela metade.
     *
     * Só a Selic acumulada no mês faz isso — a justificativa completa está no
     * campo `descartarMesCorrente`, em `series/tipos.ts`. Aqui o cuidado é de
     * lugar: o corte acontece **antes** de gravar o cache, e não na leitura,
     * para que o arquivo versionado nunca contenha um mês pela metade que um
     * consumidor futuro tomaria por fechado.
     */
    const mesDaColeta = hojeIso.slice(0, 7)
    const fechados = definicao.descartarMesCorrente
      ? pontos.filter((p) => p.data.slice(0, 7) < mesDaColeta)
      : pontos

    if (definicao.descartarMesCorrente && fechados.length < pontos.length) {
      avisar(`${definicao.id}: mês corrente (${mesDaColeta}) descartado — ainda em curso`)
    }

    /**
     * Resposta vazia depois da normalização é falha, não sucesso silencioso.
     *
     * É o caso em que a origem mudou de formato: a requisição responde 200, o
     * corpo é legível, e nada dentro dele serve. Gravar zero pontos aqui
     * apagaria o cache bom — a mesma classe de erro que `ESTADO-DO-PROJETO`
     * §7.5 descreve, com o verificador que melhora sozinho por deixar de olhar.
     */
    if (fechados.length === 0) {
      falhas += 1
      avisar(`${definicao.id}: nenhum ponto válido na resposta`)
      if (anterior) atualizadas.push(anterior)
      continue
    }

    // Guarda só a cauda mais recente: o arquivo é versionado no repositório, e
    // histórico sem teto viraria diff gigante a cada coleta.
    const guardados = fechados.slice(-definicao.pontosNoCache)

    atualizadas.push({
      id: definicao.id,
      codigoSgs: definicao.codigoSgs,
      coletadoEm: hojeIso,
      pontos: guardados,
    })

    const ultimo = guardados[guardados.length - 1]
    console.log(
      `[series] ${definicao.id}: ${guardados.length} pontos, último em ${ultimo?.data ?? '—'}`,
    )
  }

  const novo: CacheDeSeries = { versao: VERSAO_DO_CACHE, series: atualizadas }
  mkdirSync(dirname(ARQUIVO), { recursive: true })
  writeFileSync(ARQUIVO, `${JSON.stringify(novo, null, 2)}\n`, 'utf8')
  escreverCompacto(novo)

  if (falhas > 0) {
    avisar(`${falhas} de ${SERIES.length} série(s) não atualizadas. O build prossegue (R-3).`)
  } else {
    console.log(`[series] ${SERIES.length} séries atualizadas.`)
  }
}

/**
 * Gera a forma compacta das séries mensais, para o pacote do navegador.
 *
 * **Sem buraco de mês.** O vetor é posicional: a posição `k` é o mês `inicio +
 * k`. Se a origem pular um mês, a posição deixaria de corresponder à data, e a
 * correção de um intervalo longo sairia deslocada — errada por um número
 * plausível, que é a forma cara de errar. O gerador percorre o calendário e
 * **falha alto** se encontrar falta, em vez de compactar um vetor torto.
 */
function escreverCompacto(cache: CacheDeSeries): void {
  const QUEBRA = String.fromCharCode(10)
  const blocos: string[] = []

  for (const id of COMPACTAS) {
    const serie = cache.series.find((s) => s.id === id)
    if (!serie || serie.pontos.length === 0) {
      avisar(`${id}: sem pontos; forma compacta ficará vazia`)
      blocos.push(`  '${id}': { inicio: '', valores: [] },`)
      continue
    }

    const primeiro = serie.pontos[0]
    if (!primeiro) continue
    const inicio = primeiro.data.slice(0, 7)

    const valores: number[] = []
    let [ano, mes] = inicio.split('-').map(Number) as [number, number]
    let saudavel = true

    for (const ponto of serie.pontos) {
      const esperado = `${ano}-${String(mes).padStart(2, '0')}`
      if (ponto.data.slice(0, 7) !== esperado) {
        avisar(`${id}: buraco no calendário — esperava ${esperado}, veio ${ponto.data}`)
        saudavel = false
        break
      }
      valores.push(ponto.valor)
      mes += 1
      if (mes > 12) {
        mes = 1
        ano += 1
      }
    }

    if (!saudavel) {
      avisar(`${id}: forma compacta não regravada; o pacote segue com a anterior`)
      return
    }

    blocos.push(`  '${id}': { inicio: '${inicio}', valores: [${valores.join(', ')}] },`)
  }

  const ultimos: string[] = []
  for (const id of ULTIMO_PONTO) {
    const serie = cache.series.find((s) => s.id === id)
    const ponto = serie?.pontos[serie.pontos.length - 1]
    if (!ponto) {
      avisar(`${id}: sem ponto; último ponto ficará ausente`)
      continue
    }
    ultimos.push(`  '${id}': { data: '${ponto.data}', valor: ${ponto.valor} },`)
  }

  const conteudo = `/**
 * GERADO POR \`npm run fetch:serie\` — NÃO EDITAR À MÃO.
 *
 * Forma compacta das séries mensais, para o pacote do navegador. O cache
 * completo (\`cache.json\`) fica no servidor; aqui o que existe é um mês inicial
 * e um vetor posicional de valores, na escala de \`PercentualEscalado\`.
 *
 * A posição \`k\` do vetor é o mês \`inicio + k\`, sem buraco: o gerador percorre
 * o calendário e recusa gravar se a origem pular um mês.
 */

export interface SerieCompacta {
  /** Primeiro mês, em \`AAAA-MM\`. */
  readonly inicio: string
  readonly valores: readonly number[]
}

export const SERIES_COMPACTAS: Readonly<Record<string, SerieCompacta>> = {
${blocos.join(QUEBRA)}
}

export interface UltimoPonto {
  readonly data: string
  readonly valor: number
}

/** Séries de que o navegador precisa apenas do último ponto publicado. */
export const ULTIMAS_TAXAS: Readonly<Record<string, UltimoPonto>> = {
${ultimos.join(QUEBRA)}
}
`

  writeFileSync(ARQUIVO_COMPACTO, conteudo, 'utf8')
  console.log(`[series] forma compacta gravada para ${COMPACTAS.length} séries`)
}

/**
 * Nem uma exceção inesperada derruba isto.
 *
 * `process.exitCode` fica em 0 de propósito: o passo do CI é
 * `continue-on-error`, mas depender só disso deixaria o script capaz de
 * quebrar quem o rodasse à mão antes do build.
 */
main().catch((erro: unknown) => {
  avisar(`erro inesperado: ${erro instanceof Error ? erro.message : String(erro)}`)
  avisar('o build prossegue com o valor em cache (R-3).')
})
