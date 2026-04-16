# Plano de Deploy Pos-Merge: Hostinger x Supabase

## Resposta curta

Sim, **comporta no Hostinger** para o tamanho atual da cidade/projeto.

Recomendacao pratica:

1. **App (frontend + backend): Hostinger**
2. **Banco: Supabase PostgreSQL**
3. **Imagens: Cloudinary (ja integrado) ou Supabase Storage depois**

Isso equilibra custo, simplicidade e confiabilidade sem sobrecarregar operacao.

---

## Decisao recomendada

### Opcao A - Hostinger + Supabase (recomendada)

- Frontend estatico no Hostinger
- Backend Node no Hostinger (app gerenciada)
- Banco PostgreSQL no Supabase

**Por que esta e a melhor para o momento:**

- Mantem o que voce ja assina (Hostinger)
- Evita SQLite em producao
- Banco gerenciado com backup e observabilidade melhores
- Facil de escalar sem trocar toda a infraestrutura

### Opcao B - Hostinger 100% (funciona, mas com mais risco operacional)

- Frontend + Backend no Hostinger
- Banco MySQL no Hostinger

**Quando faz sentido:**

- Foco total em reduzir custo inicial
- Time disposto a lidar com backup/operacao manual do banco

**Risco principal:**

- Menos conforto operacional para crescer marketplace (pedidos, pagamentos, analytics)

---

## Arquitetura alvo (simples)

```txt
Dominio principal (Hostinger)
  -> frontend estatico (index, css, js, html)

api.seudominio.com (Hostinger Node)
  -> Express API + /admin + /painel (ate migrar para /minha-conta)

Supabase (PostgreSQL)
  -> Banco de dados principal via Prisma

Cloudinary (opcional, recomendado)
  -> Upload de imagens (evita acoplamento ao disco local)
```

---

## Plano de execucao para amanha (pos merge)

## Bloco 1 - Pre-flight local (30-45 min)

1. Atualizar branch com merge final
2. Rodar testes backend
3. Validar env de producao localmente
4. Confirmar endpoints criticos: auth, pedidos, pagamentos, upload

Comandos:

```bash
cd backend
npm ci
npm test
```

---

## Bloco 2 - Banco Supabase (30 min)

1. Criar projeto no Supabase
2. Copiar `DATABASE_URL` (URI)
3. Trocar `provider` do Prisma para `postgresql` no deploy branch
4. Aplicar schema e seed

Comandos:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

Observacao:

- Em producao, evitar SQLite. SQLite e bom para dev local.

---

## Bloco 3 - Backend no Hostinger (45-60 min)

1. Criar app Node.js no hPanel apontando para `backend`
2. Build/start command:
   - Install: `npm ci`
   - Start: `npm start`
3. Configurar variaveis de ambiente
4. Publicar e verificar health (`/api`)

Variaveis obrigatorias:

- `NODE_ENV=production`
- `PORT` (definida pelo ambiente, se necessario)
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `DATABASE_URL` (Supabase)
- `FRONTEND_URL=https://seudominio.com` (pode ser lista separada por virgula)
- `WEBHOOK_BASE_URL=https://api.seudominio.com`
- `MERCADO_PAGO_ACCESS_TOKEN` (quando ativar PIX)
- `MERCADO_PAGO_PUBLIC_KEY` (quando ativar PIX)

Variaveis opcionais (upload cloud):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## Bloco 4 - Frontend no Hostinger (20-30 min)

1. Subir arquivos estaticos da raiz
2. Confirmar que frontend aponta para API publica
3. Validar login, listagem, pedidos e fluxo basico

---

## Bloco 5 - Validacao final (30 min)

Checklist de smoke test em producao:

1. `GET /api` responde 200
2. Login admin e lojista funcionando
3. CORS liberando somente dominio oficial
4. Cadastro e consulta de pedidos funcionando
5. Upload de imagem funcionando (local ou cloud)
6. Pagamento:
   - sem MP configurado: fallback para `na_entrega`
   - com MP configurado: cria preferencia e retorna checkout URL

---

## Go-live com baixo risco

1. Subir primeiro em subdominio de homologacao
2. Testar 24h com usuarios internos
3. Virar DNS/rota principal
4. Monitorar logs nas primeiras 48h

---

## Pergunta central: Hostinger sozinho ou Supabase?

Recomendacao final para seu caso:

1. **Use Hostinger + Supabase agora** (melhor equilibrio)
2. Mantenha frontend/backend no Hostinger
3. Deixe banco fora (Supabase) para evitar dor de crescimento

Se quiser cortar custo no curtissimo prazo, da para iniciar com MySQL da Hostinger, mas eu trataria como transitorio.

---

## Roteiro de evolucao (quando o painel unico entrar)

1. Consolidar `/admin` e `/painel` em `/minha-conta`
2. Adicionar observabilidade minima (logs por role e endpoint)
3. Trocar `db push` por fluxo de migrations versionadas
4. Formalizar rotina de backup e restore testado

---

## Conclusao

Para a realidade de cidade pequena, voce nao precisa complicar stack.
Com o que ja existe hoje, o caminho mais inteligente e:

- **Hostinger para app**
- **Supabase para banco**

Entrega rapido, cabe no contexto atual e evita retrabalho quando o marketplace crescer.