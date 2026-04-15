# Plano de Cadastro de Comércios — Comércio BES

> Guia operacional para cadastrar lojas reais na plataforma.  
> Seguir esta ordem garante um perfil completo e funcional desde o primeiro acesso.

---

## Estrutura de dados de cada comércio

### Campos obrigatórios

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `nome` | string | "Aquaflora Garden Center" |
| `categoria` | string | "Pet" |
| `categoriaSlug` | string | "pet" |
| `emoji` | string | "🌿" |
| `endereco` | string | "Av. São Paulo, 120" |
| `tel` | string | "16991234567" |
| `whatsapp` | string | "5516991234567" |
| `horario` | string | "Seg-Sáb · 8h às 18h" |
| `lat` | number | -21.9925 |
| `lng` | number | -48.3912 |
| `aberto` | boolean | true/false |

### Campos recomendados

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `fotos` | array de URLs | `["/images/lojas/aquaflora/foto1.jpg"]` |
| `catalogo` | array de produtos | ver seção abaixo |
| `promo` | objeto | `{ "ativo": true, "desc": "...", "preco": "..." }` |
| `tags` | array de strings | `["plantas", "jardim", "paisagismo"]` |
| `slug` | string | "aquaflora-garden-center" |

### Exemplo de produto no catálogo

```json
{
  "nome_produto": "Samambaia Média",
  "descricao": "Planta ornamental, ideal para ambientes internos",
  "preco": 35.00
}
```

---

## Fotos — especificações

| Spec | Recomendado |
|------|-------------|
| Formato | JPG ou WebP |
| Tamanho | máx 500KB por foto |
| Dimensões | mínimo 600×600px (proporção quadrada para thumbs) |
| Quantidade | 3 a 5 fotos por loja |
| Conteúdo | fachada + interior + produto destaque |

### Onde salvar agora (fase local)

```
images/
  lojas/
    [slug-da-loja]/
      foto1.jpg    ← fachada
      foto2.jpg    ← interior
      foto3.jpg    ← produto destaque
```

No `data.json` / banco, o campo `fotos` fica:
```json
"fotos": [
  "/images/lojas/aquaflora/foto1.jpg",
  "/images/lojas/aquaflora/foto2.jpg",
  "/images/lojas/aquaflora/foto3.jpg"
]
```

### Migração futura (quando tiver tráfego)

Mover para Cloudinary ou Supabase Storage — sem mudar o código, só os URLs no banco.

---

## Google Maps — obter coordenadas

1. Abra o Google Maps no endereço da loja
2. Clique com o botão direito no pino → copie as coordenadas
3. Formato: `-21.9925, -48.3912` → `lat: -21.9925, lng: -48.3912`

### Google Maps Embed API (opcional)

Para usar o Google Maps no embed da loja (em vez do OpenStreetMap gratuito):

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → Ative **Maps Embed API**
3. Crie uma chave API → restrinja pelo domínio do site
4. Preencha em `js/config.js`:
   ```js
   export const GOOGLE_MAPS_KEY = 'AIzaSy...';
   ```
5. O mapa do modal troca automaticamente para Google Maps

**Custo:** Maps Embed API = $0.007 por load → $200 grátis/mês cobre ~28.500 carregamentos.

---

## Checklist de cadastro por loja

```
[ ] Nome e categoria definidos
[ ] Endereço completo + coordenadas (lat/lng)
[ ] Telefone e WhatsApp (formato 55 + DDD + número)
[ ] Horário de funcionamento
[ ] Status aberto/fechado (conforme dia/hora típico)
[ ] Emoji representativo da categoria
[ ] Slug gerado (kebab-case do nome)
[ ] Tags relevantes (3 a 5)
[ ] Fotos tiradas e redimensionadas (pelo menos 1)
[ ] Catálogo de produtos (se aplicável)
[ ] Promoção ativa (se tiver)
[ ] Testado: abrir modal → ver mapa → ver fotos
```

---

## Processo de abordagem ao lojista

### Fase 1 — Vitrine sem permissão (dados públicos)

Cadastrar com informações públicas:
- Nome, endereço, telefone (Google Maps / fachada)
- Foto da fachada (tirada pessoalmente)
- Horário de funcionamento (visita ou ligação)

### Fase 2 — Abordagem pessoal

Script sugerido:
> *"Olá! Criei um guia digital do comércio de Boa Esperança do Sul chamado Comércio BES. Já cadastrei sua loja no site — pode ver aqui. Quer atualizar as informações, adicionar seu cardápio e receber pedidos direto no WhatsApp? É totalmente gratuito."*

Mostrar o perfil da loja no celular na hora — **muito mais efetivo do que explicar em abstrato.**

### Fase 3 — Complemento pelo lojista

Após interesse confirmado:
- Acesso ao painel `/painel` com login próprio
- Upload de fotos adicionais
- Cadastro de catálogo completo
- Configuração de promoções

### Fase 4 — Planos pagos (futuro)

Oferecer depois de ter tráfego comprovado:
- Destaque no ranking
- Notificações push para clientes
- Analytics avançados
- QR Code impresso para o balcão

---

## Primeira loja real — Aquaflora

**Objetivo:** cadastro completo para validar todos os campos e funcionalidades.

Dados para coletar:
- [ ] Endereço exato + coordenadas
- [ ] WhatsApp de contato
- [ ] Horário completo (seg-sex, sab, dom/feriado)
- [ ] Catálogo: principais produtos com preço
- [ ] Fotos: fachada + interior + produtos destaque
- [ ] Promoção atual (se houver)
- [ ] Tags: plantas, jardim, paisagismo, flores, vasos...

Pasta das fotos: `images/lojas/aquaflora/`

---

## Log de cadastros

| Data | Loja | Status | Observações |
|------|------|--------|-------------|
| 2026-04-15 | Aquaflora GrowShop | ✅ cadastrada | id:16, 4 fotos, 4 produtos, promo quarta |

---

*Última atualização: Abril 2026*
