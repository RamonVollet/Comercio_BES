// ===========================================
// Controller - Pedidos (Orders)
// ===========================================
const prisma = require('../lib/prisma');
const sanitize = require('../lib/sanitize');

// Gerar codigo do pedido: BES-00001
async function gerarCodigo() {
  const ultimo = await prisma.pedido.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true }
  });
  const num = (ultimo ? ultimo.id : 0) + 1;
  return `BES-${String(num).padStart(5, '0')}`;
}

// POST /api/pedidos
// Cria um pedido a partir do carrinho do cliente
async function criar(req, res, next) {
  try {
    const { comercioId, enderecoId, tipoEntrega, itens, observacao } = req.body;

    // Validacoes
    if (!comercioId || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        error: 'comercioId e itens (array) sao obrigatorios'
      });
    }

    const tipo = tipoEntrega || 'entrega';
    if (!['entrega', 'retirada'].includes(tipo)) {
      return res.status(400).json({ error: 'tipoEntrega deve ser "entrega" ou "retirada"' });
    }

    // Se entrega, precisa de endereco
    if (tipo === 'entrega' && !enderecoId) {
      return res.status(400).json({
        error: 'enderecoId e obrigatorio para entregas'
      });
    }

    // Verificar comercio existe
    const comercio = await prisma.comercio.findUnique({
      where: { id: parseInt(comercioId, 10) },
      select: { id: true, nome: true, aberto: true }
    });
    if (!comercio) return res.status(404).json({ error: 'Comercio nao encontrado' });
    if (!comercio.aberto) return res.status(400).json({ error: 'Este comercio esta fechado no momento' });

    // Verificar endereco pertence ao usuario
    if (enderecoId) {
      const endereco = await prisma.endereco.findFirst({
        where: { id: parseInt(enderecoId, 10), userId: req.userId }
      });
      if (!endereco) return res.status(404).json({ error: 'Endereco nao encontrado' });
    }

    // Validar itens e calcular subtotal
    const produtoIds = itens.map(i => parseInt(i.produtoId, 10)).filter(id => !isNaN(id));
    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: produtoIds },
        comercioId: parseInt(comercioId, 10),
        disponivel: true
      }
    });

    const produtosMap = new Map(produtos.map(p => [p.id, p]));

    const itensValidados = [];
    let subtotal = 0;

    for (const item of itens) {
      const prodId = parseInt(item.produtoId, 10);
      const produto = produtosMap.get(prodId);
      if (!produto) {
        return res.status(400).json({
          error: `Produto ID ${prodId} nao encontrado ou indisponivel neste comercio`
        });
      }

      const qtd = Math.max(1, Math.min(parseInt(item.quantidade, 10) || 1, 99));
      const precoItem = produto.preco * qtd;
      subtotal += precoItem;

      itensValidados.push({
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: qtd
      });
    }

    // Limitar valor maximo por pedido (seguranca)
    if (subtotal > 10000) {
      return res.status(400).json({ error: 'Valor maximo por pedido: R$ 10.000,00' });
    }

    const taxaEntrega = tipo === 'entrega' ? 5.0 : 0; // Taxa fixa por enquanto
    const total = subtotal + taxaEntrega;
    const codigo = await gerarCodigo();

    const pedido = await prisma.pedido.create({
      data: {
        codigo,
        clienteId: req.userId,
        comercioId: parseInt(comercioId, 10),
        enderecoId: enderecoId ? parseInt(enderecoId, 10) : null,
        status: 'pendente',
        tipoEntrega: tipo,
        subtotal,
        taxaEntrega,
        desconto: 0,
        total,
        observacao: observacao ? sanitize(observacao) : null,
        itens: {
          create: itensValidados
        }
      },
      include: {
        itens: true,
        comercio: { select: { nome: true, slug: true, emoji: true, whatsapp: true } },
        endereco: true
      }
    });

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      pedido
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pedidos
// Lista pedidos do usuario (cliente) ou pedidos recebidos (comerciante)
async function listar(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const status = req.query.status;

    const where = {};

    // Cliente ve seus pedidos, comerciante ve pedidos das suas lojas
    if (req.userTipo === 'comerciante') {
      // Buscar IDs dos comercios do usuario
      const comercios = await prisma.comercio.findMany({
        where: { ownerId: req.userId },
        select: { id: true }
      });
      const idsDoUsuario = comercios.map(c => c.id);

      // Se passou ?comercioId, filtrar apenas por essa loja (validando pertencimento)
      const comercioIdParam = parseInt(req.query.comercioId, 10);
      if (!isNaN(comercioIdParam) && idsDoUsuario.includes(comercioIdParam)) {
        where.comercioId = comercioIdParam;
      } else {
        where.comercioId = { in: idsDoUsuario };
      }
    } else if (req.userTipo === 'admin') {
      // Admin ve tudo (mas pode filtrar por ?comercioId se quiser)
      const comercioIdParam = parseInt(req.query.comercioId, 10);
      if (!isNaN(comercioIdParam)) where.comercioId = comercioIdParam;
    } else {
      // Cliente ve apenas seus pedidos
      where.clienteId = req.userId;
    }

    if (status) where.status = status;

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          itens: true,
          comercio: { select: { nome: true, slug: true, emoji: true } },
          cliente: { select: { nome: true, email: true, telefone: true } },
          endereco: true,
          pagamento: { select: { status: true, metodo: true, mercadoPagoId: true } }
        }
      }),
      prisma.pedido.count({ where })
    ]);

    res.json({
      pedidos,
      paginacao: {
        total,
        pagina: page,
        porPagina: limit,
        totalPaginas: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pedidos/:codigo
// Detalhes de um pedido
async function buscarPorCodigo(req, res, next) {
  try {
    const { codigo } = req.params;

    const pedido = await prisma.pedido.findUnique({
      where: { codigo },
      include: {
        itens: { include: { produto: { select: { imagem: true, disponivel: true } } } },
        comercio: { select: { nome: true, slug: true, emoji: true, whatsapp: true, endereco: true, horario: true } },
        cliente: { select: { nome: true, email: true, telefone: true } },
        endereco: true,
        pagamento: true
      }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido nao encontrado' });

    // Verificar acesso: dono do pedido, dono do comercio, ou admin
    const isCliente = pedido.clienteId === req.userId;
    const isComercio = await prisma.comercio.findFirst({
      where: { id: pedido.comercioId, ownerId: req.userId }
    });
    const isAdmin = req.userTipo === 'admin';

    if (!isCliente && !isComercio && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissao para ver este pedido' });
    }

    res.json(pedido);
  } catch (err) {
    next(err);
  }
}

// PUT /api/pedidos/:codigo/status
// Atualizar status do pedido (comerciante/admin)
async function atualizarStatus(req, res, next) {
  try {
    const { codigo } = req.params;
    const { status, motivoCancelamento } = req.body;

    const statusValidos = ['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue', 'cancelado'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        error: `Status invalido. Valores aceitos: ${statusValidos.join(', ')}`
      });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { codigo },
      include: { comercio: { select: { ownerId: true } } }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido nao encontrado' });

    // Verificar permissao
    const isComercio = pedido.comercio.ownerId === req.userId;
    const isCliente = pedido.clienteId === req.userId;
    const isAdmin = req.userTipo === 'admin';

    // Cliente so pode cancelar
    if (isCliente && status !== 'cancelado') {
      return res.status(403).json({ error: 'Cliente so pode cancelar pedidos' });
    }

    // Apenas comerciante/admin podem mudar status (exceto cancelar)
    if (!isComercio && !isAdmin && !isCliente) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    // Nao pode alterar pedido ja entregue ou cancelado
    if (['entregue', 'cancelado'].includes(pedido.status)) {
      return res.status(400).json({ error: `Pedido ja esta ${pedido.status}` });
    }

    // Se cancelando, exigir motivo
    const data = { status };
    if (status === 'cancelado') {
      if (!motivoCancelamento) {
        return res.status(400).json({ error: 'Motivo do cancelamento e obrigatorio' });
      }
      data.motivoCancelamento = sanitize(motivoCancelamento);
    }

    const updated = await prisma.pedido.update({
      where: { codigo },
      data,
      include: {
        itens: true,
        comercio: { select: { nome: true, slug: true } },
        cliente: { select: { nome: true, email: true } },
        pagamento: { select: { status: true, metodo: true } }
      }
    });

    res.json({ message: `Status atualizado para ${status}`, pedido: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/pedidos/resumo
// Resumo de pedidos para o comerciante (dashboard)
async function resumo(req, res, next) {
  try {
    let comercioIds;

    if (req.userTipo === 'admin') {
      const comercios = await prisma.comercio.findMany({ select: { id: true } });
      comercioIds = comercios.map(c => c.id);
    } else {
      const comercios = await prisma.comercio.findMany({
        where: { ownerId: req.userId },
        select: { id: true }
      });
      comercioIds = comercios.map(c => c.id);
    }

    if (comercioIds.length === 0) {
      return res.json({
        total: 0, pendentes: 0, confirmados: 0,
        preparando: 0, emEntrega: 0, entregues: 0,
        cancelados: 0, faturamento: 0
      });
    }

    const [total, pendentes, confirmados, preparando, emEntrega, entregues, cancelados] =
      await Promise.all([
        prisma.pedido.count({ where: { comercioId: { in: comercioIds } } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'pendente' } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'confirmado' } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'preparando' } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'saiu_entrega' } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'entregue' } }),
        prisma.pedido.count({ where: { comercioId: { in: comercioIds }, status: 'cancelado' } })
      ]);

    // Faturamento (pedidos entregues)
    const entreguesData = await prisma.pedido.aggregate({
      where: { comercioId: { in: comercioIds }, status: 'entregue' },
      _sum: { total: true }
    });

    res.json({
      total,
      pendentes,
      confirmados,
      preparando,
      emEntrega,
      entregues,
      cancelados,
      faturamento: entreguesData._sum.total || 0
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, buscarPorCodigo, atualizarStatus, resumo };
