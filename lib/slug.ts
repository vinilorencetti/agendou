// Converte um nome qualquer em slug URL-safe
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')    // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')            // espaços → hífens
    .replace(/-+/g, '-')             // hífens duplos → simples
    .slice(0, 60)
}

// Slugs reservados que não podem ser usados por tenants
export const RESERVED_SLUGS = new Set([
  'admin',
  'entrar',
  'cadastro',
  'onboarding',
  'auth',
  'api',
  'suporte',
  'contato',
  'termos',
  'privacidade',
  'pricing',
  'planos',
])

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  )
}
