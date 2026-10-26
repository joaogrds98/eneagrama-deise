import { getProfile } from './profiles'
import { getResultVisualData, typeColors } from './resultVisuals'
import type { ScoreResult } from './types'

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * Math.PI / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function slicePath(cx: number, cy: number, radius: number, start: number, end: number) {
  const first = polar(cx, cy, radius, end)
  const last = polar(cx, cy, radius, start)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${first.x} ${first.y} A ${radius} ${radius} 0 ${largeArc} 0 ${last.x} ${last.y} Z`
}

export function ResultVisualizations({ result }: { result: ScoreResult }) {
  const visual = getResultVisualData(result, type => getProfile(type).name)
  const leaders = new Set(result.leaders)
  let currentAngle = 0

  return (
    <div className="result-visualizations">
      <section className="result-visual-card result-table-card" aria-labelledby="result-table-title">
        <h2 id="result-table-title">Tipos e centros de inteligência</h2>
        <div className="result-table-scroll">
          <table className="result-type-table">
            <thead><tr><th scope="col">Tipo psicológico</th><th scope="col">Nome</th><th scope="col">Centro de Inteligência</th><th scope="col">Representatividade</th></tr></thead>
            {visual.centers.map(center => (
              <tbody key={center.id} className={`center-group center-${center.id}`}>
                {center.types.map((type, index) => {
                  const row = visual.rows.find(item => item.type === type)!
                  return <tr key={type}>
                    <th scope="row"><span className="table-type-dot" style={{ backgroundColor: typeColors[type] }} />Tipo {type}</th>
                    <td><span className="table-type-name">{row.name}</span></td>
                    {index === 0 && <td className="center-cell" rowSpan={3}><span className="center-color-dot" />{center.name}</td>}
                    {index === 0 && <td className="center-share-cell" rowSpan={3}>{center.percentage}%</td>}
                  </tr>
                })}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section className="result-visual-card result-bars-card" aria-labelledby="result-bars-title">
        <div className="result-visual-heading"><h2 id="result-bars-title">Representatividade dos tipos</h2><p>Pontuação direta por tipo · escala de 0 a 75</p></div>
        <div className="result-chart-scroll">
          <svg className="type-bar-chart" viewBox="0 0 900 390" role="img" aria-labelledby="bars-svg-title bars-svg-desc">
            <title id="bars-svg-title">Pontuação dos nove tipos do Eneagrama</title>
            <desc id="bars-svg-desc">Gráfico de barras verticais na ordem {visual.rows.map(row => `tipo ${row.type}`).join(', ')}. Os valores indicam somas de respostas entre 15 e 75 pontos.</desc>
            {[0, 15, 30, 45, 60, 75].map(tick => {
              const y = 315 - (tick / 75) * 250
              return <g key={tick}><line x1="66" x2="880" y1={y} y2={y} stroke="#e3e6e8" strokeWidth="1" /><text x="52" y={y + 4} textAnchor="end" className="chart-axis-label">{tick}</text></g>
            })}
            {visual.rows.map((row, index) => {
              const slot = 814 / 9
              const x = 66 + index * slot + 12
              const barWidth = slot - 24
              const barHeight = row.raw / 75 * 250
              const y = 315 - barHeight
              return <g key={row.type}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="2" fill={typeColors[row.type]} stroke={leaders.has(row.type) ? '#c99a4a' : 'none'} strokeWidth={leaders.has(row.type) ? 3 : 0} />
                <text x={x + barWidth / 2} y={y - 9} textAnchor="middle" className="chart-value">{row.raw}</text>
                <text x={x + barWidth / 2} y="340" textAnchor="middle" className="chart-type-label">Tipo {row.type}</text>
              </g>
            })}
            <line x1="66" x2="880" y1="315" y2="315" stroke="#9ca5ad" strokeWidth="1" />
          </svg>
        </div>
      </section>

      <section className="result-visual-card result-centers-card" aria-labelledby="result-centers-title">
        <div className="result-visual-heading"><h2 id="result-centers-title">Centros de inteligência</h2><p>Participação das somas por centro</p></div>
        <div className="centers-chart-layout">
          <svg className="center-pie-chart" viewBox="0 0 300 300" role="img" aria-labelledby="pie-svg-title pie-svg-desc">
            <title id="pie-svg-title">Distribuição das pontuações pelos centros de inteligência</title>
            <desc id="pie-svg-desc">{visual.centers.map(center => `${center.name}: ${center.percentage}%`).join('. ')}.</desc>
            {visual.centers.map(center => {
              const start = currentAngle
              const extent = center.raw / (visual.total || 1) * 360
              const end = start + extent
              const middle = start + extent / 2
              currentAngle = end
              const label = polar(150, 150, 89, middle)
              return <g key={center.id}>
                <path d={slicePath(150, 150, 125, start, end)} fill={center.color} stroke="#fff" strokeWidth="2" />
                <text x={label.x} y={label.y + 5} textAnchor="middle" className="pie-percent-label">{center.percentage}%</text>
              </g>
            })}
          </svg>
          <ul className="center-legend" aria-label="Legenda dos centros">
            {visual.centers.map(center => <li key={center.id}><span style={{ backgroundColor: center.color }} /><span>{center.name}</span><strong>{center.percentage}%</strong></li>)}
          </ul>
        </div>
        <p className="center-share-note">Percentuais inteiros, calculados sobre as somas dos centros e ajustados para totalizar 100%; não representam probabilidade de personalidade.</p>
      </section>
    </div>
  )
}
