// ===========================================
// app.js — Router principal do Painel Único
// Minha Conta (ESM + history.pushState)
// ===========================================

import { resolveSection, getMenuByRole } from './sections.js';

// --- Estado global da SPA ---
let ctx = null;           // { user, capabilities, stores, activeStoreId, csrfToken }
let currentModule = null; // módulo ESM da seção ativa

const contentEl = document.getElementById('content');
const sidebarEl = document.getElementById('sidebar');
const navEl = document.getElementById('sidebar-nav');
const topbarUser = document.getElementById('topbar-user');
const storeSwitch = document.getElementById('store-switcher');
const storeSelect = document.getElementById('store-select');
const overlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');
const sidebarClose = document.getElementById('sidebar-close');

// =====================================================
// 1. Bootstrap: busca sessão e inicializa a SPA
// =====================================================
async function init() {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });

        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        if (!res.ok) throw new Error(`Erro ao carregar sessão: ${res.status}`);

        ctx = await res.json();

        renderTopbar();
        renderSidebar();
        renderStoreSwitcher();
        setupEventListeners();
        await navigate(location.pathname, false);

    } catch (err) {
        renderError('Erro ao carregar o painel. Tente novamente.', err.message);
    }
}

// =====================================================
// 2. Topbar
// =====================================================
function renderTopbar() {
    if (!ctx) return;
    const roleLabel = {
        admin: '👑 Admin',
        comerciante: '🏪 Lojista',
        cliente: '🛍️ Cliente',
    }[ctx.user.role] || ctx.user.role;

    topbarUser.textContent = `${ctx.user.nome} · ${roleLabel}`;
}

// =====================================================
// 3. Store switcher (comerciante multi-loja)
// =====================================================
function renderStoreSwitcher() {
    if (!ctx?.stores?.length || ctx.stores.length < 2) {
        storeSwitch.classList.add('hidden');
        return;
    }

    storeSwitch.classList.remove('hidden');
    storeSelect.innerHTML = ctx.stores
        .map(s => `<option value="${s.id}" ${s.id === ctx.activeStoreId ? 'selected' : ''}>${s.nome}</option>`)
        .join('');

    storeSelect.addEventListener('change', async () => {
        const storeId = Number(storeSelect.value);
        try {
            const res = await fetch('/api/auth/active-store', {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': ctx.csrfToken,
                },
                body: JSON.stringify({ storeId }),
            });

            if (res.ok) {
                // Recarregar ctx com nova sessão
                const meRes = await fetch('/api/auth/me', { credentials: 'include' });
                if (meRes.ok) {
                    ctx = await meRes.json();
                    renderTopbar();
                    // Re-renderizar seção ativa para refletir contexto da nova loja
                    await navigate(location.pathname, false);
                }
            } else {
                console.error('Erro ao trocar loja:', await res.json());
            }
        } catch (err) {
            console.error('Erro ao trocar loja:', err);
        }
    });
}

// =====================================================
// 4. Sidebar
// =====================================================
function renderSidebar() {
    const menu = getMenuByRole(ctx.user.role);

    navEl.innerHTML = ''; // remove skeleton

    if (menu.length === 0) {
        navEl.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:.85rem">Sem seções disponíveis.</p>';
        return;
    }

    const currentPath = location.pathname;

    menu.forEach(section => {
        const btn = document.createElement('a');
        btn.className = 'nav-item';
        btn.href = section.path;
        btn.dataset.path = section.path;
        btn.dataset.load = section.load;
        btn.innerHTML = `<span class="nav-icon">${section.icon}</span><span>${section.label}</span>`;

        const isActive = currentPath === section.path || currentPath.startsWith(section.path + '/');
        if (isActive) btn.setAttribute('aria-current', 'page');

        // Prefetch ao hover
        btn.addEventListener('mouseenter', () => prefetch(section.load), { once: true });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(section.path);
        });

        navEl.appendChild(btn);
    });
}

function updateNavActive(pathname) {
    navEl.querySelectorAll('.nav-item').forEach(btn => {
        const path = btn.dataset.path;
        const active = pathname === path || pathname.startsWith(path + '/');
        if (active) {
            btn.setAttribute('aria-current', 'page');
        } else {
            btn.removeAttribute('aria-current');
        }
    });
}

// =====================================================
// 5. Roteamento
// =====================================================
async function navigate(pathname, pushState = true) {
    // Fecha drawer no mobile
    closeSidebar();

    const section = resolveSection(pathname, ctx.user.role);

    if (!section) {
        if (pathname !== '/minha-conta') {
            // Seção não encontrada ou sem permissão
            render403();
        } else {
            // Fallback para início
            await navigateTo('/minha-conta', getDefaultPath());
        }
        return;
    }

    if (pushState && location.pathname !== pathname) {
        history.pushState({ path: pathname }, '', pathname);
    }

    updateNavActive(pathname);
    await loadSection(section);
}

async function navigateTo(from, to) {
    const section = resolveSection(to, ctx.user.role);
    if (!section) { render403(); return; }
    history.replaceState({ path: to }, '', to);
    updateNavActive(to);
    await loadSection(section);
}

/** Caminho padrão por role */
function getDefaultPath() {
    return '/minha-conta'; // InicioSection
}

async function loadSection(section) {
    // Desmonta seção anterior
    if (currentModule?.unmount) {
        try { currentModule.unmount(); } catch { }
    }

    renderLoading();

    try {
        const mod = await import(section.load);
        currentModule = mod;
        contentEl.innerHTML = '';
        mod.mount(contentEl, ctx);
    } catch (err) {
        console.error('[SPA] Erro ao carregar seção:', section.load, err);
        renderError('Não foi possível carregar esta seção.', err.message);
    }
}

// =====================================================
// 6. Prefetch (modulepreload)
// =====================================================
function prefetch(url) {
    if (document.querySelector(`link[rel="modulepreload"][href="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = url;
    document.head.appendChild(link);
}

// =====================================================
// 7. Event listeners
// =====================================================
function setupEventListeners() {
    // Navegação por histórico (botão voltar)
    window.addEventListener('popstate', (e) => {
        navigate(e.state?.path || location.pathname, false);
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRF-Token': ctx?.csrfToken || '' },
            });
        } finally {
            window.location.href = '/login';
        }
    });

    // Hamburger (mobile)
    menuToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
}

function openSidebar() {
    sidebarEl.classList.add('open');
    overlay.classList.add('visible');
    menuToggle.setAttribute('aria-expanded', 'true');
    sidebarEl.focus?.();
}

function closeSidebar() {
    sidebarEl.classList.remove('open');
    overlay.classList.remove('visible');
    menuToggle.setAttribute('aria-expanded', 'false');
}

// =====================================================
// 8. Helpers de estado visual
// =====================================================
function renderLoading() {
    contentEl.innerHTML = `
    <div class="content-loading">
      <div class="spinner" aria-label="Carregando seção..."></div>
    </div>`;
}

function render403() {
    contentEl.innerHTML = `
    <div class="section-error">
      <h2>🔒 Acesso negado</h2>
      <p>Você não tem permissão para acessar esta seção.</p>
    </div>`;
}

function renderError(msg, detail = '') {
    contentEl.innerHTML = `
    <div class="section-error">
      <h2>⚠️ ${msg}</h2>
      ${detail ? `<p style="font-size:.8rem;margin-top:8px;opacity:.6">${detail}</p>` : ''}
    </div>`;
}

// =====================================================
// Start
// =====================================================
init();
