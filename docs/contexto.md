# Contexto do Projeto — Comércio BES

## O que é?

**Comércio BES** é uma vitrine e marketplace digital local para a cidade de **Boa Esperança do Sul — SP**. O objetivo é ser o guia comercial definitivo da cidade, conectando moradores aos estabelecimentos locais de forma moderna, visual e funcional.

## Problema

Cidades pequenas como BES não possuem uma plataforma centralizada com informações dos comércios locais. Os moradores dependem de boca a boca, redes sociais fragmentadas ou pesquisas genéricas no Google que muitas vezes não retornam resultados para comércios menores.

## Solução

Uma plataforma web (mobile-first) que:

- **Agrega** todos os comércios da cidade em um catálogo pesquisável
- **Mostra** informações úteis: horário, telefone, endereço, avaliações
- **Permite** busca inteligente por nome, categoria e tags
- **Destaca** promoções ativas e ranking dos melhores comércios
- **Facilita** contato direto via WhatsApp
- **Permite** pedidos formatados via WhatsApp (marketplace leve)
- **Gera** links compartilháveis para cada loja (deep linking)

## Público-alvo

1. **Moradores de BES** que buscam comércios e serviços locais
2. **Comerciantes locais** que querem visibilidade digital sem custo
3. **Visitantes da região** que precisam encontrar serviços na cidade

## Stack Atual

| Camada       | Tecnologia                                                    |
| ------------ | ------------------------------------------------------------- |
| Frontend     | HTML5 + CSS3 + JavaScript (vanilla), PWA (Service Worker)     |
| Backend/API  | Node.js + Express.js                                          |
| Banco        | SQLite (dev) via Prisma ORM — PostgreSQL/MySQL para produção  |
| Auth         | JWT (HS256) + bcrypt                                          |
| Segurança    | Helmet, CSP, CORS allowlist, rate-limiting, sanitização       |
| Upload       | Multer (local) + Cloudinary (opcional)                        |
| Fontes       | Google Fonts (Syne, DM Sans)                                  |
| Mapa         | Leaflet + OpenStreetMap (com SRI)                             |
| Logging      | Morgan (request logging)                                      |

## Stack Planejada (Próximas Fases)

| Camada       | Tecnologia                           |
| ------------ | ------------------------------------ |
| Frontend     | React ou Next.js (migração futura)   |
| Banco (prod) | PostgreSQL (Supabase) ou MySQL (Hostinger) |
| Hospedagem   | Vercel (front) + Railway/Render (back) |
| CDN/Imagens  | Cloudinary ou Supabase Storage       |
| Notificações | Push API / Web Push                  |
| Pagamento    | PIX via Mercado Pago / Stripe        |

## Estrutura de Pastas Atual

```
comercio_bes/
├── index.html              # Página principal (SPA-like)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (cache offline)
├── data/
│   └── data.json           # Base de dados estática (fallback)
├── css/
│   └── style.css           # Estilos globais
├── js/
│   ├── app.js              # Entry point — ES module, imports tudo, expõe window.*
│   ├── config.js           # Constantes (API_BASE, KEYS, ITEMS_POR_PAGINA)
│   ├── modules/
│   │   ├── state.js        # Estado compartilhado (comercios, paginaAtual, etc.)
│   │   ├── api.js          # Fetch calls (carregarComercios, registrarEstatistica, etc.)
│   │   ├── auth.js         # Objeto Auth (login, register, logout, getToken)
│   │   ├── auth-ui.js      # UI de auth (drawer login/cadastro)
│   │   ├── cart.js         # Objeto Cart + drawer de carrinho
│   │   ├── checkout.js     # Fluxo de checkout (WhatsApp + pedido backend)
│   │   ├── favorites.js    # Objeto Favorites (toggle, isFav)
│   │   ├── map.js          # Leaflet + OpenStreetMap
│   │   ├── merchant-ui.js  # UI de cadastro de loja
│   │   ├── merchants.js    # Lojas locais (localStorage)
│   │   ├── orders.js       # Objeto Orders (localStorage)
│   │   ├── search.js       # Busca, filtro e ordenação
│   │   ├── theme.js        # Dark mode
│   │   └── ui.js           # Toasts, skeleton, lazy load, PWA install
│   └── render/
│       ├── cards.js        # criarCard, renderizarCards, paginação
│       ├── favorites.js    # renderFavoritos, abrirFavoritos
│       ├── modal.js        # abrirModal, catálogo, avaliação
│       ├── orders-ui.js    # drawer de pedidos
│       └── promotions.js   # renderPromos, renderRanking
├── html/
│   ├── login.html          # Página de login
│   └── cadastro.html       # Página de cadastro
├── backend/
│   ├── package.json        # Dependências do backend
│   ├── .env                # Variáveis de ambiente (JWT_SECRET, etc.)
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco (10 modelos)
│   │   ├── seed.js         # Script de seed (importa data.json)
│   │   └── dev.db          # SQLite de desenvolvimento
│   └── src/
│       ├── server.js       # Servidor Express (Helmet, CORS, rate-limit)
│       ├── lib/
│       │   └── prisma.js   # PrismaClient singleton
│       ├── controllers/    # Lógica de negócio (auth, comercios, pedidos, pagamentos, etc.)
│       ├── middleware/      # Auth JWT, upload, error handler
│       ├── routes/          # auth, comercios, categorias, avaliacoes, pedidos, pagamentos, upload, estatisticas
│       ├── admin/           # Painel do administrador (/admin — protegido por JWT)
│       ├── painel/          # Painel do comerciante (/painel)
│       └── uploads/         # Imagens enviadas via upload
├── docs/
│   ├── contexto.md         # Este arquivo
│   ├── roadmap.md          # Plano de evolução
│   ├── security-audit.md   # Relatório da auditoria de segurança
│   ├── skills.md           # Skills técnicas necessárias
│   └── modularizacao.md    # Registro do processo de modularização do JS
└── README.md               # Documentação do projeto
```

## Modelo de Dados (Prisma Schema)

O banco possui 10 modelos:

| Modelo       | Descrição                              |
| ------------ | -------------------------------------- |
| User         | Usuários (admin, comerciante, cliente) |
| Categoria    | Categorias de comércio                 |
| Comercio     | Estabelecimentos com todos os dados    |
| Produto      | Catálogo de produtos por comércio      |
| Promocao     | Promoções ativas por comércio          |
| Avaliacao    | Avaliações com nota e comentário       |
| Estatistica  | Eventos (visitas, cliques WhatsApp)    |
| Pedido       | Pedidos com status e histórico         |
| ItemPedido   | Itens de um pedido (snapshot de preço) |
| Pagamento    | Pagamentos via Mercado Pago (PIX)      |

Exemplo de comércio (via API):

```json
{
  "id": 1,
  "slug": "pizzaria-bella-massa",
  "nome": "Pizzaria Bella Massa",
  "categoria": "Restaurante",
  "categoriaSlug": "restaurante",
  "tags": ["pizza", "delivery"],
  "emoji": "🍕",
  "rating": 4.8,
  "totalAvaliacoes": 4,
  "visitas": 1240,
  "recomendados": 98,
  "aberto": true,
  "endereco": "Rua XV de Novembro, 45",
  "lat": -21.9925,
  "lng": -48.3912,
  "tel": "16991112222",
  "whatsapp": "5516991112222",
  "horario": "Ter-Dom · 18h às 23h",
  "catalogo": [
    { "nome": "Pizza Grande Margherita", "descricao": "...", "preco": 42.00 }
  ]
}
```

> O frontend faz fallback para `data/data.json` quando a API não está disponível.

## Fluxo do Usuário

```
Explorar Comércios → Buscar/Filtrar → Ver Detalhes (modal)
                                              ↓
                              Escolher Produtos (se houver catálogo)
                                              ↓
                              Enviar Pedido → WhatsApp do Lojista
                                              ↓ (futuro)
                              Pagamento PIX (Mercado Pago)
```

## Decisões Técnicas

1. **Vanilla JS com ES Modules** — Migrado para `type="module"` em Abril/2026; `app.js` como entry point único com grafo de dependências explícito. Migração para React planejada para Fase 5+
2. **API REST + fallback JSON** — Frontend busca da API com fallback para `data.json` (funciona offline)
3. **Prisma ORM** — Abstração do banco, fácil trocar SQLite (dev) por PostgreSQL/MySQL (prod)
4. **Deep linking via query string** — Permite compartilhar links de lojas sem roteador SPA
5. **WhatsApp como canal de pedido** — Elimina necessidade de sistema de pagamento próprio
6. **Sem framework CSS** — CSS customizado para identidade visual única da cidade
7. **JWT + bcrypt** — Autenticação stateless, segura, com expiração configurável
8. **Helmet + CSP** — Segurança de headers configurada desde o início
9. **SRI nos CDNs** — Integridade de recursos externos verificada (Leaflet)

## Diferencial

- **100% focado em uma cidade pequena** — não é genérico
- **Zero custo para o comerciante** — vitrine gratuita
- **WhatsApp nativo** — os comerciantes de BES já usam WhatsApp no dia-a-dia
- **Mobile-first** — a maioria dos acessos será pelo celular
- **Compartilhável** — links diretos para cada loja
