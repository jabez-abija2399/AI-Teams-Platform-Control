/**
 * Dynamic Static HTML/CSS website scaffold tailored to the project's actual domain and title.
 */

function isAuthProject(title: string, note: string): boolean {
  const lower = `${title} ${note}`.toLowerCase();
  return (
    lower.includes('login app') ||
    lower.includes('auth only') ||
    lower.includes('simple login') ||
    (lower.includes('login') && !lower.includes('studio') && !lower.includes('photo') && !lower.includes('store') && !lower.includes('slash'))
  );
}

export function buildStaticHtmlCssFiles(
  safeTitle: string,
  stackHint: string,
): Record<string, string> {
  const note = stackHint.replace(/`/g, "'").replace(/\$/g, '');
  const title = safeTitle || 'Slash Photo Studio';

  if (isAuthProject(title, note)) {
    return buildAuthScaffold(title, note);
  }

  return buildCreativeStudioScaffold(title, note);
}

function buildAuthScaffold(safeTitle: string, note: string): Record<string, string> {
  const css = `/* ${safeTitle} — Auth Design System */
:root {
  --bg: #0d1117;
  --fg: #e6edf3;
  --primary: #38bdf8;
  --primary-hover: #0ea5e9;
  --muted: #8b949e;
  --card: #161b22;
  --border: #30363d;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--fg);
}
.shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}
.card {
  width: 100%;
  max-width: 440px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.brand {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 700;
}
h1 { margin: 12px 0 6px; font-size: 1.8rem; }
.sub { margin: 0 0 24px; color: var(--muted); font-size: 0.95rem; }
label { display: block; margin: 16px 0 6px; font-size: 0.85rem; font-weight: 600; }
input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 1rem;
  background: #0d1117;
  color: #fff;
}
input:focus-visible, button:focus-visible, .btn:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  background: var(--primary);
  color: #0d1117;
  padding: 8px 12px;
  z-index: 10;
  font-family: system-ui, sans-serif;
}
.skip-link:focus {
  left: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--primary);
  color: #0d1117;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}
.btn:hover { background: var(--primary-hover); }
.btn-ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--border);
  margin-top: 12px;
}
.footer-link { margin-top: 20px; text-align: center; font-size: 0.85rem; color: var(--muted); }
.footer-link a { color: var(--primary); }
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
</html>`;

  return {
    'index.html': page(
      'Welcome',
      `<h1>${safeTitle}</h1>
      <p class="sub">${note}</p>
      <a class="btn" href="login.html">Log in</a>
      <a class="btn btn-ghost" href="signup.html">Create an Account</a>`,
    ),
    'login.html': page(
      'Login',
      `<h1>Welcome back</h1>
      <p class="sub">Enter your credentials to continue</p>
      <form action="home.html" method="get">
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="username" placeholder="you@example.com" required />
        <label for="password">Password</label>
        <input id="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
        <button type="submit" class="btn">Sign In</button>
      </form>
      <p class="footer-link">Need an account? <a href="signup.html">Sign up</a></p>`,
    ),
    'signup.html': page(
      'Sign Up',
      `<h1>Create account</h1>
      <p class="sub">Get started with your free account</p>
      <form action="home.html" method="get">
        <label for="name">Full Name</label>
        <input id="name" type="text" autocomplete="name" placeholder="Your Name" required />
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="username" placeholder="you@example.com" required />
        <label for="password">Password</label>
        <input id="password" type="password" autocomplete="new-password" placeholder="••••••••" required minlength="8" />
        <button type="submit" class="btn">Create Account</button>
      </form>
      <p class="footer-link">Already have an account? <a href="login.html">Log in</a></p>`,
    ),
    'home.html': page(
      'Dashboard',
      `<h1>Member Home</h1>
      <p class="sub">You are successfully logged in to ${safeTitle}.</p>
      <a class="btn" href="index.html">Back to Home</a>
      <a class="btn btn-ghost" href="login.html">Sign Out</a>`,
    ),
    'css/styles.css': css,
    'README.md': `# ${safeTitle}\n\nStatic HTML/CSS authentication template.\n`,
  };
}

function buildCreativeStudioScaffold(safeTitle: string, note: string): Record<string, string> {
  const css = `/* ${safeTitle} — Modern Studio Design System */
:root {
  --bg: #090b10;
  --bg-surface: #12151e;
  --bg-card: #181c28;
  --fg: #f3f4f6;
  --fg-muted: #9ca3af;
  --primary: #f59e0b;
  --primary-hover: #d97706;
  --accent: #38bdf8;
  --border: #262c3d;
  --radius: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  min-height: 100%;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg);
  color: var(--fg);
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration: none;
}

.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  background: var(--primary);
  color: #000;
  padding: 8px 12px;
  z-index: 1000;
  font-weight: bold;
}
.skip-link:focus {
  left: 8px;
}

/* Header & Navigation */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  background: rgba(9, 11, 16, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--fg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-badge {
  background: var(--primary);
  color: #000;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  list-style: none;
}

.nav-links a {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--fg-muted);
  transition: color 0.2s ease;
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--primary);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius);
  background: var(--primary);
  color: #090b10;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--fg);
  border-color: var(--border);
}

.btn-outline:hover {
  background: var(--bg-surface);
  border-color: var(--primary);
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 80px 24px 60px;
  background: radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
}

.hero-tag {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--primary);
  margin-bottom: 16px;
}

.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4.2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 20px;
}

.hero p {
  font-size: 1.15rem;
  color: var(--fg-muted);
  max-width: 650px;
  margin: 0 auto 32px;
}

.hero-cta {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* Gallery Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.gallery-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.gallery-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
}

.gallery-img-box {
  width: 100%;
  height: 280px;
  background: linear-gradient(135deg, #1f293d 0%, #111827 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--primary);
}

.gallery-info {
  padding: 20px;
}

.gallery-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary);
}

.gallery-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 4px;
}

/* Services / Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.pricing-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
}

.pricing-card.featured {
  border-color: var(--primary);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-card) 100%);
}

.pricing-title {
  font-size: 1.3rem;
  font-weight: 800;
}

.pricing-price {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--primary);
  margin: 16px 0;
}

.pricing-features {
  list-style: none;
  margin: 20px 0;
  flex: 1;
}

.pricing-features li {
  font-size: 0.9rem;
  color: var(--fg-muted);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pricing-features li::before {
  content: "✓";
  color: var(--primary);
  font-weight: bold;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--fg);
  font-size: 0.95rem;
  font-family: inherit;
}

.form-control:focus-visible, input:focus-visible, button:focus-visible, .btn:focus-visible {
  outline: 2px solid var(--primary);
}

/* Footer */
.footer {
  border-top: 1px solid var(--border);
  padding: 40px 24px;
  text-align: center;
  color: var(--fg-muted);
  font-size: 0.85rem;
}
`;

  const headerHtml = (activeNav: string) => `
  <header class="navbar">
    <a href="index.html" class="brand">
      <span>${safeTitle}</span>
      <span class="brand-badge">Studio</span>
    </a>
    <nav>
      <ul class="nav-links">
        <li><a href="index.html" class="${activeNav === 'home' ? 'active' : ''}">Home</a></li>
        <li><a href="gallery.html" class="${activeNav === 'gallery' ? 'active' : ''}">Gallery</a></li>
        <li><a href="services.html" class="${activeNav === 'services' ? 'active' : ''}">Services</a></li>
        <li><a href="about.html" class="${activeNav === 'about' ? 'active' : ''}">About</a></li>
        <li><a href="contact.html" class="${activeNav === 'contact' ? 'active' : ''}">Contact</a></li>
        <li><a href="booking.html" class="btn">Book Session</a></li>
      </ul>
    </nav>
  </header>`;

  const footerHtml = `
  <footer class="footer">
    <div class="container">
      <p>© 2026 ${safeTitle}. All rights reserved. Professional Photography & Creative Visuals.</p>
    </div>
  </footer>`;

  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} · Professional Photography Studio</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('home')}

  <main id="main">
    <section class="hero">
      <span class="hero-tag">High-End Visual Craft</span>
      <h1>Capturing Moments<br />That Define You</h1>
      <p>Welcome to ${safeTitle}. We craft editorial portraits, commercial campaigns, and cinematic events with uncompromising lighting and direction.</p>
      <div class="hero-cta">
        <a href="booking.html" class="btn">Book a Studio Shoot</a>
        <a href="gallery.html" class="btn btn-outline">Explore Portfolio</a>
      </div>
    </section>

    <section class="container">
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="hero-tag">Portfolio Highlights</span>
        <h2 style="font-size: 2rem; font-weight: 800;">Featured Shoots</h2>
      </div>

      <div class="gallery-grid">
        <div class="gallery-card">
          <div class="gallery-img-box">📸</div>
          <div class="gallery-info">
            <span class="gallery-category">Editorial Portrait</span>
            <h3 class="gallery-title">Vogue Style Studio Series</h3>
          </div>
        </div>
        <div class="gallery-card">
          <div class="gallery-img-box">⚡</div>
          <div class="gallery-info">
            <span class="gallery-category">Commercial & Brand</span>
            <h3 class="gallery-title">Luxury Fashion Campaign</h3>
          </div>
        </div>
        <div class="gallery-card">
          <div class="gallery-img-box">🎬</div>
          <div class="gallery-info">
            <span class="gallery-category">Cinematic Events</span>
            <h3 class="gallery-title">Gala & Premiere Coverage</h3>
          </div>
        </div>
      </div>
    </section>
  </main>

  ${footerHtml}
</body>
</html>`,

    'gallery.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gallery · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('gallery')}

  <main id="main" class="container">
    <div style="text-align: center; margin-bottom: 40px;">
      <span class="hero-tag">Visual Showcase</span>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Studio Photography Gallery</h1>
      <p style="color: var(--fg-muted); margin-top: 8px;">Explore our creative collection spanning portraits, fashion editorial, and commercial product shoots.</p>
    </div>

    <div class="gallery-grid">
      <div class="gallery-card">
        <div class="gallery-img-box">📷</div>
        <div class="gallery-info">
          <span class="gallery-category">Studio Portraits</span>
          <h3 class="gallery-title">Moody High-Contrast Headshots</h3>
        </div>
      </div>
      <div class="gallery-card">
        <div class="gallery-img-box">✨</div>
        <div class="gallery-info">
          <span class="gallery-category">Fashion</span>
          <h3 class="gallery-title">Autumn Lookbook 2026</h3>
        </div>
      </div>
      <div class="gallery-card">
        <div class="gallery-img-box">🌆</div>
        <div class="gallery-info">
          <span class="gallery-category">Location Shoot</span>
          <h3 class="gallery-title">Urban Neon Twilight</h3>
        </div>
      </div>
      <div class="gallery-card">
        <div class="gallery-img-box">💎</div>
        <div class="gallery-info">
          <span class="gallery-category">Product & Commercial</span>
          <h3 class="gallery-title">Timepiece Macro Reflections</h3>
        </div>
      </div>
      <div class="gallery-card">
        <div class="gallery-img-box">🎭</div>
        <div class="gallery-info">
          <span class="gallery-category">Creative Art</span>
          <h3 class="gallery-title">Color Gel Prism Experiment</h3>
        </div>
      </div>
      <div class="gallery-card">
        <div class="gallery-img-box">💍</div>
        <div class="gallery-info">
          <span class="gallery-category">Weddings & Love</span>
          <h3 class="gallery-title">Golden Hour Romance</h3>
        </div>
      </div>
    </div>
  </main>

  ${footerHtml}
</body>
</html>`,

    'services.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Services & Packages · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('services')}

  <main id="main" class="container">
    <div style="text-align: center; margin-bottom: 40px;">
      <span class="hero-tag">Pricing & Offerings</span>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Photography Packages</h1>
      <p style="color: var(--fg-muted); margin-top: 8px;">Transparent packages with full professional lighting, retouched master files, and private gallery delivery.</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <h3 class="pricing-title">Studio Portrait</h3>
        <p style="color: var(--fg-muted); font-size: 0.85rem;">Ideal for actors, executives & creatives</p>
        <div class="pricing-price">$250</div>
        <ul class="pricing-features">
          <li>1-Hour Studio Session</li>
          <li>2 Outfit Changes</li>
          <li>5 Master Retouched High-Res Photos</li>
          <li>Full Digital Usage Rights</li>
        </ul>
        <a href="booking.html" class="btn btn-outline">Book Portrait</a>
      </div>

      <div class="pricing-card featured">
        <span class="hero-tag" style="margin-bottom: 4px;">Most Popular</span>
        <h3 class="pricing-title">Editorial & Fashion</h3>
        <p style="color: var(--fg-muted); font-size: 0.85rem;">Complete creative direction & styling</p>
        <div class="pricing-price">$550</div>
        <ul class="pricing-features">
          <li>2.5-Hour In-Studio Shoot</li>
          <li>Creative Lighting & Color Gel Setup</li>
          <li>15 Editorial Retouched Deliverables</li>
          <li>Wardrobe & Posing Direction</li>
          <li>Online Proofing Gallery within 48h</li>
        </ul>
        <a href="booking.html" class="btn">Book Editorial</a>
      </div>

      <div class="pricing-card">
        <h3 class="pricing-title">Commercial & Brand</h3>
        <p style="color: var(--fg-muted); font-size: 0.85rem;">For lookbooks, campaigns & products</p>
        <div class="pricing-price">$1,200</div>
        <ul class="pricing-features">
          <li>Full Day Studio & Equipment Access</li>
          <li>Unlimited Product & Model Sets</li>
          <li>35 Commercial Grade Deliverables</li>
          <li>Commercial Worldwide License</li>
        </ul>
        <a href="booking.html" class="btn btn-outline">Inquire Brand</a>
      </div>
    </div>
  </main>

  ${footerHtml}
</body>
</html>`,

    'booking.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Book a Shoot · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('booking')}

  <main id="main" class="container" style="max-width: 680px;">
    <div style="text-align: center; margin-bottom: 36px;">
      <span class="hero-tag">Reserve Your Session</span>
      <h1 style="font-size: 2.2rem; font-weight: 900;">Book a Studio Session</h1>
      <p style="color: var(--fg-muted); margin-top: 6px;">Select your desired package and preferred time. Our team will confirm within 24 hours.</p>
    </div>

    <form style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px;" onsubmit="alert('Thank you! Your shoot reservation request has been received by ${safeTitle}.'); return false;">
      <div class="form-group">
        <label for="name">Your Name</label>
        <input id="name" type="text" class="form-control" placeholder="Jane Doe" required />
      </div>

      <div class="form-group">
        <label for="email">Email Address</label>
        <input id="email" type="email" class="form-control" placeholder="jane@example.com" required />
      </div>

      <div class="form-group">
        <label for="phone">Phone Number</label>
        <input id="phone" type="tel" class="form-control" placeholder="+1 (555) 000-0000" />
      </div>

      <div class="form-group">
        <label for="package">Select Photography Package</label>
        <select id="package" class="form-control" required>
          <option value="portrait">Studio Portrait ($250)</option>
          <option value="editorial" selected>Editorial & Fashion Shoot ($550)</option>
          <option value="commercial">Commercial Campaign ($1,200)</option>
          <option value="custom">Custom Creative Project</option>
        </select>
      </div>

      <div class="form-group">
        <label for="date">Preferred Date</label>
        <input id="date" type="date" class="form-control" required />
      </div>

      <div class="form-group">
        <label for="notes">Vision & Special Requests</label>
        <textarea id="notes" rows="4" class="form-control" placeholder="Tell us about the vibe, styling, mood, or deliverables you are looking for..."></textarea>
      </div>

      <button type="submit" class="btn" style="width: 100%; padding: 14px; font-size: 1rem;">Confirm Booking Request</button>
    </form>
  </main>

  ${footerHtml}
</body>
</html>`,

    'about.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>About · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('about')}

  <main id="main" class="container" style="max-width: 800px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span class="hero-tag">Our Story</span>
      <h1 style="font-size: 2.5rem; font-weight: 900;">About ${safeTitle}</h1>
    </div>

    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 40px; line-height: 1.8;">
      <p style="font-size: 1.1rem; margin-bottom: 20px;">
        Founded with a commitment to visual excellence, <strong>${safeTitle}</strong> provides world-class studio facilities, cinematic lighting setups, and dedicated creative direction.
      </p>
      <p style="color: var(--fg-muted); margin-bottom: 20px;">
        Whether you are building your personal portfolio, launching a brand collection, or capturing high-profile events, we blend technical mastery with an authentic human touch.
      </p>
      <h3 style="font-size: 1.3rem; margin: 30px 0 12px; color: var(--primary);">Studio Highlights</h3>
      <ul style="color: var(--fg-muted); padding-left: 20px; margin-bottom: 24px;">
        <li>2,400 sq. ft. soundproof studio with 20ft cyclorama wall</li>
        <li>Profoto & Broncolor strobe systems with custom modifiers</li>
        <li>On-site dressing room, hair/makeup vanity, and client lounge</li>
        <li>Same-week digital proofing and color-graded exports</li>
      </ul>
      <a href="booking.html" class="btn">Work with Us</a>
    </div>
  </main>

  ${footerHtml}
</body>
</html>`,

    'contact.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contact · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('contact')}

  <main id="main" class="container" style="max-width: 800px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span class="hero-tag">Get in Touch</span>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Contact the Studio</h1>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
      <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px;">
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">Studio Location</h3>
        <p style="color: var(--fg-muted); margin-bottom: 12px;">📍 100 Studio Way, Arts District, NY 10001</p>
        <p style="color: var(--fg-muted); margin-bottom: 12px;">📞 +1 (555) 890-4321</p>
        <p style="color: var(--fg-muted); margin-bottom: 24px;">✉️ hello@slashphotostudio.com</p>

        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Hours</h4>
        <p style="color: var(--fg-muted); font-size: 0.9rem;">Monday – Friday: 9:00 AM – 7:00 PM<br />Saturday: 10:00 AM – 6:00 PM<br />Sunday: By Appointment Only</p>
      </div>

      <form style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px;" onsubmit="alert('Message sent to studio!'); return false;">
        <div class="form-group">
          <label for="cname">Name</label>
          <input id="cname" type="text" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="cemail">Email</label>
          <input id="cemail" type="email" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="cmsg">Message</label>
          <textarea id="cmsg" rows="4" class="form-control" required></textarea>
        </div>
        <button type="submit" class="btn" style="width: 100%;">Send Message</button>
      </form>
    </div>
  </main>

  ${footerHtml}
</body>
</html>`,

    'login.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Client Login · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('home')}
  <main id="main" class="container" style="max-width: 480px;">
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px;">
      <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Client Portal</h1>
      <p style="color: var(--fg-muted); font-size: 0.9rem; margin-bottom: 24px;">Sign in to view your private proofing galleries.</p>
      <form action="home.html" method="get">
        <div class="form-group">
          <label for="login-email">Email Address</label>
          <input id="login-email" name="email" type="email" autocomplete="username" class="form-control" placeholder="client@example.com" required />
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" class="form-control" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn" style="width: 100%;">Sign In</button>
      </form>
      <p style="margin-top: 20px; text-align: center; font-size: 0.85rem; color: var(--fg-muted);">New client? <a href="signup.html" style="color: var(--primary);">Create account</a></p>
    </div>
  </main>
  ${footerHtml}
</body>
</html>`,

    'signup.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Create Account · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('home')}
  <main id="main" class="container" style="max-width: 480px;">
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px;">
      <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Create Account</h1>
      <p style="color: var(--fg-muted); font-size: 0.9rem; margin-bottom: 24px;">Register for private gallery access and proof downloads.</p>
      <form action="home.html" method="get">
        <div class="form-group">
          <label for="signup-name">Full Name</label>
          <input id="signup-name" name="name" type="text" autocomplete="name" class="form-control" placeholder="Your Name" required />
        </div>
        <div class="form-group">
          <label for="signup-email">Email Address</label>
          <input id="signup-email" name="email" type="email" autocomplete="username" class="form-control" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label for="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" autocomplete="new-password" class="form-control" placeholder="••••••••" required minlength="8" />
        </div>
        <button type="submit" class="btn" style="width: 100%;">Create Account</button>
      </form>
      <p style="margin-top: 20px; text-align: center; font-size: 0.85rem; color: var(--fg-muted);">Already registered? <a href="login.html" style="color: var(--primary);">Log in</a></p>
    </div>
  </main>
  ${footerHtml}
</body>
</html>`,

    'home.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Client Dashboard · ${safeTitle}</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${headerHtml('home')}
  <main id="main" class="container" style="max-width: 800px;">
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px;">
      <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px;">Welcome to Your Client Portal</h1>
      <p style="color: var(--fg-muted); margin-bottom: 24px;">Your proofing galleries, shoot contracts, and download links will appear here.</p>
      <div style="display: flex; gap: 12px;">
        <a href="gallery.html" class="btn">View Gallery</a>
        <a href="booking.html" class="btn btn-outline">Book Another Session</a>
      </div>
    </div>
  </main>
  ${footerHtml}
</body>
</html>`,

    'css/styles.css': css,
    'README.md': `# ${safeTitle}

Professional static website and portfolio for ${safeTitle}.

## Features

- **Home Page** (\`index.html\`) — Hero presentation, featured shoots, and booking CTAs.
- **Gallery** (\`gallery.html\`) — Photography portfolio showcase with category filters.
- **Services & Pricing** (\`services.html\`) — Portrait, editorial, and commercial shoot packages.
- **Booking** (\`booking.html\`) — Interactive shoot reservation & scheduling inquiry form.
- **About** (\`about.html\`) — Studio story, lighting equipment, and team.
- **Contact** (\`contact.html\`) — Location, business hours, and direct inquiry form.
- **Client Portal** (\`login.html\`, \`signup.html\`, \`home.html\`) — Proofing gallery access.
- **Styles** (\`css/styles.css\`) — Modern dark aesthetic with HSL-tailored typography and responsive grid layout.

## Run Locally

Open \`index.html\` in any web browser, or start a local HTTP server:

\`\`\`bash
python3 -m http.server 8080
\`\`\`
`,
  };
}
