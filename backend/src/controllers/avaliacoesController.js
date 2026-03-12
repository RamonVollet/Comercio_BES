// ===========================================
// Controller - Avaliacoes
// ===========================================
const prisma = require('../lib/prisma');

// Sanitizacao de texto - remove tags HTML para prevenir XSS
function sanitize(str) {
  if (str === null || str === undefined) return str;
  return String(str).replace(/[<>]/g, '');
}

// GET /api/avaliacoes/:comercioSlug
async function listarPorComercio(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.comercioSlug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { comercioId: comercio.id },
      include: {
        user: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular media
    const total = avaliacoes.length;
    const media = total > 0
      ? Math.round((avaliacoes.reduce((acc, a) => acc + a.nota, 0) / total) * 10) / 10
      : 0;

    res.json({
      comercioSlug: req.params.comercioSlug,
      media,
      total,
      avaliacoes: avaliacoes.map(a => ({
        id: a.id,
        nota: a.nota,
        comentario: a.comentario,
        usuario: a.user?.nome || 'Anonimo',
        createdAt: a.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/avaliacoes/:comercioSlug
async function criar(req, res, next) {
  try {
    const { nota, comentario } = req.body;

    const notaInt = parseInt(nota, 10);
    if (isNaN(notaInt) || notaInt < 1 || notaInt > 5) {
      return res.status(400).json({
        error: 'nota e obrigatoria e deve ser entre 1 e 5'
      });
    }

    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.comercioSlug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        comercioId: comercio.id,
        userId: req.userId || null,
        nota: notaInt,
        comentario: sanitize(comentario) || null
      },
      include: {
        user: { select: { nome: true } }
      }
    });

    // Recalcular e atualizar campo recomendados
    const stats = await prisma.avaliacao.aggregate({
      where: { comercioId: comercio.id },
      _avg: { nota: true },
      _count: true
    });

    await prisma.comercio.update({
      where: { id: comercio.id },
      data: { recomendados: stats._count }
    });

    res.status(201).json({
      message: 'Avaliacao enviada com sucesso',
      avaliacao: {
        id: avaliacao.id,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
        usuario: avaliacao.user?.nome || 'Anonimo',
        createdAt: avaliacao.createdAt
      },
      mediaAtual: Math.round(stats._avg.nota * 10) / 10,
      totalAvaliacoes: stats._count
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/avaliacoes/:id (admin ou autor)
async function excluir(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalido' });
    }

    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id }
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliacao nao encontrada' });
    }

    // Permitir exclusao pelo autor ou admin
    if (req.userTipo !== 'admin' && avaliacao.userId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao para excluir esta avaliacao' });
    }

    await prisma.avaliacao.delete({
      where: { id }
    });

    res.json({ message: 'Avaliacao excluida' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorComercio, criar, excluir };
