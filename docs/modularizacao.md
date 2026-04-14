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
2. Script ainda é clássico (sem `type="module"`) — carregar via `<script src>` em ordem
3. Módulos são globais por enquanto — funções/objetos ficam no `window` implicitamente
4. `escapeHTML` deve ser importado por todos os renders — nunca inline
5. `data.json` como fallback precisa continuar funcionando
6. Service Worker (`sw.js`) atualizar cache list a cada novo arquivo JS/CSS adicionado

---

## Estado atual dos arquivos

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `js/script.js` | 1.561 | monólito — em decomposição |
| `js/config.js` | — | ✅ extraído (passo 1) |
| `js/modules/utils.js` | — | ✅ extraído (passo 1) |
| `js/modules/api.js` | — | pendente (passo 2) |
| `js/modules/auth.js` | — | pendente (passo 3) |
| `js/modules/cart.js` | — | pendente (passo 4) |
| `js/modules/favorites.js` | — | pendente |
| `js/modules/orders.js` | — | pendente |
| `js/modules/search.js` | — | pendente |
| `js/modules/map.js` | — | pendente |
| `js/modules/ratings.js` | — | pendente |
| `js/modules/theme.js` | — | pendente |
| `js/modules/ui.js` | — | pendente |
| `js/render/cards.js` | — | pendente |
| `js/render/modal.js` | — | pendente |
| `js/render/catalog.js` | — | pendente |
| `js/render/promotions.js` | — | pendente |
| `js/app.js` | — | pendente (passo final — entry point) |

---

## Plano de passos

| # | O que extrair | De onde | Risco |
|---|---------------|---------|-------|
| **1** ✅ | `config.js` + `utils.js` | linhas 1–58, 345–352, 465–471 | baixo |
| **2** | `api.js` — 6 fetch calls centralizadas | linhas 12–19, 284–318 | baixo |
| **3** | `auth.js` — objeto `Auth` completo | linhas 61–142 | médio |
| **4** | `cart.js` — objeto `Cart` + drawer UI | linhas 144–207, 870–940 | médio |
| **5** | `favorites.js` — objeto `Favorites` | linhas 209–228 | baixo |
| **6** | `orders.js` — objeto `Orders` | linhas 230–246 | baixo |
| **7** | `search.js` — busca + filtros | linhas 508–617 | médio |
| **8** | `map.js` — Leaflet render | linhas 376–430 | médio |
| **9** | `theme.js` — dark mode | linhas 1471–1492 | baixo |
| **10** | `ui.js` — toasts, skeleton, lazy, PWA | linhas 1416–1560 | médio |
| **11** | `render/cards.js` — criarCard, renderizarCards | linhas 432–505 | médio |
| **12** | `render/modal.js` — abrirModal, fecharModal | linhas 619–710 | alto |
| **13** | `render/catalog.js` — catálogo + carrinho modal | linhas 660–798 | alto |
| **14** | `render/promotions.js` — renderPromos, renderRanking | linhas 522–617 | baixo |
| **15** | Migrar para `type="module"` — app.js como entry | tudo | alto |
| **16** | Atualizar `sw.js` cache list | sw.js | baixo |

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

```html
<!-- 1. Config (sem deps) -->
<script src="js/config.js"></script>
<!-- 2. Utils (sem deps) -->
<script src="js/modules/utils.js"></script>
<!-- 3. (futuro) Módulos de domínio -->
<script src="js/modules/api.js"></script>
<script src="js/modules/auth.js"></script>
...
<!-- N. Script principal (usa tudo acima) -->
<script src="js/script.js"></script>
```

---

## Log de mudanças

| Data | Passo | Arquivos alterados |
|------|-------|-------------------|
| 2026-04-14 | 1 — config + utils | `js/config.js` (novo), `js/modules/utils.js` (novo), `js/script.js` (linhas removidas), `index.html` (2 script tags) |
