# Comércio BES — Contexto para Codex

## O que é

Guia comercial + marketplace local para **Boa Esperança do Sul — SP**. Conecta moradores ao comércio local via web/PWA. Projeto de um colaborador (dono do repo), sendo desenvolvido com Pedro como co-desenvolvedor.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + JS vanilla (PWA) |
| Backend | Node.js + Express.js |
| Banco | PostgreSQL 16 via Prisma ORM |
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
docs/              → OPERACAO.md
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

Docker local/producao:

```bash
docker compose up -d postgres redis
docker compose run --rm api npm run db:push
docker compose run --rm api npm run seed
docker compose up -d
```

## Credenciais de teste (seed)

- Admin: `admin@comerciobes.com` / `admin123`
- Lojista: `lojista@comerciobes.com` / `lojista123`

## Roles

- `admin` — acesso total, painel em `/admin`
- `comerciante` — gerencia própria loja, painel em `/minha-conta`
- `cliente` — avalia, faz pedidos

## Branch strategy

```
main     → produção (protegida)
dev      → desenvolvimento ativo
Codex/* → worktrees do Codex (merge na dev ao final da sessão)
```

## Deploy alvo

- **Frontend:** Hostinger Business ou site estatico equivalente
- **Backend:** servidor local via Docker Compose agora; VPS KVM 2/4 depois
- **Banco:** PostgreSQL em volume Docker, com backup SQL diario em `backups/`
- **Imagens:** upload local persistente em `backend/uploads` ou Cloudinary

Dominio da API/painel:

```txt
https://api.comerciobes.com.br
```

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

- CI/CD (deploy manual por enquanto)
- CI/CD completo
