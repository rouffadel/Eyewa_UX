# Deployment cache behavior

After each deploy, clients should load **new** `index.html`, which references **new** hashed JS/CSS files. If `index.html` is cached, users keep running an old app.

## App (this repo)

- Production build uses `outputHashing: "all"` (hashed `main-*.js`, `styles-*.css`).
- `index.html` includes no-cache meta tags.
- `/config/appsettings*.json` is requested with a cache-busting query param.

## Server (required on VPS)

Apply `nginx-cache.conf` in your nginx site, then reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## After deploy

Users with a stuck old version: hard refresh once (`Ctrl+Shift+R` / `Cmd+Shift+R`) or clear site data for your domain.
