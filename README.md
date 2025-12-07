<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Et3Z0vT0CP3-2gsHNZb1tFl92_keljkp

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## CI e Deploy (GitHub Actions)

- **CI:** há um workflow em `.github/workflows/ci.yml` que roda em `push` e `pull_request` para a branch `main`. Ele instala dependências com `npm ci` e executa `npm run build`.
- **Deploy (GitHub Pages → `docs/`):** o workflow em `.github/workflows/deploy.yml` foi atualizado para rodar em `push` para `main`, executar `npm run build`, copiar o conteúdo de `dist/` para a pasta `docs/` e commitar/pushar a pasta `docs/` na branch `main`.

Passos rápidos para habilitar o deploy automático (usando `docs/`):
- Certifique-se de que a branch padrão do repositório é `main`.
- Nas configurações do repositório (Settings → Pages), defina a fonte (Source) para **Branch `main`** e **/docs folder**.
- Após o primeiro push para `main`, o workflow de deploy irá gerar os arquivos em `dist/`, copiar para `docs/` e commitar os arquivos de publicação em `main`. O Pages servirá esses arquivos a partir de `docs/`.

URL típica de publicação: `https://<seu-usuario>.github.io/<seu-repositorio>/` (substitua conforme apropriado).

Se quiser que eu também adicione um `CNAME` (para domínio personalizado) ou ajuste o `base` no `vite.config.ts` (necessário para subpaths), diga e eu configuro.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Et3Z0vT0CP3-2gsHNZb1tFl92_keljkp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## CI e Deploy (GitHub Actions)

- **CI:** há um workflow em `.github/workflows/ci.yml` que roda em `push` e `pull_request` para a branch `main`. Ele instala dependências com `npm ci` e executa `npm run build`.
- **Deploy (GitHub Pages):** há um workflow em `.github/workflows/deploy.yml` que roda em `push` para `main`, executa `npm run build` e publica `./dist` usando `peaceiris/actions-gh-pages` para a branch `gh-pages`.

Passos rápidos para habilitar o deploy automático:
- Certifique-se de que a branch padrão do repositório é `main`.
- Nas configurações do repositório (Settings → Pages), defina a fonte para a branch `gh-pages` (pasta `/`). O workflow criará e atualizará essa branch automaticamente.
- Após o primeiro push para `main`, o workflow de deploy irá gerar os arquivos em `dist/` e publicar no GitHub Pages.

URL típica de publicação: `https://<seu-usuario>.github.io/<seu-repositorio>/` (substitua conforme apropriado).

Se quiser que eu também adicione um `CNAME` ou ajuste o `base` no `vite.config.ts` para um site com path personalizado, diga e eu configuro.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Et3Z0vT0CP3-2gsHNZb1tFl92_keljkp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
