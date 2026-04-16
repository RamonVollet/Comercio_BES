# Painel Unico RBAC: Arquitetura + UX/UI para Minha Conta (/minha-conta)

## Contexto

Hoje o projeto possui interfaces separadas (`/admin` e `/painel`) e isso gera divergencia de experiencia, repeticao de componentes e aumento de manutencao. A proposta e consolidar tudo em uma unica entrada protegida (`/minha-conta`) com renderizacao dinamica por perfil.

Este documento define a base arquitetural para migracao para **Next.js + React (App Router)** com:

- RBAC (Role-Based Access Control)
- Shell unico de Minha Conta (Sidebar + Topbar + Content)
- Carregamento sob demanda por role (evitando bundle desnecessario)
- Integracao com padrao visual estabelecido em `docs/visual.md`

---

## Objetivo

Criar um **Painel Unico Baseado em Regras** onde:

1. A rota base e sempre `/minha-conta`
2. Menus e paginas mudam por role
3. Regras de acesso sao avaliadas no middleware e no servidor
4. O cliente final nao baixa codigo de Admin/Lojista que nao utiliza
5. O nome da pagina para todos os perfis e **Minha Conta**

---

## Perfis e Escopo Funcional

### `admin` (Master)

- Gestao global de usuarios
- Moderacao de lojas e catalogos
- Configuracoes de marketplace
- Logs e auditoria
- Integracoes de sistema

### `comerciante` (Tenant)

- Gestao da propria loja
- Produtos, variacoes e estoque
- Pedidos da propria loja
- Frete e regras de entrega da loja
- Recebiveis e extratos

### `cliente` (User)

- Historico de compras
- Rastreio de envio
- Pagamentos salvos
- Enderecos
- Devolucoes/solicitacoes

---

## Principios de Arquitetura

1. **Role-aware por default**
2. **Permission-first** (capability > if role solto no componente)
3. **Server-side guards** (nunca apenas client-side)
4. **Code splitting por dominio e role**
5. **Shell visual unica** para consistencia UX

---

## Matriz RBAC (Capacidades)

| Capability | admin | comerciante | cliente |
|-----------|:-----:|:-----------:|:-------:|
| `account.view` | ✅ | ✅ | ✅ |
| `users.manage` | ✅ | ❌ | ❌ |
| `stores.moderate` | ✅ | ❌ | ❌ |
| `stores.manage.own` | ❌ | ✅ | ❌ |
| `products.manage.own` | ❌ | ✅ | ❌ |
| `orders.view.global` | ✅ | ❌ | ❌ |
| `orders.view.ownStore` | ❌ | ✅ | ❌ |
| `orders.view.own` | ❌ | ❌ | ✅ |
| `shipping.manage.ownStore` | ❌ | ✅ | ❌ |
| `payouts.view.ownStore` | ❌ | ✅ | ❌ |
| `payments.manage.own` | ❌ | ❌ | ✅ |
| `addresses.manage.own` | ❌ | ❌ | ✅ |
| `returns.manage.own` | ❌ | ❌ | ✅ |
| `logs.read` | ✅ | ❌ | ❌ |
| `integrations.manage` | ✅ | ❌ | ❌ |

> Base atual compativel: o backend ja emite `tipo` no JWT (`admin`, `comerciante`, `cliente`).

---

## Arquitetura de Rotas (Next.js App Router)

### Regra principal

- Entrada unica protegida: `/minha-conta`
- Navegacao interna simples via `?secao=...` (ex.: `/minha-conta?secao=produtos`, `/minha-conta?secao=usuarios`, `/minha-conta?secao=pedidos`)
- Sem excesso de subrotas para manter operacao simples

### Estrutura sugerida

```txt
src/
  app/
    (public)/
      login/page.tsx
    (protected)/
      minha-conta/
        layout.tsx
        page.tsx
        loading.tsx
        error.tsx
```

### Por que sem `[[...slug]]`?

Projeto pequeno pede menor complexidade. Uma pagina protegida com secoes por permissao reduz manutencao, onboarding e chance de erro.

---

## Estrutura de Pastas (Features + RBAC)

```txt
src/
  modules/
    auth/
      session.ts
      jwt.ts
    rbac/
      roles.ts
      permissions.ts
      sections.ts
  features/
    minha-conta/
      shell/
        MinhaContaShell.tsx
        Sidebar.tsx
        Topbar.tsx
        ContentArea.tsx
      common/
        sections/
          InicioSection.tsx
      admin/
        sections/
          UsuariosSection.tsx
          ModeracaoLojasSection.tsx
          ConfiguracoesSection.tsx
          LogsSection.tsx
      merchant/
        sections/
          ProdutosSection.tsx
          EstoqueSection.tsx
          PedidosSection.tsx
          FreteSection.tsx
          RecebiveisSection.tsx
      customer/
        sections/
          HistoricoSection.tsx
          RastreioSection.tsx
          PagamentosSection.tsx
          EnderecosSection.tsx
          DevolucoesSection.tsx
middleware.ts
```

---

## Layout UX (Alinhado ao `visual.md`)

Shell padrao em todas as roles:

1. **Sidebar dinamica** por role (menu e secoes)
2. **Topbar unica** com perfil, contexto e acoes globais
3. **Content Area** para secao ativa

Padroes visuais (consistencia):

- Fundo principal neutro/off-white
- Verde como acento funcional (foco, CTA, status)
- Cards com sombra suave e borda leve
- Hierarquia tipografica clara
- Estados de foco/hover consistentes
- Responsivo: sidebar colapsa para drawer em mobile

Wireframe:

```txt
+-------------------------------------------------------------+
| Topbar: Minha Conta | busca | notificacoes | perfil        |
+---------+---------------------------------------------------+
| Sidebar | Content Area                                      |
| role    | - resumo                                           |
| aware   | - tabelas/listas por permissao                     |
| menu    | - empty/error/loading states padronizados          |
+---------+---------------------------------------------------+
```

---

## Middleware e Protecao de Rotas

### 1) Protecao de borda (`middleware.ts`)

Responsabilidades:

- Barrar anonimos em `/minha-conta/**`
- Validar JWT (preferencialmente em cookie httpOnly)
- Encaminhar role para request headers internos

Exemplo base:

```ts
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/modules/auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/minha-conta')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', String(payload.id));
  requestHeaders.set('x-user-role', payload.tipo);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ['/minha-conta/:path*']
};
```

### 2) Guarda no servidor (layout/page)

Mesmo com middleware, validar permissao no servidor antes de renderizar modulo.

```ts
// src/app/(protected)/minha-conta/page.tsx
import { notFound } from 'next/navigation';
import { getServerSession } from '@/modules/auth/session';
import { resolveSection } from '@/modules/rbac/sections';

export default async function MinhaContaPage({
  searchParams
}: {
  searchParams: { secao?: string };
}) {
  const session = await getServerSession();
  if (!session) notFound();

  const key = searchParams.secao || 'inicio';
  const section = resolveSection(key, session.user.role);
  if (!section) notFound();

  const module = await section.load();
  const Page = module.default;

  return <Page session={session} />;
}
```

---

## Registro de Secoes + Menus (Single Source of Truth)

```ts
// src/modules/rbac/sections.ts
import type { Role } from './roles';

type MinhaContaSection = {
  key: string;
  href: string;
  roles: Role[];
  label: string;
  icon: string;
  load: () => Promise<{ default: React.ComponentType<any> }>;
};

export const sections: MinhaContaSection[] = [
  {
    key: 'inicio',
    href: '/minha-conta',
    roles: ['admin', 'comerciante', 'cliente'],
    label: 'Minha Conta',
    icon: 'layout-dashboard',
    load: () => import('@/features/minha-conta/common/sections/InicioSection')
  },
  {
    key: 'usuarios',
    href: '/minha-conta?secao=usuarios',
    roles: ['admin'],
    label: 'Usuarios',
    icon: 'users',
    load: () => import('@/features/minha-conta/admin/sections/UsuariosSection')
  },
  {
    key: 'produtos',
    href: '/minha-conta?secao=produtos',
    roles: ['comerciante'],
    label: 'Produtos',
    icon: 'package',
    load: () => import('@/features/minha-conta/merchant/sections/ProdutosSection')
  },
  {
    key: 'pedidos',
    href: '/minha-conta?secao=pedidos',
    roles: ['cliente'],
    label: 'Meus Pedidos',
    icon: 'shopping-bag',
    load: () => import('@/features/minha-conta/customer/sections/HistoricoSection')
  }
];

export function resolveSection(key: string, role: Role) {
  return sections.find((s) => s.key === key && s.roles.includes(role));
}

export function getMenuByRole(role: Role) {
  return sections.filter((s) => s.roles.includes(role));
}
```

Vantagens:

- Menu e roteamento coerentes entre si
- Nao existe item navegavel sem permissao
- Menor chance de drift entre frontend e regra de negocio

---

## Estrategia para Evitar Codigo Desnecessario

1. **Section-level splitting** com App Router (cada secao em seu chunk)
2. **Imports dinamicos por role** (`section.load()`)
3. **RSC first** para telas de leitura pesada (menos JS no cliente)
4. **Client Components apenas no necessario** (filtros interativos, graficos, drag/drop)
5. **Nao serializar matriz completa de permissoes para browser**; enviar apenas menu autorizado

Resultado esperado:

- Cliente comum nao baixa modulos de administracao
- TTFB e interatividade melhores na Minha Conta do cliente

---

## Integracao com Backend Atual (Express + Prisma)

A base atual ja ajuda na migracao:

- `User.tipo` no Prisma ja cobre os 3 roles
- JWT ja inclui `tipo`
- Middleware backend ja possui `requireTipo(...)`

Ajustes recomendados:

1. Padronizar naming no frontend: `role` mapeado de `tipo`
2. Expor endpoint `/api/auth/me` com payload minimo de sessao
3. Garantir filtro de escopo para `comerciante` por `ownerId` em todos os endpoints sensiveis
4. Criar auditoria de acoes criticas de admin (logs)

---

## Plano de Migracao (Sem Big Bang)

### Fase 1 - Fundacao

- Criar shell unica `/minha-conta`
- Implementar middleware + session server
- Registrar secoes comuns (`inicio`, `perfil`, `configuracoes basicas`)

### Fase 2 - Modulos por role

- Migrar secoes de Admin para `features/minha-conta/admin`
- Migrar secoes de Lojista para `features/minha-conta/merchant`
- Criar area de Cliente em `features/minha-conta/customer`

### Fase 3 - Encerramento de legados

- `/admin` -> redirect 302 para `/minha-conta`
- `/painel` -> redirect 302 para `/minha-conta`
- Remover componentes duplicados e CSS legado nao utilizado

### Fase 4 - Hardening

- Observabilidade (eventos de acesso negado, latencia por role)
- Testes E2E RBAC por perfil
- Revisao de acessibilidade e responsividade final

---

## Criterios de Aceite

1. Usuario `admin` ve menu e modulos de sistema global
2. Usuario `comerciante` nao consegue acessar rotas de admin por URL direta
3. Usuario `cliente` nao baixa chunk de modulos admin/merchant
4. Sidebar e Topbar mantem consistencia visual conforme `visual.md`
5. Todas as telas de `/minha-conta` exigem sessao valida
6. Acoes sensiveis continuam validadas no backend (nao apenas frontend)

---

## Perguntas de Esclarecimento (antes do codigo base)

1. O token de acesso no novo frontend ficara em **cookie httpOnly** ou continuaremos com header Bearer no cliente?
2. Um `comerciante` podera gerenciar **mais de uma loja** (1:N) no primeiro release do painel unico?
3. O modulo de recebiveis deve consumir qual fonte inicial: dados internos (`Pedido`/`Pagamento`) ou integracao externa (gateway/ERP)?
4. O cliente final tera suporte a devolucao completa com status e SLA, ou apenas abertura de solicitacao no MVP?
5. Vamos manter `/admin` e `/painel` por um periodo de convivencia (feature flag) ou cortar diretamente apos homologacao?

---

## Resumo Executivo

A proposta elimina dashboards paralelas e estabelece um unico ponto de entrada (`/minha-conta`) com RBAC real no fluxo completo (middleware + servidor + backend), sem burocracia desnecessaria para a realidade de uma cidade pequena. O design permanece coeso com as diretrizes visuais atuais, enquanto a estrutura de codigo reduz custo de manutencao e evita transferir bundles de modulos nao usados para perfis comuns.