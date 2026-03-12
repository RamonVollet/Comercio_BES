// ===========================================
// Controller - Estatisticas
// ===========================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/estatisticas/registrar
async function registrar(req, res, next) {
  try {
    const { comercioId, tipo } = req.body;

    const tiposValidos = ['visita', 'whatsapp_click', 'telefone_click', 'compartilhamento'];
    if (!comercioId || !tipo || !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        error: 'comercioId e tipo sao obrigatorios. Tipos: ' + tiposValidos.join(', ')
      });
    }

    // Registrar evento
    await prisma.estatistica.create({
      data: {
        comercioId: parseInt(comercioId),
        tipo,
        ip: req.ip || null
      }
    });

    // Incrementar visitas no comercio se for visita
    if (tipo === 'visita') {
      await prisma.comercio.update({
        where: { id: parseInt(comercioId) },
        data: { visitas: { increment: 1 } }
      });
    }

    res.status(201).json({ message: 'Evento registrado' });
  } catch (err) {
    next(err);
  }
}

// GET /api/estatisticas/:comercioSlug
async function buscarPorComercio(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.comercioSlug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    // Verificar permissao: dono ou admin
    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao para ver estas estatisticas' });
    }

    const { periodo = '30' } = req.query; // dias
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));

    const eventos = await prisma.estatistica.findMany({
      where: {
        comercioId: comercio.id,
        createdAt: { gte: dataInicio }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por tipo
    const resumo = {
      visitas: 0,
      whatsapp_clicks: 0,
      telefone_clicks: 0,
      compartilhamentos: 0
    };

    eventos.forEach(e => {
      switch (e.tipo) {
        case 'visita': resumo.visitas++; break;
        case 'whatsapp_click': resumo.whatsapp_clicks++; break;
        case 'telefone_click': resumo.telefone_clicks++; break;
        case 'compartilhamento': resumo.compartilhamentos++; break;
      }
    });

    // Agrupar por dia (ultimos N dias)
    const porDia = {};
    eventos.forEach(e => {
      const dia = e.createdAt.toISOString().split('T')[0];
      if (!porDia[dia]) porDia[dia] = { visitas: 0, whatsapp: 0, telefone: 0, compartilhamento: 0 };
      switch (e.tipo) {
        case 'visita': porDia[dia].visitas++; break;
        case 'whatsapp_click': porDia[dia].whatsapp++; break;
        case 'telefone_click': porDia[dia].telefone++; break;
        case 'compartilhamento': porDia[dia].compartilhamento++; break;
      }
    });

    res.json({
      comercio: { id: comercio.id, nome: comercio.nome, slug: comercio.slug },
      periodo: `${periodo} dias`,
      resumo,
      porDia,
      totalEventos: eventos.length
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/estatisticas/geral (admin)
async function geral(req, res, next) {
  try {
    const [
      totalComercios,
      totalUsuarios,
      totalAvaliacoes,
      totalEventos
    ] = await Promise.all([
      prisma.comercio.count(),
      prisma.user.count(),
      prisma.avaliacao.count(),
      prisma.estatistica.count()
    ]);

    // Top 5 comercios por visitas
    const topVisitas = await prisma.comercio.findMany({
      select: { nome: true, slug: true, visitas: true },
      orderBy: { visitas: 'desc' },
      take: 5
    });

    res.json({
      totais: {
        comercios: totalComercios,
        usuarios: totalUsuarios,
        avaliacoes: totalAvaliacoes,
        eventos: totalEventos
      },
      topVisitas
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registrar, buscarPorComercio, geral };
