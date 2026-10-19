import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, TransitionEvent } from 'react'
import { ArrowRight, LockKeyhole, MoveUpRight } from 'lucide-react'
import { profiles } from '../enneagram/profiles'
import { angleDelta, rotationForType, snapRotation, typeForRotation } from './atlasRotation'
import './landing.css'

const typeDescriptions = [
  'O cuidado com o que pode ser melhor.',
  'A presença que aproxima e acolhe.',
  'A energia de transformar intenção em ação.',
  'O valor de reconhecer a própria singularidade.',
  'O espaço para observar e descobrir.',
  'A busca por vínculos e caminhos seguros.',
  'A curiosidade pelo que ainda pode ser.',
  'A força para se posicionar no mundo.',
  'A abertura para diferentes pontos de vista.',
]
const points = profiles.map((_, index) => {
  const angle = (-50 + index * 40) * Math.PI / 180
  return { x: 260 + Math.cos(angle) * 201, y: 260 + Math.sin(angle) * 201 }
})
const sequence = [0, 3, 1, 7, 4, 6, 0]
const polygon = (indices: number[]) => indices.map(index => `${points[index].x},${points[index].y}`).join(' ')

const AUTO_ROTATION_INTERVAL = 6_000
const MANUAL_IDLE_DELAY = 10_000

function PersonalityAtlas({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  const centerFadeId = useId()
  const [rotation, setRotation] = useState(-active * 40)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible')
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [autoAnimating, setAutoAnimating] = useState(false)
  const [interactionRevision, setInteractionRevision] = useState(0)
  const rotationRef = useRef(rotation)
  const selectedRef = useRef(active)
  const lastInteractionAt = useRef(Date.now())
  const figure = useRef<HTMLElement | null>(null)
  const orbit = useRef<HTMLDivElement | null>(null)
  const gesture = useRef<{
    id: number; x: number; y: number; centerX: number; centerY: number; width: number
    mode: 'angular' | 'horizontal'; lastAngle: number | null; lastX: number; moved: boolean
  } | null>(null)
  const suppressClick = useRef(false)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const profile = profiles[active]

  function rotate(value: number) {
    rotationRef.current = value
    setRotation(value)
  }
  function noteInteraction() {
    lastInteractionAt.current = Date.now()
    setAutoAnimating(false)
    setInteractionRevision(revision => revision + 1)
  }
  function publishSelection(index: number) {
    if (selectedRef.current === index) return
    selectedRef.current = index
    onSelect(index)
  }
  function displayedRotation() {
    if (!orbit.current) return rotationRef.current
    const matrix = new DOMMatrixReadOnly(getComputedStyle(orbit.current).transform)
    const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
    return rotationRef.current + angleDelta(rotationRef.current, angle)
  }
  function select(index: number) {
    noteInteraction()
    rotate(rotationForType(index, displayedRotation()))
    publishSelection(index)
  }

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setReducedMotion(motionPreference.matches)
    const syncPageVisibility = () => setPageVisible(document.visibilityState === 'visible')
    motionPreference.addEventListener('change', syncMotionPreference)
    document.addEventListener('visibilitychange', syncPageVisibility)

    const element = figure.current
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return () => {
        motionPreference.removeEventListener('change', syncMotionPreference)
        document.removeEventListener('visibilitychange', syncPageVisibility)
      }
    }

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .15 })
    if (element) observer.observe(element)
    return () => {
      motionPreference.removeEventListener('change', syncMotionPreference)
      document.removeEventListener('visibilitychange', syncPageVisibility)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (hovered || dragging || !pageVisible || !inView || reducedMotion) {
      setAutoAnimating(false)
      return
    }

    const idleRemaining = Math.max(0, lastInteractionAt.current + MANUAL_IDLE_DELAY - Date.now())
    const timer = window.setTimeout(() => {
      const next = (selectedRef.current + 1) % profiles.length
      setAutoAnimating(true)
      rotate(rotationForType(next, displayedRotation()))
      publishSelection(next)
    }, Math.max(AUTO_ROTATION_INTERVAL, idleRemaining))

    return () => window.clearTimeout(timer)
  }, [active, dragging, hovered, inView, interactionRevision, pageVisible, reducedMotion])

  // A selection in the type directory uses the same fixed focus position.
  useEffect(() => {
    if (gesture.current || selectedRef.current === active) return
    selectedRef.current = active
    const next = rotationForType(active, rotationRef.current)
    rotationRef.current = next
    setRotation(next)
  }, [active])

  function down(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    noteInteraction()
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = event.clientX - centerX
    const y = event.clientY - centerY
    gesture.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY, centerX, centerY, width: rect.width,
      mode: Math.hypot(x, y) < rect.width * .2 ? 'horizontal' : 'angular',
      lastAngle: Math.atan2(y, x) * 180 / Math.PI, lastX: event.clientX, moved: false,
    }
    suppressClick.current = false
    rotate(displayedRotation())
    setDragging(true)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current
    if (!start || start.id !== event.pointerId) return
    if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) {
      start.moved = true
      suppressClick.current = true
      if (event.type === 'pointermove') event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (!start.moved) return
    let delta = 0
    if (start.mode === 'horizontal') {
      delta = (event.clientX - start.lastX) / start.width * 180
      start.lastX = event.clientX
    } else {
      const x = event.clientX - start.centerX
      const y = event.clientY - start.centerY
      // Crossing the exact center has no reliable polar angle. Resume on re-entry.
      if (Math.hypot(x, y) < start.width * .06) { start.lastAngle = null; return }
      const angle = Math.atan2(y, x) * 180 / Math.PI
      if (start.lastAngle !== null) delta = angleDelta(start.lastAngle, angle)
      start.lastAngle = angle
    }
    const next = rotationRef.current + delta
    rotate(next)
    publishSelection(typeForRotation(next))
  }
  function settle() {
    const moved = gesture.current?.moved
    gesture.current = null
    setDragging(false)
    noteInteraction()
    if (moved) {
      const next = snapRotation(rotationRef.current)
      rotate(next)
      publishSelection(typeForRotation(next))
    } else {
      rotate(rotationForType(selectedRef.current, rotationRef.current))
    }
    window.setTimeout(() => { suppressClick.current = false }, 0)
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return
    move(event)
    settle()
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!delta && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 8 : (active + delta + 9) % 9
    select(next)
    buttons.current[next]?.focus({ preventScroll: true })
  }

  function pointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    noteInteraction()
    setHovered(true)
  }

  function pointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    noteInteraction()
    setHovered(false)
  }

  function finishAutoTransition(event: TransitionEvent<HTMLDivElement>) {
    if (event.target === orbit.current && event.propertyName === 'transform') setAutoAnimating(false)
  }

  return <figure ref={figure} className="atlas" id="personality-atlas" aria-label="Mapa interativo dos nove tipos do Eneagrama">
    <div role="group" aria-label="Selecionar uma perspectiva" aria-describedby="atlas-help" className={`atlas-dial${dragging ? ' is-dragging' : ''}${autoAnimating ? ' is-auto-animating' : ''}`} style={{ '--dial-rotation': `${rotation}deg` } as CSSProperties} onPointerEnter={pointerEnter} onPointerLeave={pointerLeave} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={event => { if (gesture.current?.id === event.pointerId) settle() }} onLostPointerCapture={event => { if (gesture.current?.id === event.pointerId) settle() }} onKeyDown={keyboard} onTransitionEnd={finishAutoTransition}>
      <div className="atlas-orbit" ref={orbit}>
        <svg viewBox="0 0 520 520" aria-hidden="true" className="atlas-lines">
          <defs>
            <radialGradient id={`${centerFadeId}-gradient`} gradientUnits="userSpaceOnUse" cx="260" cy="260" r="186">
              <stop offset="0%" stopColor="#000" />
              <stop offset="58%" stopColor="#000" />
              <stop offset="72%" stopColor="#3f3f3f" />
              <stop offset="86%" stopColor="#b3b3b3" />
              <stop offset="100%" stopColor="#fff" />
            </radialGradient>
            <mask id={`${centerFadeId}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="520" height="520">
              <rect width="520" height="520" fill={`url(#${centerFadeId}-gradient)`} />
            </mask>
          </defs>
          <circle className="atlas-outer" cx="260" cy="260" r="226" />
          {Array.from({ length: 72 }, (_, index) => {
            const angle = index * 5 * Math.PI / 180
            const radius = index % 8 === 0 ? 216 : 221
            return <line key={index} className="atlas-tick" x1={260 + Math.cos(angle) * radius} y1={260 + Math.sin(angle) * radius} x2={260 + Math.cos(angle) * 226} y2={260 + Math.sin(angle) * 226} />
          })}
          <circle className="atlas-circle" cx="260" cy="260" r="201" />
          <g mask={`url(#${centerFadeId}-mask)`}>
            <polyline className="atlas-connection" points={polygon(sequence)} />
            <polygon className="atlas-connection" points={polygon([2, 5, 8])} />
            <line className="atlas-ray" x1="260" y1="260" x2={points[active].x} y2={points[active].y} />
          </g>
        </svg>
        {profiles.map((item, index) => <button ref={element => { buttons.current[index] = element }} className={`atlas-node${active === index ? ' is-selected' : ''}`} type="button" key={item.type} style={{ left: `${points[index].x / 5.2}%`, top: `${points[index].y / 5.2}%` }} aria-label={`Explorar tipo ${item.type}: ${item.name}`} aria-pressed={active === index} tabIndex={active === index ? 0 : -1} onClick={() => { if (!suppressClick.current) select(index) }}>{String(item.type).padStart(2, '0')}</button>)}
      </div>
      <div className="atlas-reading" aria-live={autoAnimating ? 'off' : 'polite'} aria-atomic="true" key={active}>
        <span className="atlas-reading-label">TIPO {String(profile.type).padStart(2, '0')}</span>
        <strong>{profile.name}</strong>
        <span className="atlas-reading-rule" />
        <p>{typeDescriptions[active]}</p>
      </div>
    </div>
    <span className="sr-only" id="atlas-help">Arraste ao redor do círculo para girar livremente ou selecione um número para trazê-lo à posição ativa no alto à direita. As setas do teclado também permitem explorar os tipos.</span>
  </figure>
}

type Props = { participantName: string; onNameChange: (name: string) => void; onStart: () => void; available: boolean }

export function ExperimentalLanding({ participantName, onNameChange, onStart, available }: Props) {
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const sections = root.current?.querySelectorAll('.editorial-reveal') ?? []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach(section => section.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: .08 })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return <div className="landing-experimental" ref={root}>
    <div className="editorial-header-wrap">
      <header className="editorial-header editorial-container">
        <a className="editorial-brand" href="#inicio" aria-label="Déise A. Zardeto, início"><img src={`${import.meta.env.BASE_URL}branding/logo-header-transparent.svg`} alt="Logomarca de Déise A. Zardeto" width="52" height="52" /><span><strong>Déise A. Zardeto</strong><small>Psicologia Clínica e Neuropsicologia</small></span></a>
        <nav aria-label="Navegação principal"><span className="editorial-product">ENEAGRAMA</span><a href="#about-enneagram">Sobre a experiência <MoveUpRight size={13} /></a></nav>
      </header>
    </div>
    <main>
      <div className="editorial-first-fold">
        <section className="editorial-hero editorial-container" id="inicio" aria-labelledby="landing-title">
          <div className="editorial-hero-copy">
            <h1 id="landing-title">Descubra mais<br />sobre <em>você.</em></h1>
            <p className="editorial-lead">Explore sua personalidade através do Eneagrama.</p>
            <form className="editorial-start" id="start-test" onSubmit={event => { event.preventDefault(); onStart() }}>
              <label htmlFor="editorial-name">Seu nome <span>(opcional)</span></label>
              <input id="editorial-name" name="participant-name" autoComplete="name" maxLength={100} value={participantName} onChange={event => onNameChange(event.target.value)} placeholder="Como podemos chamar você?" />
              <button className="editorial-cta" type="submit" disabled={!available}>Iniciar meu teste <span><ArrowRight size={19} /></span></button>
              <p className="editorial-test-meta">135 afirmações <i /> cerca de 25 min <i /> relatório em PDF</p>
            </form>
          </div>
          <PersonalityAtlas active={active} onSelect={setActive} />
        </section>
      </div>

    <section className="editorial-about editorial-container editorial-reveal" id="about-enneagram" aria-labelledby="about-title">
      <div className="editorial-section-marker"><span>01 — O ENCONTRO</span><span>AUTOCONHECIMENTO COM DELICADEZA</span></div>
      <div className="editorial-about-grid"><h2 id="about-title">Um mapa.<br /><em>Não um limite.</em></h2><div><p className="editorial-large-copy">Você é maior do que qualquer descrição sobre você.</p><p>O Eneagrama apresenta nove padrões de personalidade como possibilidades de reflexão. Observar esses padrões pode abrir espaço para reconhecer o que se repete, o que nos move e o que pode ganhar uma nova perspectiva.</p><p>A pontuação do questionário mostra afinidades nas suas respostas. Ela não define quem você é nem substitui uma avaliação psicológica profissional.</p></div></div>
    </section>

    <section className="editorial-types" aria-labelledby="types-title"><div className="editorial-container editorial-reveal">
      <div className="editorial-section-marker"><span>02 — AS PERSPECTIVAS</span><span>PARTES DE UM TODO</span></div>
      <div className="editorial-types-heading"><h2 id="types-title">Nove formas de perceber.<br /><em>Muitas formas de ser.</em></h2><p>Nenhuma delas conta a história inteira.<br />Cada uma oferece uma lente para observar.</p></div>
      <div className="editorial-type-directory">{profiles.map((profile, index) => <a className={`editorial-type-link${active === index ? ' is-selected' : ''}`} key={profile.type} href="#personality-atlas" onClick={() => setActive(index)}><span className="directory-number">{String(profile.type).padStart(2, '0')}</span><div><h3>{profile.name}</h3><p>{profile.summary}</p></div><MoveUpRight size={17} /></a>)}</div>
      <p className="editorial-directory-note">Explore um tipo para conhecê-lo no mapa. Sua escolha aqui não interfere no teste.</p>
    </div></section>

    <section className="editorial-ritual editorial-container editorial-reveal" aria-labelledby="ritual-title">
      <div className="editorial-section-marker"><span>03 — O SEU TEMPO</span><span>SEM RESPOSTAS CERTAS OU ERRADAS</span></div>
      <div className="editorial-ritual-grid"><div><h2 id="ritual-title">Uma pausa.<br /><em>Um novo olhar.</em></h2><p>Escolha um momento tranquilo.<br />O resto começa com sinceridade.</p></div><ol><li><span>01</span><div><h3>Esteja presente.</h3><p>Pense no que costuma acontecer na sua vida, além de como você se sente hoje.</p></div></li><li><span>02</span><div><h3>Responda com liberdade.</h3><p>Escolha o que se aproxima de você. É possível voltar e rever suas respostas.</p></div></li><li><span>03</span><div><h3>Leve a reflexão com você.</h3><p>Veja o panorama dos nove tipos e baixe seu relatório em PDF ao concluir.</p></div></li></ol></div>
    </section>

    <section className="editorial-privacy"><div className="editorial-container editorial-reveal"><LockKeyhole size={23} strokeWidth={1.3} /><div><h2>Este espaço é seu.</h2><p>Seu nome e suas respostas ficam somente na memória desta página. O relatório é gerado no seu navegador. Nada é enviado ou armazenado; ao recarregar, os dados se perdem.</p></div><a href="#start-test">Começar minha reflexão <ArrowRight size={17} /></a></div></section>
    </main>
    <footer className="editorial-footer editorial-container"><div><strong>Déise A. Zardeto</strong><span>Psicologia Clínica e Neuropsicologia</span></div><p>Conhecer-se é um processo.<br /><span>Este pode ser um começo.</span></p><small>© {new Date().getFullYear()} · Eneagrama<br />Uma experiência de autoconhecimento.</small></footer>
  </div>
}
