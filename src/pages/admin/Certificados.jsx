import { useState } from 'react'
import { FormCertificado } from '../../components/painel/FormCertificado'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { Modal } from '../../components/ui/Modal'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarCertificadosAdmin, removerCertificado, trocarOrdem } from '../../lib/consultasCadastros'

/** Certificados e cursos: cadastrar, editar, ordenar e remover (aparecem na página Sobre) */
export default function Certificados() {
  useTituloPagina('Certificados')
  const certificados = useConsulta(buscarCertificadosAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()
  const [editando, setEditando] = useState(null) // null | 'novo' | certificado
  const [removendo, setRemovendo] = useState(null)

  const lista = certificados.dados ?? []
  const proximaOrdem = Math.max(0, ...lista.map((c) => c.ordem)) + 1

  async function mover(indice, direcao) {
    const ok = await executar(() => trocarOrdem('certificados', lista[indice], lista[indice + direcao]))
    if (ok) certificados.recarregar()
  }

  async function confirmarRemocao() {
    const c = removendo
    setRemovendo(null)
    const ok = await executar(() => removerCertificado(c), 'Certificado removido.')
    if (ok) certificados.recarregar()
  }

  return (
    <section className="container pagina painel">
      <div className="painel__topo">
        <h1>Certificados</h1>
        <button type="button" className="botao botao--primario botao--pequeno" onClick={() => setEditando('novo')}>
          Novo certificado
        </button>
      </div>
      <p className="texto-suave painel__explicacao">
        Aparecem na página "Sobre" do site, nesta ordem. Sem nenhum certificado, a seção não aparece.
      </p>

      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta
        carregando={certificados.carregando && !certificados.dados}
        erro={certificados.erro}
        vazio={!lista.length}
        mensagemVazio="Nenhum certificado ainda. Cadastre o primeiro!"
      >
        <ul className="cadastro" role="list">
          {lista.map((c, i) => (
            <li key={c.id} className={`cadastro__item ${c.imagem_url ? 'certificado-item' : ''}`}>
              {c.imagem_url && (
                <img className="certificado-item__imagem" src={c.imagem_url} alt="" width="96" height="72" loading="lazy" />
              )}
              <div className="cadastro__info">
                <p className="cadastro__titulo">{c.titulo}</p>
                <p className="cadastro__detalhe">
                  {c.instituicao}
                  {c.ano ? ` · ${c.ano}` : ''}
                  {!c.imagem_url && ' · sem imagem'}
                </p>
              </div>
              <div className="cadastro__acoes">
                <button type="button" className="botao-acao" onClick={() => setEditando(c)} disabled={ocupado}>
                  Editar<span className="sr-only"> {c.titulo}</span>
                </button>
                <span className="cadastro__ordem">
                  <button type="button" className="botao-acao botao-acao--icone" onClick={() => mover(i, -1)} disabled={ocupado || i === 0}>
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">Subir {c.titulo}</span>
                  </button>
                  <button
                    type="button"
                    className="botao-acao botao-acao--icone"
                    onClick={() => mover(i, 1)}
                    disabled={ocupado || i === lista.length - 1}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">Descer {c.titulo}</span>
                  </button>
                </span>
                <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(c)} disabled={ocupado}>
                  Remover<span className="sr-only"> {c.titulo}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Modal
        aberto={Boolean(editando)}
        titulo={editando === 'novo' ? 'Novo certificado' : 'Editar certificado'}
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormCertificado
            certificado={editando === 'novo' ? null : editando}
            proximaOrdem={proximaOrdem}
            aoCancelar={() => setEditando(null)}
            aoSalvar={() => {
              setEditando(null)
              avisar('Certificado salvo. A página Sobre já mostra a mudança.')
              certificados.recarregar()
            }}
          />
        )}
      </Modal>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Remover certificado?"
        rotuloConfirmar="Remover certificado"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        <p>
          "{removendo?.titulo}" sai da página Sobre
          {removendo?.imagem_url ? ' e a imagem é apagada' : ''}. Não dá para desfazer.
        </p>
      </JanelaConfirmacao>
    </section>
  )
}
