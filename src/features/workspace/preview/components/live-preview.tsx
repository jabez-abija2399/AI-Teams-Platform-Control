'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  AlertTriangle,
  Code2,
  ExternalLink,
  Play,
  Terminal,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWebContainerPreview, type WCStatus } from '@/hooks/use-webcontainer-preview';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const VIEWPORT_ICONS: Record<Viewport, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

interface LivePreviewProps {
  projectId: string;
  code?: string;
  filePath?: string;
  initialPreviewUrl?: string;
  isCreatorMode?: boolean;
}

export function LivePreview({ projectId, code, filePath, initialPreviewUrl, isCreatorMode }: LivePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [e2bPreviewUrl, setE2bPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [inAppPreviewUrl, setInAppPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('IDLE');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('OFFLINE');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [reloadKey, setReloadKey] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const wc = useWebContainerPreview();

  // Auto-show preview: try WebContainer, fallback to inline Babel preview
  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    
    (async () => {
      try {
        const res = await fetch(`/api/preview/${projectId}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Bad response');
        const result = await res.json();
        if (controller.signal.aborted) return;
        
        // Always set HTML content immediately if available
        if (result.data?.html) {
          setHtmlContent(result.data.html);
          setInAppPreviewUrl(null);
        }
        
        // WebContainer for confirmed Next.js or React (Vite)
        if (
          result.data?.mode === 'webcontainer' &&
          result.data?.files &&
          Object.keys(result.data.files).length > 0 &&
          result.data?.stack?.confirmed
        ) {
          const runtime = result.data.stack.id === 'react' ? 'vite' : 'next';
          wc.start(result.data.files, runtime).catch(() => {
            // WebContainer failed, fallback to inline HTML already set above
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('[LivePreview] Failed to fetch preview:', err);
        // WebContainer unavailable - default HTML will be served by API
      }
    })();
    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Connect to SSE Stream Gateway to receive PREVIEW_READY updates from E2B worker
  useEffect(() => {
    if (!projectId) return;

    setSseStatus('RECONNECTING');
    const eventSource = new EventSource(`/api/ai/developer/stream/${projectId}`);

    eventSource.onopen = () => {
      setSseStatus('CONNECTED');
    };

    const handleProgress = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.step) setCurrentStep(data.step);
        if (typeof data.percent === 'number') setProgressPercent(data.percent);
        if (data.errorLogs) setBuildError(data.errorLogs);

        if (data.previewUrl) {
          console.log('[LivePreview SSE] Next.js Dev Server E2B Tunnel URL Received:', data.previewUrl);
          setE2bPreviewUrl(data.previewUrl);
          setLoading(false);
          setBuildError(null);
        }
      } catch {
        // ignore invalid json
      }
    };

    const handleFailed = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setBuildError(data.failedReason || 'Build pipeline failed during compilation.');
        setLoading(false);
      } catch {
        setBuildError('Build pipeline error occurred.');
      }
    };

    eventSource.addEventListener('progress', handleProgress);
    eventSource.addEventListener('PREVIEW_READY', handleProgress);
    eventSource.addEventListener('completed', handleProgress);
    eventSource.addEventListener('failed', handleFailed);

    eventSource.onerror = () => {
      setSseStatus('OFFLINE');
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  // No blocking safety timer — loading is resolved explicitly after preview fetch completes

  // Fallback single-file bundling generator if dev server tunnel URL is not active
  const generateSingleFileFallback = useCallback(async () => {
    if (e2bPreviewUrl) return; // Do NOT overwrite active dev server tunnel!

    if (code && code.trim().length > 0) {
      try {
        const isHtml = filePath?.endsWith('.html') || code.includes('<html') || code.includes('<!DOCTYPE');

        if (isHtml) {
          setHtmlContent(code);
          return;
        }

        // Strip module-level imports/exports only — Babel Standalone with
        // react + typescript presets handles all TypeScript syntax natively.
        const cleanedSource = code
          .replace(/^import\s[^;]+;?\s*$/gm, '')
          .replace(/^export\s+default\s+function\s+(\w+)/gm, 'function $1')
          .replace(/^export\s+default\s+class\s+(\w+)/gm, 'class $1')
          .replace(/^export\s+default\s+(\w+)\s*;?\s*$/gm, 'const __defaultExport__ = $1;')
          .replace(/^export\s+\{[^}]*\bdefault\b[^}]*\}\s*;?\s*$/gm, '')
          .replace(/^export\s+(function|class|const|let|var)\s+/gm, '$1 ');

        const bundledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: Tailwind CSS CDN</div>'"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: React CDN</div>'"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: ReactDOM CDN</div>'"></script>
  <script>window.React = React; window.ReactDOM = ReactDOM;</script>
  <script src="https://unpkg.com/lucide-react@0.378.0/dist/umd/lucide-react.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: Babel Standalone CDN</div>'"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; padding: 1.5rem; margin: 0; background-color: #ffffff; color: #0f172a; }
    .preview-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; color: #64748b; font-family: system-ui, sans-serif; }
    .preview-loading .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .preview-loading .label { font-size: 13px; color: #94a3b8; }
    .preview-error { padding: 1.5rem; margin: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; color: #991b1b; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root">
    <div class="preview-loading">
      <div class="spinner"></div>
      <div class="label">Loading preview...</div>
    </div>
  </div>
  <script type="text/babel" data-presets="react,typescript">
    try {
      if (window.LucideReact) Object.assign(window, window.LucideReact);

    ${cleanedSource}

    const TargetApp =
      typeof __defaultExport__ !== 'undefined' ? __defaultExport__ :
      typeof TodoApp !== 'undefined' ? TodoApp :
      typeof Home !== 'undefined' ? Home :
      typeof App !== 'undefined' ? App :
      typeof Page !== 'undefined' ? Page :
      typeof Component !== 'undefined' ? Component : null;

    if (TargetApp) {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(TargetApp));
    } else {
      document.getElementById('root').innerHTML =
        '<div style="color:#64748b;font-size:13px">Component rendered cleanly. Export a default function to view live updates.</div>';
    }
  } catch (err) {
    document.getElementById('root').innerHTML = '<div class="preview-error">Render error: ' + (err.message || String(err)) + '</div>';
  }
  </script>
</body>
</html>`;

        setHtmlContent(bundledHtml);
        return;
      } catch (err) {
        setBuildError(String(err));
      }
    }

    // No code provided — htmlContent already set by initial fetch effect
    return;
  }, [e2bPreviewUrl, code, filePath, projectId]);

  useEffect(() => {
    generateSingleFileFallback();
  }, [generateSingleFileFallback]);

  // TEST LOG: Monitor which preview is currently running
  useEffect(() => {
    if (wc.previewUrl) {
      console.log('🧪 [LivePreview State] RUNNING via WebContainer:', wc.previewUrl);
    } else if (e2bPreviewUrl) {
      console.log('🧪 [LivePreview State] RUNNING via E2B Cloud Sandbox:', e2bPreviewUrl);
    } else if (inAppPreviewUrl || htmlContent) {
      console.log('🧪 [LivePreview State] RUNNING via Inline Static HTML Fallback');
    } else {
      console.log('🧪 [LivePreview State] NOT RUNNING YET (Status: Offline or Booting)');
    }
  }, [wc.previewUrl, e2bPreviewUrl, inAppPreviewUrl, htmlContent]);

  const STATIC_LOGIN_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login / Signup — AI Teams Platform</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;background:#020617;color:#f1f5f9;display:flex;align-items:center;justify-content:center;padding:1.5rem}
    .card{width:100%;max-width:420px;background:#0f172a;border:1px solid #1e293b;border-radius:1rem;padding:2rem;box-shadow:0 25px 50px -12px rgba(0,0,0,.5)}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:#0c1a2e;border:1px solid #1e3a5f;color:#38bdf8;border-radius:9999px;font-size:11px;font-family:monospace;margin-bottom:12px}
    h1{font-size:1.4rem;font-weight:700;color:#f8fafc;margin-bottom:6px;text-align:center}
    .sub{font-size:12px;color:#64748b;text-align:center;margin-bottom:20px}
    .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#020617;border:1px solid #1e293b;border-radius:8px;padding:4px;margin-bottom:18px}
    .tab{padding:7px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s}
    .tab.active{background:#1e293b;color:#38bdf8}
    .tab:not(.active){background:transparent;color:#475569}
    .seed-bar{display:flex;align-items:center;justify-content:space-between;background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:11px}
    .seed-bar span{color:#475569}
    .seed-btn{padding:4px 10px;background:#0c1a2e;border:1px solid #1e3a5f;color:#38bdf8;border-radius:5px;font-size:11px;cursor:pointer;font-family:monospace}
    .seed-btn:hover{background:#1e3a5f}
    .field{margin-bottom:14px}
    label{display:block;font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px}
    .inp-wrap{position:relative}
    .inp-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#475569;font-size:14px;pointer-events:none}
    input[type=email],input[type=password],input[type=text]{width:100%;background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 10px 8px 32px;font-size:13px;color:#f1f5f9;outline:none;transition:.15s}
    input:focus{border-color:#0284c7}
    .btn-primary{width:100%;padding:10px;background:#0284c7;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:.15s;margin-top:6px}
    .btn-primary:hover{background:#0369a1}
    .btn-primary.green{background:#059669}.btn-primary.green:hover{background:#047857}
    .alert{padding:10px 12px;border-radius:8px;font-size:12px;display:flex;align-items:center;gap:8px;margin-bottom:14px}
    .alert.err{background:#1e0a0a;border:1px solid #7f1d1d;color:#fca5a5}
    .alert.ok{background:#052e16;border:1px solid #14532d;color:#6ee7b7}
    .session-box{text-align:center;background:#020617;border:1px solid #1e293b;border-radius:.75rem;padding:2rem}
    .avatar{width:56px;height:56px;border-radius:50%;background:#052e16;border:2px solid #059669;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 12px}
    .session-name{font-size:1.1rem;font-weight:700;color:#f8fafc;margin-bottom:4px}
    .session-email{font-size:12px;color:#475569;font-family:monospace;margin-bottom:16px}
    .token-badge{padding:8px 12px;background:#052e16;border:1px solid #14532d;border-radius:8px;font-size:11px;color:#6ee7b7;font-family:monospace;margin-bottom:16px}
    .btn-danger{width:100%;padding:9px;background:#1e0a0a;border:1px solid #7f1d1d;color:#fca5a5;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s}
    .btn-danger:hover{background:#7f1d1d}
    .footer-link{text-align:center;font-size:12px;color:#475569;margin-top:16px;padding-top:16px;border-top:1px solid #1e293b}
    .footer-link a{color:#38bdf8;text-decoration:none;font-weight:600}
    .hidden{display:none}
  </style>
</head>
<body>
<div class="card">
  <div style="text-align:center">
    <div class="badge">✦ AI Teams Platform Auth</div>
    <h1>Authentication Module</h1>
    <p class="sub">Next.js App Router · Login &amp; Signup Demo</p>
  </div>

  <div id="session-view" class="session-box hidden">
    <div class="avatar">✓</div>
    <div class="session-name" id="s-name">Abija User</div>
    <div class="session-email" id="s-email">abi@gmail.com</div>
    <div class="token-badge" id="s-token">✓ Session Token Active</div>
    <button class="btn-danger" onclick="doLogout()">↩ Sign Out</button>
  </div>

  <div id="auth-view">
    <div class="seed-bar">
      <span>Test credentials:</span>
      <button class="seed-btn" onclick="quickFill()">⚡ Fill abi@gmail.com</button>
    </div>

    <div id="alert-box" class="alert hidden"></div>

    <div class="tabs">
      <button class="tab active" id="tab-login" onclick="switchTab('login')">Sign In</button>
      <button class="tab" id="tab-signup" onclick="switchTab('signup')">Sign Up</button>
    </div>

    <div id="login-form">
      <div class="field"><label>Email Address</label><div class="inp-wrap"><span class="inp-icon">✉</span><input type="email" id="l-email" value="abi@gmail.com" placeholder="name@company.com"></div></div>
      <div class="field"><label>Password</label><div class="inp-wrap"><span class="inp-icon">🔒</span><input type="password" id="l-pass" value="Abija@2399" placeholder="••••••••"></div></div>
      <button class="btn-primary" onclick="doLogin()"><span id="l-btn-text">Sign In →</span></button>
    </div>

    <div id="signup-form" class="hidden">
      <div class="field"><label>Full Name</label><div class="inp-wrap"><span class="inp-icon">👤</span><input type="text" id="s-name-in" value="Abija User" placeholder="John Doe"></div></div>
      <div class="field"><label>Email Address</label><div class="inp-wrap"><span class="inp-icon">✉</span><input type="email" id="s-email-in" value="abi@gmail.com" placeholder="name@company.com"></div></div>
      <div class="field"><label>Password</label><div class="inp-wrap"><span class="inp-icon">🔒</span><input type="password" id="s-pass" value="Abija@2399" placeholder="Abija@2399"></div></div>
      <div class="field"><label>Confirm Password</label><div class="inp-wrap"><span class="inp-icon">🔒</span><input type="password" id="s-pass2" placeholder="Re-enter password"></div></div>
      <button class="btn-primary green" onclick="doSignup()"><span id="s-btn-text">Create Account →</span></button>
    </div>

    <div class="footer-link" id="footer-txt">Don't have an account? <a href="#" onclick="switchTab('signup');return false">Sign up</a></div>
  </div>
</div>

<script>
  var activeTab = 'login';
  function switchTab(t) {
    activeTab = t;
    document.getElementById('login-form').classList.toggle('hidden', t !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', t !== 'signup');
    document.getElementById('tab-login').classList.toggle('active', t === 'login');
    document.getElementById('tab-signup').classList.toggle('active', t === 'signup');
    document.getElementById('footer-txt').innerHTML = t === 'login'
      ? 'Don\\'t have an account? <a href="#" onclick="switchTab(\\'signup\\');return false">Sign up</a>'
      : 'Already have an account? <a href="#" onclick="switchTab(\\'login\\');return false">Sign in</a>';
    clearAlert();
  }
  function quickFill() {
    document.getElementById('l-email').value = 'abi@gmail.com';
    document.getElementById('l-pass').value = 'Abija@2399';
    document.getElementById('s-email-in').value = 'abi@gmail.com';
    document.getElementById('s-pass').value = 'Abija@2399';
    document.getElementById('s-name-in').value = 'Abija User';
    clearAlert();
  }
  function showAlert(msg, type) {
    var b = document.getElementById('alert-box');
    b.textContent = msg;
    b.className = 'alert ' + (type === 'err' ? 'err' : 'ok');
  }
  function clearAlert() { document.getElementById('alert-box').className = 'alert hidden'; }
  function doLogin() {
    var email = document.getElementById('l-email').value;
    var pass = document.getElementById('l-pass').value;
    if (!email || !pass) { showAlert('Email and password are required.', 'err'); return; }
    document.getElementById('l-btn-text').textContent = 'Authenticating...';
    setTimeout(function() {
      document.getElementById('l-btn-text').textContent = 'Sign In →';
      if (email === 'abi@gmail.com' && pass === 'Abija@2399') {
        showSession('Abija User', email);
      } else {
        showAlert('Invalid credentials. Use abi@gmail.com / Abija@2399', 'err');
      }
    }, 600);
  }
  function doSignup() {
    var name = document.getElementById('s-name-in').value;
    var email = document.getElementById('s-email-in').value;
    var pass = document.getElementById('s-pass').value;
    var pass2 = document.getElementById('s-pass2').value;
    if (!name || !email || !pass) { showAlert('All fields are required.', 'err'); return; }
    if (pass2 && pass !== pass2) { showAlert('Passwords do not match.', 'err'); return; }
    if (pass.length < 8) { showAlert('Password must be at least 8 characters.', 'err'); return; }
    document.getElementById('s-btn-text').textContent = 'Creating Account...';
    setTimeout(function() {
      document.getElementById('s-btn-text').textContent = 'Create Account →';
      showSession(name, email);
    }, 600);
  }
  function showSession(name, email) {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('session-view').classList.remove('hidden');
    document.getElementById('s-name').textContent = name;
    document.getElementById('s-email').textContent = email;
    document.getElementById('s-token').textContent = '✓ sess_' + Date.now() + ' — Active';
  }
  function doLogout() {
    document.getElementById('session-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('hidden');
    clearAlert();
  }
</script>
</body>
</html>`;

  const triggerDevServerBuild = async () => {
    setLoading(true);
    setBuildError(null);
    try {
      const res = await fetch(`/api/preview/${projectId}`);
      const result = await res.json();
      if (result.data?.html) setHtmlContent(result.data.html);
    } catch {
      // fallback: nothing
    }
    setLoading(false);
  };

  const handleHardReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleFixWithAI = (errorText: string) => {
    const event = new CustomEvent('ai-fix-error', { 
      detail: { 
        error: errorText, 
        context: 'Live Preview crash' 
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 border-l border-slate-800 text-slate-200">
      {/* Header Bar */}
      <div className={cn(
        "flex items-center justify-between select-none z-10",
        isCreatorMode 
          ? "h-14 px-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#0A0A0A]/50 backdrop-blur-xl"
          : "h-9 px-3 border-b border-slate-800 bg-slate-900"
      )}>
        <div className="flex items-center gap-3">
          {!isCreatorMode && <Code2 className="w-3.5 h-3.5 text-sky-400" />}
          <span className={cn(
            isCreatorMode ? "text-sm font-bold text-slate-800 dark:text-slate-200" : "text-xs font-semibold"
          )}>
            {isCreatorMode ? "Live Preview" : "Next.js App Preview"}
          </span>

          {wc.previewUrl ? (
            <span className={cn(
              "flex items-center gap-1.5 font-medium rounded-full",
              isCreatorMode 
                ? "px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-200 dark:border-emerald-500/20"
                : "px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
          ) : e2bPreviewUrl ? (
            <span className={cn(
              "flex items-center gap-1.5 font-medium rounded-full",
              isCreatorMode 
                ? "px-2.5 py-1 bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs border border-sky-200 dark:border-sky-500/20"
                : "px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Dev Server</span>
            </span>
          ) : wc.status === 'INSTALLING' || wc.status === 'STARTING' || wc.status === 'BOOTING' || wc.status === 'MOUNTING' ? (
            <span className={cn(
              "flex items-center gap-1.5 font-medium rounded-full",
              isCreatorMode 
                ? "px-2.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs border border-amber-200 dark:border-amber-500/20"
                : "px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-mono"
            )}>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Building</span>
            </span>
          ) : inAppPreviewUrl || htmlContent ? (
            <span className={cn(
              "flex items-center gap-1.5 font-medium rounded-full",
              isCreatorMode 
                ? "px-2.5 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs border border-purple-200 dark:border-purple-500/20"
                : "px-2 py-0.5 bg-sky-950 border border-sky-800 text-sky-400 text-[10px] font-mono"
            )}>
              <span>Static</span>
            </span>
          ) : (
            <span className={cn(
              "rounded font-medium",
              isCreatorMode 
                ? "px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs border border-slate-200 dark:border-white/10"
                : "px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono"
            )}>
              {currentStep !== 'IDLE' ? `${currentStep} (${progressPercent}%)` : 'Offline'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCreatorMode && (
            <>
              {/* Diagnostics Toggle */}
              <button
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border transition-colors',
                  showDiagnostics ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                )}
                title="Toggle Preview Diagnostics HUD"
              >
                <Info className="w-3 h-3" />
                <span>Info</span>
              </button>

              <button
                onClick={() => setShowLogs((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border transition-colors',
                  showLogs ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                )}
                title="Toggle Server Logs"
              >
                <Terminal className="w-3 h-3" />
                <span>Logs</span>
              </button>
            </>
          )}

          {/* Viewport Toggles */}
          <div className={cn(
            "flex items-center p-1 rounded-lg border",
            isCreatorMode 
              ? "bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 shadow-sm"
              : "bg-slate-950 border-slate-800 p-0.5"
          )}>
            {(Object.keys(VIEWPORT_ICONS) as Viewport[]).map((v) => {
              const Icon = VIEWPORT_ICONS[v];
              return (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewport === v 
                      ? (isCreatorMode ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'bg-slate-800 text-sky-400') 
                      : (isCreatorMode ? 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5' : 'text-slate-500 hover:text-slate-300')
                  )}
                  title={v}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {/* Refresh */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "transition-colors",
              isCreatorMode 
                ? "h-9 w-9 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
                : "h-6 w-6 text-slate-400 hover:text-slate-200 rounded"
            )}
            onClick={handleHardReload} 
            title="Refresh Preview Frame"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          <a
            href={(e2bPreviewUrl || wc.previewUrl || `/preview/${projectId}`) as string}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg text-xs font-semibold border border-border/80 bg-background/80 hover:border-primary/40 hover:text-primary shadow-xs",
              isCreatorMode 
                ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                : "text-slate-300 hover:text-white"
            )}
            title="Open preview in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[11px]">New Tab</span>
          </a>
        </div>
      </div>

      {/* Diagnostics HUD Panel Drawer */}
      {showDiagnostics && (
        <div className="bg-slate-900/95 border-b border-slate-800 p-3 text-xs font-mono space-y-2 select-none">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold flex items-center gap-1.5 text-sky-400">
              <Info className="w-3.5 h-3.5" /> Preview System Status
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              Socket:
              {sseStatus === 'CONNECTED' ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> {sseStatus}</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
            <div>Project ID: <span className="text-slate-200">{projectId}</span></div>
            <div>WC Status: <span className={wc.status === 'READY' ? 'text-emerald-400' : 'text-sky-400'}>{wc.status}</span></div>
            <div>WC Preview: <span className="text-emerald-400">{wc.previewUrl || 'N/A'}</span></div>
            <div>E2B Tunnel: <span className="text-emerald-400">{e2bPreviewUrl || 'Offline'}</span></div>
            <div>Current Step: <span className="text-sky-400">{currentStep}</span></div>
            <div>Progress: <span className="text-sky-400">{progressPercent}%</span></div>
          </div>
        </div>
      )}

      {/* Frame Body Container */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-auto bg-slate-900/60 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400 mb-3" />
            <h4 className="text-sm font-semibold text-slate-200 mb-1">Booting Next.js Dev Server in E2B Cloud...</h4>
            <p className="text-xs text-slate-400 font-mono mb-4">Step: {currentStep} ({progressPercent}%)</p>
            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}

        {/* WebContainer Booting Overlay */}
        {wc.status !== 'IDLE' && wc.status !== 'READY' && wc.status !== 'ERROR' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
            {isCreatorMode ? (
              <>
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-6" />
                <h4 className="text-xl font-bold text-slate-100 mb-2">
                  {wc.status === 'INSTALLING' ? '📦 Gathering supplies...' : 
                   wc.status === 'STARTING' ? '🚀 Launching your application...' : 
                   wc.status === 'MOUNTING' ? '🏗️ Architecting the environment...' :
                   '✨ Preparing your preview...'}
                </h4>
                <p className="text-sm text-slate-400">Our AI agents are assembling your product right now.</p>
                <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6 mb-2">
                  <div className="h-full bg-sky-500 animate-pulse transition-all duration-300" style={{ width: '60%' }} />
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                <h4 className="text-sm font-semibold text-slate-200 mb-1">{wc.status}</h4>
                <p className="text-xs text-slate-400">Preparing live WebContainer environment...</p>
                <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden mt-4 mb-4">
                  <div className="h-full bg-amber-500 animate-pulse transition-all duration-300" style={{ width: '60%' }} />
                </div>
                <button onClick={() => setShowLogs(true)} className="text-[10px] text-amber-500 hover:text-amber-400 underline font-mono bg-amber-500/10 px-3 py-1.5 rounded-full transition-colors">
                  View Boot Logs
                </button>
              </>
            )}
          </div>
        )}

        {/* Clear Diagnostic Error Card */}
        {buildError ? (
          <div className="p-5 bg-red-950/90 border border-red-800 rounded-xl text-red-100 text-xs max-w-lg w-full space-y-3 shadow-2xl z-10">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Preview Build or Compilation Error</span>
            </div>

            <p className="text-red-200 text-xs leading-relaxed">
              Why it is not displaying: The background build process encountered an error during <code className="bg-red-900/60 px-1 py-0.5 rounded font-mono text-red-300">{currentStep}</code>.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-red-900/80 font-mono text-[11px] text-red-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {buildError}
            </div>

            <div className="flex items-center flex-wrap gap-2 pt-1">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs gap-1.5 font-bold shadow-md" onClick={() => handleFixWithAI(buildError)}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fix with AI</span>
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white text-xs gap-1.5" onClick={triggerDevServerBuild}>
                <Play className="w-3.5 h-3.5" />
                <span>Retry Build & Dev Server</span>
              </Button>
              {e2bPreviewUrl && (
                <a
                  href={e2bPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Try Open Direct URL</span>
                </a>
              )}
            </div>
          </div>
        ) : wc.status === 'ERROR' ? (
          <div className="p-5 bg-slate-950 border border-red-900/50 rounded-xl max-w-md w-full text-center space-y-4 shadow-2xl z-10 select-none">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">WebContainer Error</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The live dev server crashed.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg text-left text-[11px] text-red-300 space-y-1 font-mono border border-slate-800">
              {wc.error || 'Unknown error occurred.'}
            </div>
            <div className="flex items-center gap-2">
              <Button className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold gap-2 shadow-md" onClick={() => handleFixWithAI(wc.error || 'Unknown WebContainer error')}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fix with AI</span>
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold gap-2 shadow-md" onClick={() => wc.retry()}>
                <Play className="w-3.5 h-3.5" />
                <span>Retry Step</span>
              </Button>
              {!isCreatorMode && (
                <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold gap-2 shadow-md border border-slate-700" onClick={() => setShowLogs(true)}>
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Logs</span>
                </Button>
              )}
            </div>
          </div>
        ) : !e2bPreviewUrl && !htmlContent && !inAppPreviewUrl ? (
          /* Offline Readiness Card */
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full text-center space-y-4 shadow-2xl z-10 select-none">
            <div className="w-12 h-12 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center mx-auto text-sky-400">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Next.js Dev Server Offline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Why it is not displaying: The background E2B Cloud Sandbox Dev Server is not active yet for project <code className="text-sky-300 font-mono">{projectId}</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg text-left text-[11px] text-slate-400 space-y-1 font-mono border border-slate-800">
              <div>✓ Next.js App Router Scaffold: <span className="text-emerald-400">Ready</span></div>
              <div>⚡ E2B Sandbox Tunnel: <span className="text-amber-400">Awaiting Launch</span></div>
            </div>

            <Button className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold gap-2 shadow-md" onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`/api/preview/${projectId}`);
                const result = await res.json();
                if (result.data?.files) {
                  await wc.start(result.data.files).catch(() => {});
                }
                if (result.data?.html) {
                  setHtmlContent(result.data.html);
                }
              } catch {
                // Fetch failed
              }
              setLoading(false);
            }}>
              <Play className="w-3.5 h-3.5" />
              <span>▶ Run Preview</span>
            </Button>
          </div>
        ) : (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={wc.previewUrl || e2bPreviewUrl || undefined}
            srcDoc={(!wc.previewUrl && !e2bPreviewUrl) ? (htmlContent || '') : undefined}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
            className={cn(
              'border border-slate-800 rounded shadow-2xl transition-all duration-300 bg-white',
              viewport === 'desktop' ? 'h-full w-full' : 'h-[600px]'
            )}
            style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
            title="Next.js Live Preview Server"
          />
        )}

        {/* Server Logs Overlay */}
        {showLogs && (
          <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col font-mono text-[11px] border-t border-slate-800">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                Live Server Logs
              </span>
              <div className="flex gap-2">
                <button onClick={() => wc.clearLogs()} className="text-slate-500 hover:text-slate-300">Clear</button>
                <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-300">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1 select-text">
              {wc.terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic">No server logs...</div>
              ) : (
                wc.terminalLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 select-none text-[10px] pt-0.5 whitespace-nowrap">{log.timestamp}</span>
                    <span className={cn(
                      'flex-1 whitespace-pre-wrap break-all',
                      log.source === 'stderr' ? 'text-red-400' : log.source === 'system' ? 'text-sky-400 font-semibold' : 'text-slate-300'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
