# Trilha de estudo — base (Marugoto · A1 Starter)

> Documento de trabalho do agente `trilha-estudo`. É uma **base/ideia** para discussão —
> a implementação será planejada à parte. O usuário fornecerá o conteúdo a fatiar; aqui fica o esqueleto.

## Ideia
Uma **trilha estilo Duolingo** (etapa por etapa), seguindo a ideologia do **Marugoto**:
cada trajeto gira em torno de um **tema** e de **"can-do"** (o que o aluno consegue fazer),
combinando **りかい (compreensão: vocabulário/escrita)** e **かつどう (atividade: usar a língua)**.

Reaproveita os mecanismos que já existem no app:
- **Flashcards** (memorização com furigana) → fase de vocabulário do tema.
- **Quiz** (leitura/gramática/tradução) → fase de compreensão.
- **Desafio** (cronômetro + combo) → checkpoint do trajeto.

## Estrutura proposta
```
Trilha
 └─ Trajeto (tema, com 1 "can-do")
     └─ Etapas (3–5 nós, estilo trilha)
         ├─ nó de vocabulário  (flashcards do tema)
         ├─ nó de escrita/kana (quiz curto)
         ├─ nó de frase/gramática (quiz curto)
         └─ checkpoint (desafio do tema) → libera o próximo trajeto
```
Cada etapa concluída acende o próximo nó (bloqueado→aberto→concluído); concluir o checkpoint
libera o trajeto seguinte. Progresso por trajeto salvo no `localStorage`.

## Os 3 primeiros trajetos (rascunho)
### Trajeto 1 — あいさつ · Saudações & primeiros contatos
- **Can-do:** cumprimentar, se apresentar com o nome, agradecer/se despedir.
- Vocabulário: おはよう, こんにちは, こんばんは, さようなら, ありがとう, すみません, はじめまして.
- Escrita: introdução ao hiragana (linhas あ/か/さ).
- Frase: 「わたしは ___ です。」 (apresentar o nome).
- Checkpoint: situações de saudação (qual frase usar).

### Trajeto 2 — わたし · Eu & você
- **Can-do:** dizer nome, nacionalidade e ocupação; perguntar o do outro.
- Vocabulário: なまえ, くに, しごと, がくせい, せんせい + países/profissões básicas.
- Gramática: は (tópico), の (posse), か (pergunta), です.
- Frase: 「___ は がくせいです。」 / 「おなまえは？」
- Checkpoint: montar uma autoapresentação curta.

### Trajeto 3 — たべもの · Comida & gostos
- **Can-do:** dizer o que gosta/não gosta; pedir algo simples.
- Vocabulário: みず, おちゃ, ごはん, パン, さかな, やさい, くだもの.
- Gramática: が (com 好き), を (objeto), ください.
- Frase: 「すしが すきです。」 / 「みずを ください。」
- Checkpoint: pedir comida/bebida numa situação.

## A planejar (antes de implementar)
- Modelo de dados da trilha (trajetos/etapas/estados) e migração.
- Tela da trilha (mapa de nós) — UI/UX (pedir plano aos agentes `ui`/`ux`).
- Como o conteúdo fornecido pelo usuário é **fatiado** em etapas (vocab/escrita/frase/checkpoint).
- Reuso vs. novo: quais nós usam flashcard/quiz existentes e o que precisa ser criado.
- Critérios de "can-do" e desbloqueio.
