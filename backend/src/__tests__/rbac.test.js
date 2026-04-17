const { getCapabilities, ROLE_CAPABILITIES } = require('../rbac/capabilities');
const { requireCapability } = require('../middleware/auth');

describe('RBAC Capabilities', () => {
    test('Deve retornar capabilities corretas para admin', () => {
        const caps = getCapabilities('admin');
        expect(caps).toContain('users.manage');
        expect(caps).toContain('account.view');
    });

    test('Deve retornar array vazio para tipo desconhecido', () => {
        const caps = getCapabilities('unknown');
        expect(caps).toEqual([]);
    });

    test('ROLE_CAPABILITIES não deve ter mutação exposta que aponte falha', () => {
        expect(ROLE_CAPABILITIES.cliente).toBeDefined();
        expect(ROLE_CAPABILITIES.comerciante).toBeDefined();
    });
});

describe('Middleware requireCapability', () => {
    let req, res, next;

    beforeEach(() => {
        req = { userTipo: 'cliente', userId: 1, path: '/api/test' };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        // Espiar console.warn para não sujar o log de teste (e testar se chamou)
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Deve chamar next() se usuario possui a capability requerida', () => {
        const middleware = requireCapability('account.view');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('Deve retornar 403 e logar se usuario NÃO possui a capability requerida', () => {
        const middleware = requireCapability('users.manage'); // admin only
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Acesso negado', required: 'users.manage' });
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[RBAC] 403 capability denied'));
    });
});
