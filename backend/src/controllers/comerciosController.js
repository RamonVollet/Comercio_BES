// ===========================================
// Controller - Comercios
// ===========================================
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const prisma = new PrismaClient();

// Formatar comercio para resposta (converte JSON strings em arrays)
function formatarComercio(c) {
  // Calcular rating medio das avaliacoes
  let rating = 0;
  if (c.avaliacoes && c.avaliacoes.length > 0) {
    const soma = c.avaliacoes.reduce((acc, a) => acc + a.nota, 0);
    rating = Math.round((soma / c.avaliacoes.length) * 10) / 10;
  }

  const resultado = {
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    categoria: c.categoria?.nome || '',
    categoriaSlug: c.categoria?.slug || '',
    tags: safeParseJSON(c.tags, []),
    emoji: c.emoji,
    rating: rating,
    totalAvaliacoes: c.avaliacoes?.length || 0,
    visitas: c.visitas,
    recomendados: c.recomendados,
    aberto: c.aberto,
    descricao: c.descricao,
    endereco: c.endereco,
    lat: c.lat,
    lng: c.lng,
    tel: c.tel,
    whatsapp: c.whatsapp,
    horario: c.horario,
    fotos: safeParseJSON(c.fotos, []),
    promo: c.promocao ? {
      ativo: c.promocao.ativo,
      desc: c.promocao.descricao,
      preco: c.promocao.preco,
      original: c.promocao.original
    } : null,
    catalogo: c.produtos ? c.produtos.map(p => ({
      id: p.id,
      nome_produto: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      imagem: p.imagem,
      disponivel: p.disponivel
    })) : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };

  return resultado;
}

function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Includes comuns para queries
const includeCompleto = {
  categoria: true,
  produtos: { orderBy: { ordem: 'asc' } },
  promocao: true,
  avaliacoes: { select: { nota: true } }
};

// GET /api/comercios
async function listar(req, res, next) {
  try {
    const {
      busca,
      categoria,
      aberto,
      orderBy = 'rating',
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    // Filtro por busca (nome, tags)
    if (busca) {
      where.OR = [
        { nome: { contains: busca } },
        { tags: { contains: busca } },
        { endereco: { contains: busca } }
      ];
    }

    // Filtro por categoria
    if (categoria) {
      where.categoria = { slug: categoria };
    }

    // Filtro por status aberto/fechado
    if (aberto !== undefined) {
      where.aberto = aberto === 'true';
    }

    // Ordenacao
    let orderByClause = {};
    switch (orderBy) {
      case 'nome':
        orderByClause = { nome: 'asc' };
        break;
      case 'visitas':
        orderByClause = { visitas: 'desc' };
        break;
      case 'recente':
        orderByClause = { createdAt: 'desc' };
        break;
      case 'rating':
      default:
        orderByClause = { recomendados: 'desc' }; // Aproximacao; rating real e calculado
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [comercios, total] = await Promise.all([
      prisma.comercio.findMany({
        where,
        include: includeCompleto,
        orderBy: orderByClause,
        skip,
        take
      }),
      prisma.comercio.count({ where })
    ]);

    res.json({
      comercios: comercios.map(formatarComercio),
      paginacao: {
        total,
        pagina: parseInt(page),
        porPagina: take,
        totalPaginas: Math.ceil(total / take)
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/comercios/:slug
async function buscarPorSlug(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug },
      include: {
        ...includeCompleto,
        avaliacoes: {
          include: { user: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    res.json(formatarComercio(comercio));
  } catch (err) {
    next(err);
  }
}

// POST /api/comercios
async function criar(req, res, next) {
  try {
    const {
      nome, categoriaId, tags, emoji, descricao,
      aberto, endereco, lat, lng, tel, whatsapp,
      horario, fotos
    } = req.body;

    if (!nome || !categoriaId || !endereco || !whatsapp || !horario) {
      return res.status(400).json({
        error: 'nome, categoriaId, endereco, whatsapp e horario sao obrigatorios'
      });
    }

    // Verificar se categoria existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: parseInt(categoriaId) }
    });
    if (!categoria) {
      return res.status(400).json({ error: 'Categoria nao encontrada' });
    }

    const slug = slugify(nome, { lower: true, strict: true });

    // Verificar slug unico
    const slugExistente = await prisma.comercio.findUnique({ where: { slug } });
    if (slugExistente) {
      return res.status(409).json({ error: 'Ja existe um comercio com nome similar' });
    }

    const comercio = await prisma.comercio.create({
      data: {
        slug,
        nome,
        categoriaId: parseInt(categoriaId),
        tags: JSON.stringify(tags || []),
        emoji: emoji || categoria.emoji || '',
        descricao: descricao || null,
        aberto: aberto !== undefined ? aberto : true,
        endereco,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        tel: tel || null,
        whatsapp,
        horario,
        fotos: JSON.stringify(fotos || []),
        ownerId: req.userId
      },
      include: includeCompleto
    });

    res.status(201).json({
      message: 'Comercio criado com sucesso',
      comercio: formatarComercio(comercio)
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/comercios/:slug
async function atualizar(req, res, next) {
  try {
    const comercioExistente = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercioExistente) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    // Verificar permissao: dono ou admin
    if (req.userTipo !== 'admin' && comercioExistente.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao para editar este comercio' });
    }

    const {
      nome, categoriaId, tags, emoji, descricao,
      aberto, endereco, lat, lng, tel, whatsapp,
      horario, fotos
    } = req.body;

    const data = {};
    if (nome !== undefined) {
      data.nome = nome;
      data.slug = slugify(nome, { lower: true, strict: true });
    }
    if (categoriaId !== undefined) data.categoriaId = parseInt(categoriaId);
    if (tags !== undefined) data.tags = JSON.stringify(tags);
    if (emoji !== undefined) data.emoji = emoji;
    if (descricao !== undefined) data.descricao = descricao;
    if (aberto !== undefined) data.aberto = aberto;
    if (endereco !== undefined) data.endereco = endereco;
    if (lat !== undefined) data.lat = parseFloat(lat);
    if (lng !== undefined) data.lng = parseFloat(lng);
    if (tel !== undefined) data.tel = tel;
    if (whatsapp !== undefined) data.whatsapp = whatsapp;
    if (horario !== undefined) data.horario = horario;
    if (fotos !== undefined) data.fotos = JSON.stringify(fotos);

    const comercio = await prisma.comercio.update({
      where: { slug: req.params.slug },
      data,
      include: includeCompleto
    });

    res.json({
      message: 'Comercio atualizado',
      comercio: formatarComercio(comercio)
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comercios/:slug
async function excluir(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    // Verificar permissao: dono ou admin
    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao para excluir este comercio' });
    }

    await prisma.comercio.delete({ where: { slug: req.params.slug } });

    res.json({ message: 'Comercio excluido com sucesso' });
  } catch (err) {
    next(err);
  }
}

// --- Produtos (catalogo) ---

// POST /api/comercios/:slug/produtos
async function adicionarProduto(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const { nome, descricao, preco, imagem, disponivel, ordem } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({ error: 'nome e preco sao obrigatorios' });
    }

    const produto = await prisma.produto.create({
      data: {
        comercioId: comercio.id,
        nome,
        descricao: descricao || '',
        preco: parseFloat(preco),
        imagem: imagem || null,
        disponivel: disponivel !== undefined ? disponivel : true,
        ordem: parseInt(ordem) || 0
      }
    });

    res.status(201).json({ message: 'Produto adicionado', produto });
  } catch (err) {
    next(err);
  }
}

// PUT /api/comercios/:slug/produtos/:produtoId
async function atualizarProduto(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const { nome, descricao, preco, imagem, disponivel, ordem } = req.body;
    const data = {};

    if (nome !== undefined) data.nome = nome;
    if (descricao !== undefined) data.descricao = descricao;
    if (preco !== undefined) data.preco = parseFloat(preco);
    if (imagem !== undefined) data.imagem = imagem;
    if (disponivel !== undefined) data.disponivel = disponivel;
    if (ordem !== undefined) data.ordem = parseInt(ordem);

    const produto = await prisma.produto.update({
      where: { id: parseInt(req.params.produtoId) },
      data
    });

    res.json({ message: 'Produto atualizado', produto });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comercios/:slug/produtos/:produtoId
async function excluirProduto(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    await prisma.produto.delete({
      where: { id: parseInt(req.params.produtoId) }
    });

    res.json({ message: 'Produto excluido' });
  } catch (err) {
    next(err);
  }
}

// --- Promocoes ---

// PUT /api/comercios/:slug/promocao
async function definirPromocao(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    const { ativo, descricao, preco, original } = req.body;

    if (!descricao || !preco || !original) {
      return res.status(400).json({ error: 'descricao, preco e original sao obrigatorios' });
    }

    const promocao = await prisma.promocao.upsert({
      where: { comercioId: comercio.id },
      create: {
        comercioId: comercio.id,
        ativo: ativo !== undefined ? ativo : true,
        descricao,
        preco,
        original
      },
      update: {
        ativo: ativo !== undefined ? ativo : true,
        descricao,
        preco,
        original
      }
    });

    res.json({ message: 'Promocao atualizada', promocao });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comercios/:slug/promocao
async function removerPromocao(req, res, next) {
  try {
    const comercio = await prisma.comercio.findUnique({
      where: { slug: req.params.slug }
    });

    if (!comercio) {
      return res.status(404).json({ error: 'Comercio nao encontrado' });
    }

    if (req.userTipo !== 'admin' && comercio.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    await prisma.promocao.deleteMany({
      where: { comercioId: comercio.id }
    });

    res.json({ message: 'Promocao removida' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar, buscarPorSlug, criar, atualizar, excluir,
  adicionarProduto, atualizarProduto, excluirProduto,
  definirPromocao, removerPromocao
};
