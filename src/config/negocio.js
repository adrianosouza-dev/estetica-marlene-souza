/*
 * Dados fixos do negócio.
 * Endereço, WhatsApp, Instagram, texto do Sobre e horários vêm da tabela "perfil"
 * e "horarios_funcionamento" do Supabase (editáveis no painel). Os valores daqui
 * são a reserva para quando o banco estiver vazio ou fora do ar.
 */
export const negocio = {
  nome: 'Marlene Souza',
  especialidade: 'Unhas e sobrancelhas',

  // Página inicial
  frase: 'Seu momento de cuidado, com hora marcada',
  descricao:
    'Manicure, pedicure e design de sobrancelhas com a Marlene Souza, em Maués. ' +
    'Escolha o serviço, veja os horários livres e agende pelo celular.',

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
