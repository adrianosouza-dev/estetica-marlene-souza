/*
 * Redes sociais do perfil (Instagram, TikTok e Facebook).
 * O banco guarda só o usuário; aqui ele vira o link e o texto mostrado no site.
 * Rede vazia não entra na lista: o ícone some do rodapé e do Contato.
 */

const REDES = [
  { rede: 'instagram', nome: 'Instagram', link: (u) => `https://www.instagram.com/${u}` },
  { rede: 'tiktok', nome: 'TikTok', link: (u) => `https://www.tiktok.com/@${u}` },
  { rede: 'facebook', nome: 'Facebook', link: (u) => `https://www.facebook.com/${u}` },
]

/** { instagram, tiktok, facebook } → [{ rede, nome, link, usuario }], só as preenchidas */
export function redesDoPerfil(perfil) {
  return REDES.filter(({ rede }) => perfil?.[rede]).map(({ rede, nome, link }) => {
    const valor = perfil[rede]
    return {
      rede,
      nome,
      link: link(valor),
      // 'profile.php?id=123' não é um nome para mostrar: nesse caso, só "Facebook"
      usuario: valor.startsWith('profile.php') ? null : `@${valor}`,
    }
  })
}
