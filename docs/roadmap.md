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

## Fase 2 — PWA + UX Avançado

> Status: Planejado

- [ ] **PWA (Progressive Web App)**
  - Manifest.json + Service Worker
  - Funcionar offline (cache dos dados)
  - "Instalar" como app no celular
- [ ] **Melhorias de UX**
  - Skeleton loading enquanto carrega dados
  - Lazy loading das imagens reais
  - Animações de transição entre seções
  - Scroll infinito ou paginação nos cards
- [ ] **Fotos reais**
  - Substituir emojis por imagens dos comércios
  - Upload via Cloudinary ou similar
- [ ] **Geolocalização**
  - "Comércios perto de você" usando Geolocation API
  - Ordenar por proximidade
- [ ] **Favoritos (localStorage)**
  - Salvar lojas favoritas no navegador
  - Seção "Meus Favoritos"
- [ ] **Tema escuro (Dark Mode)**
- [ ] **Internacionalização básica** (pt-BR / en)

---

## Fase 3 — Backend + Painel Admin

> Status: Planejado

- [ ] **API REST com Node.js**
  - Express ou Fastify
  - CRUD completo de comércios
  - Endpoints: `/api/comercios`, `/api/comercios/:slug`, `/api/categorias`
- [ ] **Banco de dados**
  - PostgreSQL (Supabase) ou MongoDB (Atlas)
  - Schema de comércios, produtos, categorias, avaliações
- [ ] **Painel administrativo**
  - Login para comerciantes (JWT + bcrypt)
  - Cadastrar/editar/excluir própria loja
  - Gerenciar catálogo de produtos
  - Ver estatísticas (visitas, cliques no WhatsApp)
- [ ] **Upload de imagens**
  - Cloudinary ou Supabase Storage
  - Compressão e redimensionamento automático
- [ ] **Avaliações reais**
  - Salvar avaliações no banco
  - Média calculada no servidor

---

## Fase 4 — Marketplace Completo

> Status: Futuro

- [ ] **Carrinho persistente**
  - Salvar carrinho por sessão/localStorage
  - Múltiplas lojas no mesmo pedido? (avaliar)
- [ ] **Histórico de pedidos**
  - Usuário pode ver pedidos anteriores
- [ ] **Notificações**
  - Push notifications para promoções
  - Loja nova cadastrada na sua categoria favorita
- [ ] **Sistema de cupons**
  - Código promocional por loja
  - "Primeira compra com desconto"
- [ ] **Integração com pagamento** (longo prazo)
  - PIX via API (Mercado Pago / Stripe)
  - Opção: pagar online ou pagar na entrega
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

*Última atualização: Março 2026*
