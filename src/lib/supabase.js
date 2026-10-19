import { createClient } from '@supabase/supabase-js'

/*
 * Cliente único do Supabase para o app inteiro.
 * As chaves vêm do arquivo .env.local (veja .env.example) e nunca ficam no código.
 * A chave "anon" é pública por natureza: quem protege os dados são as regras de
 * Row Level Security no banco.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const chaveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && chaveAnon)

if (!supabaseConfigurado) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram definidas. ' +
      'Copie .env.example para .env.local e preencha. O site abre, mas sem dados do banco.',
  )
}

export const supabase = supabaseConfigurado ? createClient(url, chaveAnon) : null
