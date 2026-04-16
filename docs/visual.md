# Visual Redesign: "Local & Premium" — Comércio BES

## Context

O site atual tem visual de "sistema administrativo": fundo verde-floresta dominante (`--escuro: #184a37`), sombras com tint verde (`rgba(0,200,83,0.28)`), tipografia Poppins sem personalidade. O objetivo é transformar a interface em um marketplace de consumo fluido — fundo off-white clean, verde usado com precisão cirúrgica, tipografia moderna, cards que "flutuam" com soft shadows, glassmorphism no header e micro-interações.

**Arquivos afetados:**
- `css/style.css` (2775 linhas) — frontend público
- `backend/admin/css/admin.css` (604 linhas) — painel admin
- `backend/painel/css/painel.css` (589 linhas) — painel comerciante
- `index.html` — import de fontes (head)
- `html/login.html` e `html/cadastro.html` — import de fontes (head)
- `js/modules/theme.js` ou nav scroll — pequena adição JS para glassmorphism

---

## Antes de Começar

1. Criar branch dedicada: `git checkout -b feat/visual-redesign`
2. Tirar screenshots do estado atual para comparação (index, login, painel, admin)
3. Executar scan de cores hardcoded antes de alterar variáveis (ver Phase 0 abaixo)

> **Rollback:** todo o redesign fica contido nessa branch. Um `git checkout main` restaura o estado original a qualquer momento.

---

## Nova Paleta

A paleta usa valores equivalentes ao Tailwind Emerald/Slate — testados em produção, com boa acessibilidade entre si.

| Variável | Atual | Nova | Uso | Contraste¹ |
|----------|-------|------|-----|------------|
| `--verde` | `#00C853` | `#10B981` | Foco de inputs, bordas ativas | — |
| `--verde-escuro` | `#007B33` | `#047857` | Brand, logo, headings, botões CTA | branco: **5.8:1** ✓ |
| `--laranja` | `#FF6D00` | `#EA580C` | Tags promo, badges | branco: **3.4:1** (bold/large) |
| `--creme` / bg principal | `#edf7f1` | `#FAFAFA` | Background geral | — |
| `--escuro` | `#184a37` | `#1E293B` | Texto principal, header nav | sobre #FAFAFA: **16.1:1** ✓ |
| `--cinza` | `#f4fbf7` | `#F8FAFC` | Background secundário/cards | — |
| `--texto` | `#143428` | `#334155` | Texto corrido | sobre #FAFAFA: **8.9:1** ✓ |
| `--borda` | `#cfe3d7` | `#E2E8F0` | Bordas neutras | — |
| Dark `--creme` | `#0F0F0F` | `#0B1120` | Background dark mode | — |
| Dark `--escuro` | `#FFFFFF` | `#F1F5F9` | Texto no dark mode | sobre #0B1120: **17.3:1** ✓ |

> ¹ WCAG AA exige 4.5:1 para texto normal, 3:1 para texto grande/bold (≥18px ou ≥14px bold).
>
> ⚠️ **Botões CTA:** usar `background: var(--verde-escuro)` (#047857) com `color: #FFFFFF` — contraste 5.8:1.
> Não usar `--verde` (#10B981) como fundo de botão com texto branco (contraste 2.4:1 — falha WCAG).

---

## Nova Tipografia

**Google Fonts — substituir em todos os HTMLs:**
```html
<!-- Preconnect para melhorar LCP (adicionar antes do link principal) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Remover Poppins, adicionar Plus Jakarta Sans -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Headings / Logo / Destaques**: `'Plus Jakarta Sans', sans-serif`
- **Body / Inputs / Descrições**: `'Inter', sans-serif`
- Nos painéis admin/painel: manter `DM Sans` + substituir `Syne` por `Plus Jakarta Sans`

---

## Passos de Implementação

### Phase 0 — Scan de Cores Hardcoded (antes de qualquer mudança)

Identificar ocorrências de cores hardcoded fora do `:root` e migrar para variáveis:

```bash
# Buscar cores do esquema antigo em style.css
grep -n "#00C853\|#007B33\|#184a37\|#edf7f1\|#143428\|#cfe3d7\|#f4fbf7\|#FF6D00" css/style.css
grep -n "#00C853\|#007B33\|#184a37" backend/admin/css/admin.css
grep -n "#00C853\|#007B33\|#184a37" backend/painel/css/painel.css
```

Para cada ocorrência encontrada: substituir pelo nome da variável CSS correspondente antes de alterar os valores no `:root`.

---

### Phase 1 — Variáveis CSS (todos os 3 arquivos)

**style.css** — atualizar bloco `:root` completo:
```css
:root {
  --verde: #10B981;
  --verde-escuro: #047857;
  --laranja: #EA580C;
  --azul: #0D47A1;
  --creme: #FAFAFA;
  --escuro: #1E293B;
  --cinza: #F8FAFC;
  --texto: #334155;
  --borda: #E2E8F0;
  --transition-base: 0.2s ease-out; /* transições consistentes em todo o projeto */
  /* demais variáveis light/dark mantidas */
}

body.dark-mode {
  --creme: #0B1120;
  --escuro: #F1F5F9;
  --cinza: #1E293B;
  --texto: #CBD5E1;
  --borda: #334155;
}
```

**admin.css e painel.css** — mesmo swap nas variáveis `--verde`, `--verde-dark`, `--creme`, `--escuro`.

---

### Phase 2 — Import de Fontes

**Arquivos:** `index.html`, `html/login.html`, `html/cadastro.html`

Substituir a linha `<link>` do Google Fonts: adicionar os dois `<link rel="preconnect">` acima do import e trocar `Poppins` por `Plus+Jakarta+Sans`.

Atualizar declaração `font-family` nos headings de `'Poppins'` para `'Plus Jakarta Sans'`.

---

### Phase 3 — style.css: Componentes Chave

#### 3a. Body / Background principal
```css
body {
  background-color: var(--creme); /* agora #FAFAFA */
  font-family: 'Inter', sans-serif;
}
h1, h2, h3, h4, .nav-logo, .store-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
}
```

#### 3b. Hero/Banner — Mesh Gradient sutil (substituir fundo verde sólido)
```css
.hero, .banner-section {
  background:
    radial-gradient(ellipse 700px 500px at 5% 30%, rgba(16,185,129,0.07) 0%, transparent 65%),
    radial-gradient(ellipse 500px 400px at 85% 70%, rgba(234,88,12,0.05) 0%, transparent 65%),
    var(--creme);
}
```

#### 3c. Nav — Glassmorphism no scroll
Adicionar classe `.scrolled` via JS (IntersectionObserver ou scroll event):
```css
nav {
  background: var(--creme);
  transition: background var(--transition-base), backdrop-filter var(--transition-base), box-shadow var(--transition-base);
}
nav.scrolled {
  background: rgba(250, 250, 250, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
}
body.dark-mode nav.scrolled {
  background: rgba(11, 17, 32, 0.85);
}
```

JS minimal (adicionar em `theme.js` ou criar `nav-scroll.js`):
```js
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 10);
});
```

#### 3d. Cards — Border-radius 20px + Soft Shadows
```css
/* Substituir sombras green-tinted por neutras */
.store-card, .promo-card, .product-card {
  border-radius: 20px;
  box-shadow: 0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.store-card:hover, .promo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px -8px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
}
```

#### 3e. Inputs — Sem borda até :focus
```css
input, textarea, select {
  border: 1.5px solid transparent;
  background: var(--cinza);
  border-radius: 12px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
  outline: none;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--verde);
  box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
}
```

#### 3f. Botões CTA — Verde escuro com texto branco
```css
.btn-primary, .cta-button, [class*="btn-verde"] {
  background: var(--verde-escuro); /* #047857 — contraste 5.8:1 com branco */
  color: #FFFFFF;
  transition: background var(--transition-base), transform var(--transition-base);
}
.btn-primary:hover {
  background: #065F46; /* tom mais escuro no hover */
  transform: translateY(-1px);
}
```

#### 3g. Tags de Promoção / Badges
```css
.badge-promo, .tag-promo, .desconto-badge {
  background: var(--laranja); /* #EA580C terracota */
  color: #fff; /* bold/large text: contraste 3.4:1 — adequado para badges em font-weight ≥ 700 */
  font-weight: 700;
  border-radius: 8px;
}
```

#### 3h. Modais e Drawer — Glassmorphism
```css
.modal-content, .drawer-content, .cart-drawer {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 24px;
  box-shadow: 0 20px 60px -12px rgba(0,0,0,0.18);
  transition: opacity var(--transition-base), transform var(--transition-base);
}
body.dark-mode .modal-content,
body.dark-mode .drawer-content {
  background: rgba(30,41,59,0.90);
  border-color: rgba(255,255,255,0.08);
}
```

---

### Phase 4 — admin.css e painel.css

Mudanças mais focadas (variáveis já trocadas na Phase 1):

- Sidebar: usar `--verde-escuro` (#047857) como cor da sidebar activa (em vez do verde neon atual)
- Cards/stat boxes: aplicar o mesmo soft shadow `0 4px 24px -4px rgba(0,0,0,0.06)`
- Tabelas: usar `--borda` (#E2E8F0) para divisores em vez de `#e0e0e0` hardcoded
- Botões primary: `background: var(--verde-escuro)` (#047857) com `color: #FFFFFF`
- Fonte headings: `'Plus Jakarta Sans'` (importar no HTML dos painéis também)

---

## Verificação

1. Abrir `index.html` no browser — fundo deve ser off-white (#FAFAFA), sem verde dominante
2. Scrollar — nav deve virar glassmorphism após 10px de scroll
3. Hover em card de comércio — deve subir 4px suavemente
4. Clicar em input de busca — borda esmeralda aparece + glow sutil
5. Abrir modal de login — deve ter efeito vidro (blur no fundo)
6. Ativar dark mode — fundo deve ser #0B1120 (azul-escuro, não preto puro); nav glassmorphism dark deve funcionar
7. Abrir `/admin` e `/painel` — sidebar com verde mais sóbrio, sem neon
8. Inspecionar botões CTA — cor de fundo deve ser #047857 (não #10B981)

---

## Notas

- Nenhum novo pacote npm — tudo CSS nativo + Google Fonts
- `Poppins` pode ser removida do import para reduzir um request
- O glassmorphism do header requer HTTPS ou localhost (Safari bloqueia `backdrop-filter` em file:///)
- `transform: translateY(-4px)` no hover de cards pode ser reduzido para `-2px` em mobile via `@media (hover: none)`
- `--transition-base: 0.2s ease-out` centraliza a duração de todas as micro-animações — altere aqui para ajustar o "peso" global das transições
