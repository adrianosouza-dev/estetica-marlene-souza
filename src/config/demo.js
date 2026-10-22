/*
 * Modo demonstração (site do portfólio).
 * Ligado só no projeto da Vercel de demonstração, com VITE_MODO_DEMO=true.
 * O e-mail e a senha de demonstração são públicos de propósito: aparecem na
 * tela de login para quem visita o portfólio. O banco da demonstração impede
 * enviar ou apagar fotos (migration 010) e é restaurado toda madrugada.
 */
export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true'

export const ACESSO_DEMO = {
  email: import.meta.env.VITE_DEMO_EMAIL ?? '',
  senha: import.meta.env.VITE_DEMO_SENHA ?? '',
}
