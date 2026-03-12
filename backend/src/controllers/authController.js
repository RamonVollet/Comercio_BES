// ===========================================
// Controller - Autenticacao
// ===========================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Validacao de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Placeholder JWT secret check
const JWT_PLACEHOLDER = 'trocar-por-uma-chave-secreta-longa-e-aleatoria';

function gerarToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === JWT_PLACEHOLDER) {
    console.error('[SEGURANCA] JWT_SECRET nao configurado ou usando valor padrao! Altere no .env');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET nao configurado para producao');
    }
  }
  return jwt.sign(
    { id: user.id, email: user.email, tipo: user.tipo },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
  );
}

// Sanitizar string - remover tags HTML
function sanitize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

// POST /api/auth/registro
async function registro(req, res, next) {
  try {
    const { nome, email, senha, tipo, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: 'Nome, email e senha sao obrigatorios'
      });
    }

    // Validar formato do email
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Formato de email invalido' });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter no minimo 6 caracteres'
      });
    }

    // SEGURANCA: Bloquear escalation de role
    // Apenas 'cliente' e 'comerciante' sao permitidos no registro publico
    // 'admin' so pode ser definido diretamente no banco
    const tipoPermitido = (tipo === 'comerciante') ? 'comerciante' : 'cliente';

    // Verificar se email ja existe
    const existente = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existente) {
      return res.status(409).json({ error: 'Email ja cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    const user = await prisma.user.create({
      data: {
        nome: sanitize(nome),
        email: email.toLowerCase().trim(),
        senha: senhaHash,
        tipo: tipoPermitido,
        telefone: telefone ? sanitize(telefone) : null
      },
      select: { id: true, nome: true, email: true, tipo: true, createdAt: true }
    });

    const token = gerarToken(user);

    res.status(201).json({
      message: 'Conta criada com sucesso',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha sao obrigatorios'
      });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = gerarToken(user);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      token
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/perfil
async function perfil(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        telefone: true,
        createdAt: true,
        comercios: {
          select: { id: true, nome: true, slug: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/perfil
async function atualizarPerfil(req, res, next) {
  try {
    const { nome, telefone, senhaAtual, novaSenha } = req.body;
    const data = {};

    if (nome) data.nome = sanitize(nome);
    if (telefone !== undefined) data.telefone = telefone ? sanitize(telefone) : null;

    // Alterar senha
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ error: 'Informe a senha atual' });
      }

      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter no minimo 6 caracteres' });
      }

      data.senha = await bcrypt.hash(novaSenha, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, nome: true, email: true, tipo: true, telefone: true }
    });

    res.json({ message: 'Perfil atualizado', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { registro, login, perfil, atualizarPerfil };
