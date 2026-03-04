import { ParsedRoute } from './types';

export class HtmlGenerator {
    public generate(routes: ParsedRoute[], appName: string, baseUrl: string, inlineData: { postmanContent: string, envContent: string, openApiContent: string }): string {
        const groups = this.groupByPrefix(routes);

        const escapeJs = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const postmanEscaped = escapeJs(inlineData.postmanContent || '{}');
        const envEscaped = escapeJs(inlineData.envContent || '{}');
        const openapiEscaped = escapeJs(inlineData.openApiContent || '{}');

        const methodColors: Record<string, string> = {
            GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#a78bfa', DELETE: '#ef4444', OPTIONS: '#64748b'
        };

        const sidebarLinks = Object.keys(groups).map(g => {
            const anchor = g.toLowerCase().replace(/[^a-z0-9]/g, '-');
            return `<li><a href="#${anchor}" onclick="setActive(this)">${g}</a></li>`;
        }).join('\n');

        const groupHtml = Object.entries(groups).map(([groupName, groupRoutes]) => {
            const anchor = groupName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const routeCards = groupRoutes.map(r => {
                const color = methodColors[r.method] || '#64748b';
                const requiresAuth = r.middleware.includes('auth');
                const mwHtml = r.middleware.map(m => `<span class="mw-badge">${m}</span>`).join('');
                return `<div class="route-card">
                    <div class="route-header">
                        <span class="method-badge" style="background:${color}">${r.method}</span>
                        <code class="route-path">${r.path}</code>
                        ${requiresAuth ? '<span class="auth-badge">🔒 Auth</span>' : ''}
                        ${r.name ? `<span class="route-name">${r.name}</span>` : ''}
                    </div>
                    ${(r.handler || r.middleware.length) ? `<div class="route-meta">
                        ${r.handler ? `<span class="handler-label">⚙ ${r.handler}</span>` : ''}
                        ${mwHtml}
                    </div>` : ''}
                </div>`;
            }).join('\n');

            return `<section class="route-group" id="${anchor}">
                <h2>${groupName}</h2>
                <div class="routes">${routeCards}</div>
            </section>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} | API Docs — ArikaJS</title>
    <link rel="icon" type="image/png" href="./assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #8b5cf6;
            --primary-glow: rgba(139, 92, 246, 0.4);
            --secondary: #ec4899;
            --bg: #f8fafc;
            --sidebar-bg: rgba(255,255,255,0.85);
            --card-bg: rgba(255, 255, 255, 0.8);
            --card-border: rgba(15, 23, 42, 0.08);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: rgba(15, 23, 42, 0.08);
            --aurora-opacity: 0.3;
            --btn-sec-bg: rgba(15, 23, 42, 0.05);
            --h1-gradient: linear-gradient(135deg, #0f172a 30%, #334155 100%);
            --sidebar-border: rgba(15, 23, 42, 0.08);
            --route-path-bg: rgba(15, 23, 42, 0.05);
            --route-path-color: #1e293b;
            --handler-color: #64748b;
            --mw-bg: rgba(15, 23, 42, 0.05);
        }
        [data-theme="dark"] {
            --bg: #030712;
            --sidebar-bg: rgba(10, 15, 30, 0.9);
            --card-bg: rgba(17, 24, 39, 0.7);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
            --aurora-opacity: 0.5;
            --btn-sec-bg: rgba(255, 255, 255, 0.05);
            --h1-gradient: linear-gradient(135deg, #fff 30%, rgba(255, 255, 255, 0.5) 100%);
            --sidebar-border: rgba(255,255,255,0.08);
            --route-path-bg: rgba(255, 255, 255, 0.06);
            --route-path-color: #e2e8f0;
            --handler-color: #475569;
            --mw-bg: rgba(255, 255, 255, 0.06);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text-main); display: block; min-height: 100vh; overflow-x: hidden; }

        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; filter: blur(100px); opacity: var(--aurora-opacity); pointer-events: none; }
        .aurora-blur { position: absolute; border-radius: 50%; animation: move 20s infinite alternate; }
        .blur-1 { width: 50vw; height: 50vw; background: radial-gradient(circle, var(--primary) 0%, transparent 70%); top: -10%; left: -10%; }
        .blur-2 { width: 40vw; height: 40vw; background: radial-gradient(circle, var(--secondary) 0%, transparent 70%); bottom: -10%; right: -10%; animation-duration: 25s; }
        @keyframes move { from { transform: translate(0,0) scale(1); } to { transform: translate(10%,10%) scale(1.1); } }

        /* Sidebar */
        .sidebar {
            width: 270px; min-height: 100vh; background: var(--sidebar-bg);
            border-right: 1px solid var(--sidebar-border);
            position: fixed; top: 0; left: 0; overflow-y: auto;
            display: flex; flex-direction: column; z-index: 50;
            backdrop-filter: blur(20px);
        }
        .sidebar-header { padding: 24px 20px 20px; border-bottom: 1px solid var(--sidebar-border); }
        .logo-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .logo-wrap img { width: 110px; height: auto; }
        [data-theme="dark"] .logo-wrap img { filter: invert(1) drop-shadow(0 2px 6px rgba(139,92,246,0.3)); }
        .sidebar-subtitle { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-top: 6px; }

        .sidebar nav { padding: 16px 0; flex: 1; }
        .sidebar nav h3 { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .1em; padding: 0 20px 8px; }
        .sidebar nav ul { list-style: none; }
        .sidebar nav ul li a {
            display: flex; align-items: center; gap: 8px; padding: 8px 20px;
            font-size: 13px; color: var(--text-muted); text-decoration: none;
            border-left: 3px solid transparent; transition: all .2s;
        }
        .sidebar nav ul li a:hover, .sidebar nav ul li a.active {
            color: var(--primary); border-left-color: var(--primary); background: rgba(139,92,246,.06);
        }
        .sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--sidebar-border); }
        .sidebar-footer span { display: block; font-size: 11px; color: var(--text-muted); }
        .sidebar-footer strong { color: var(--primary); }

        /* Header */
        header {
            position: fixed; top: 0; left: 270px; right: 0; min-height: 64px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 32px; background: var(--sidebar-bg); backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border); z-index: 40;
        }
        .header-title { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-right { display: flex; align-items: center; gap: 12px; }

        /* Download Buttons */
        .dl-btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
            cursor: pointer; border: 1px solid var(--border); text-decoration: none;
            background: var(--btn-sec-bg); color: var(--text-main);
            transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .dl-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139,92,246,0.2); border-color: var(--primary); color: var(--primary); }
        .dl-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
        .dl-btn.postman { border-color: rgba(255,108,55,0.3); }
        .dl-btn.postman:hover { border-color: #ff6c37; color: #ff6c37; box-shadow: 0 4px 12px rgba(255,108,55,0.2); }
        .dl-btn.openapi { border-color: rgba(16,185,129,0.3); }
        .dl-btn.openapi:hover { border-color: #10b981; color: #10b981; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }

        /* Theme Toggle */
        .theme-toggle {
            background: var(--card-bg); border: 1px solid var(--border);
            padding: 7px; border-radius: 99px; cursor: pointer;
            display: flex; align-items: center; gap: 4px;
        }
        .theme-toggle svg { width: 18px; height: 18px; color: var(--text-main); transition: color 0.3s; }

        /* Main */
        .main { margin-left: 270px; margin-top: 72px; padding: 40px; position: relative; z-index: 10; }

        /* Route Group */
        .route-group { width: 100%; margin-bottom: 56px; scroll-margin-top: 80px; }
        .route-group h2 {
            font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700;
            color: var(--text-main); margin-bottom: 16px;
            display: flex; align-items: center; gap: 10px;
        }
        .route-group h2::before { content: ''; width: 4px; height: 20px; background: linear-gradient(var(--primary), var(--secondary)); border-radius: 2px; flex-shrink: 0; }
        .routes { display: flex; flex-direction: column; gap: 10px; width: 100%; }

        /* Route Card */
        .route-card {
            width: 100%; background: var(--card-bg); border: 1px solid var(--card-border);
            border-radius: 14px; padding: 16px 20px;
            transition: border-color .25s, transform .25s, box-shadow .25s;
            backdrop-filter: blur(10px);
        }
        .route-card:hover { border-color: var(--primary); transform: translateX(4px); box-shadow: 0 8px 30px var(--primary-glow); }
        .route-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .method-badge {
            padding: 4px 14px; border-radius: 6px; font-family: 'JetBrains Mono', monospace;
            font-size: 11px; font-weight: 700; color: #fff; min-width: 72px; text-align: center; letter-spacing: .05em;
        }
        .route-path {
            font-family: 'JetBrains Mono', monospace; font-size: 14px;
            color: var(--route-path-color); background: var(--route-path-bg);
            padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border);
        }
        .auth-badge { font-size: 11px; color: #f59e0b; background: rgba(245,158,11,.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,.2); }
        .route-name { font-size: 11px; color: var(--text-muted); margin-left: auto; font-family: 'JetBrains Mono', monospace; }
        .route-meta { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .handler-label { font-size: 12px; color: var(--handler-color); font-family: 'JetBrains Mono', monospace; }
        .mw-badge { padding: 2px 8px; background: var(--mw-bg); border-radius: 4px; font-size: 11px; color: var(--text-muted); border: 1px solid var(--border); }
    </style>
</head>
<body>

<div class="aurora">
    <div class="aurora-blur blur-1"></div>
    <div class="aurora-blur blur-2"></div>
</div>

<aside class="sidebar">
    <div class="sidebar-header">
        <div class="logo-wrap">
            <img src="./assets/img/logo.png" alt="ArikaJS">
        </div>
        <div class="sidebar-subtitle">API Documentation</div>
    </div>
    <nav>
        <h3>Sections</h3>
        <ul id="nav-links">
            ${sidebarLinks}
        </ul>
    </nav>
    <div class="sidebar-footer">
        <span>Total Routes: <strong>${routes.length}</strong></span>
        <span style="margin-top:4px">Generated: <strong>${new Date().toLocaleDateString()}</strong></span>
    </div>
</aside>

<header>
    <div class="header-left">
        <div class="header-title">${appName} &mdash; API Reference</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Complete API documentation &mdash; auto-generated from your ArikaJS route definitions.</div>
    </div>
    <div class="header-right">
        <button class="dl-btn postman" id="btn-postman" title="Download Postman Collection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Postman
        </button>
        <button class="dl-btn" id="btn-env" title="Download Postman Environment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Environment
        </button>
        <button class="dl-btn openapi" id="btn-openapi" title="Download OpenAPI Spec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            OpenAPI
        </button>
        <button class="theme-toggle" id="theme-toggle" title="Toggle Theme">
            <svg id="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
            <svg id="sun-icon" style="display:none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
        </button>
    </div>
</header>

<main class="main">
    ${groupHtml}
</main>

<script>
    const html = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    const sun = document.getElementById('sun-icon');
    const moon = document.getElementById('moon-icon');

    function setTheme(t) {
        html.setAttribute('data-theme', t);
        localStorage.setItem('arika_theme', t);
        if (t === 'dark') { sun.style.display = 'block'; moon.style.display = 'none'; }
        else               { sun.style.display = 'none';  moon.style.display = 'block'; }
    }
    setTheme(localStorage.getItem('arika_theme') || 'light');
    toggle.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

    function setActive(el) {
        document.querySelectorAll('#nav-links a').forEach(a => a.classList.remove('active'));
        el.classList.add('active');
    }

    function download(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    const postmanData = \`${postmanEscaped}\`;
    const envData     = \`${envEscaped}\`;
    const openapiData = \`${openapiEscaped}\`;

    document.getElementById('btn-postman').addEventListener('click', () => download('postman_collection.json', postmanData));
    document.getElementById('btn-env').addEventListener('click',     () => download('postman_environment.json', envData));
    document.getElementById('btn-openapi').addEventListener('click', () => download('openapi.json', openapiData));
</script>
</body>
</html>`;
    }

    private groupByPrefix(routes: ParsedRoute[]): Record<string, ParsedRoute[]> {
        const groups: Record<string, ParsedRoute[]> = {};
        routes.forEach(r => {
            let group = r.prefix ? r.prefix.replace(/^\/+/, '').split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') : 'General';
            if (!group) group = 'General';
            if (!groups[group]) groups[group] = [];
            groups[group].push(r);
        });
        return groups;
    }
}
