/**
 * As defesas de `api/contato` além da validação de conteúdo —
 * `lib/contato/protecao.ts`, auditoria de segurança de 14/10/2026 (§7.100).
 *
 * Cada bloco trava um ataque que foi PROVADO localmente contra a rota antes da
 * correção: corpo gigante, chave de limite falsificada, envio de outro site e
 * JSON fora do formato.
 */

import { describe, expect, it } from 'vitest'

import {
  camposDe,
  chaveDeOrigem,
  CORPO_MAXIMO_EM_BYTES,
  lerCorpoLimitado,
  LimiteDeFrequencia,
  origemAceita,
} from '../../src/lib/contato/protecao'

const cabecalhos = (h: Record<string, string>) => new Headers(h)

describe('corpo limitado', () => {
  it('lê o corpo de um formulário normal', async () => {
    const r = new Request('https://x/api', { method: 'POST', body: '{"a":"b"}' })
    expect(await lerCorpoLimitado(r)).toBe('{"a":"b"}')
  })

  it('recusa pelo content-length declarado, sem ler', async () => {
    const r = new Request('https://x/api', {
      method: 'POST',
      body: 'x',
      headers: { 'content-length': String(CORPO_MAXIMO_EM_BYTES + 1) },
    })
    expect(await lerCorpoLimitado(r)).toBeNull()
  })

  it('recusa quem omite o tamanho e manda mais que o limite', async () => {
    const grande = 'x'.repeat(CORPO_MAXIMO_EM_BYTES + 10)
    const fluxo = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(grande))
        c.close()
      },
    })
    const r = new Request('https://x/api', { method: 'POST', body: fluxo, duplex: 'half' } as RequestInit)
    expect(await lerCorpoLimitado(r)).toBeNull()
  })
})

describe('origem', () => {
  const json = { 'content-type': 'application/json', host: 'calculoficial.com.br' }

  it('aceita o formulário do próprio site', () => {
    expect(
      origemAceita(
        cabecalhos({ ...json, origin: 'https://calculoficial.com.br', 'sec-fetch-site': 'same-origin' }),
      ),
    ).toBe(true)
  })

  it('recusa texto puro — o que um formulário de outro site consegue enviar', () => {
    expect(origemAceita(cabecalhos({ 'content-type': 'text/plain', host: 'calculoficial.com.br' }))).toBe(false)
  })

  it('recusa outro site, pela origem e pelo sec-fetch-site', () => {
    expect(origemAceita(cabecalhos({ ...json, origin: 'https://evil.example' }))).toBe(false)
    expect(origemAceita(cabecalhos({ ...json, 'sec-fetch-site': 'cross-site' }))).toBe(false)
  })

  it('confere o host repassado pelo proxy', () => {
    expect(
      origemAceita(
        cabecalhos({
          'content-type': 'application/json',
          host: 'interno:3000',
          'x-forwarded-host': 'calculoficial.com.br',
          origin: 'https://calculoficial.com.br',
        }),
      ),
    ).toBe(true)
  })
})

describe('chave do limite de frequência', () => {
  it('usa o ÚLTIMO endereço — o que o proxy acrescentou', () => {
    // Medido antes da correção: "2.2.2.2, 1.1.1.1" passava como 2.2.2.2.
    expect(chaveDeOrigem(cabecalhos({ 'x-forwarded-for': '2.2.2.2, 1.1.1.1' }))).toBe('1.1.1.1')
    expect(chaveDeOrigem(cabecalhos({ 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1')
  })

  it('sem cabeçalho, uma chave só para todos', () => {
    expect(chaveDeOrigem(cabecalhos({}))).toBe('sem-endereco')
  })
})

describe('campos recebidos', () => {
  it('JSON fora do formato vira campos vazios, não exceção', () => {
    for (const json of [null, 42, 'texto', [1, 2]]) {
      expect(camposDe(json)).toMatchObject({ motivo: '', mensagem: '', decorridoMs: 0 })
    }
  })

  it('campo que não é texto vira vazio', () => {
    expect(camposDe({ motivo: { toString: 1, valueOf: 1 }, mensagem: 'oi', decorridoMs: '9' })).toEqual({
      motivo: '',
      mensagem: 'oi',
      email: '',
      calculadora: '',
      site: '',
      decorridoMs: 0,
    })
  })
})

describe('limite de frequência', () => {
  it('três por endereço na janela', () => {
    const l = new LimiteDeFrequencia(1_000, 3, 10_000, 100, 10)
    expect([0, 1, 2, 3].map((t) => l.excedeu('a', t))).toEqual([false, false, false, true])
    expect(l.excedeu('a', 2_000)).toBe(false)
  })

  it('o teto global segura quem tem muitos endereços', () => {
    const l = new LimiteDeFrequencia(1_000, 3, 10_000, 5, 100)
    const r = ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => l.excedeu(k, i))
    expect(r).toEqual([false, false, false, false, false, true])
  })

  it('passar do teto de endereços não zera o limite de quem está abusando', () => {
    const l = new LimiteDeFrequencia(1_000, 1, 10_000, 1_000, 3)
    expect(l.excedeu('abusador', 0)).toBe(false)
    // Endereços novos empurram os mais antigos — mas quem acabou de enviar é o
    // mais recente, e continua lembrado.
    l.excedeu('x', 1)
    l.excedeu('y', 2)
    expect(l.excedeu('abusador', 3)).toBe(true)
    l.excedeu('z', 4)
    l.excedeu('w', 5)
    expect(l.excedeu('abusador', 6)).toBe(true)
  })
})
