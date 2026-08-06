/**
 * Shared helpers so regenerate / request-changes actually reshapes agent output
 * instead of only appending a revision note.
 */

export function feedbackBlob(...parts: unknown[]): string {
  return parts
    .map((p) => (typeof p === 'string' ? p : JSON.stringify(p ?? {})))
    .join(' ')
    .toLowerCase();
}

export function wantsHtmlCssStack(...parts: unknown[]): boolean {
  const blob = feedbackBlob(...parts);
  if (blob.includes('not next') || blob.includes('no next') || blob.includes('without next')) {
    return true;
  }
  if (blob.includes('no react') || blob.includes('not react') || blob.includes('without react')) {
    return true;
  }
  if (
    blob.includes('no framework') ||
    blob.includes('without framework') ||
    blob.includes('framwork')
  ) {
    return true;
  }
  if (blob.includes('vanilla') || blob.includes('plain html') || blob.includes('static html')) {
    return true;
  }
  if (
    (blob.includes('html') && blob.includes('css')) ||
    blob.includes('html/css') ||
    blob.includes('html & css') ||
    blob.includes('html and css')
  ) {
    return true;
  }
  if (
    blob.includes('login.html') ||
    blob.includes('signup.html') ||
    blob.includes('plain html pages')
  ) {
    return true;
  }
  return false;
}

/** User wants static HTML/CSS only — no Express/PHP/DB/API. */
export function wantsStaticNoBackend(...parts: unknown[]): boolean {
  const blob = feedbackBlob(...parts);
  if (
    blob.includes('no backend') ||
    blob.includes('without backend') ||
    blob.includes('no bakcned') ||
    blob.includes('nobackend') ||
    blob.includes('no server') ||
    blob.includes('without server') ||
    blob.includes('static page') ||
    blob.includes('static pages') ||
    blob.includes('static site') ||
    blob.includes('static html')
  ) {
    return true;
  }
  // HTML/CSS / no framework ⇒ static by default (do not invent Express)
  if (wantsHtmlCssStack(...parts)) {
    const explicitlyWantsServer =
      blob.includes('express') ||
      blob.includes(' php') ||
      blob.includes('database') ||
      blob.includes('postgres') ||
      blob.includes('sqlite') ||
      blob.includes('api route') ||
      blob.includes('with backend') ||
      blob.includes('need backend');
    if (!explicitlyWantsServer) return true;
  }
  return false;
}

export function wantsSimpler(...parts: unknown[]): boolean {
  const blob = feedbackBlob(...parts);
  return (
    blob.includes('simpler') ||
    blob.includes('too complex') ||
    blob.includes('too many') ||
    blob.includes('minimal') ||
    blob.includes('mvp only') ||
    blob.includes('just ') ||
    /\bonly\b/.test(blob)
  );
}

export function wantsNoSocialLogin(...parts: unknown[]): boolean {
  const blob = feedbackBlob(...parts);
  return (
    blob.includes('no social') ||
    blob.includes('without social') ||
    blob.includes('remove social') ||
    blob.includes('no google') ||
    blob.includes('no oauth')
  );
}

export function extractAddRequests(feedback: string): string[] {
  const matches = feedback.matchAll(/(?:add|include|need|want)\s+([^,.]+)/gi);
  return [...matches]
    .map((m) => m[1]?.trim())
    .filter((s): s is string => Boolean(s && s.length > 2));
}

export function extractRemoveRequests(feedback: string): string[] {
  const matches = feedback.matchAll(/(?:remove|without|drop|no)\s+([^,.]+)/gi);
  return [...matches]
    .map((m) => m[1]?.trim())
    .filter((s): s is string => Boolean(s && s.length > 2));
}

export function withRevisionMeta<T extends Record<string, unknown>>(
  doc: T,
  feedback?: string,
): T & { revisionNote?: string } {
  const trimmed = feedback?.trim();
  if (!trimmed) return doc;
  return { ...doc, revisionNote: trimmed };
}
