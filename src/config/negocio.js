/*
 * Dados fixos do negócio.
 * Servem de valor padrão enquanto a tabela "perfil" do Supabase não estiver pronta.
 * Depois, o que a Marlene editar no painel tem prioridade sobre estes valores.
 */
export const negocio = {
  nome: 'Marlene Souza',
  especialidade: 'Unhas e sobrancelhas',

  endereco: {
    bairro: 'Donga Micheles', // CONFIRMAR: grafia do bairro
    cidade: 'Maués',
    estado: 'AM',
  },

  // Só números, com código do país (55) e DDD. Ex.: '5592991234567'
  whatsapp: '', // CONFIRMAR: número da Marlene

  // Deixe vazio enquanto não existir; o link some do site automaticamente
  instagram: '',

  horarioResumo: 'Segunda a sábado, das 8h às 17h',
}

export function enderecoCompleto() {
  const { bairro, cidade, estado } = negocio.endereco
  return `Bairro ${bairro}, ${cidade}-${estado}`
}
