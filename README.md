# 五 · Quiz JLPT N5

App de quiz para estudar japonês **nível N5**, usando suas 5.000 questões como base.
Roda no **iPhone (Safari)**, instala via *Adicionar à Tela de Início*, funciona **offline** e
guarda acertos, erros e seu **nível de japonês** — **sem App Store**, sem backend, sem build.

Junto vem um **ambiente opencode + GPT** já configurado para você continuar evoluindo o app.

---

## Conteúdo da pasta
```
n5-quiz/
├─ index.html              ← o app (interface + lógica, arquivo único)
├─ data.js                 ← 5.000 questões (gerado do seu Excel)
├─ manifest.webmanifest    ← metadados do PWA
├─ sw.js                   ← cache offline (service worker)
├─ icon-180/192/512*.png   ← ícones (selo 五)
├─ opencode.json           ← config do opencode apontando para o GPT
├─ AGENTS.md               ← contexto do projeto para o agente de IA
└─ README.md               ← este arquivo
```

---

## Parte 1 — Usar no iPhone 16 (sem App Store)

O jeito mais limpo é publicar a pasta num host estático grátis e abrir o link no iPhone.
Assim o app fica instalável e 100% offline depois da 1ª abertura.

### Opção A — Netlify Drop (mais fácil, ~30s, sem conta obrigatória)
1. No computador, acesse **https://app.netlify.com/drop**.
2. **Arraste a pasta `n5-quiz` inteira** para a área indicada.
3. Copie o link gerado (algo como `https://seu-nome.netlify.app`).
4. No iPhone, abra esse link no **Safari**.
5. Toque em **Compartilhar** (□↑) → **Adicionar à Tela de Início** → *Adicionar*.
6. Abra pelo ícone **五**. Pronto — funciona offline e salva seu progresso.

### Opção B — GitHub Pages
1. Crie um repositório e suba os arquivos da pasta `n5-quiz` (na raiz).
2. *Settings → Pages → Branch: main / root → Save*.
3. Abra a URL `https://SEU-USUARIO.github.io/SEU-REPO/` no Safari do iPhone e *Adicionar à Tela de Início*.

### Opção C — Vercel
`npm i -g vercel` → dentro da pasta rode `vercel` → abra a URL no iPhone.

### Abrir direto do arquivo (sem hospedar)
Dá para enviar a pasta para o app **Arquivos** (iCloud Drive) e abrir `index.html` no Safari.
Funciona para jogar, mas a **instalação na tela de início e o cache offline** só funcionam
quando o app é aberto por um link **http/https** (Opções A/B/C). Recomendo hospedar.

### Testar no computador antes
```bash
cd n5-quiz
python3 -m http.server 8080
# abra http://localhost:8080
```

---

## Parte 2 — Ambiente opencode + GPT

[opencode](https://opencode.ai) é um agente de código no terminal (estilo Claude Code), porém
livre para escolher o modelo. Aqui ele já vem apontado para o **GPT**.

### 1) Instalar o opencode
```bash
# qualquer uma das três:
curl -fsSL https://opencode.ai/install | bash
# ou
brew install sst/tap/opencode
# ou
npm i -g opencode-ai

opencode --version
```

### 2) Conectar sua conta GPT (OpenAI)
Pegue uma API key em https://platform.openai.com/api-keys e então:
```bash
# jeito 1 — interativo (recomendado)
opencode auth login        # escolha "OpenAI" e cole a chave

# jeito 2 — variável de ambiente (o opencode.json já lê {env:OPENAI_API_KEY})
export OPENAI_API_KEY="sk-..."
```

### 3) Rodar dentro do projeto
```bash
cd n5-quiz
opencode          # abre a interface (TUI); o opencode.json e o AGENTS.md são lidos automaticamente
```
Comandos úteis dentro do opencode: `/init` (analisa o repo e atualiza o AGENTS.md),
`/undo`, `/share`. Modo automação: `opencode run "sua tarefa"`.

### Escolher o modelo GPT
O `opencode.json` está com `"model": "openai/gpt-5.5"`. Se sua chave não tiver acesso ao 5.5,
troque por `openai/gpt-5.4` ou `openai/gpt-5.4-mini`. Para ver o que está disponível:
```bash
opencode models            # lista os modelos; use o formato openai/<id>
```

### Exemplos de pedido ao GPT (já com contexto do AGENTS.md)
- “Adicione um **modo revisão espaçada** que prioriza as questões de `wrongIds`.”
- “Crie um **filtro por subcategoria** (ex.: só conjugação de verbos) na tela inicial.”
- “Faça um **gráfico de evolução diária** da precisão usando Canvas, sem bibliotecas.”
- “Adicione **exportar/importar progresso** em JSON.”

> Dica: o `AGENTS.md` já explica as regras do projeto (arquivo único, offline, formato de `data.js`,
> nada de `fetch` de JSON). Isso mantém o GPT no trilho.

---

## Como o nível é calculado
É um **indicador de estudo**, não uma nota oficial do JLPT. Ele usa sua **precisão geral**
(acertos ÷ respondidas) e o volume respondido para rotular de *aquecendo* a *pronto p/ a prova*.
A seção **Áreas** mostra a precisão por categoria (vocabulário, verbos, kanji, gramática, etc.),
revelando seus pontos fracos.

## Trocar/atualizar as questões
Basta regerar o `data.js` mantendo o formato (veja `AGENTS.md`). Se você editar arquivos que ficam
em cache, suba a versão em `sw.js` (`n5-quiz-v2`) para forçar atualização nos aparelhos já instalados.
