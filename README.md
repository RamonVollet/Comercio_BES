# Comércio BES

> Vitrine e marketplace local de **Boa Esperança do Sul — SP**

Guia comercial digital que conecta moradores ao comércio local, centralizando informações de estabelecimentos em uma experiência moderna, rápida e visual. O projeto evolui de um catálogo estático para um marketplace com pedidos via WhatsApp.

## Funcionalidades

- **Tela de boas-vindas** com transição animada para o site principal
- **Busca inteligente** por nome, categoria e tags (ex.: pizza, farmácia, mecânico)
- **Filtro por categorias** de comércio (restaurantes, farmácias, pet shops, etc.)
- **Ordenação** por melhor avaliação, ordem alfabética e mais visitados
- **Promoções ativas** em destaque
- **Ranking** por avaliação, visitas e recomendações
- **Mapa** incorporado com OpenStreetMap
- **Modal detalhado** de cada estabelecimento (endereço, horário, telefone, status, galeria, WhatsApp)
- **Deep linking** — compartilhe o link de uma loja específica (ex.: `?loja=pizzaria-bella-massa`)
- **Catálogo de produtos** com envio de pedido formatado via WhatsApp
- **Avaliação** com estrelas e notificação visual (toast)
- **Dados desacoplados** — consumo assíncrono via `fetch()` de `data/data.json`

## Tecnologias

| Camada      | Tecnologia                        |
| ----------- | --------------------------------- |
| Estrutura   | HTML5                             |
| Estilo      | CSS3 (variáveis, grid, flexbox)   |
| Lógica      | JavaScript ES6+ (vanilla)        |
| Dados       | JSON estático (preparado p/ API)  |
| Fontes      | Google Fonts (Syne, DM Sans)      |
| Mapa        | OpenStreetMap (embed)             |

## Estrutura do Projeto

```text
comercio_bes/
├── index.html
├── data/
│   └── data.json
├── css/
│   └── style.css
├── js/
│   └── script.js
├── docs/
│   ├── contexto.md
│   ├── roadmap.md
│   └── skills.md
└── README.md
```

## Como Executar

### Com servidor local (recomendado)

```bash
# Usando Live Server (VS Code), XAMPP, ou qualquer HTTP server
# Exemplo com Python:
python -m http.server 8080

# Exemplo com Node.js:
npx serve .
```

Acesse `http://localhost:8080` no navegador.

### Direto no navegador

Abra `index.html` — a maioria das funcionalidades funciona, mas o `fetch()` para `data.json` requer um servidor HTTP local.

## Como Personalizar os Comércios

Os dados ficam em `data/data.json`. Cada comércio possui os campos:

| Campo          | Tipo     | Descrição                              |
| -------------- | -------- | -------------------------------------- |
| `id`           | number   | Identificador único                    |
| `slug`         | string   | Identificador para URL (deep linking)  |
| `nome`         | string   | Nome do estabelecimento                |
| `categoria`    | string   | Categoria principal                    |
| `tags`         | string[] | Termos de busca                        |
| `rating`       | number   | Avaliação (0-5)                        |
| `visitas`      | number   | Contagem de visitas                    |
| `recomendados` | number   | Contagem de recomendações              |
| `aberto`       | boolean  | Se está aberto agora                   |
| `endereco`     | string   | Endereço físico                        |
| `tel`          | string   | Telefone (somente números)             |
| `whatsapp`     | string   | WhatsApp com DDI (ex.: 5516991112222)  |
| `horario`      | string   | Horário de funcionamento               |
| `fotos`        | string[] | Emojis ou URLs de imagens              |
| `promo`        | object?  | Promoção ativa (desc, preco, original) |
| `catalogo`     | object[]?| Produtos disponíveis para pedido       |

## Roadmap

Consulte [docs/roadmap.md](docs/roadmap.md) para o plano completo de evolução do projeto.

## Licença

Projeto desenvolvido para a comunidade de Boa Esperança do Sul — SP.

---

Feito com 💚 para a cidade
