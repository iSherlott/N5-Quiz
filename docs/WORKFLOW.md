# Fluxo de trabalho — N5-Quiz (time de agentes)

App de quiz JLPT N5: **arquivo único** `index.html` (UI + lógica), dados em `data.js`
(**gerado** por `build-data.js`), `sw.js` (cache — subir a versão a cada mudança de arquivo cacheado).
Offline-first, tema "Solo Leveling / Sistema", interface em **pt-BR**.

## Regras de ouro

1. **Integração é só do líder.** Apenas a sessão principal (líder) edita
   `index.html`, `data.js`, `build-data.js` e `sw.js`. Os agentes **NÃO** editam esses arquivos —
   eles leem o código, pesquisam e entregam **specs/planos** (o quê, onde, trechos de CSS/JS, critérios de aceite).
2. **Planejamento primeiro.** Toda feature nova começa por um **plano escrito** antes de implementar:
   - Problema / objetivo
   - Proposta (abordagem) + alternativas
   - UI/UX (layout, estados, animações, acessibilidade)
   - Modelo de dados / persistência (localStorage `n5quiz_v1`)
   - Riscos e impacto (offline, performance, saves antigos → migração)
   - Plano de teste (incl. validação no celular)
   - Passos de rollout (+ bump `sw.js`)
   O líder revisa o plano com o usuário, **aprova**, e só então integra.
3. **Correto por construção.** Japonês sempre verificado; furigana por caractere quando houver kanji.
4. **Validar no celular** antes de fechar qualquer mudança visual (viewport ~375×812 e menor).

## Ciclo de uma feature
pedido → agente(s) do domínio entregam **plano** → usuário aprova → **líder integra** no `index.html`
→ `mobile-qa` valida → commit (+bump `sw.js`) → push.

## Time de agentes (`.claude/agents/`)
| Agente | Responsável por |
|---|---|
| `mobile-qa` | valida a estrutura/responsividade no celular (roda o preview, mede, tira print) |
| `ui` | UI da página (visual, tema, componentes, CSS) |
| `ux` | UX da página (fluxos, navegação, microinterações, hierarquia) |
| `desktop-ui` | adapta UI/UX para computador (mouse/teclado, hover/foco, uso do espaço) — só aditivo via media queries, sem mexer no mobile; alinhado a `ui`/`ux` |
| `quiz` | administração do Quiz (categorias, formato das questões, intensidades) |
| `flashcard` | administração do Flashcard (conjuntos, furigana, desafio, pontuação) |
| `conquistas` | sistema de conquistas/títulos (e complementos de título) |
| `level` | sistema de nível (curva, rank) |
| `xp` | sistema de XP (ganho, bônus, balanceamento) |
| `status` | menu de status (radar de atributos, áreas, recordes) |
| `audio` | áudios (Web Audio: seleção/acerto/erro, mute) |
| `trilha-estudo` | trilha de estudo estilo Duolingo seguindo o Marugoto (recebe conteúdo a fatiar) |
| `marugoto-sensei` | intérprete do método Marugoto (A1); gera conteúdo/atividades que alimentam a trilha |
| `curriculum-architect` | estrutura o curso como DAG (Seção→Unidade→Nó→Lição→Item), dependências e checkpoints |
| `gamification-ux` | gamificação/UX da trilha: trilha sinuosa, estados dos nós, vidas, streak, recompensas |
| `srs-engine` | repetição espaçada SM-2 por item, injeção 70/30, fila offline |
| `content-factory` | gera/valida exercícios mobile (WORD_BANK/MULTIPLE_CHOICE/LISTEN_AND_TAP/TRANSLATE_INPUT) |
| `dicas-recursos` | sugere ideias e recursos de implementação para planejarmos |

> Trilha (offline, client-side): ver `docs/trilha-arquitetura.md` (modelo de dados em `localStorage`
> + contratos de módulos JS — equivalente offline às "APIs"; **sem backend/REST**).

> Observação de descoberta: os agentes ficam versionados com o repo (`n5-quiz/.claude/agents/`).
> Para o Claude Code carregá-los automaticamente, abra a sessão tendo `n5-quiz` como pasta de trabalho
> (ou copie-os para `~/.claude/agents/`).
