# Quiz JLPT N5 — site (deploy no GitHub Pages)

PWA estático (HTML/CSS/JS). Não tem build: os arquivos da raiz **são** o site.
Este repositório já vem com um workflow que **publica no GitHub Pages automaticamente** a cada push.

## Opção A — Deploy automático (recomendado)

1. Crie um repositório **vazio** no GitHub (ex.: `n5-quiz`).
2. No terminal, dentro desta pasta:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/n5-quiz.git
   git branch -M main
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source: GitHub Actions**.
   O workflow `.github/workflows/deploy.yml` roda sozinho e publica o site.
4. Acesse: `https://SEU-USUARIO.github.io/n5-quiz/`

A partir daí, **todo `git push` na branch `main` faz o deploy automático**.

> Atalho com GitHub CLI (se tiver o `gh` instalado e autenticado):
> ```bash
> gh repo create n5-quiz --public --source=. --remote=origin --push
> ```
> Depois é só ativar Pages → Source: GitHub Actions.

## Opção B — Deploy pela branch (sem Actions)

1. Faça o push (passos 1–2 acima).
2. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`**.
   O arquivo `.nojekyll` já está incluído para o Pages servir tudo como está.

## Atualizar depois

Edite os arquivos, então:
```bash
git add -A && git commit -m "atualiza conteúdo" && git push
```
Como é um PWA com cache (service worker), **abra o site uma vez online** depois do deploy para
o app instalado pegar a versão nova (a versão do cache muda a cada atualização).

## Arquivos do site
`index.html` · `data.js` (banco de 5.000 questões) · `exams.js` (11 simulados temáticos, com áudio) ·
`manifest.webmanifest` · `sw.js` (offline) · ícones · `.nojekyll`
