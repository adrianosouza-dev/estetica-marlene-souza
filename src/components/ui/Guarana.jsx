/*
 * Ilustração de um cacho de guaraná, símbolo de Maués.
 * Cada fruto é uma cápsula vermelha que se abre e mostra a semente escura
 * envolvida pela polpa branca, o "olho" do guaraná.
 * É decorativa (aria-hidden): não traz informação para o leitor de tela.
 */

const COR = {
  casca: 'var(--cor-destaque)',
  bordaAberta: '#8f1426',
  polpa: '#fffdfb',
  semente: 'var(--cor-semente)',
  galho: 'var(--cor-texto)',
  folha: 'var(--cor-sucesso)',
}

// Posição, tamanho e inclinação de cada fruto do cacho (de trás para a frente)
const FRUTOS = [
  { x: 136, y: 128, escala: 0.4, giro: -12 },
  { x: 232, y: 122, escala: 0.38, giro: 10 },
  { x: 86, y: 214, escala: 0.4, giro: -18 },
  { x: 186, y: 206, escala: 0.44, giro: 3 },
  { x: 284, y: 210, escala: 0.39, giro: 16 },
  { x: 138, y: 298, escala: 0.42, giro: -8 },
  { x: 236, y: 296, escala: 0.4, giro: 12 },
  { x: 188, y: 372, escala: 0.36, giro: 4 },
]

/** Um fruto aberto, desenhado em volta do ponto (0, 0) */
function Fruto({ x, y, escala, giro }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
      {/* Casca: gota com a ponta para baixo */}
      <path
        d="M0 -104C58 -104 98 -60 98 0C98 64 52 112 0 124C-52 112 -98 64 -98 0C-98 -60 -58 -104 0 -104Z"
        fill={COR.casca}
      />
      {/* Borda da casca que se abriu */}
      <ellipse cx="0" cy="-16" rx="70" ry="76" fill={COR.bordaAberta} />
      {/* Polpa branca, mais visível embaixo da semente */}
      <ellipse cx="0" cy="-12" rx="60" ry="66" fill={COR.polpa} />
      {/* Semente e brilho */}
      <circle cx="0" cy="-24" r="45" fill={COR.semente} />
      <ellipse cx="-15" cy="-40" rx="11" ry="8" fill={COR.polpa} opacity="0.7" />
    </g>
  )
}

function Folha({ x, y, giro, escala = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
      <path d="M0 0C22 -38 70 -54 116 -40C86 -8 42 8 0 0Z" fill={COR.folha} />
      <path d="M4 -2C40 -18 76 -30 108 -38" stroke={COR.polpa} strokeWidth="2" opacity="0.35" fill="none" />
    </g>
  )
}

export function Guarana({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 370 420"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Folha x={176} y={34} giro={-160} escala={0.95} />
      <Folha x={196} y={30} giro={-24} escala={1.05} />

      {/* Haste principal e as hastes de cada fruto, que ficam atrás deles */}
      <g stroke={COR.galho} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M188 8C186 60 186 200 188 340" />
        {FRUTOS.map(({ x, y, escala }) => (
          <path key={`${x}-${y}`} d={`M187 ${y - 70}Q${(x + 187) / 2} ${y - 72} ${x} ${y - 40 * escala - 26}`} />
        ))}
      </g>

      {FRUTOS.map((fruto) => (
        <Fruto key={`${fruto.x}-${fruto.y}`} {...fruto} />
      ))}
    </svg>
  )
}
