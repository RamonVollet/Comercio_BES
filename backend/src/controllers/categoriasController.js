// ===========================================
// Controller - Categorias
// ===========================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/categorias
async function listar(req, res, next) {
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { comercios: true }
        }
      },
      orderBy: { nome: 'asc' }
    });

    res.json(categorias.map(c => ({
      id: c.id,
      nome: c.nome,
      slug: c.slug,
      emoji: c.emoji,
      totalComercios: c._count.comercios
    })));
  } catch (err) {
    next(err);
  }
}

// POST /api/categorias (admin only)
async function criar(req, res, next) {
  try {
    const { nome, slug, emoji } = req.body;

    if (!nome || !slug) {
      return res.status(400).json({ error: 'nome e slug sao obrigatorios' });
    }

    const categoria = await prisma.categoria.create({
      data: { nome, slug, emoji: emoji || '' }
    });

    res.status(201).json({ message: 'Categoria criada', categoria });
  } catch (err) {
    next(err);
  }
}

// PUT /api/categorias/:id (admin only)
async function atualizar(req, res, next) {
  try {
    const { nome, slug, emoji } = req.body;
    const data = {};

    if (nome !== undefined) data.nome = nome;
    if (slug !== undefined) data.slug = slug;
    if (emoji !== undefined) data.emoji = emoji;

    const categoria = await prisma.categoria.update({
      where: { id: parseInt(req.params.id) },
      data
    });

    res.json({ message: 'Categoria atualizada', categoria });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categorias/:id (admin only)
async function excluir(req, res, next) {
  try {
    // Verificar se ha comercios nesta categoria
    const count = await prisma.comercio.count({
      where: { categoriaId: parseInt(req.params.id) }
    });

    if (count > 0) {
      return res.status(400).json({
        error: `Nao e possivel excluir: ${count} comercios usam esta categoria`
      });
    }

    await prisma.categoria.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Categoria excluida' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, atualizar, excluir };
