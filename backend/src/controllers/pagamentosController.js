// ===========================================
// Controller - Pagamentos (Mercado Pago)
// ===========================================
const prisma = require('../lib/prisma');

// Mercado Pago SDK v2
let mpClient = null;
let mpPreference = null;
let mpPayment = null;

// Inicializar Mercado Pago (lazy load)
function initMP() {
  if (mpClient) return true;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken || accessToken.includes('seu-access-token')) {
    console.warn('[PAGAMENTO] Mercado Pago nao configurado. Configure MERCADO_PAGO_ACCESS_TOKEN no .env');
    return false;
  }

  try {
    const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
    mpClient = new MercadoPagoConfig({ accessToken });
    mpPreference = new Preference(mpClient);
    mpPayment = new Payment(mpClient);
    console.log('[PAGAMENTO] Mercado Pago inicializado');
    return true;
  } catch (err) {
    console.error('[PAGAMENTO] Erro ao inicializar Mercado Pago:', err.message);
    return false;
  }
}

// POST /api/pagamentos/criar
// Cria uma preferencia de pagamento no Mercado Pago
async function criarPagamento(req, res, next) {
  try {
    const { pedidoCodigo, metodo } = req.body;

    if (!pedidoCodigo) {
      return res.status(400).json({ error: 'pedidoCodigo e obrigatorio' });
    }

    // Buscar pedido
    const pedido = await prisma.pedido.findUnique({
      where: { codigo: pedidoCodigo },
      include: {
        itens: true,
        comercio: { select: { nome: true, slug: true } },
        cliente: { select: { id: true, nome: true, email: true } },
        pagamento: true
      }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido nao encontrado' });

    // Verificar se e o dono do pedido
    if (pedido.clienteId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    // Verificar se ja tem pagamento aprovado
    if (pedido.pagamento && pedido.pagamento.status === 'aprovado') {
      return res.status(400).json({ error: 'Este pedido ja foi pago' });
    }

    // Se metodo "na_entrega", criar pagamento local sem MP
    if (metodo === 'na_entrega') {
      const pagamento = await prisma.pagamento.upsert({
        where: { pedidoId: pedido.id },
        create: {
          pedidoId: pedido.id,
          metodo: 'na_entrega',
          status: 'pendente',
          valor: pedido.total
        },
        update: {
          metodo: 'na_entrega',
          status: 'pendente',
          valor: pedido.total
        }
      });

      // Confirmar pedido automaticamente
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { status: 'confirmado' }
      });

      return res.json({
        message: 'Pedido confirmado - pagamento na entrega',
        pagamento,
        tipo: 'na_entrega'
      });
    }

    // Integração com Mercado Pago
    if (!initMP()) {
      return res.status(503).json({
        error: 'Sistema de pagamento nao configurado. Use pagamento na entrega.',
        fallback: 'na_entrega'
      });
    }

    const webhookUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    // Criar preferencia de pagamento
    const preferenceData = {
      body: {
        items: pedido.itens.map(item => ({
          id: String(item.id),
          title: `${item.nome} (${pedido.comercio.nome})`,
          quantity: item.quantidade,
          unit_price: item.preco,
          currency_id: 'BRL'
        })),
        // Adicionar taxa de entrega como item se > 0
        ...(pedido.taxaEntrega > 0 ? {
          shipments: {
            cost: pedido.taxaEntrega,
            mode: 'not_specified'
          }
        } : {}),
        payer: {
          name: pedido.cliente.nome,
          email: pedido.cliente.email
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5500'}?pedido=${pedido.codigo}&status=sucesso`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5500'}?pedido=${pedido.codigo}&status=falha`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5500'}?pedido=${pedido.codigo}&status=pendente`
        },
        auto_return: 'approved',
        notification_url: `${webhookUrl}/api/pagamentos/webhook`,
        external_reference: pedido.codigo,
        statement_descriptor: 'COMERCIO BES',
        // Excluir metodos se especificado
        ...(metodo === 'pix' ? {
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'ticket' }
            ]
          }
        } : {})
      }
    };

    const preference = await mpPreference.create(preferenceData);

    // Salvar/atualizar pagamento no banco
    const pagamento = await prisma.pagamento.upsert({
      where: { pedidoId: pedido.id },
      create: {
        pedidoId: pedido.id,
        preferenceId: preference.id,
        metodo: metodo || null,
        status: 'pendente',
        valor: pedido.total
      },
      update: {
        preferenceId: preference.id,
        metodo: metodo || null,
        status: 'pendente',
        valor: pedido.total
      }
    });

    res.json({
      message: 'Preferencia de pagamento criada',
      pagamento,
      tipo: 'mercado_pago',
      checkout_url: preference.init_point,
      sandbox_url: preference.sandbox_init_point,
      preference_id: preference.id,
      public_key: process.env.MERCADO_PAGO_PUBLIC_KEY
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/pagamentos/webhook
// Webhook do Mercado Pago (recebe notificacoes de pagamento)
async function webhook(req, res, next) {
  try {
    const { type, data } = req.body;

    // Mercado Pago envia "payment" para eventos de pagamento
    if (type === 'payment' && data && data.id) {
      if (!initMP()) {
        console.error('[WEBHOOK] Mercado Pago nao configurado');
        return res.sendStatus(200); // Responder 200 para MP nao reenviar
      }

      // Buscar detalhes do pagamento no MP
      const mpPaymentData = await mpPayment.get({ id: data.id });

      if (!mpPaymentData) {
        console.error('[WEBHOOK] Pagamento nao encontrado no MP:', data.id);
        return res.sendStatus(200);
      }

      const externalRef = mpPaymentData.external_reference; // = codigo do pedido
      const mpStatus = mpPaymentData.status;

      // Mapear status do MP para nosso status
      const statusMap = {
        'approved': 'aprovado',
        'pending': 'pendente',
        'in_process': 'em_analise',
        'rejected': 'recusado',
        'refunded': 'devolvido',
        'cancelled': 'recusado',
        'charged_back': 'devolvido'
      };

      const nossoStatus = statusMap[mpStatus] || 'pendente';

      // Atualizar pagamento no banco
      const pedido = await prisma.pedido.findUnique({
        where: { codigo: externalRef },
        include: { pagamento: true }
      });

      if (pedido && pedido.pagamento) {
        await prisma.pagamento.update({
          where: { id: pedido.pagamento.id },
          data: {
            mercadoPagoId: String(data.id),
            status: nossoStatus,
            metodo: mpPaymentData.payment_type_id || null,
            mercadoPagoStatus: mpStatus,
            detalhes: JSON.stringify({
              payment_method_id: mpPaymentData.payment_method_id,
              status_detail: mpPaymentData.status_detail,
              transaction_amount: mpPaymentData.transaction_amount
            }),
            ...(mpStatus === 'approved' ? { paidAt: new Date() } : {})
          }
        });

        // Se aprovado, confirmar pedido automaticamente
        if (mpStatus === 'approved' && pedido.status === 'pendente') {
          await prisma.pedido.update({
            where: { id: pedido.id },
            data: { status: 'confirmado' }
          });
        }

        console.log(`[WEBHOOK] Pedido ${externalRef}: ${mpStatus} -> ${nossoStatus}`);
      }
    }

    // Sempre responder 200 para o MP
    res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Erro:', err.message);
    res.sendStatus(200); // Responder 200 mesmo com erro para MP nao reenviar
  }
}

// GET /api/pagamentos/:pedidoCodigo
// Consultar status do pagamento
async function consultarPagamento(req, res, next) {
  try {
    const { pedidoCodigo } = req.params;

    const pedido = await prisma.pedido.findUnique({
      where: { codigo: pedidoCodigo },
      include: {
        pagamento: true,
        comercio: { select: { nome: true } }
      }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido nao encontrado' });

    // Verificar acesso
    const isCliente = pedido.clienteId === req.userId;
    const isComercio = await prisma.comercio.findFirst({
      where: { id: pedido.comercioId, ownerId: req.userId }
    });
    const isAdmin = req.userTipo === 'admin';

    if (!isCliente && !isComercio && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    if (!pedido.pagamento) {
      return res.json({ status: 'sem_pagamento', pedido: pedido.codigo });
    }

    // Se tem mercadoPagoId e o MP esta configurado, consultar status atualizado
    if (pedido.pagamento.mercadoPagoId && initMP()) {
      try {
        const mpData = await mpPayment.get({ id: parseInt(pedido.pagamento.mercadoPagoId, 10) });
        if (mpData) {
          res.json({
            pagamento: pedido.pagamento,
            mercadoPago: {
              status: mpData.status,
              status_detail: mpData.status_detail,
              payment_method_id: mpData.payment_method_id,
              transaction_amount: mpData.transaction_amount
            }
          });
          return;
        }
      } catch (e) {
        // Se nao conseguir consultar MP, retornar dados locais
      }
    }

    res.json({ pagamento: pedido.pagamento });
  } catch (err) {
    next(err);
  }
}

module.exports = { criarPagamento, webhook, consultarPagamento };
