# Modularização do Comércio BES

> Registro vivo do processo de desmontagem do monólito `script.js`.  
> Atualizar este arquivo ao concluir cada passo.

---

## Por que modularizar

`script.js` tem **1.561 linhas** e mistura 10+ responsabilidades no mesmo arquivo.  
Ler o arquivo inteiro a cada sessão custa créditos e torna mudanças perigosas.  
Cada módulo extraído = arquivo menor + escopo isolado + risco menor de regressão.

---

## Regras da refatoração

1. **Um módulo por vez** — extrair, carregar, verificar, só então próximo
2. ~~Script ainda é clássico (sem `type="module"`)~~ → **migrado para ES modules** (passo 15)
3. ~~Módulos são globais por enquanto~~ → **`import`/`export` explícito** + `Object.assign(window, {...})` em `app.js` para inline handlers
4. `escapeHTML` deve ser importado por todos os renders — nunca inline
5. `data.json` como fallback precisa continuar funcionando
6. Service Worker (`sw.js`) atualizar cache list a cada novo arquivo JS/CSS adicionado

---

## Estado atual dos arquivos

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `js/script.js` | ~100 | ⚰️ orphaned — substituído por app.js |
| `js/config.js` | — | ✅ extraído (passo 1) |
| `js/modules/utils.js` | — | ✅ extraído (passo 1) |
| `js/modules/api.js` | — | ✅ extraído (passo 2) |
| `js/modules/auth.js` | — | ✅ extraído (passo 3) |
| `js/modules/cart.js` | — | ✅ extraído (passo 4) |
| `js/modules/favorites.js` | — | ✅ extraído (passo 5) |
| `js/modules/orders.js` | — | ✅ extraído (passo 6) |
| `js/modules/merchants.js` | — | ✅ extraído (bônus) |
| `js/modules/search.js` | — | ✅ extraído (passo 7) |
| `js/modules/map.js` | — | ✅ extraído (passo 8) |
| `js/modules/theme.js` | — | ✅ extraído (passo 9) |
| `js/modules/ui.js` | — | ✅ extraído (passo 10) |
| `js/modules/auth-ui.js` | — | ✅ extraído (bônus) |
| `js/modules/checkout.js` | — | ✅ extraído (bônus) |
| `js/modules/merchant-ui.js` | — | ✅ extraído (bônus) |
| `js/render/cards.js` | — | ✅ extraído (passo 11) |
| `js/render/modal.js` | — | ✅ extraído (passo 12+13) |
| `js/render/promotions.js` | — | ✅ extraído (passo 14) |
| `js/render/favorites.js` | — | ✅ extraído (bônus) |
| `js/render/orders-ui.js` | — | ✅ extraído (bônus) |
| `js/app.js` | — | ✅ criado (passo 15 — entry point ES module) |
| `js/modules/state.js` | — | ✅ criado (passo 15 — estado compartilhado) |

---

## Plano de passos

| # | O que extrair | De onde | Risco |
|---|---------------|---------|-------|
| **1** ✅ | `config.js` + `utils.js` | linhas 1–58, 345–352, 465–471 | baixo |
| **2** ✅ | `api.js` — fetch calls centralizadas | `registrarEstatistica`, `carregarComercios`, `enviarAvaliacaoApi` | baixo |
| **3** ✅ | `auth.js` — objeto `Auth` completo | login, register, logout, getSession, getToken | médio |
| **4** ✅ | `cart.js` — objeto `Cart` + drawer UI | Cart + toggleCarrinhoDrawer, renderCarrinhoDrawer, cartUpdateQtd, cartRemove, enviarTudoWhatsApp | médio |
| **5** ✅ | `favorites.js` — objeto `Favorites` | toggle, isFav | baixo |
| **6** ✅ | `orders.js` — objeto `Orders` | get, create | baixo |
| **bônus** ✅ | `merchants.js` — objeto `Merchants` | get, register | baixo |
| **7** | `search.js` — busca + filtros | linhas 508–617 | médio |
| **8** | `map.js` — Leaflet render | linhas 376–430 | médio |
| **9** | `theme.js` — dark mode | linhas 1471–1492 | baixo |
| **10** | `ui.js` — toasts, skeleton, lazy, PWA | linhas 1416–1560 | médio |
| **11** | `render/cards.js` — criarCard, renderizarCards | linhas 432–505 | médio |
| **12** | `render/modal.js` — abrirModal, fecharModal | linhas 619–710 | alto |
| **13** | `render/catalog.js` — catálogo + carrinho modal | linhas 660–798 | alto |
| **14** | `render/promotions.js` — renderPromos, renderRanking | linhas 522–617 | baixo |
| **15** ✅ | Migrar para `type="module"` — app.js como entry | tudo | alto |
| **16** ✅ | Atualizar `sw.js` cache list | sw.js | baixo |

---

## Conteúdo de cada módulo (referência rápida)

### `js/config.js`
Constantes globais sem dependência alguma.
```
API_BASE, KEYS (SESSION/CART/ORDERS/FAVORITES/API_TOKEN), ITEMS_POR_PAGINA
```

### `js/modules/utils.js`
Funções puras — sem DOM, sem estado, sem fetch.
```
escapeHTML(str)
storageGet(key)
storageSet(key, val)
gerarSlug(nome)
gerarStars(rating) → string HTML
formatCurrency(value) → "1.234,56" [nova — inline toFixed x7]
```

### `js/modules/api.js` (próximo)
Toda comunicação com o backend. Retorna dados, não manipula DOM.
```
registrarEstatistica(comercioId, tipo)
carregarComercios()
enviarAvaliacao(dados)
...
```

### `js/modules/auth.js` (próximo)
Objeto `Auth` completo — login, registro, logout, getSession, getToken.

### `js/modules/cart.js` (próximo)
Objeto `Cart` completo + renderCarrinhoDrawer + abrirCarrinhoDrawer.

---

## Ordem de carregamento em index.html

**Pós-migração (passo 15) — uma única tag:**
```html
<script type="module" src="js/app.js"></script>
```

O browser resolve o grafo de dependências automaticamente via `import`/`export`. Ordem de carregamento manual não é mais necessária.

---

## Log de mudanças

| Data | Passo | Arquivos alterados |
|------|-------|-------------------|
| 2026-04-14 | 1 — config + utils | `js/config.js` (novo), `js/modules/utils.js` (novo), `js/script.js` (linhas removidas), `index.html` (2 script tags) |
| 2026-04-14 | 2–6 + bônus — api, auth, cart, favorites, orders, merchants | `js/modules/api.js` (novo), `js/modules/auth.js` (novo), `js/modules/cart.js` (novo), `js/modules/favorites.js` (novo), `js/modules/orders.js` (novo), `js/modules/merchants.js` (novo), `js/script.js` (objetos + drawer removidos), `index.html` (+6 script tags) |
| 2026-04-14 | 7–14 + bônus — theme, ui, map, search, auth-ui, checkout, merchant-ui, render/* | 11 arquivos novos em `js/modules/` e `js/render/`, `js/script.js` reduzido a ~100 linhas (estado + init + boot), `index.html` (+12 script tags) |
| 2026-04-14 | 15 — migração ES modules + app.js | `js/app.js` (novo entry point), `js/modules/state.js` (novo estado compartilhado), todos os 20 módulos receberam `import`/`export`, `index.html` reduzido a 1 `<script type="module">`, `js/script.js` orphaned |
| 2026-04-14 | 16 — sw.js cache update | `sw.js` CACHE_NAME `v2` → `v3`, OFFLINE_ASSETS atualizado com todos os módulos novos, `script.js` removido da lista |
