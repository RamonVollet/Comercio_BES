# Comércio BES — Contexto para Claude Code

## O que é

Guia comercial + marketplace local para **Boa Esperança do Sul — SP**. Conecta moradores ao comércio local via web/PWA. Projeto de um colaborador (dono do repo), sendo desenvolvido com Pedro como co-desenvolvedor.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + JS vanilla (PWA) |
| Backend | Node.js + Express.js |
| Banco (dev) | SQLite via Prisma ORM |
| Banco (prod) | PostgreSQL — Supabase |
| Auth | JWT (HS256) + bcrypt |
| Upload | Multer (local) + Cloudinary (opcional) |
| Segurança | Helmet, CSP, CORS allowlist, rate-limiting |

## Estrutura

```
raiz/              → frontend estático (index.html, css/, js/, html/)
backend/           → API Express
  src/
    server.js      → entry point
    controllers/   → lógica de negócio
    routes/        → auth, comercios, categorias, avaliacoes, pedidos, pagamentos, upload, estatisticas
    middleware/    → auth.js (JWT), upload.js (multer), errorHandler.js
    lib/prisma.js  → PrismaClient singleton
  admin/           → painel do admin (/admin, protegido JWT)
  painel/          → painel do comerciante (/painel)
  prisma/
    schema.prisma  → 10 modelos: User, Categoria, Comercio, Produto, Promocao, Avaliacao, Estatistica, Pedido, ItemPedido, Pagamento
docs/              → contexto.md, roadmap.md, security-audit.md, skills.md
```

## Comandos úteis

```bash
cd backend
npm run dev          # servidor de desenvolvimento (nodemon)
npm run seed         # popula banco com dados de data.json
npm run db:push      # aplica schema.prisma no banco
npm run db:reset     # reset + reseed
npm run setup        # install + migrate + seed (primeira vez)
```

Frontend: abrir `index.html` diretamente ou `npx serve . -p 8080` na raiz.

## Credenciais de teste (seed)

- Admin: `admin@comerciobes.com` / `admin123`
- Lojista: `lojista@comerciobes.com` / `lojista123`

## Roles

- `admin` — acesso total, painel em `/admin`
- `comerciante` — gerencia própria loja, painel em `/painel`
- `cliente` — avalia, faz pedidos

## Branch strategy

```
main     → produção (protegida)
dev      → desenvolvimento ativo
claude/* → worktrees do Claude Code (merge na dev ao final da sessão)
```

## Deploy alvo

- **Frontend:** Hostinger Business (site estático)
- **Backend:** Hostinger Business (Node.js gerenciado — 5 apps disponíveis)
- **Banco:** Supabase (PostgreSQL, 2º projeto na conta existente)
- **Imagens:** Supabase Storage ou Cloudinary

## Fase atual

**Fase 4 — Marketplace** (em andamento)
- Carrinho + histórico de pedidos: implementado (localStorage)
- Pedidos backend (`/api/pedidos`): implementado
- Pagamento PIX Mercado Pago (`/api/pagamentos`): backend implementado, pendente testes + UI
- Notificações push: pendente
- Sistema de cupons: pendente

## Auditoria de segurança

Concluída em março/2026. **43 vulnerabilidades corrigidas** (4 críticas, 8 altas, 10 médias, 5 baixas, 16 frontend). Detalhes em `docs/security-audit.md`.

## O que ainda não existe

- Testes automatizados (zero cobertura — primeira prioridade técnica)
- CI/CD (deploy manual por enquanto)
- Docker
