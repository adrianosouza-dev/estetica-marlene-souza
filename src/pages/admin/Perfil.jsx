import { useState } from 'react'
import { EnviarFoto } from '../../components/painel/EnviarFoto'
import { Aviso } from '../../components/ui/Aviso'
import { Campo } from '../../components/ui/Campo'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { Modal } from '../../components/ui/Modal'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarPerfilAdmin, salvarPerfil, trocarFotoPerfil } from '../../lib/consultasCadastros'
import { limparInstagram, linkValido, whatsappDoPerfil, whatsappParaPerfil } from '../../lib/edicao'
import { mascararTelefone } from '../../lib/formatadores'

/** Formulário com os dados atuais do perfil */
function FormPerfil({ perfil, executar, ocupado, aoSalvar }) {
  const [dados, setDados] = useState({
    sobre: perfil.sobre ?? '',
    telefone: mascararTelefone(whatsappDoPerfil(perfil.whatsapp)),
    instagram: perfil.instagram ? `@${perfil.instagram}` : '',
    endereco: perfil.endereco ?? '',
    link_mapa: perfil.link_mapa ?? '',
  })
  const [erros, setErros] = useState({})

  const alterar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const digitos = dados.telefone.replace(/\D/g, '')
    const encontrados = {}
    if (digitos && digitos.length < 10) encontrados.telefone = 'Digite o WhatsApp com DDD, ou deixe em branco.'
    if (!linkValido(dados.link_mapa)) encontrados.link_mapa = 'Cole o link completo do mapa (começa com https://), ou deixe em branco.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    const ok = await executar(
      () =>
        salvarPerfil({
          sobre: dados.sobre.trim() || null,
          whatsapp: whatsappParaPerfil(dados.telefone),
          instagram: limparInstagram(dados.instagram) || null,
          endereco: dados.endereco.trim() || null,
          link_mapa: dados.link_mapa.trim() || null,
        }),
      'Perfil salvo. O site já mostra os dados novos.',
    )
    if (ok) aoSalvar()
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <Campo
        rotulo="Texto do Sobre"
        dica="Deixe uma linha em branco para começar outro parágrafo."
        multilinha
        rows={8}
        maxLength={3000}
        value={dados.sobre}
        onChange={(e) => alterar('sobre', e.target.value)}
      />
      <Campo
        rotulo="WhatsApp"
        dica="As clientes falam com você por este número."
        type="tel"
        inputMode="numeric"
        placeholder="(92) 99123-4567"
        value={dados.telefone}
        onChange={(e) => alterar('telefone', mascararTelefone(e.target.value))}
        erro={erros.telefone}
      />
      <Campo
        rotulo="Instagram"
        opcional
        dica="O @ ou o link do perfil."
        value={dados.instagram}
        onChange={(e) => alterar('instagram', e.target.value)}
        autoCapitalize="none"
      />
      <Campo rotulo="Endereço" maxLength={200} value={dados.endereco} onChange={(e) => alterar('endereco', e.target.value)} />
      <Campo
        rotulo="Link do mapa"
        opcional
        dica="Cole o link de compartilhar do Google Maps. Vazio: o site procura o endereço no mapa."
        type="url"
        inputMode="url"
        value={dados.link_mapa}
        onChange={(e) => alterar('link_mapa', e.target.value)}
        erro={erros.link_mapa}
      />
      <div>
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </div>
    </form>
  )
}

/** Perfil: texto do Sobre, contato e foto */
export default function Perfil() {
  useTituloPagina('Perfil')
  const perfil = useConsulta(buscarPerfilAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()
  const [trocandoFoto, setTrocandoFoto] = useState(false)

  return (
    <section className="container pagina painel">
      <h1>Perfil</h1>
      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta carregando={perfil.carregando && !perfil.dados} erro={perfil.erro}>
        {perfil.dados && (
          <>
            <section className="painel__bloco perfil-foto" aria-labelledby="titulo-foto">
              <h2 id="titulo-foto">Foto da página Sobre</h2>
              {perfil.dados.foto_url ? (
                <img className="perfil-foto__imagem" src={perfil.dados.foto_url} alt="Foto atual da página Sobre" />
              ) : (
                <p className="texto-suave">Nenhuma foto ainda.</p>
              )}
              <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => setTrocandoFoto(true)}>
                {perfil.dados.foto_url ? 'Trocar foto' : 'Enviar foto'}
              </button>
            </section>

            <section className="painel__bloco" aria-labelledby="titulo-dados">
              <h2 id="titulo-dados">Sobre e contato</h2>
              {/* key: ao recarregar, o formulário recomeça com os dados salvos */}
              <FormPerfil
                key={perfil.dados.atualizado_em}
                perfil={perfil.dados}
                executar={executar}
                ocupado={ocupado}
                aoSalvar={perfil.recarregar}
              />
            </section>
          </>
        )}
      </EstadoConsulta>

      <Modal aberto={trocandoFoto} titulo="Foto da página Sobre" aoFechar={() => setTrocandoFoto(false)}>
        <EnviarFoto
          comLegenda={false}
          rotuloEnviar="Usar esta foto"
          enviar={(foto) => trocarFotoPerfil(foto, perfil.dados?.foto_caminho_storage)}
          aoCancelar={() => setTrocandoFoto(false)}
          aoEnviar={() => {
            setTrocandoFoto(false)
            avisar('Foto trocada. A página Sobre já mostra a nova foto.')
            perfil.recarregar()
          }}
        />
      </Modal>
    </section>
  )
}
