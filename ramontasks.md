# Ramon Tasks

## Go-live agora

- [ ] Corrigir e publicar o frontend com o entrypoint atual (`js/app.js`)
- [ ] Ajustar o `FRONTEND_URL` de producao no backend para incluir `https://comerciobes.com.br` e `https://www.comerciobes.com.br`
- [ ] Subir novo deploy da API com o CORS revisado
- [ ] Fazer smoke test no dominio publico: home, login, cadastro, listagem de comercios, avaliacao e pedidos
- [ ] Validar se `https://api.comerciobes.com.br/api/comercios` responde com `Origin: https://comerciobes.com.br`
- [ ] Conferir se o logout limpa sessao no site e no `/minha-conta`

## Marketplace

- [ ] Ligar o checkout do frontend ao backend de pedidos
- [ ] Mostrar status real dos pedidos vindos da API no frontend
- [ ] Integrar a UI de PIX com `/api/pagamentos/criar`
- [ ] Testar o fluxo completo do Mercado Pago em sandbox
- [ ] Validar webhook de pagamento em producao
- [ ] Revisar mensagens de erro e estados vazios do checkout

## Conteudo comercial

- [ ] Cadastrar as lojas reais priorizadas para o lancamento
- [ ] Revisar nome, categoria, endereco, telefone, WhatsApp e horario de cada loja
- [ ] Subir fotos reais das lojas prioritarias
- [ ] Confirmar promoções ativas com os comerciantes
- [ ] Revisar slugs, descricoes e catalogos das lojas com pedido
- [ ] Definir quais lojas entram como destaque inicial na home

## Operacao e confianca

- [ ] Rodar a suite de testes do backend antes de cada deploy
- [ ] Criar um checklist simples de smoke test pos-deploy
- [ ] Confirmar variaveis de ambiente de producao: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `WEBHOOK_BASE_URL`, credenciais do Mercado Pago
- [ ] Confirmar banco de producao no Supabase com backup habilitado
- [ ] Revisar uploads e imagens para evitar dependencias de arquivos locais ausentes
- [ ] Monitorar logs da API nas primeiras 48h apos o relancamento

## Depois do lancamento

- [ ] Implementar notificacoes push
- [ ] Implementar sistema de cupons
- [ ] Criar automacao minima de CI para testes do backend
- [ ] Criar relatorio simples de acessos, pedidos e lojas mais visitadas
