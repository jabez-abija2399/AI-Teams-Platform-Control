/**
 * Static HTML/CSS scaffold when user (or architecture) forbids frameworks/backends.
 */

export function buildStaticHtmlCssFiles(
  safeTitle: string,
  stackHint: string,
): Record<string, string> {
  const note = stackHint.replace(/`/g, "'").replace(/\$/g, '');
  const css = `/* ${safeTitle} — static HTML/CSS only */
:root {
  --bg: #f2f0ef;
  --fg: #1a3339;
  --primary: #245f73;
  --accent: #733e24;
  --muted: #4a5f66;
  --card: #ffffff;
  --border: #d4d2d0;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  font-family: Georgia, "Times New Roman", serif;
  background:
    radial-gradient(ellipse at top, rgba(36, 95, 115, 0.12), transparent 55%),
    var(--bg);
  color: var(--fg);
}
a { color: var(--primary); }
.shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}
.card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 12px 40px rgba(26, 51, 57, 0.08);
}
.brand {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 700;
  font-family: system-ui, sans-serif;
}
h1 {
  margin: 10px 0 0;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}
.sub {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.5;
  font-family: system-ui, sans-serif;
}
label {
  display: block;
  margin: 16px 0 6px;
  font-size: 0.8rem;
  font-family: system-ui, sans-serif;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 1rem;
  font-family: system-ui, sans-serif;
  background: #fff;
}
input:focus-visible,
button:focus-visible,
.btn:focus-visible {
  outline: 3px solid rgba(36, 95, 115, 0.45);
  outline-offset: 2px;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  background: var(--primary);
  color: var(--bg);
  padding: 8px 12px;
  z-index: 10;
  font-family: system-ui, sans-serif;
}
.skip-link:focus {
  left: 8px;
}
button, .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--primary);
  color: var(--bg);
  font-weight: 700;
  font-size: 0.95rem;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  text-decoration: none;
}
.btn-ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--border);
  margin-top: 10px;
}
.footer-link {
  margin-top: 16px;
  text-align: center;
  font-size: 0.85rem;
  font-family: system-ui, sans-serif;
}
`;

  const page = (heading: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading} · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="shell">
    <main id="main" class="card">
      <p class="brand">${safeTitle}</p>
      ${body}
    </main>
  </div>
</body>
</html>
`;

  return {
    'index.html': page(
      'Welcome',
      `<h1>${safeTitle}</h1>
      <p class="sub">${note}</p>
      <a class="btn" href="login.html">Log in</a>
      <a class="btn btn-ghost" href="signup.html">Sign up</a>`,
    ),
    'login.html': page(
      'Login',
      `<h1>Log in</h1>
      <p class="sub">Static HTML/CSS page — no backend.</p>
      <form action="home.html" method="get" autocomplete="on">
        <label for="login-email">Email</label>
        <input id="login-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required />
        <label for="login-password">Password</label>
        <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
        <button type="submit">Continue to home</button>
      </form>
      <p class="footer-link">No account? <a href="signup.html">Sign up</a></p>`,
    ),
    'signup.html': page(
      'Sign up',
      `<h1>Sign up</h1>
      <p class="sub">Static HTML/CSS page — no backend.</p>
      <form action="home.html" method="get" autocomplete="on">
        <label for="signup-name">Name</label>
        <input id="signup-name" name="name" type="text" autocomplete="name" placeholder="Your name" />
        <label for="signup-email">Email</label>
        <input id="signup-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required />
        <label for="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" autocomplete="new-password" placeholder="••••••••" required minlength="8" />
        <button type="submit">Create account</button>
      </form>
      <p class="footer-link">Already have an account? <a href="login.html">Log in</a></p>`,
    ),
    'home.html': page(
      'Home',
      `<h1>Welcome home</h1>
      <p class="sub">You reached the home page (static demo — no server session).</p>
      <a class="btn" href="index.html">Back to start</a>
      <a class="btn btn-ghost" href="login.html">Log out</a>`,
    ),
    'css/styles.css': css,
    'README.md': `# ${safeTitle}

Static HTML + CSS only (no Next.js, no React, no backend).

${note}

## Open locally

Open \`index.html\` in a browser, or:

\`\`\`bash
python3 -m http.server 8080
\`\`\`

Visit http://localhost:8080

## Files

- \`index.html\` — landing
- \`login.html\` — login form (static)
- \`signup.html\` — signup form (static)
- \`home.html\` — home after form submit
- \`css/styles.css\` — shared styles
`,
  };
}
