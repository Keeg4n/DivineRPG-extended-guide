# DivineRPG Extended guide

Sources of the guide site: https://keeg4n.github.io/DivineRPG-extended-guide/

- `docs/` - pages in Markdown (the text is in Russian), `mkdocs.yml` - navigation and theme (MkDocs Material).
- Every push to `main` rebuilds and publishes the site (`.github/workflows/deploy.yml`).
- Admins can edit pages right on the site: open any page with `?edit`, click the pencil and enter the admin password
  (`docs/assets/editor.js`). The password decrypts a GitHub key limited to this repository (`docs/assets/editor-key.json`).
