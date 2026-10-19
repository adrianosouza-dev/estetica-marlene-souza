/**
 * Mensagem de retorno para o usuário.
 * Erros usam role="alert" (o leitor de tela anuncia na hora);
 * os demais usam role="status" (anúncio educado, sem interromper).
 *
 * tipo: 'info' | 'sucesso' | 'erro'
 */
export function Aviso({ tipo = 'info', children }) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
