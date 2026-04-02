// ===========================================
// Sanitizacao de inputs — compartilhado
// Usa a biblioteca xss para remover payloads
// maliciosos de forma abrangente (inclui
// javascript: em atributos, event handlers, etc)
// ===========================================
const xss = require('xss');

const options = {
  whiteList: {}, // sem tags permitidas — remove tudo
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

function sanitize(str) {
  if (str === null || str === undefined) return str;
  return xss(String(str), options).trim();
}

module.exports = sanitize;
