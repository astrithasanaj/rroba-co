export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="sq">
  <head>
    <meta charset="utf-8" />
    <title>Kjo faqe nuk u ngarkua</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #ffffff; color: #111111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #8a8a8a; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #a61e35; color: #f7f7f7; }
      .secondary { background: #f7f7f7; color: #111111; border-color: #e5e5e5; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Kjo faqe nuk u ngarkua</h1>
      <p>Diçka shkoi keq nga ana jonë. Provo ta rifreskosh ose kthehu në ballinë.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Provo përsëri</button>
        <a class="secondary" href="/">Kthehu në ballinë</a>
      </div>
    </div>
  </body>
</html>`;
}
