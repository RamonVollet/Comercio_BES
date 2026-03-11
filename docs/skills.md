# Skills Técnicas — Comércio BES

Conhecimentos e tecnologias que serão úteis em cada fase do projeto.

---

## Frontend (Atual → Futuro)

### Essenciais agora
- **HTML5 Semântico** — estrutura acessível, SEO-friendly
- **CSS3 Avançado** — Grid, Flexbox, variáveis CSS, animações, media queries
- **JavaScript ES6+** — fetch, async/await, template literals, destructuring, módulos
- **DOM Manipulation** — manipulação eficiente sem frameworks
- **Responsividade** — mobile-first, design adaptativo

### Próximo nível
- **React.js** — componentização, hooks, estado, context API
- **Next.js** — SSR/SSG, roteamento, API routes, SEO automático
- **TypeScript** — tipagem estática para código mais seguro
- **Tailwind CSS** — produtividade no styling (alternativa ao CSS custom)
- **Framer Motion** — animações declarativas em React

---

## Backend (Fase 3+)

### API e Servidor
- **Node.js** — runtime JavaScript no servidor
- **Express.js** ou **Fastify** — framework para API REST
- **REST API design** — verbos HTTP, status codes, CORS, versionamento
- **Middleware** — autenticação, validação, rate limiting

### Banco de Dados
- **PostgreSQL** — banco relacional robusto (via Supabase)
- **MongoDB** — alternativa NoSQL (via Atlas)
- **Prisma** ou **Drizzle ORM** — ORM moderno para Node.js
- **Redis** — cache de dados frequentes (performance)

### Autenticação e Segurança
- **JWT (JSON Web Tokens)** — tokens de sessão stateless
- **bcrypt** — hash seguro de senhas
- **CORS** — configuração segura de origens
- **Rate Limiting** — proteção contra abuso
- **Helmet.js** — headers de segurança HTTP
- **OWASP Top 10** — conhecimento de vulnerabilidades comuns

---

## DevOps e Infraestrutura

### Deploy
- **Vercel** — deploy automático do frontend (Git push → produção)
- **Railway** ou **Render** — deploy do backend Node.js
- **Supabase** — PostgreSQL + Auth + Storage em um serviço
- **Cloudinary** — CDN de imagens com transformação automática

### Ferramentas
- **Git + GitHub** — controle de versão, branches, PRs
- **GitHub Actions** — CI/CD (testes automáticos, lint, deploy)
- **ESLint + Prettier** — padronização de código
- **Docker** (opcional) — containerização para ambiente consistente

---

## UX/UI Design

- **Figma** — prototipação e design de interfaces
- **Design System** — componentes reutilizáveis, tokens de design
- **Acessibilidade (a11y)** — ARIA labels, contraste, navegação por teclado
- **Mobile-first** — projetar para celular primeiro, expandir para desktop
- **Micro-interações** — feedback visual para cada ação do usuário

---

## PWA (Progressive Web App)

- **Service Workers** — cache offline, background sync
- **Web App Manifest** — ícone, splash screen, instalação
- **Cache API** — estratégias de cache (network-first, cache-first)
- **Push Notifications** — engajamento via Web Push API
- **Lighthouse** — auditoria de performance e PWA score

---

## SEO e Marketing

- **Meta tags** — title, description, Open Graph, Twitter Cards
- **Structured Data** — JSON-LD para lojas locais (LocalBusiness schema)
- **Google Search Console** — monitoramento de indexação
- **Google Analytics** ou **Plausible** — métricas de acesso
- **Sitemap.xml** — facilitar crawling
- **Schema.org** — dados estruturados para rich snippets

---

## APIs e Integrações

| Integração | Uso | Prioridade |
|-----------|-----|-----------|
| **WhatsApp API** (wa.me links) | Pedidos e contato | Alta (já implementado) |
| **OpenStreetMap** | Mapa dos comércios | Alta (já implementado) |
| **Geolocation API** | "Perto de você" | Média |
| **Clipboard API** | Copiar link da loja | Alta (já implementado) |
| **Web Share API** | Compartilhar nativo no mobile | Média |
| **Google Maps API** | Mapa mais completo (pago) | Baixa |
| **Mercado Pago API** | Pagamento PIX | Futura |
| **Cloudinary API** | Upload/transform de imagens | Média |
| **OneSignal** | Push notifications | Média |

---

## Aprendizado Recomendado (Ordem)

### Curto prazo (1-3 meses)
1. Aprofundar JavaScript assíncrono (Promises, async/await, error handling)
2. Aprender React.js (componentes, hooks, estado)
3. Git avançado (branches, merge, rebase, PRs)
4. Introdução a Node.js + Express

### Médio prazo (3-6 meses)
5. Next.js (SSR, API routes)
6. PostgreSQL + Prisma ORM
7. Autenticação JWT
8. TypeScript
9. Deploy (Vercel + Railway)

### Longo prazo (6-12 meses)
10. PWA (Service Workers)
11. Docker
12. Testes automatizados (Jest, Vitest, Cypress)
13. CI/CD (GitHub Actions)
14. Pagamento online (Mercado Pago / Stripe)

---

## Recursos de Estudo

| Recurso | Tipo | Tema |
|---------|------|------|
| [javascript.info](https://javascript.info) | Site | JS completo |
| [react.dev](https://react.dev) | Docs | React oficial |
| [nextjs.org/learn](https://nextjs.org/learn) | Tutorial | Next.js |
| [nodejs.org](https://nodejs.org) | Docs | Node.js |
| [prisma.io/docs](https://www.prisma.io/docs) | Docs | ORM |
| [web.dev](https://web.dev) | Site | PWA + Performance |
| [owasp.org](https://owasp.org) | Site | Segurança |

---

*Última atualização: Março 2026*
