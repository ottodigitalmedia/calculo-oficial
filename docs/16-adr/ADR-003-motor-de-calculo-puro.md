---
doc: ADR-003
projeto: Cálculo Oficial
versao: 1.0
status: aprovado
depende_de: [04-architecture]
---

# ADR-003 — Motor de cálculo puro, sem dependência de runtime

## Contexto

O cálculo é o produto. Um defeito nele produz números errados que pessoas usam para conversar com o empregador, decidir sobre um emprego ou conferir um pagamento.

Além disso, o cálculo executa no navegador do usuário, sobre dados sensíveis que nunca devem sair do dispositivo — o que faz de cada dependência da cadeia um vetor potencial de exfiltração.

## Opções consideradas

**A. Cálculo dentro dos componentes de interface.** Menos arquivos, entrega mais rápida. Torna o teste do cálculo dependente de renderização, mistura formatação com apuração e amarra o motor à interface para sempre.

**B. Camada de serviço acoplada ao framework.** Separa cálculo de interface, mas mantém o motor preso ao ambiente e sujeito à sua cadeia de dependências.

**C. Pacote isolado, sem dependência de runtime, sem conhecimento de interface, rede, ambiente ou relógio.**

## Decisão

**Opção C.**

O motor vive em `src/lib/engine/` e obedece a quatro contratos:

| Contrato | Regra |
|---|---|
| C-M1 | Toda função pública retorna resultado **e** traço de cálculo |
| C-M2 | Puro: mesma entrada e mesma data de referência produzem sempre a mesma saída. Não lê relógio, rede nem ambiente |
| C-M3 | Erro de domínio retorna valor tipado, nunca exceção. Exceção significa defeito |
| C-M4 | Não formata: devolve centavos e basis points; a formatação em pt-BR pertence à apresentação |

Reforçado por regra de fronteira verificada estaticamente: o motor não importa nada da aplicação, dos componentes nem da camada de formatação.

## Consequências positivas

- **Segurança.** A parte do sistema que toca dado do usuário não tem cadeia de dependências a comprometer. Neutraliza a ameaça AM-01 no ponto onde ela causaria o maior dano.
- **Testabilidade.** Os casos-ouro comparam inteiros com inteiros, sem renderização, sem tempo, sem ambiente. Testes rápidos e determinísticos são testes que continuam sendo executados.
- **C-M2 é o que mantém a suíte viva.** Com data de referência sempre explícita, nenhum caso-ouro começa a falhar sozinho na virada do exercício — o padrão que faz equipes aprenderem a ignorar falha vermelha.
- **Portabilidade.** Se um dia houver servidor, geração de PDF ou API, o mesmo motor roda sem alteração.
- **C-M1 torna `RF-003` estrutural.** Não existe caminho de cálculo sem traço, então a memória de cálculo não pode ser esquecida em uma calculadora nova.

## Consequências negativas

- Mais código: tipos de entrada e saída explícitos por calculadora, e uma camada de conversão entre motor e interface.
- Sem biblioteca de datas, a aritmética de calendário precisa ser implementada e testada — trabalho real, e a fonte mais provável de defeito sutil no motor.
- C-M4 obriga formatação explícita em toda exibição; esquecê-la produz "450000" na tela em vez de "R$ 4.500,00". Mitigado por componentes de exibição que só aceitam valores tipados.
- A regra de fronteira exige verificação automatizada para não erodir com o tempo.

## Custo de reversão

**Muito alto na prática, e por isso a decisão é definitiva.**

Tecnicamente seria possível fundir o motor à interface, mas isso destruiria os casos-ouro, o teste isolado e a garantia de C-M2 — ou seja, todo o aparato que sustenta a única métrica sem tolerância do projeto (`M-3`).

O caminho oposto tem custo assimétrico: extrair um motor puro de cálculo já espalhado pela interface é uma reescrita completa. A decisão é barata agora e cara depois, o que é exatamente o critério para tomá-la no início.
