# Introdução + Unidades 1–6 — Fundamentos de kana & kanji (rumo à U7)

> Objetivo: cobrir o "buraco" antes da U7 — o aluno chega à U7 dominando **hiragana +
> katakana** e reconhecendo **~100 kanji básicos**. Base no plano do usuário, adaptado ao
> **formato da trilha** (mc / word-bank / diálogo) e ao **nível N5**.

## O que cabe / não cabe no motor atual
- **Cabe:** reconhecimento de kana (kana→romaji e romaji→kana), leitura/significado de kanji,
  frases simples (word-bank), diálogos (story), checkpoints.
- **Não cabe hoje:** escrita traço-a-traço (sem módulo de caligrafia), áudio/shadowing e SRS.
  - Áudio/shadowing + SRS → **Fase 2**. Memorização bruta de kana/kanji → já existe em **Flashcards**.

## Distribuição de kanji (curada, SEM repetição — total 100)
- **U1 (10):** 一 二 三 四 五 六 七 八 九 十
- **U2 (15):** 百 千 万 円 人 日 月 火 水 木 金 土 曜 年 時
- **U3 (15):** 分 半 今 朝 昼 夜 午 前 後 毎 何 名 子 男 女
- **U4 (20):** 山 川 田 空 天 気 雨 花 木(já)… → ajustar; natureza/lugar: 山 川 田 空 天 気 雨 花 海 林 森 石 犬 虫 魚 鳥 草 竹 米 貝
- **U5 (20):** 上 下 中 大 小 右 左 口 目 耳 手 足 力 体 心 頭 顔 足(já)… → corpo/posição: 上 下 中 大 小 右 左 口 目 耳 手 足 力 体 行 来 入 出 立 見
- **U6 (20):** 学 校 先 生 本 友 私 会 社 店 駅 道 町 食 飲 聞 話 読 書 語
> Nota: listas U4/U5 a refinar ao construir (remover duplicatas e fixar exatamente 20 cada).

## Estrutura por unidade (nós, no formato da trilha)
1. **intro** (story): apresenta a tabela/linhas de kana ou os kanji do bloco.
2. **kana/leitura** (lesson mc): reconhecimento nos dois sentidos.
3. **kanji** (lesson mc): leitura + significado (sem entregar a resposta no enunciado).
4. **frase** (lesson wb/mc): uso em frase simples (partículas は/が/を/に/で/へ; ます/ません/ました).
5. **check** (checkpoint ≥80%).

## Can-do por unidade (resumo)
- **U1:** ler あ〜そ; números 一〜十; apresentar-se (はじめまして / わたしは〜です / これは〜です).
- **U2:** completar hiragana; números grandes/数え (百千万円); dias/tempo (日月火…曜年時); intro katakana.
- **U3:** katakana completo + dakuten/handakuten + yōon/sokuon/chōon; horas (分半今前後…).
- **U4:** ler kana+kanji misturados; natureza/lugar; partículas essenciais.
- **U5:** leitura funcional (placas/horários/formulários); corpo/posição/verbos de movimento.
- **U6:** consolidação; escola/cidade/ações; pronto para a U7.

## Tabelas de kana (gojūon, 46 básicos cada)
**Hiragana:** あa いi うu えe おo / かka きki くku けke こko / さsa しshi すsu せse そso /
たta ちchi つtsu てte とto / なna にni ぬnu ねne のno / はha ひhi ふfu へhe ほho /
まma みmi むmu めme もmo / やya ゆyu よyo / らra りri るru れre ろro / わwa をwo / んn
**Katakana:** アa イi ウu エe オo / カka キki クku ケke コko / サsa シshi スsu セse ソso /
タta チchi ツtsu テte トto / ナna ニni ヌnu ネne ノno / ハha ヒhi フfu ヘhe ホho /
マma ミmi ムmu メme モmo / ヤya ユyu ヨyo / ラra リri ルru レre ロro / ワwa ヲwo / ンn
**Dakuten ゛:** k→g, s→z, t→d, h→b (か→が, は→ば). **Handakuten ゜:** h→p (は→ぱ).
**Yōon:** sílaba i + ゃ/ゅ/ょ (きゃ kya, しょ sho, ちゅ chu); em katakana キャ/ショ/チュ.

## Ordem na trilha
Array `COURSE`: **u1 … u6 → u7 → u8** (intro primeiro; U7 passa a desbloquear após a U6).
Pilotando **U1 primeiro**; 2–6 entram na sequência após validação.
