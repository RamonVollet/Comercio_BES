# Lembrete e Próximos Passos (Plano Cadastro)

Este documento foi criado para registrar o status de implementação atual do sistema "Comércio BES" e quais as próximas etapas estruturais para continuar a construção do **Painel Único (RBAC)** e o fluxo de self-service.

## Status Atual 🟢
- A fundação do Painel Único SPA (`/minha-conta`) está implementada e estável em CSS Grid Premium.
- O sistema de sessões baseado em Cookies httpOnly e proteção CSRF foi testado e certificado.
- As capacidades de roteamento SPA interpretam os caminhos do Admin, Cliente e Comerciante sem "engolir" rotas ou disparar múltiplos re-renders.
- SVGs minimalistas foram inseridos no lugar dos Emojis para as interfaces corporativas.
- A página principal `index.html` consegue coexistir pacificamente porta 3000 junto com a API e o SPA.

## Próximos Desafios (Fase Lojista + Backoffice) 🚀

### 1. Sistema de Onboarding Público (Self-Service)
O próximo marco do plano original de Cadastro Público (docs/plano-cadastro.md).
- Transformar `cadastro.html` para conversar com a nova rota `POST /api/auth/registro`.
- Adicionar no back-end o fluxo de cadastro e emissão de permissão base (`comerciante_pendente` ou `comerciante`) automática com a flag `Verificado: False`.

### 2. Painel de Status da Loja
Atualmente a seção "Produtos" etc já funciona no shell de comerciante, mas precisamos modelar o cenário de fluxo de entrada:
- Lojista recém cadastrado entra no `/minha-conta`.
- Deve existir um formulário em uma seção chamada "Perfil da Loja Principal" para ele inserir dados do seu próprio comércio na Plataforma, que então criará o `Comercio` associado a ele no DB.

### 3. Conectar CRUD de Usuários e Lojas do Admin
- Nas seções `UsuariosSection.js` e `ModeracaoLojasSection.js` inserimos placeholders com status "🚧 Módulo em Construção".
- Será necessário criar as rotas Express administrativas (`GET /api/admin/usuarios`, `PUT /api/admin/lojas/:id`) com a verificação de capability `users.manage` no `requireCapability()`.

## Lembrete de Login:
- O admin padrao continua o mesmo.
- Lojista com lojas demo atreladas: `comerciante@demo.com` / `demo123`
