// ===========================================
// Controller - Autenticacao
// ===========================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const sanitize = require('../lib/sanitize');

// Validacao de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validacao de CPF (11 digitos)
const CPF_REGEX = /^\d{11}$/;

// Validacao de CNPJ (14 digitos)
const CNPJ_REGEX = /^\d{14}$/;

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

// Limpar CPF/CNPJ - manter apenas digitos
function limparDocumento(doc) {
  if (!doc || typeof doc !== 'string') return null;
  return doc.replace(/\D/g, '');
}

// POST /api/auth/registro
// Aceita dois fluxos distintos:
//   tipo: "cliente"     → Cadastro de USUARIO (comprador)
//   tipo: "comerciante" → Cadastro de LOJA/COMERCIO (vendedor)
async function registro(req, res, next) {
  try {
    const { nome, email, senha, tipo, telefone } = req.body;

    // --- Validacoes basicas (ambos os tipos) ---
    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: 'Nome, email e senha sao obrigatorios'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Formato de email invalido' });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        error: 'A senha deve ter no minimo 6 caracteres'
      });
    }

    // SEGURANCA: Bloquear escalation de role
    const tipoPermitido = (tipo === 'comerciante') ? 'comerciante' : 'cliente';

    // Verificar se email ja existe
    const existente = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existente) {
      return res.status(409).json({ error: 'Email ja cadastrado' });
    }

    // --- Dados base do usuario ---
    const data = {
      nome: sanitize(nome),
      email: email.toLowerCase().trim(),
      senha: await bcrypt.hash(senha, 12),
      tipo: tipoPermitido,
      telefone: telefone ? sanitize(telefone) : null
    };

    // --- Dados especificos COMERCIANTE ---
    if (tipoPermitido === 'comerciante') {
      const { nomeFantasia, cpfCnpj, enderecoComercial, telefoneComercial } = req.body;

      if (!nomeFantasia) {
        return res.status(400).json({
          error: 'Nome fantasia do negocio e obrigatorio para comerciantes'
        });
      }

      if (!cpfCnpj) {
        return res.status(400).json({
          error: 'CPF ou CNPJ e obrigatorio para comerciantes'
        });
      }

      const docLimpo = limparDocumento(cpfCnpj);
      if (!CPF_REGEX.test(docLimpo) && !CNPJ_REGEX.test(docLimpo)) {
        return res.status(400).json({
          error: 'CPF (11 digitos) ou CNPJ (14 digitos) invalido'
        });
      }

      data.nomeFantasia = sanitize(nomeFantasia);
      data.cpfCnpj = docLimpo;
      data.enderecoComercial = enderecoComercial ? sanitize(enderecoComercial) : null;
      data.telefoneComercial = telefoneComercial ? sanitize(telefoneComercial) : null;
    }

    // --- Dados especificos CLIENTE ---
    if (tipoPermitido === 'cliente') {
      const { cpf } = req.body;
      if (cpf) {
        const cpfLimpo = limparDocumento(cpf);
        if (!CPF_REGEX.test(cpfLimpo)) {
          return res.status(400).json({ error: 'CPF invalido (11 digitos)' });
        }
        data.cpf = cpfLimpo;
      }
    }

    const user = await prisma.user.create({
      data,
      select: {
        id: true, nome: true, email: true, tipo: true,
        telefone: true, nomeFantasia: true, createdAt: true
      }
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

    // Retornar dados relevantes por tipo
    const userData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      telefone: user.telefone
    };

    if (user.tipo === 'comerciante') {
      userData.nomeFantasia = user.nomeFantasia;
    }

    res.json({
      message: 'Login realizado com sucesso',
      user: userData,
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
        avatar: true,
        createdAt: true,
        // Campos comerciante
        nomeFantasia: true,
        cpfCnpj: true,
        enderecoComercial: true,
        telefoneComercial: true,
        // Campos cliente
        cpf: true,
        // Relacoes
        comercios: {
          select: { id: true, nome: true, slug: true, emoji: true, aberto: true }
        },
        enderecos: {
          select: {
            id: true, apelido: true, rua: true, numero: true,
            complemento: true, bairro: true, cidade: true,
            estado: true, cep: true, principal: true
          },
          orderBy: { principal: 'desc' }
        },
        pedidos: {
          select: {
            id: true, codigo: true, status: true, total: true,
            tipoEntrega: true, createdAt: true,
            comercio: { select: { nome: true, slug: true, emoji: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
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
    const { nome, telefone, avatar, senhaAtual, novaSenha } = req.body;
    const data = {};

    if (nome) data.nome = sanitize(nome);
    if (telefone !== undefined) data.telefone = telefone ? sanitize(telefone) : null;
    if (avatar !== undefined) data.avatar = avatar;

    // Campos especificos por tipo
    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });

    if (currentUser.tipo === 'comerciante') {
      const { nomeFantasia, cpfCnpj, enderecoComercial, telefoneComercial } = req.body;
      if (nomeFantasia) data.nomeFantasia = sanitize(nomeFantasia);
      if (cpfCnpj) {
        const docLimpo = limparDocumento(cpfCnpj);
        if (!CPF_REGEX.test(docLimpo) && !CNPJ_REGEX.test(docLimpo)) {
          return res.status(400).json({ error: 'CPF ou CNPJ invalido' });
        }
        data.cpfCnpj = docLimpo;
      }
      if (enderecoComercial !== undefined) data.enderecoComercial = sanitize(enderecoComercial);
      if (telefoneComercial !== undefined) data.telefoneComercial = sanitize(telefoneComercial);
    }

    if (currentUser.tipo === 'cliente') {
      const { cpf } = req.body;
      if (cpf) {
        const cpfLimpo = limparDocumento(cpf);
        if (!CPF_REGEX.test(cpfLimpo)) {
          return res.status(400).json({ error: 'CPF invalido' });
        }
        data.cpf = cpfLimpo;
      }
    }

    // Alterar senha
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ error: 'Informe a senha atual' });
      }

      const senhaValida = await bcrypt.compare(senhaAtual, currentUser.senha);
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
      select: {
        id: true, nome: true, email: true, tipo: true,
        telefone: true, avatar: true, nomeFantasia: true,
        cpfCnpj: true, enderecoComercial: true, telefoneComercial: true, cpf: true
      }
    });

    res.json({ message: 'Perfil atualizado', user });
  } catch (err) {
    next(err);
  }
}

// ============================================
// Enderecos de entrega (apenas clientes)
// ============================================

// GET /api/auth/enderecos
async function listarEnderecos(req, res, next) {
  try {
    const enderecos = await prisma.endereco.findMany({
      where: { userId: req.userId },
      orderBy: { principal: 'desc' }
    });
    res.json(enderecos);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/enderecos
async function criarEndereco(req, res, next) {
  try {
    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, principal } = req.body;

    if (!rua || !numero || !bairro || !cep) {
      return res.status(400).json({ error: 'Rua, numero, bairro e CEP sao obrigatorios' });
    }

    // Se marcando como principal, desmarcar outros
    if (principal) {
      await prisma.endereco.updateMany({
        where: { userId: req.userId },
        data: { principal: false }
      });
    }

    const endereco = await prisma.endereco.create({
      data: {
        userId: req.userId,
        apelido: sanitize(apelido) || 'Casa',
        rua: sanitize(rua),
        numero: sanitize(numero),
        complemento: complemento ? sanitize(complemento) : null,
        bairro: sanitize(bairro),
        cidade: cidade ? sanitize(cidade) : 'Boa Esperança do Sul',
        estado: estado ? sanitize(estado) : 'SP',
        cep: sanitize(cep).replace(/\D/g, ''),
        principal: principal || false
      }
    });

    res.status(201).json(endereco);
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/enderecos/:id
async function atualizarEndereco(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

    // Verificar ownership
    const endereco = await prisma.endereco.findFirst({
      where: { id, userId: req.userId }
    });
    if (!endereco) return res.status(404).json({ error: 'Endereco nao encontrado' });

    const { apelido, rua, numero, complemento, bairro, cidade, estado, cep, principal } = req.body;
    const data = {};

    if (apelido) data.apelido = sanitize(apelido);
    if (rua) data.rua = sanitize(rua);
    if (numero) data.numero = sanitize(numero);
    if (complemento !== undefined) data.complemento = complemento ? sanitize(complemento) : null;
    if (bairro) data.bairro = sanitize(bairro);
    if (cidade) data.cidade = sanitize(cidade);
    if (estado) data.estado = sanitize(estado);
    if (cep) data.cep = sanitize(cep).replace(/\D/g, '');

    if (principal) {
      await prisma.endereco.updateMany({
        where: { userId: req.userId },
        data: { principal: false }
      });
      data.principal = true;
    }

    const updated = await prisma.endereco.update({
      where: { id },
      data
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/enderecos/:id
async function excluirEndereco(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

    const endereco = await prisma.endereco.findFirst({
      where: { id, userId: req.userId }
    });
    if (!endereco) return res.status(404).json({ error: 'Endereco nao encontrado' });

    await prisma.endereco.delete({ where: { id } });
    res.json({ message: 'Endereco excluido' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registro, login, perfil, atualizarPerfil,
  listarEnderecos, criarEndereco, atualizarEndereco, excluirEndereco
};
