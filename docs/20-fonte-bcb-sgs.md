---
doc: 20-fonte-bcb-sgs
projeto: Cálculo Oficial
versao: 1.0
status: medido
depende_de: [06-api-spec, 16-adr/ADR-006]
---

# Ficha da fonte — SGS do Banco Central

> **Medida com requisição real em 02/08/2026**, e não copiada de exemplo de
> terceiro. `06-api-spec` §4.1 exige isso em letras maiúsculas: *"não assumir a
> partir de exemplos de terceiros"*.
>
> A ficha do projeto irmão (`docs/fontes/bcb-sgs.md`) foi o **ponteiro** que
> encurtou a busca, exatamente como `ESTADO-DO-PROJETO` §6.0 prescreve. Ela
> acertou três armadilhas, **errou uma** e **não tinha duas** que a medição
> encontrou. É a demonstração mais curta de por que ponteiro não substitui
> conferência.

---

## 1. O serviço

| Item | Medido |
|---|---|
| Base | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados` |
| Autenticação | Nenhuma |
| Formato | `?formato=json` |
| Cabeçalho exigido | Nenhum. Responde igual com e sem `accept` ou `user-agent` |
| Série inexistente | **HTTP 502**, não 404 |

### 1.1 As duas formas de consulta

```
GET .../dados/ultimos/{N}?formato=json
GET .../dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa
```

---

## 2. As séries que este projeto usa

| Id interno | Código | O que é | Produtor |
|---|---|---|---|
| `selic-ao-ano` | 4189 | Selic acumulada no mês, anualizada | Banco Central |
| `ipca-mensal` | 433 | IPCA, variação mensal | **IBGE** |
| `igpm-mensal` | 189 | IGP-M, variação mensal | **FGV** |
| `inpc-mensal` | 188 | INPC, variação mensal | **IBGE** |
| `poupanca-mensal` | 195 | Rendimento da poupança | Banco Central |
| `tr-mensal` | 226 | Taxa Referencial | Banco Central |

> **A série 11 não é a Selic que se quer.** Ela é a Selic **diária** — devolveu
> `0.052531` em 30/07/2026. Quem procura "a taxa básica" e pega a 11 publica um
> número cem vezes menor com aparência de certo. A anualizada é a **4189**.

---

## 3. As seis armadilhas

As três primeiras a ficha do projeto irmão já trazia, e se confirmaram. As três
seguintes são novas.

### 3.1 `valor` é string, com ponto decimal ✅ confirmada

`"14.15"`, nunca `14.15`. Convertido por decomposição em inteiros, sem passar
por ponto flutuante (`ADR-004` A-6/A-7).

### 3.2 `data` é `dd/MM/aaaa` ✅ confirmada

Nunca ISO. Casa com a nossa regra de jamais usar `new Date(string)`.

### 3.3 Defasagem de cerca de um mês ✅ confirmada — e **desigual entre séries**

Na coleta de 03/08/2026:

```
igpm-mensal      último ponto: julho/2026
ipca-mensal      último ponto: junho/2026
inpc-mensal      último ponto: junho/2026
```

A ficha dizia "~1 mês". É verdade, e insuficiente: as séries **não andam
juntas**. Uma tela que compare IPCA e IGP-M no "mês corrente" comparará meses
diferentes se confiar no calendário em vez da data que veio com o dado. Daí
`S-5` — o valor nunca aparece sem a data.

### 3.4 ⚠️ A ordem não é garantida, e **difere por série** — NOVA

O achado mais perigoso do dia. As duas respostas abaixo saíram da mesma chamada
`ultimos/N`, no mesmo minuto:

```
4189 →  01/07/2026, 01/06/2026, 01/05/2026, …   decrescente
 433 →  01/02/2026, 01/03/2026, 01/04/2026, …   crescente
```

Ler o último item do array como "o mais recente" **acerta numa e erra na
outra** — e erra devolvendo um valor plausível, de um mês vizinho. O coletor
ordena por data antes de gravar, e um caso-ouro roda as duas capturas reais.

### 3.5 ⚠️ O schema não é uniforme — NOVA

TR e poupança trazem um terceiro campo:

```json
{"data":"29/07/2026","dataFim":"29/08/2026","valor":"0.1729"}
```

Validador que recuse campo desconhecido rejeitaria as duas séries inteiras. O
nosso exige `data` e `valor` legíveis e ignora o resto.

### 3.6 ⚠️ `ultimos/N` tem teto de **20** — NOVA, e a ficha errava por outro lado

O serviço responde **400** com a mensagem em texto claro:

```
A quantidade máxima de valores deve ser 20
```

Foi assim que a primeira execução do coletor falhou nas seis séries de uma vez.

**E a "janela máxima de 10 anos" da ficha não vale como regra geral.** Medido no
endpoint por intervalo, série 433:

| Janela pedida | Resultado |
|---|---|
| 5 anos | 200 · 66 pontos |
| 10 anos | 200 · 126 pontos |
| 11 anos | 200 · 138 pontos |
| **20 anos** | **200 · 246 pontos** |

O limite acompanha a **quantidade de pontos**, não a de anos — série diária
estoura muito antes de dez anos, e série mensal passa de vinte sem reclamar. Por
isso as três séries de índice usam intervalo de 20 anos, e as diárias usam
`ultimos/20`.

---

## 4. Atribuição

O Banco Central **republica** IGP-M (FGV) e IPCA/INPC (IBGE). Creditar só o
republicador é atribuição errada, e o catálogo de séries carrega o produtor de
cada uma em campo próprio, com teste que cobra.

---

## 5. O que esta ficha **não** autoriza

`CLAUDE.md` regra 10 continua valendo em cima dela: indicador econômico **não é
parâmetro legal**. Nada daqui vira valor de caso-ouro de cálculo trabalhista ou
tributário, nada daqui entra em `lib/params/`, e a falha desta fonte nunca
interrompe o build (`R-3`).
