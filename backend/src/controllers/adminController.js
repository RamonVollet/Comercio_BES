const prisma = require('../lib/prisma');

async function listarUsuarios(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const usuarios = await prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: { id: true, nome: true, email: true, tipo: true, createdAt: true }
        });

        const total = await prisma.user.count();

        res.json({
            usuarios,
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

async function atualizarStatusLoja(req, res, next) {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        if (typeof ativo !== 'boolean') {
            return res.status(400).json({ error: 'ativo deve ser boolean' });
        }

        const comercio = await prisma.comercio.update({
            where: { id: parseInt(id, 10) },
            data: { aberto: ativo } // Map do termo "ativo" (suspender) para aberto/fechado?
            // "aberto" aqui eh o status p/ clientes. Se houvesse "ativo" seria melhor, 
            // mas como nao há no schema MVP, usaremos "aberto" para simular suspensão.
        });

        res.json({ message: ativo ? 'Loja ativada com sucesso' : 'Loja suspensa com sucesso', aberto: comercio.aberto });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Comércio não encontrado' });
        }
        next(err);
    }
}

module.exports = { listarUsuarios, atualizarStatusLoja };
