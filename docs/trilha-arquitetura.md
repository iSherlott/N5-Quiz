# Trilha — Arquitetura técnica (offline / client-side)

> Tradução do ecossistema de 4 agentes para a realidade do N5-Quiz: **arquivo único, offline,
> sem servidor**. Não há REST/DB remoto. O "banco" é o **`localStorage`** (chave `n5quiz_v1`) + dados
> estáticos no app; as "APIs" são **contratos de módulos JS** (funções puras + JSON). No fim há um
> **mapa para REST**, caso um dia exista backend. **Planejamento — nada implementado ainda.**

## 0. Camadas
- **Conteúdo (estático, no app):** o curso (DAG), as lições e os itens atômicos — só leitura.
- **Estado do usuário (`localStorage`):** progresso dos nós, SRS por item, gamificação (vidas/streak/XP/moedas).
- **Módulos (lógica):** Curriculum, Gamification, SRS, Content — funções puras, sem rede.

---

## 1. Modelo de dados — CONTEÚDO (DAG do curso)
Estrutura estática (Seção → Unidade → Nó → Lição → Item). Vive no app (ex.: `COURSE` junto de `DECKS`).
```json
{
  "section_id": "a1", "section_title": "Marugoto A1",
  "units": [{
    "unit_id": "u7", "unit_title": "町 · Cidade & direções", "cando": "Pedir e dar direções",
    "nodes": [
      {"node_id":"u7-vocab","node_type":"concept","depends_on":[],"lesson":"u7-l-vocab","item_tags":["u7-lugares","u7-direcao"]},
      {"node_id":"u7-escrita","node_type":"concept","depends_on":["u7-vocab"],"lesson":"u7-l-escrita"},
      {"node_id":"u7-frase","node_type":"concept","depends_on":["u7-escrita"],"lesson":"u7-l-frase"},
      {"node_id":"u7-dialogo","node_type":"story","depends_on":["u7-frase"],"lesson":"u7-l-dialogo"},
      {"node_id":"u7-check","node_type":"checkpoint","depends_on":["u7-dialogo"],"pass":0.8}
    ]
  }]
}
```
**Item atômico** (unidade mínima rastreada pelo SRS): `{ "item_id":"i.eki", "tags":["u7-lugares"], "front":"駅", "read":"えき", "pt":"estação" }`.

## 2. Modelo de dados — ESTADO do usuário (`localStorage n5quiz_v1`)
```js
STATE.trail = {
  nodes: { "u7-vocab":{state:"COMPLETED", score:1.0}, "u7-escrita":{state:"UNLOCKED"} }, // máquina de estados
  srs:   { "i.eki":{ef:2.6, interval:6, reps:2, next_review:1781200000000, last_q:4} },   // por item
  game:  { lives:5, lives_ts:1781190000000, streak:7, streak_ts:"2026-06-04", freeze:1, coins:120, xp:0 }
}
```
- `nodes[*].state` ∈ `LOCKED|UNLOCKED|IN_PROGRESS|COMPLETED|GOLDEN`.
- `srs[item]` = estado SM-2 do item.
- `game`: `lives` (0–5) + `lives_ts` (último consumo, p/ regen 4h); `streak` + `streak_ts` (data local AAAA-MM-DD); `freeze` (qtde de Streak Freeze); `coins`, `xp`.

---

## 3. Contratos internos (módulos = "APIs" offline)
Funções puras; recebem/retornam JSON; sem efeitos de rede.

### 3.1 Curriculum (Agente 1)
- `generateCourseDAG(subject, target) → COURSE` (autoria/build; a partir do catálogo Marugoto).
- `validateNodeDependency(nodeId, trail) → bool` — `true` se todos os `depends_on` estão `COMPLETED|GOLDEN`.

### 3.2 Gamification & UX (Agente 2)
- `calcSnakeCoordinates(nodeList, screenW) → [{node_id,x,y}]`
  - x oscila em torno do centro: `x = cx + A·sin(i·π/period)`, `A = min(screenW*0.28, 120)`, `period≈2`;
    `y = i·STEP` (STEP≈110px). Responsivo 320–480px.
- `nodeState(nodeId, trail) → estado` (deriva da máquina + dependências).
- `regenLives(game, now) → game` — repõe `+1` vida a cada `4h` desde `lives_ts`, teto 5.
- `processStreakUpdate(game, nowLocalDate) → game` — se data local avançou 1 dia: mantém/incrementa;
  se pulou dia: zera (ou consome `freeze`). Baseado no **fuso local do dispositivo**.
- `triggerMicroReward(eventType) → {reward, amount}` (moedas/baú/2×XP por marcos).

### 3.3 SRS (Agente 3) — SM-2
- `calcNextReview(item, q) → item'` (q=0..5):
  - `EF' = max(1.3, EF + (0.1 − (5−q)(0.08 + (5−q)0.02)))`
  - se `q<3`: `reps=0; interval=1` (reaprender). senão: `reps++`; `interval = reps===1?1 : reps===2?6 : round(interval·EF')`.
  - `next_review = now + interval·86400000`.
- `generateHybridLessonPayload(nodeId, trail, now) → {items:[...]}`:
  - vencidos = `srs` com `next_review ≤ now` que pertencem ao app; se houver → lição = **70% itens novos do nó + 30% vencidos** (arredondando p/ o tamanho da lição).
- `ingestOfflineAnswers(answers[]) → trail'` — ordena por timestamp e aplica `calcNextReview` cronologicamente.

### 3.4 Content Factory (Agente 4)
- `generateExercisePayload(nodeId, itemTags, type) → exercise` (tipos abaixo).
- `validateContentIntegrity(exercise) → {ok, errors[]}` — exige ≥3 distratores plausíveis, 1 chave correta, dica; rejeita nulos/ambiguidade.

**Schema de exercício (mobile):**
```json
{ "exercise_id":"u7-fr-01", "type":"WORD_BANK",
  "instruction":"Monte: \"Até a estação, por favor.\"",
  "stimulus":"えき / おねがいします",
  "correct_answer":["えき","まで","おねがいします"],
  "distractors":["こうえん","から","みせ"],
  "hint":"〜まで = até (destino).", "item_ids":["i.eki","i.made"] }
```
Tipos: `WORD_BANK` · `MULTIPLE_CHOICE` · `LISTEN_AND_TAP` (áudio só Web Audio/TTS offline — se inviável, marcar pendente) · `TRANSLATE_INPUT`.

---

## 4. Orquestração (em processo, sem rede)
1. **Montagem do curso:** `generateCourseDAG` → `calcSnakeCoordinates` + estados dos nós → renderiza o mapa.
2. **Abrir nó:** `validateNodeDependency` → `generateHybridLessonPayload` (70/30) → `generateExercisePayload`+`validateContentIntegrity` por item → entrega a lição.
3. **Concluir lição:** por item, `calcNextReview` (agenda revisão) → atualiza `nodes[*].state`/`score`
   (checkpoint exige ≥0.8) → `regenLives`/`processStreakUpdate`/`triggerMicroReward` → `save()`.
Tudo síncrono no dispositivo; "sync offline" = `ingestOfflineAnswers` processa respostas acumuladas em ordem.

## 5. Se um dia houver backend (mapa p/ REST)
Os contratos acima viram endpoints 1:1 (não necessários agora):
| Módulo | Função | REST equivalente |
|---|---|---|
| Curriculum | generateCourseDAG | `GET /courses/{id}/dag` |
| Curriculum | validateNodeDependency | `GET /users/{u}/nodes/{n}/eligible` |
| SRS | generateHybridLessonPayload | `POST /users/{u}/lessons` (target_node) |
| SRS | calcNextReview / ingestOfflineAnswers | `POST /users/{u}/reviews` (batch, timestamps) |
| Gamification | process_streak/lives/reward | `POST /users/{u}/session-result` |
| Content | generate/validate | `POST /content/exercises` |

## 6. Decisões pendentes (impacto na arquitetura)
1. **Vidas/streak:** a trilha usa **5 vidas + regen 4h + streak diário** (novo) — separado das 3 vidas do modo Sobrevivência do quiz? (recomendo: trilha = sistema próprio; quiz mantém o atual.)
2. **SRS substitui ou complementa** `wrongIds`/maestria de flashcard? (recomendo: SRS por item passa a ser a fonte única de revisão.)
3. **Áudio do `LISTEN_AND_TAP`** offline: Web Audio (tons) não fala palavras; TTS do dispositivo (`speechSynthesis`) funciona offline em iOS? — validar; senão, adiar esse tipo.
4. **Escopo do piloto:** implementar primeiro só a Unidade 7 (5 nós) com `WORD_BANK`+`MULTIPLE_CHOICE` e SRS básico, e evoluir.
