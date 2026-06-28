# Plano — Trilha de estudo (estilo Duolingo + Marugoto)

> **Planejamento-primeiro.** Este é um PLANO para aprovação — nada foi implementado no `index.html`.
> Piloto: **Unidade 7 (町 · Cidade & direções)**. Consolida `marugoto-sensei` (conteúdo),
> `trilha-estudo` (estrutura/dados), `ui` e `ux` (tela). Fontes: `docs/marugoto-A1-unidades.md`.

## 1. Visão (UX macro)
Uma **trilha vertical de nós** (caminho sinuoso, estilo Duolingo). Cada **unidade** = um trajeto temático
com um **can-do**; o trajeto termina num **checkpoint** (a tarefa comunicativa do tema). Nós abrem em
sequência (bloqueado → atual → concluído); concluir o checkpoint conclui a unidade e libera a próxima.

## 2. Nós da Unidade 7 (concreto)
| # | Nó | Mecânica | Conteúdo | Reuso? |
|---|----|----------|----------|--------|
| 1 | 語 **Vocabulário** | flashcard (estudo + mini-desafio) | lugares (駅,公園,地下鉄,病院,銀行,コンビニ,レストラン,ホテル) + direção (まっすぐ,右,左,近く,曲がる) | maioria já existe nos decks |
| 2 | 仮 **Escrita/leitura** | quiz curto (5) | leitura de kana/kanji dos lugares | reusa formato kanji/kana |
| 3 | 文 **Frases & partículas** | quiz curto (5) | までから/へに + verbos de movimento (lacuna) | reusa formato gram |
| 4 | 会 **Diálogo (táxi)** | leitor/atividade | diálogo p.116 (4 falas) com furigana+pt; ordenar/escolher fala | **novo** (tipo "diálogo") |
| 5 | 試 **Checkpoint** | desafio temático | situações: escolher a frase certa ("até X, por favor", "vire à direita") | reusa motor de desafio |

Princípio Marugoto: **Katsudou** (nós 4–5: usar a língua) apoiado por **Rikai** (nós 1–3: vocabulário/gramática).

## 3. Estrutura de dados (proposta)
Conteúdo da trilha (em `index.html`, junto de `DECKS`):
```js
TRAIL = [{
  id:"u7", k:"町", name:"Cidade & direções", cando:"Pedir e dar direções na cidade",
  nodes:[
    {id:"vocab", t:"flash", k:"語", label:"Vocabulário", cards:[...]},   // cartas do tema (furigana)
    {id:"escrita", t:"quiz", k:"仮", label:"Escrita", items:[...]},       // questões {q,o,a,...}
    {id:"frase", t:"quiz", k:"文", label:"Frases", items:[...]},
    {id:"dialogo", t:"dialog", k:"会", label:"Diálogo", lines:[{jp,furi,pt}...]},
    {id:"check", t:"challenge", k:"試", label:"Checkpoint", items:[...]}
  ]
}]
```
Progresso (localStorage `n5quiz_v1`):
```js
STATE.trail = { u7:{ done:["vocab","escrita"] } }   // nós concluídos
```
Regra de desbloqueio: **sequencial** — o nó disponível é o 1º não concluído. Checkpoint concluído ⇒
unidade concluída ⇒ próxima unidade liberada. Nós concluídos podem ser refeitos (revisão).

## 4. UI da página (tema Sistema)
- **Entrada:** novo dropdown na home **"Trilha 道"** com botão **"Abrir trilha"** (mesmo fluxo de quiz/flashcards).
- **Tela da trilha (`trilhaMap`)**: cabeçalho (‹ voltar · "町 · Cidade & direções" · progresso 2/5) +
  **caminho vertical** de nós. Cada nó = um **selo circular** com o kanji (語/仮/文/会/試), ligados por
  linha tracejada. Estados:
  - **bloqueado:** cinza, 🔒, opaco.
  - **atual:** azul do Sistema (`--sys`), brilho + leve pulso (chama atenção).
  - **concluído:** ✓ dourado (`--gold`), linha até ele preenchida.
  - **checkpoint:** selo maior/destacado (試), tipo "porta" do trajeto.
- Respeita o layout travado-na-tela das telas de atividade; a tela da trilha **rola** (lista) como a home.
- Reusa tokens existentes (`--card/--line/--sys/--gold/--shu`, fontes `--jp/--display`).

## 5. UX (fluxo e estados)
1. Home → "Abrir trilha" → mapa da Unidade 7 (nó atual em destaque).
2. Tocar nó disponível → abre a atividade (flashcard/quiz/diálogo/checkpoint) reusando as telas atuais.
3. Concluir → volta ao mapa; o caminho avança (animação), próximo nó acende.
4. Checkpoint concluído → celebração ("trajeto concluído 完了") → próxima unidade liberada.
5. Nó bloqueado dá feedback ("conclua o anterior"). Nós concluídos podem ser refeitos.
- **Diálogo (nó novo):** mostra as 4 falas (furigana + pt); atividade leve = **ordenar as falas** ou
  **escolher a resposta certa** do motorista. Sem pontuação punitiva (foco em compreensão).
- **Checkpoint:** desafio curto "situação → frase certa" (ex.: situação "quer ir a Fujisawa de táxi" →
  「ふじさわ まで おねがいします。」). Conta como conclusão do trajeto.

## 6. Reuso × novo
- **Reuso:** decks de flashcard e formatos de quiz (kanji/kana/gram), motor de desafio, sons, tema.
- **Novo:** tela `trilhaMap` (UI), tipo de nó **diálogo**, estrutura `TRAIL` + progresso `STATE.trail`,
  e o conteúdo específico da Unidade 7 (algumas cartas/itens/falas autorais a partir do catálogo).

## 7. Implementação em fases (após aprovação)
1. Dados: `TRAIL` (Unidade 7) + migração `STATE.trail` no `load()`/reset.
2. UI: `trilhaMap` (caminho + nós + estados) + entrada na home.
3. Ligar nós às atividades existentes (flashcard/quiz) filtradas ao conteúdo do nó.
4. Nó **diálogo** (leitor + atividade leve) e **checkpoint** (situação→frase).
5. Conclusão/desbloqueio + animação + persistência. Bump `sw.js`. `mobile-qa` valida.

## 8. Decisões pendentes (preciso de você)
1. **XP/medalhas na trilha?** Dar XP modesto por nó e tratar o checkpoint como desafio (conta medalha)?
   Ou manter a trilha separada da progressão Solo Leveling?
2. **Conteúdo dos nós 2/3 (escrita/frase):** gerar automaticamente a partir do vocabulário do tema,
   ou eu autoro ~5 questões por nó com base no catálogo?
3. **Atividade do diálogo:** "ordenar as falas" ou "completar/escolher a fala"? (ou as duas)
4. **Entrada:** dropdown "Trilha 道" na home (junto de Quiz/Flashcards) — ok?
