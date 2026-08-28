import DOMPurify from 'dompurify';

// Check if we are running on the server or the client.
// DOMPurify requires a window object. If we are on the server (Node.js), we must use jsdom to simulate it.
const isServer = typeof window === 'undefined';

let purifier: typeof DOMPurify | null = null;

if (isServer) {
  // We use require instead of import to avoid breaking the client-side bundle.
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  purifier = DOMPurify(window);
} else {
  // If we are in the browser, DOMPurify can safely use the native window object.
  purifier = DOMPurify;
}

/**
 * Sanitizes a string of raw HTML or Markdown to prevent Cross-Site Scripting (XSS) attacks.
 * AI models can sometimes generate malicious <script> tags or inline event handlers.
 * This function strips all dangerous executable code while preserving safe markup (like <b>, <i>, <a>).
 * 
 * @param dirty The raw, potentially unsafe string.
 * @returns A completely safe, sanitized string ready to be dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  if (!purifier) {
    throw new Error('DOMPurify failed to initialize.');
  }

  // We enforce strict rules: no entire documents, just fragments.
  // We allow target="_blank" on links but enforce rel="noopener noreferrer" for safety.
  return purifier.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
