# `golden/` — casos-ouro

O núcleo do plano de testes (`12-test-plan` §3). 150 a 220 casos para o v1.

**Regra CO-1.** O valor esperado vem de conferência manual contra o texto da
norma, de exemplo publicado em fonte oficial, ou de documento real anonimizado.
Nunca de outro site, de software de terceiro ou de resposta gerada por modelo
de linguagem.

**Data de referência sempre explícita.** Caso que dependa da data atual passa a
falhar sozinho na virada do exercício, e é assim que suítes morrem.

**Nenhum caso-ouro é marcado como pendente para desbloquear entrega.** Se um
falha, ou o código está errado ou o caso está errado — descobrir qual é o
trabalho, não contorná-lo.
