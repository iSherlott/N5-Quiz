# AGENTS.md — Quiz JLPT N5

Contexto para o agente de IA (opencode + GPT) que vai evoluir este projeto.

## O que é
App web (PWA) de quiz para estudar japonês nível **JLPT N5**. Roda no Safari do iPhone,
pode ser instalado via **Adicionar à Tela de Início** e funciona offline. Sem App Store,
sem backend, sem etapa de build.

## Stack e princípios (NÃO quebrar)
- **Vanilla HTML/CSS/JS** num único `index.html`. Sem framework, sem bundler, sem npm install.
- **Offline-first**: nada de fontes/CDNs externas. Use só fontes nativas do iOS já definidas nas
  variáveis CSS (`--jp`, `--display`, `--ui`).
- Os dados vêm de `data.js` carregado por `<script>` (NÃO usar `fetch` de JSON — quebra em `file://`).
- Persistência só com `localStorage` (chave `n5quiz_v1`). Sem cookies, sem servidor.
- iOS: respeitar `env(safe-area-inset-*)`, alvos de toque ≥ 44px, `viewport-fit=cover`.
- Estética: minimalismo japonês (papel washi, tinta sumi, vermelho 朱 `--shu`). Manter limpo.

## Arquivos
- `index.html` — app completo (UI + lógica). Máquina de estados: HOME → QUIZ → RESULTADO → REVISÃO.
- `data.js` — `window.QUIZ_DATA` (~4.6 mil questões) e `window.QUIZ_CATS` (rótulos de categoria). **GERADO** por `build-data.js`.
- `build-data.js` — gerador (Node) que produz `data.js` a partir de bancos verificados + motores de regra
  (conjugação de verbos/adjetivos; tabelas de leitura de números/contadores/tempo; bancos de kanji/katakana/vocab/etc.).
  Japonês "correto por construção". Rode `node build-data.js` após editar bancos. Não é parte do runtime (sem build no app).
- `data.old.js` — backup do database anterior (5.000 questões antigas). Não é carregado pelo app.
- `manifest.webmanifest`, `sw.js`, `icon-*.png`, `favicon-32.png` — PWA/ícones.
- `opencode.json` — config do opencode (modelo GPT).

## Categorias (portões) e estilos de questão
15 categorias em `QUIZ_CATS`: vocab, verbo, adj, kanji, kata, gram, contador, numero, tempo, kana, antonimo,
variado, **cor**, **expr** (expressões), **saudacao**. Glifos kanji por categoria ficam em `CAT_K` (index.html).
Estilos: vocab=frase (kanji↔hiragana) "do que/quem fala"; verbo/adj=forma/tempo a partir do dicionário;
kanji=1 kanji→leitura/significado; kata=palavra estrangeira→katakana; gram=lacuna de partícula; contador/numero/tempo=
leitura correta; kana=frase só em kana→tradução pt; antonimo=palavra→oposto; cor/expr/saudacao=situação/leitura→resposta.
**Caçada (quantidade):** `LEN_OPTS` = 10/30/50/Infinito (`n:0` = todo o pool, exibido como ∞).

## Formato dos dados (`data.js`)
```js
window.QUIZ_CATS = { "vocab":"Vocabulário", "verbo":"Verbos", ... };
window.QUIZ_DATA = [ { "i":0, "q":"pergunta", "o":["op1","op2","op3","op4"], "a":2, "c":"vocab" }, ... ];
// i = id único | q = enunciado | o = 4 opções | a = índice (0-3) da correta | c = categoria
```
Invariantes a preservar ao gerar/editar dados: 4 opções distintas, `a` aponta para a correta,
`q` único, `c` ∈ chaves de `QUIZ_CATS`.

## Lógica de nível

### Progressão estilo Solo Leveling (principal)
Sistema de XP/nível/rank/atributos/títulos em `index.html` (funções a partir de `// progressão`).
Persistido no STATE: `xp, level, rank, perfectSessions, titlesUnlocked[], equippedTitle, titleManual`.
- **XP por questão** (`answer()`): acerto = `round(10 · streakMult(streakAnterior) · retry)`, onde
  `streakMult(s)=min(1+0.1·s, 2.0)`; erro = 2 fixo. `retry=0.40` quando a questão já estava em
  `wrongIds` no início da sessão (`session.retrySet`) — acerto de revisão vale menos.
- **Bônus de fim de sessão** (`result()`): por precisão, escalando com nº de questões (`·served/10`):
  100%→50 (Despertar Perfeito), ≥90→25, ≥70→12, <70→5. Sessões com <5 questões não dão bônus.
- **Nível**: `xpStep(L)=round(40·L^1.45)`, `xpForLevel(L)`=soma acumulada, sem teto.
- **Rank**: faixas de nível → E/D/C/B/A/S/国家級 (`RANKS`).
- **Atributos** (`attrs()`): **6 tipos de estudo** (語彙 Vocabulário, 漢字 Kanji, 文法 Gramática,
  動形 Verbos/Adj., 仮名 Kana, 数時 Núm./Tempo) que cobrem as 12 categorias. Cada um: `v`=valor
  (`10+floor(8·√acertos)`) e `f`=fração 0..1 (`p/(p+30)`). Render em **hexágono radar SVG** (`radarSVG()`,
  sem libs) + legenda com barras que crescem (`f`).
- **Títulos** (`TITLES`): ~18 desbloqueáveis por condição; `equippedTitle` mostrado no status.
  Auto-equipa o mais alto até o usuário escolher um manualmente (`titleManual`).
- **Notificações**: `syncProgress(snapshot)` compara antes/depois e enfileira (`notify`/`flushNotif`)
  pop-ups “⟦ NOTIFICAÇÃO ⟧” para level-up, rank-up e títulos novos.
- Ao zerar progresso, o `resetBtn` também reseta todos esses campos.

### Preparo p/ a prova (secundário)
`levelInfo()` ainda mapeia a precisão geral em rótulos N5 (“aquecendo → … → pronto p/ a prova”),
exibido como subtítulo do status. “Áreas” mostra precisão por categoria (pontos fracos).

## Como testar localmente
Servir a pasta por HTTP (o `file://` funciona para uso básico, mas o service worker e a
instalação só funcionam em http/https):
```bash
cd n5-quiz
python3 -m http.server 8080   # abrir http://localhost:8080
```

## Boas tarefas para o agente
- Modo “revisão espaçada” usando `wrongIds`.
- Filtro por subcategoria (ex.: só conjugação de verbos).
- Estatística de tempo por questão; histórico por dia; gráfico simples (Canvas, sem libs).
- Acessibilidade (aria-live no feedback), modo de alto contraste.
- Exportar/importar progresso (JSON) via `localStorage`.

## Convenções
- Português (pt-BR) na interface. Comentários curtos.
- Sem dependências novas sem motivo forte. Manter um arquivo só sempre que possível.
- Ao alterar arquivos cacheados, suba a versão do cache em `sw.js` (`n5-quiz-v2`, ...).
