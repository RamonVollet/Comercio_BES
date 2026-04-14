# Roadmap — Comércio BES

Plano de evolução do projeto de vitrine/marketplace local.

---

## Fase 1 — MVP Estático (Atual) ✅

> Status: **Concluído**

- [x] Tela de welcome com animações
- [x] Busca por nome, categoria e tags
- [x] Filtro por categorias
- [x] Ordenação (rating, A-Z, visitas)
- [x] Cards de comércios com status aberto/fechado
- [x] Seção de promoções ativas
- [x] Ranking (avaliação, visitas, recomendados)
- [x] Mapa com OpenStreetMap
- [x] Modal de detalhes da loja
- [x] Avaliação com estrelas e toast
- [x] Botão WhatsApp em cada loja
- [x] Dados separados em `data.json` (fetch)
- [x] Deep linking (`?loja=slug`)
- [x] Catálogo de produtos (Pizzaria + Hamburgueria)
- [x] Carrinho → pedido formatado no WhatsApp

---

## Fase 2 — PWA + UX Avançado ✅

> Status: **Concluído**

- [x] **PWA (Progressive Web App)**
  - Manifest.json + Service Worker
  - Funcionar offline (cache dos dados)
  - "Instalar" como app no celular
- [x] **Melhorias de UX**
  - Skeleton loading enquanto carrega dados
  - Lazy loading das imagens reais
  - Animações de transição entre seções
  - Scroll infinito ou paginação nos cards
- [x] **Favoritos (localStorage)**
  - Salvar lojas favoritas no navegador
  - Seção "Meus Favoritos"
- [x] **Tema escuro (Dark Mode)**

---

## Fase 3 — Backend + Painel Admin ✅

> Status: **Concluído**

- [x] **API REST com Node.js**
  - Express.js com middleware (CORS, Helmet, rate-limiting)
  - CRUD completo de comércios, produtos, promoções
  - Endpoints: `/api/comercios`, `/api/comercios/:slug`, `/api/categorias`, `/api/avaliacoes`, `/api/estatisticas`
- [x] **Banco de dados**
  - Prisma ORM com SQLite (dev) / PostgreSQL ou MySQL (prod)
  - Schema: User, Categoria, Comercio, Produto, Promocao, Avaliacao, Estatistica
  - Seed script importa todos os dados de `data.json`
- [x] **Painel administrativo**
  - Login para administradores e comerciantes (JWT + bcrypt)
  - Cadastrar/editar/excluir lojas
  - Gerenciar catálogo de produtos e promoções
  - Ver avaliações e estatísticas (visitas, cliques WhatsApp)
  - Dashboard com visão geral
- [x] **Upload de imagens**
  - Multer para armazenamento local
  - Integração opcional com Cloudinary (auto-detecta via env vars)
- [x] **Avaliações reais**
  - Salvar avaliações no banco (nota + comentário)
  - Média calculada no servidor, atualizada em tempo real
- [x] **Frontend integrado com API**
  - `carregarDados()` busca da API com fallback para `data.json`
  - `enviarAvaliacao()` envia via API REST
  - Estatísticas: visitas, cliques WhatsApp, compartilhamentos
  - Auth (login/registro) via API com fallback localStorage

---

## Fase 3.5 — Auditoria de Segurança ✅

> Status: **Concluído** (Março 2026)

Auditoria completa de segurança com **43 vulnerabilidades identificadas e corrigidas**. Relatório detalhado em `docs/security-audit.md`.

- [x] **Headers de segurança (Helmet)**
  - CSP, HSTS, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy
  - Permissions-Policy (câmera, microfone, pagamento desabilitados)
  - CORP/COOP configurados
- [x] **Proteção contra ataques**
  - XSS: `escapeHTML()` em 14 pontos de innerHTML no frontend
  - Injeção: `sanitize()` em todos os controllers do backend
  - CSRF: CORS com allowlist explícita de origens
  - Rate limiting: auth (20/15min), avaliações (30/15min), estatísticas (60/1min)
- [x] **Autenticação e autorização**
  - JWT com algoritmo HS256 explícito (sign + verify)
  - Bloqueio de escalação de privilégio (registro como admin impedido)
  - Validação de email com regex
  - Normalização de email (lowercase + trim)
  - Verificação de JWT_SECRET na inicialização
- [x] **Proteção de dados**
  - IDOR corrigido (produtos verificam pertencimento ao comércio)
  - IPs não armazenados em estatísticas
  - Paginação limitada (máx 100 resultados)
  - Body parser reduzido para 100KB
- [x] **Qualidade de código**
  - PrismaClient singleton (`src/lib/prisma.js`)
  - Imports não utilizados removidos
  - parseInt com radix 10 + validação NaN
  - Morgan (request logging) configurado
  - Error handler genérico em produção
- [x] **Frontend**
  - SRI (Subresource Integrity) nos CDN do Leaflet
  - Senhas em plaintext substituídas por ofuscação btoa() no localStorage fallback
  - Validação de WhatsApp (10-15 dígitos)

---

## Fase 4 — Marketplace Completo

> Status: **Em andamento**

- [x] **Carrinho persistente**
  - Carrinho salvo em localStorage (`js/modules/cart.js`)
  - Adicionar/remover itens, alterar quantidade
  - Pedido formatado e enviado via WhatsApp
- [x] **Histórico de pedidos**
  - Módulo Orders em `js/modules/orders.js` com localStorage
  - Usuário pode ver pedidos anteriores
- [ ] **Notificações**
  - Push notifications para promoções
  - Loja nova cadastrada na sua categoria favorita
- [ ] **Sistema de cupons**
  - Código promocional por loja
  - "Primeira compra com desconto"
- [x] **Integração com pagamento** (backend implementado — pendente testes e UI)
  - PIX via Mercado Pago (`pagamentosController.js` + rota `/api/pagamentos`)
  - Modelo `Pagamento` no banco com status e external_id
  - [ ] Testar fluxo completo com sandbox Mercado Pago
  - [ ] Integrar UI do frontend com checkout PIX
- [ ] **Delivery tracking** (muito longo prazo)
  - Status do pedido em tempo real
  - Integração com motoboy

---

## Fase 5 — Escala e Monetização

> Status: Visão

- [ ] **Plano premium para lojistas**
  - Destaque nas buscas
  - Selo verificado
  - Analytics avançados
  - Prioridade no ranking
- [ ] **Anúncios locais**
  - Banner no topo para comerciantes premium
  - Promoções destacadas por pagamento
- [ ] **Expansão para outras cidades**
  - Multi-tenant (cada cidade = instância)
  - "Comércio [SIGLA]" — modelo replicável
- [ ] **App nativo (React Native / Flutter)**
  - Se a demanda justificar
- [ ] **SEO e Google Meu Negócio**
  - Indexação de cada loja
  - Rich snippets / structured data

---

## Ideias Complementares

| Ideia | Descrição | Esforço |
|-------|-----------|---------|
| **Classificados** | Seção de classificados locais (vender usado) | Médio |
| **Vagas de emprego** | Comerciantes postam vagas | Baixo |
| **Eventos locais** | Agenda cultural de BES | Baixo |
| **Blog da cidade** | Matérias sobre comércios, novidades | Médio |
| **Gamificação** | Selos para quem avalia muito, "influencer local" | Médio |
| **QR Code por loja** | Comerciante imprime QR que leva ao perfil | Baixo |
| **Widget embeddable** | Comerciante coloca widget no Instagram/site | Alto |
| **Integração iFood** | Puxar cardápio do iFood se a loja tiver | Alto |

---

## Métricas de Sucesso

| Métrica | Meta (6 meses) |
|---------|----------------|
| Comércios cadastrados | 50+ |
| Acessos mensais | 1.000+ |
| Pedidos via WhatsApp | 100+/mês |
| Avaliações | 200+ |
| Comerciantes premium | 5+ |

---

---

## Fase 4.5 — Refatoração Técnica ✅

> Status: **Concluído** (Abril 2026)

- [x] **Modularização do frontend** — `script.js` (1.561 linhas) extraído em 20 módulos
- [x] **Migração para ES Modules** — `type="module"` + `app.js` como entry point único
- [x] **Estado compartilhado** — `js/modules/state.js` centraliza estado mutable
- [x] **Service Worker atualizado** — cache `v3` com lista de todos os módulos

---

*Última atualização: Abril 2026*
