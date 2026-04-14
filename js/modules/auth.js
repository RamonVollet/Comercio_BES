// ===== COMÉRCIO BES — AUTH MODULE =====
// Gerencia sessão, login, registro e logout.

import { API_BASE } from '../config.js';
import { KEYS } from '../config.js';
import { storageGet, storageSet } from './utils.js';
import { state } from './state.js';

export const Auth = {
  getSession() { return storageGet(KEYS.SESSION); },

  getToken() { return storageGet(KEYS.API_TOKEN); },

  isLoggedIn() { return !!this.getSession(); },

  getUser() { return this.getSession(); },

  async register(nome, email, tel, senha, tipo, _dadosLoja) {
    if (state.apiDisponivel) {
      try {
        const body = { nome, email, senha, telefone: tel || undefined };
        body.tipo = tipo === 'lojista' ? 'comerciante' : 'cliente';

        const res = await fetch(API_BASE + '/auth/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, msg: data.error || 'Erro ao criar conta.' };

        storageSet(KEYS.API_TOKEN, data.token);
        storageSet(KEYS.SESSION, {
          userId: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          tipo: data.user.tipo,
          fromApi: true
        });
        return { ok: true, user: data.user };
      } catch (err) {
        console.warn('[Auth] API register falhou:', err.message);
      }
    }
    return { ok: false, msg: 'Serviço indisponível. Verifique sua conexão e tente novamente.' };
  },

  async login(email, senha) {
    if (state.apiDisponivel) {
      try {
        const res = await fetch(API_BASE + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, msg: data.error || 'E-mail ou senha incorretos.' };

        storageSet(KEYS.API_TOKEN, data.token);
        storageSet(KEYS.SESSION, {
          userId: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          tipo: data.user.tipo,
          fromApi: true
        });
        return { ok: true, user: data.user };
      } catch (err) {
        console.warn('[Auth] API login falhou:', err.message);
      }
    }
    return { ok: false, msg: 'Serviço indisponível. Verifique sua conexão e tente novamente.' };
  },

  logout() {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.API_TOKEN);
  }
};
