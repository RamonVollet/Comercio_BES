# Comercio BES

Guia comercial e marketplace local de Boa Esperanca do Sul - SP.

## Decisao atual

Rodar a API em servidor local com Docker agora e migrar para VPS depois. O dominio da API ja deve ser definitivo:

```txt
https://api.comerciobes.com.br
```

Assim a migracao futura troca DNS e restaura backup, sem mudar o frontend.

## Stack

- Frontend: HTML, CSS e JavaScript vanilla.
- Backend: Node.js + Express.
- Banco: PostgreSQL 16 via Prisma.
- Proxy/SSL: Caddy.
- Cache/fila futura: Redis.
- Deploy: Docker Compose.

## Subir com Docker

Crie `.env` a partir de `.env.example` e troque senhas/chaves.

```bash
docker compose up -d postgres redis
docker compose run --rm api npm run db:push
docker compose run --rm api npm run seed
docker compose up -d
```

URLs:

- API: `https://api.comerciobes.com.br/api`
- Health: `https://api.comerciobes.com.br/api/health`
- Painel: `https://api.comerciobes.com.br/minha-conta`

## Desenvolvimento sem Docker

```bash
cd backend
npm install
npm run db:push
npm run seed
npm run dev
```

URLs locais:

- Site/API: `http://localhost:3000`
- Painel: `http://localhost:3000/minha-conta`

## Credenciais seed

- Admin: `admin@comerciobes.com` / `admin123`
- Lojista: `lojista@comerciobes.com` / `lojista123`
- Alias lojista: `comerciante@demo.com` / `demo123`

## Docs importantes

- Operacao, backup e migracao: `docs/OPERACAO.md`
