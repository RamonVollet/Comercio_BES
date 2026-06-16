# Operacao - Comercio BES

Este e o guia importante para colocar a API em servidor local hoje e migrar para VPS depois sem redesenhar tudo.

## Arquitetura alvo

- Site publico: `https://comerciobes.com.br`
- API e painel: `https://api.comerciobes.com.br`
- Proxy/SSL: Caddy
- API: Node.js + Express em Docker
- Banco: PostgreSQL 16 em volume Docker
- Cache/fila futura: Redis 7
- Backups: dumps SQL diarios em `backups/`

O frontend deve chamar sempre `https://api.comerciobes.com.br/api`, nunca IP direto. Na migracao para VPS, a troca principal deve ser o DNS.

## Primeira subida no servidor

1. Instale Docker Engine e Docker Compose plugin.
2. Aponte `api.comerciobes.com.br` para o IP publico do servidor.
3. Copie `.env.example` para `.env`.
4. Troque `POSTGRES_PASSWORD` e `JWT_SECRET`.
5. Suba banco e Redis:

```bash
docker compose up -d postgres redis
```

6. Crie tabelas e dados iniciais:

```bash
docker compose run --rm api npm run db:push
docker compose run --rm api npm run seed
```

7. Suba a pilha completa:

```bash
docker compose up -d
```

8. Confira:

```bash
curl https://api.comerciobes.com.br/api/health
```

O esperado e `database: "reachable"`.

## Login e painel

Painel:

```txt
https://api.comerciobes.com.br/minha-conta
```

Credenciais criadas pelo seed:

```txt
Admin: admin@comerciobes.com / admin123
Lojista: lojista@comerciobes.com / lojista123
Alias lojista: comerciante@demo.com / demo123
```

O lojista seed fica vinculado a uma loja demo para o dashboard abrir com contexto de loja.

## Backup

O servico `db-backup` cria um arquivo SQL por dia em `backups/` e apaga dumps com mais de 14 dias.

Backup manual:

```bash
docker compose exec postgres pg_dump -U comerciobes comerciobes > backups/manual-$(date +%F_%H-%M-%S).sql
```

Restore em banco vazio:

```bash
cat backups/arquivo.sql | docker compose exec -T postgres psql -U comerciobes comerciobes
```

Antes de migrar para VPS, faca um backup manual e teste restore em uma maquina separada.

## Migracao para VPS

1. Instale Docker na VPS.
2. Copie o repositorio, `.env`, `backend/uploads/` e `backups/`.
3. Suba Postgres na VPS.
4. Restaure o SQL mais recente.
5. Suba `docker compose up -d`.
6. Troque o DNS de `api.comerciobes.com.br` para o IP da VPS.
7. Confira `/api/health`, login e painel.

Escolha inicial recomendada: KVM 2. Suba para KVM 4 quando houver loja usando diariamente, pagamento real, instabilidade ou consumo alto.

## Checklist antes de expor

- `JWT_SECRET` real e longo.
- `POSTGRES_PASSWORD` real e forte.
- Firewall liberando apenas 80/443 publicamente.
- Banco sem porta publica.
- `COOKIE_DOMAIN=.comerciobes.com.br`.
- `FRONTEND_URL=https://comerciobes.com.br`.
- `WEBHOOK_BASE_URL=https://api.comerciobes.com.br`.
- `AUTH_FALLBACK_ENABLED=false`.
- `/api/health` com banco reachable.
- Backup gerado e restore testado.
