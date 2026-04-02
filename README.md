# Comércio BES

> Vitrine e marketplace local de **Boa Esperança do Sul — SP**

Guia comercial digital que conecta moradores ao comércio local, centralizando informações de estabelecimentos em uma experiência moderna, rápida e visual. O projeto evolui de um catálogo estático para um marketplace com pedidos via WhatsApp.

## Funcionalidades

- **Busca inteligente** por nome, categoria e tags (ex.: pizza, farmácia, mecânico)
- **Filtro por categorias** de comércio (restaurantes, farmácias, pet shops, etc.)
- **Ordenação** por melhor avaliação, ordem alfabética e mais visitados
- **Promoções ativas** em destaque
- **Ranking** por avaliação, visitas e recomendações
- **Mapa** incorporado com OpenStreetMap
- **Modal detalhado** de cada estabelecimento (endereço, horário, telefone, status, galeria, WhatsApp)
- **Deep linking** — compartilhe o link de uma loja específica (ex.: `?loja=pizzaria-bella-massa`)
- **Catálogo de produtos** com envio de pedido formatado via WhatsApp
- **Avaliação com estrelas** — salva no banco de dados com média em tempo real
- **API REST** — backend Node.js/Express com autenticação JWT
- **Painel administrativo** (`/admin`) — CRUD de lojas, produtos, promoções, estatísticas
- **Painel do comerciante** (`/painel`) — gestão da própria loja, produtos e pedidos
- **Sistema de pedidos** — criação, acompanhamento e atualização de status
- **Pagamentos** — integração com Mercado Pago (PIX)
- **Upload de imagens** — armazenamento local + Cloudinary opcional
- **Estatísticas** — rastreamento de visitas, cliques WhatsApp, compartilhamentos
- **Arquitetura híbrida** — API REST com fallback para `data.json` estático

## Tecnologias

| Camada      | Tecnologia                                   |
| ----------- | -------------------------------------------- |
| Frontend    | HTML5, CSS3, JavaScript ES6+ (vanilla)       |
| Backend     | Node.js, Express.js                          |
| Banco       | Prisma ORM + SQLite (dev) / MySQL ou PostgreSQL (prod) |
| Auth        | JWT + bcrypt                                 |
| Upload      | Multer (local) + Cloudinary (opcional)       |
| Segurança   | Helmet, CORS, Rate Limiting                  |
| Fontes      | Google Fonts (Syne, DM Sans)                 |
| Mapa        | Leaflet + OpenStreetMap                      |

## Estrutura do Projeto

```text
comercio_bes/
├── index.html                  # Frontend principal
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker (cache offline)
├── data/
│   └── data.json               # Dados estáticos (fallback)
├── css/
│   └── style.css               # Estilos do frontend
├── js/
│   └── script.js               # Lógica do frontend (API + fallback)
├── html/
│   ├── login.html              # Página de login
│   └── cadastro.html           # Página de cadastro
├── backend/
│   ├── package.json             # Dependências do backend
│   ├── .env                     # Variáveis de ambiente (não versionado)
│   ├── .env.example             # Template de variáveis de ambiente
│   ├── prisma/
│   │   ├── schema.prisma        # Schema do banco de dados
│   │   └── dev.db               # SQLite de desenvolvimento
│   ├── src/
│   │   ├── server.js            # Servidor Express
│   │   ├── seed.js              # Script de seed (importa data.json)
│   │   ├── lib/
│   │   │   └── prisma.js        # PrismaClient singleton
│   │   ├── middleware/
│   │   │   ├── auth.js          # Middleware JWT + controle de roles
│   │   │   ├── upload.js        # Multer + Cloudinary
│   │   │   └── errorHandler.js  # Handler de erros global
│   │   ├── routes/
│   │   │   ├── auth.js          # POST /api/auth/registro, /api/auth/login
│   │   │   ├── comercios.js     # CRUD /api/comercios
│   │   │   ├── categorias.js    # GET /api/categorias
│   │   │   ├── avaliacoes.js    # GET/POST /api/avaliacoes/:slug
│   │   │   ├── pedidos.js       # GET/POST/PUT /api/pedidos
│   │   │   ├── pagamentos.js    # POST /api/pagamentos (Mercado Pago)
│   │   │   ├── upload.js        # POST /api/upload
│   │   │   └── estatisticas.js  # POST /api/estatisticas/registrar
│   │   └── controllers/         # Lógica de cada rota
│   ├── admin/                   # Painel do administrador (/admin)
│   │   ├── index.html
│   │   ├── css/admin.css
│   │   └── js/admin.js
│   ├── painel/                  # Painel do comerciante (/painel)
│   │   ├── index.html
│   │   ├── css/painel.css
│   │   └── js/painel.js
│   └── uploads/                 # Imagens enviadas (local)
├── docs/
│   ├── contexto.md
│   ├── roadmap.md
│   ├── security-audit.md
│   └── skills.md
└── README.md
```

## Como Executar

### 1. Backend (API + Admin)

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env se necessário (JWT_SECRET, porta, etc.)

# Gerar o Prisma Client e criar o banco
npx prisma generate
npx prisma db push

# Popular o banco com dados iniciais (importa data.json)
npm run seed

# Iniciar o servidor
npm run dev
```

O backend roda em `http://localhost:3000`:
- **API:** `http://localhost:3000/api`
- **Admin:** `http://localhost:3000/admin`

**Credenciais de acesso (seed):**
- Admin: `admin@comerciobes.com` / `admin123`
- Lojista demo: `lojista@comerciobes.com` / `lojista123`

### 2. Frontend

```bash
# Na raiz do projeto, servir com qualquer HTTP server
# Exemplo com Python:
python -m http.server 8080

# Exemplo com Node.js:
npx serve . -p 8080
```

Acesse `http://localhost:8080` no navegador. O frontend detecta automaticamente se a API está disponível em `localhost:3000` e faz fallback para `data/data.json` caso contrário.

### Direto no navegador

Abra `index.html` — funciona em modo offline com dados do `data.json`. Funcionalidades que dependem da API (avaliações reais, estatísticas, auth via banco) ficam desabilitadas.

## API REST

### Endpoints principais

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| `GET` | `/api/comercios` | Listar comércios (busca, filtro, paginação) |
| `GET` | `/api/comercios/:slug` | Detalhes de um comércio |
| `POST` | `/api/comercios` | Criar comércio (admin) |
| `PUT` | `/api/comercios/:slug` | Atualizar comércio (admin) |
| `DELETE` | `/api/comercios/:slug` | Remover comércio (admin) |
| `GET` | `/api/categorias` | Listar categorias |
| `GET` | `/api/avaliacoes/:slug` | Avaliações de um comércio |
| `POST` | `/api/avaliacoes/:slug` | Enviar avaliação |
| `POST` | `/api/estatisticas/registrar` | Registrar evento (visita, clique) |
| `GET` | `/api/pedidos` | Listar pedidos do usuário autenticado |
| `POST` | `/api/pedidos` | Criar pedido |
| `PUT` | `/api/pedidos/:id` | Atualizar status do pedido |
| `POST` | `/api/pagamentos` | Criar pagamento PIX (Mercado Pago) |
| `POST` | `/api/auth/registro` | Criar conta |
| `POST` | `/api/auth/login` | Fazer login |
| `POST` | `/api/upload` | Upload de imagem |

### Query params (`GET /api/comercios`)

| Param | Descrição | Exemplo |
| ----- | --------- | ------- |
| `busca` | Texto de busca (nome, tags) | `?busca=pizza` |
| `categoria` | Filtro por slug de categoria | `?categoria=restaurante` |
| `aberto` | Filtro por status | `?aberto=true` |
| `orderBy` | Ordenação | `?orderBy=rating` |
| `page` | Página | `?page=1` |
| `limit` | Itens por página | `?limit=20` |

## Deploy (Hostinger Business + Supabase)

### Banco de dados — Supabase (PostgreSQL)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a `DATABASE_URL` (Connection String → URI mode)
3. Altere o `provider` em `prisma/schema.prisma` de `sqlite` para `postgresql`
4. Configure `DATABASE_URL` no `.env` com a string do Supabase
5. Execute `npx prisma db push` para criar as tabelas
6. Execute `npm run seed` para popular os dados

### Hostinger Business — Node.js gerenciado

1. **Frontend:** suba os arquivos estáticos (`index.html`, `css/`, `js/`, `data/`, etc.) via hPanel
2. **Backend:** crie uma aplicação Node.js gerenciada no hPanel apontando para `backend/`
3. Configure as variáveis de ambiente no painel (JWT_SECRET, DATABASE_URL, etc.)
4. O backend será acessível em um subdomínio — atualize `FRONTEND_URL` no `.env` com a URL do frontend

### Variáveis de ambiente necessárias (produção)

```env
NODE_ENV=production
JWT_SECRET=<string longa e aleatória>
DATABASE_URL=postgresql://...  # Supabase connection string
FRONTEND_URL=https://seudominio.com.br
CLOUDINARY_CLOUD_NAME=...      # opcional, para upload de imagens
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Roadmap

Consulte [docs/roadmap.md](docs/roadmap.md) para o plano completo de evolução do projeto.

## Licença

Projeto desenvolvido para a comunidade de Boa Esperança do Sul — SP.

---

Feito com 💚 para a cidade
