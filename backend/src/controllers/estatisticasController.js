// ===========================================
// Controller - Estatisticas
// ===========================================
const prisma = require('../lib/prisma');

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
    const comercioIdInt = parseInt(comercioId, 10);
    if (isNaN(comercioIdInt)) {
      return res.status(400).json({ error: 'comercioId invalido' });
    }

    await prisma.estatistica.create({
      data: {
        comercioId: comercioIdInt,
        tipo,
        ip: null // Nao armazenar IPs por privacidade
      }
    });

    // Incrementar visitas no comercio se for visita
    if (tipo === 'visita') {
      await prisma.comercio.update({
        where: { id: comercioIdInt },
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
    const periodoInt = Math.min(365, Math.max(1, parseInt(periodo, 10) || 30));
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodoInt);

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
      periodo: `${periodoInt} dias`,
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
