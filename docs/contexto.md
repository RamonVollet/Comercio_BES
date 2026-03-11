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

| Camada   | Tecnologia                          |
| -------- | ----------------------------------- |
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Dados    | JSON estático (`data/data.json`)    |
| Fontes   | Google Fonts (Syne, DM Sans)        |
| Mapa     | OpenStreetMap (embed)               |

## Stack Planejada (Médio Prazo)

| Camada       | Tecnologia                           |
| ------------ | ------------------------------------ |
| Frontend     | React ou Next.js                     |
| Backend/API  | Node.js + Express ou Fastify         |
| Banco        | PostgreSQL ou MongoDB                |
| Auth         | JWT + bcrypt                         |
| Hospedagem   | Vercel (front) + Railway (back)      |
| CDN/Imagens  | Cloudinary ou Supabase Storage       |

## Estrutura de Pastas Atual

```
comercio_bes/
├── index.html              # Página principal (SPA-like)
├── data/
│   └── data.json           # Base de dados dos comércios
├── css/
│   └── style.css           # Estilos globais
├── js/
│   └── script.js           # Lógica principal (fetch, render, carrinho)
├── docs/
│   ├── contexto.md         # Este arquivo
│   ├── roadmap.md          # Plano de evolução
│   └── skills.md           # Skills técnicas necessárias
└── README.md               # Documentação do projeto
```

## Modelo de Dados (data.json)

Cada comércio é um objeto com:

```json
{
  "id": 1,
  "slug": "pizzaria-bella-massa",
  "nome": "Pizzaria Bella Massa",
  "categoria": "restaurante",
  "tags": ["pizza", "delivery"],
  "emoji": "🍕",
  "rating": 4.8,
  "visitas": 1240,
  "recomendados": 98,
  "aberto": true,
  "endereco": "Rua XV de Novembro, 45",
  "tel": "16991112222",
  "whatsapp": "5516991112222",
  "horario": "Ter-Dom · 18h às 23h",
  "fotos": ["🍕", "🍝", "🥗"],
  "promo": { "ativo": true, "desc": "...", "preco": "R$52", "original": "R$72" },
  "catalogo": [
    { "nome_produto": "Pizza Grande Margherita", "descricao": "...", "preco": 42.00 }
  ]
}
```

## Fluxo do Usuário

```
Welcome Screen → Explorar Comércios → Buscar/Filtrar → Ver Detalhes (modal)
                                                          ↓
                                          Escolher Produtos (se houver catálogo)
                                                          ↓
                                          Enviar Pedido → WhatsApp do Lojista
```

## Decisões Técnicas

1. **Vanilla JS** — Mantido por simplicidade no estágio atual; migração para React planejada
2. **fetch() + JSON** — Simula consumo de API REST; troca futura é trivial
3. **Deep linking via query string** — Permite compartilhar links de lojas sem roteador SPA
4. **WhatsApp como canal de pedido** — Elimina necessidade de sistema de pagamento próprio
5. **Sem framework CSS** — CSS customizado para identidade visual única da cidade

## Diferencial

- **100% focado em uma cidade pequena** — não é genérico
- **Zero custo para o comerciante** — vitrine gratuita
- **WhatsApp nativo** — os comerciantes de BES já usam WhatsApp no dia-a-dia
- **Mobile-first** — a maioria dos acessos será pelo celular
- **Compartilhável** — links diretos para cada loja
