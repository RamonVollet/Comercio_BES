<<<<<<< HEAD
# Comercio BES

Guia comercial local de **Boa Esperanca do Sul (SP)**, desenvolvido como site estatico para facilitar a descoberta de lojas, servicos e promocoes da cidade.

O projeto apresenta uma interface moderna com busca, filtros por categoria, ranking, destaques de promocoes, modal com detalhes de cada comercio e atalhos de contato via WhatsApp.

## Objetivo

Conectar moradores ao comercio local, centralizando informacoes de estabelecimentos em uma experiencia simples, rapida e visual.

## Funcionalidades

- Tela de boas-vindas com transicao para o site principal.
- Busca por nome, categoria e tags (ex.: pizza, farmacia, mecanico).
- Filtro por categorias de comercio.
- Ordenacao por melhor avaliacao, ordem alfabetica e mais visitados.
- Bloco de promocoes ativas.
- Ranking por avaliacao, visitas e recomendacoes.
- Mapa incorporado com OpenStreetMap.
- Modal com detalhes do estabelecimento:
  - endereco
  - horario
  - telefone formatado
  - status aberto/fechado
  - galeria simbolica
  - links de WhatsApp e mapa
- Sistema de avaliacao com estrelas e notificacao visual (toast).
- Atualizacao automatica do ano no rodape.

## Tecnologias

- HTML5
- CSS3
- JavaScript (vanilla)
- Google Fonts (Syne e DM Sans)
- OpenStreetMap (embed)

## Estrutura do projeto

```text
comercio_bes/
|-- index.html
|-- css/
|   `-- style.css
`-- js/
    `-- script.js
```

## Como executar localmente

1. Coloque a pasta do projeto no servidor local (ex.: XAMPP em `htdocs`).
2. Inicie Apache no painel do XAMPP.
3. Acesse no navegador:
   - `http://localhost/comercio_bes/`

Tambem e possivel abrir o `index.html` diretamente no navegador, mas o uso com servidor local e recomendado para testes.

## Como personalizar os comercios

Os dados estao no array `comercios` em `js/script.js`.

Cada item possui campos como:

- `nome`
- `categoria`
- `tags`
- `rating`
- `visitas`
- `recomendados`
- `aberto`
- `endereco`
- `tel`
- `whatsapp`
- `horario`
- `fotos`
- `promo`
=======
# Comercio_BES
>>>>>>> 48623e457ce2ae1dbfb13fcb7f4061ce4878537e
