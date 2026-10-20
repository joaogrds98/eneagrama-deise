import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, Download, LockKeyhole, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { activeAssessment } from './features/enneagram/instrument'
import { getProfile, profiles } from './features/enneagram/profiles'
import { validateAnswers, validateInstrument, validateScoreResult } from './features/enneagram/scoring'
import { shuffleItems } from './features/enneagram/shuffle'
import type { Answers, Assessment, Instrument, ScoreResult } from './features/enneagram/types'
import { ExperimentalLanding } from './features/landing/ExperimentalLanding'

type View = 'home' | 'quiz' | 'result'
const logo = `${import.meta.env.BASE_URL}branding/logo-header-transparent.svg`

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <img src={logo} alt="Logomarca de Deise A. Zardeto Bello" width="52" height="52" />
      <div>
        <strong>Deise A. Zardeto Bello</strong>
        <small>Psicologia Clínica e Neuropsicologia</small>
      </div>
    </div>
  )
}

const heroTypes = [
  { type: 1, name: 'Perfeccionista', description: 'Busca coerência e aprimoramento.' },
  { type: 2, name: 'Ajudante', description: 'Valoriza cuidado e conexão.' },
  { type: 3, name: 'Realizador', description: 'Move-se por metas e resultados.' },
  { type: 4, name: 'Idealista', description: 'Busca autenticidade e significado.' },
  { type: 5, name: 'Analítico', description: 'Valoriza conhecimento e autonomia.' },
  { type: 6, name: 'Precavido', description: 'Procura segurança e confiança.' },
  { type: 7, name: 'Otimista', description: 'Explora possibilidades e novidades.' },
  { type: 8, name: 'Desafiador', description: 'Preza autonomia e ação direta.' },
  { type: 9, name: 'Pacífico', description: 'Busca harmonia e estabilidade.' },
]

function carouselStep(width: number) {
  if (width <= 360) return 88
  if (width <= 680) return 96
  if (width <= 900) return 122
  return 154
}

function HeroTypeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; step: number } | null>(null)
  const dragged = useRef(false)
  const move = (direction: number) => setActiveIndex(current => (current + direction + heroTypes.length) % heroTypes.length)

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const step = carouselStep(window.innerWidth)
    dragStart.current = { x: event.clientX, step }
    dragged.current = false
    setDragX(0)
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return
    const distance = event.clientX - dragStart.current.x
    if (Math.abs(distance) > 6) dragged.current = true
    setDragX(distance)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return
    const { x, step } = dragStart.current
    const distance = event.clientX - x
    dragStart.current = null
    setIsDragging(false)
    setDragX(0)
    if (Math.abs(distance) > 6) {
      dragged.current = true
      window.setTimeout(() => { dragged.current = false }, 0)
    }
    if (Math.abs(distance) >= step * 0.28) {
      const count = Math.min(4, Math.max(1, Math.round(Math.abs(distance) / step)))
      move(distance < 0 ? count : -count)
    }
  }

  function handlePointerCancel() {
    dragStart.current = null
    setIsDragging(false)
    setDragX(0)
    dragged.current = false
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }

  return (
    <div className="hero-carousel">
      <span className="hero-carousel-heading"><Sparkles size={14} strokeWidth={1.6} /> NOVE FORMAS DE ESTAR NO MUNDO</span>
      <div className={`hero-carousel-stage${isDragging ? ' is-dragging' : ''}`} role="region" aria-roledescription="carrossel" aria-label="Explore os nove tipos do Eneagrama" tabIndex={0} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}>
        {heroTypes.map((item, index) => {
          const offset = ((index - activeIndex + heroTypes.length + Math.floor(heroTypes.length / 2)) % heroTypes.length) - Math.floor(heroTypes.length / 2)
          const step = dragStart.current?.step ?? carouselStep(window.innerWidth)
          const visualOffset = offset + dragX / step
          const distance = Math.abs(visualOffset)
          const scale = distance <= 1 ? 1 - distance * 0.16 : 0.84 - Math.min(distance - 1, 0.65) * 0.18
          const opacity = distance <= 1 ? 1 - distance * 0.22 : 0.78 - Math.min(distance - 1, 0.65) * 0.4
          const sideMask = distance < 0.04 ? 'none' : visualOffset > 0
            ? 'linear-gradient(90deg, transparent 0%, #000 38%, #000 100%)'
            : 'linear-gradient(270deg, transparent 0%, #000 38%, #000 100%)'
          return <button
            className={`hero-type-card${offset === 0 ? ' is-active' : ''}`}
            key={item.type}
            type="button"
            aria-label={`Tipo ${item.type}, ${item.name}. ${item.description}`}
            aria-current={offset === 0 ? 'true' : undefined}
            tabIndex={offset === 0 ? 0 : -1}
            onClick={() => {
              if (dragged.current) { dragged.current = false; return }
              setActiveIndex(index)
            }}
            data-offset={offset}
            style={{
              '--scale': scale,
              '--rotation': `${visualOffset * -7}deg`,
              '--opacity': Math.max(0, opacity),
              left: `calc(50% + ${visualOffset * step}px)`,
              WebkitMaskImage: sideMask,
              maskImage: sideMask,
              zIndex: Math.max(0, 10 - Math.round(distance * 3)),
              visibility: distance > 1.65 ? 'hidden' : 'visible',
            } as CSSProperties}
          >
            <span className="hero-type-kicker">TIPO <span>{String(item.type).padStart(2, '0')}</span></span>
            <span className="hero-type-index" aria-hidden="true">{String(item.type).padStart(2, '0')}</span>
            <span className="hero-type-rule" />
            <span className="hero-type-name">{item.name}</span>
            <span className="hero-type-description">{item.description}</span>
          </button>
        })}
      </div>
      <div className="hero-carousel-controls">
        <button className="hero-carousel-arrow" type="button" aria-label="Tipo anterior" onClick={() => move(-1)}><ArrowLeft size={17} /></button>
        <span className="hero-carousel-position" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} <i /> 09</span>
        <button className="hero-carousel-arrow" type="button" aria-label="Próximo tipo" onClick={() => move(1)}><ArrowRight size={17} /></button>
      </div>
      <p className="hero-carousel-note">135 afirmações <span>·</span> cerca de 25 min <span>·</span> relatório em PDF</p>
    </div>
  )
}

function Home({ instrument, participantName, onNameChange, onStart }: { instrument: Instrument | null; participantName: string; onNameChange: (name: string) => void; onStart: () => void }) {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.home-reveal'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach(section => section.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-copy">
            <h1>Descubra mais sobre <em>você.</em></h1>
            <p>Explore sua personalidade através do Eneagrama.</p>
            <label className="participant-name-field"><span>Seu nome (opcional)</span><input type="text" name="participant-name" autoComplete="name" maxLength={100} value={participantName} onChange={event => onNameChange(event.target.value)} placeholder="Como podemos chamar você?" /></label>
            <div className="hero-actions">
              <button className="button button-gold" onClick={onStart} disabled={!instrument}>Iniciar meu teste <ArrowRight size={18} /></button>
            </div>
          </div>
          <HeroTypeCarousel />
        </div>
      </section>

      <section className="intro container home-reveal" id="about-enneagram">
        <div className="section-heading">
          <span className="eyebrow">AUTOCONHECIMENTO COM DELICADEZA</span>
          <h2>Um convite à observação, <em>não a um rótulo.</em></h2>
        </div>
        <p>O Eneagrama apresenta nove padrões de personalidade como possibilidades de reflexão. A pontuação do questionário indica afinidade com determinadas descrições naquele momento; ela não define quem você é por completo.</p>
      </section>

      <section className="types-section home-reveal">
        <div className="container">
          <div className="section-heading types-heading">
            <div><span className="eyebrow">OS NOVE TIPOS</span><h2>Diferentes formas de <em>estar no mundo.</em></h2></div>
            <p>Explore os nomes tradicionalmente associados a cada tipo. As descrições completas aparecem no resultado e no relatório.</p>
          </div>
          <div className="types-grid">
            {profiles.map(profile => <article className="type-card" key={profile.type}><span className="type-number">{String(profile.type).padStart(2, '0')}</span><div><h3>{profile.name}</h3><p>{profile.summary}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="guidance container home-reveal">
        <div className="guidance-title"><span className="eyebrow">ANTES DE COMEÇAR</span><h2>Responda a partir da <em>sua experiência.</em></h2><p>Reserve alguns minutos em um ambiente tranquilo.</p></div>
        <div className="guidance-list">
          <div><span>01</span><p>Considere seus comportamentos habituais, e não apenas um dia específico.</p></div>
          <div><span>02</span><p>Escolha com sinceridade, sem procurar a resposta socialmente esperada.</p></div>
          <div><span>03</span><p>Não existem respostas certas ou erradas. Você pode voltar e corrigir uma escolha.</p></div>
        </div>
      </section>

      <section className="privacy-band home-reveal"><div className="container privacy-inner"><ShieldCheck size={28} strokeWidth={1.5} /><div><strong>Sua reflexão permanece com você.</strong><p>Seu nome e as respostas são processados somente na memória desta página. Nada é enviado ou armazenado e os dados se perdem ao recarregar.</p></div></div></section>
    </>
  )
}

function Quiz({ assessment, onFinish, onBack }: { assessment: Assessment; onFinish: (result: ScoreResult) => void; onBack: () => void }) {
  const instrument = assessment.instrument
  const [items] = useState(() => shuffleItems(instrument.items))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const item = items[index]
  const anchors = item.anchors ?? instrument.anchors
  const value = answers[item.id]
  const progress = Math.round(((index + 1) / items.length) * 100)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [index])

  function next() {
    if (!value) {
      setError('Selecione uma opção para continuar.')
      return
    }
    setError('')
    if (index < items.length - 1) {
      setIndex(index + 1)
      return
    }
    try {
      validateAnswers(instrument, answers)
      const score = assessment.score(answers as Answers)
      validateScoreResult(instrument, score)
      onFinish(score)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível calcular o resultado.')
    }
  }

  return (
    <main className="quiz-shell container">
      <button className="text-button" onClick={onBack}><ArrowLeft size={17} /> Voltar ao início</button>
      <div className="quiz-panel">
        <div className="quiz-meta"><span className="eyebrow">QUESTIONÁRIO ENEAGRAMA</span><span>Questão {index + 1} de {items.length}</span></div>
        <div className="progress-track" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={items.length} aria-label="Progresso do questionário"><div style={{ width: `${progress}%` }} /></div>
        <div className="question-content" key={item.id}>
          <div className="question-prompt">
            <span className="question-count">{String(index + 1).padStart(3, '0')} <span>/ {String(items.length).padStart(3, '0')}</span></span>
            <h1>{item.text}</h1>
            <p>{item.instruction ?? 'O quanto essa afirmação combina com você?'}</p>
          </div>
          <fieldset className="answer-fieldset">
            <legend className="sr-only">Selecione uma resposta de 1 a 5</legend>
            {anchors.map((anchor, answerIndex) => {
              const answerValue = answerIndex + 1
              return <label className={`answer-option ${value === answerValue ? 'selected' : ''}`} key={answerValue}>
                <input type="radio" name={item.id} value={answerValue} aria-label={`${answerValue}: ${anchor}`} checked={value === answerValue} onChange={() => { setAnswers(previous => ({ ...previous, [item.id]: answerValue })); setError('') }} />
                <span className="answer-number">{answerValue}</span>
              </label>
            })}
            <div className="answer-scale-labels" aria-hidden="true"><span>Não combina comigo</span><span>Combina totalmente comigo</span></div>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="quiz-footer"><button className="button button-outline" onClick={() => setIndex(index - 1)} disabled={index === 0}><ArrowLeft size={17} /> Anterior</button><button className="button button-navy" onClick={next}>{index === items.length - 1 ? 'Ver meu resultado' : 'Próxima'} <ArrowRight size={17} /></button></div>
      </div>
      <p className="memory-note"><LockKeyhole size={15} /> Suas respostas ficam somente nesta página e serão perdidas se ela for recarregada.</p>
    </main>
  )
}

function Results({ result, performedAt, participantName, onRestart }: { result: ScoreResult; performedAt: Date; participantName: string; onRestart: () => void }) {
  const [downloading, setDownloading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const leader = result.dominantType ? getProfile(result.dominantType) : null
  async function handleDownload() {
    setDownloading(true)
    setPdfError('')
    try { const { downloadReport } = await import('./features/enneagram/report'); await downloadReport(result, performedAt, participantName) }
    catch { setPdfError('Não foi possível gerar o PDF. Tente novamente.') }
    finally { setDownloading(false) }
  }
  return (
    <main className="results-shell container">
      <div className="result-topline"><span className="eyebrow">SEU RESULTADO</span><span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(performedAt)}</span></div>
      <section className="result-hero">
        <div className="result-emblem"><Sparkles size={22} strokeWidth={1.3} /><span>{leader ? String(leader.type).padStart(2, '0') : '='}</span></div>
        <div>{participantName.trim() && <p className="result-participant">Uma reflexão para {participantName.trim()}</p>}<span className="eyebrow light">{leader ? 'TIPO COM MAIOR PONTUAÇÃO' : 'PONTUAÇÕES MAIS ALTAS EM EMPATE'}</span><h1>{leader ? leader.name : result.leaders.map(type => getProfile(type).name).join(' · ')}</h1><p>{leader ? leader.summary : 'Suas respostas não apontaram um único tipo com maior pontuação. Considere as descrições empatadas como convites à reflexão.'}</p></div>
      </section>
      {leader && <section className="insight-grid" aria-label="Reflexões sobre o tipo">
        <article><span className="eyebrow">CARACTERÍSTICAS</span><h2>Traços associados</h2><div className="trait-list">{leader.traits.map(trait => <span key={trait}>{trait}</span>)}</div></article>
        <article><span className="eyebrow">POTENCIAIS RECURSOS</span><h2>Pontos fortes</h2><p>{leader.strengths}</p></article>
        <article><span className="eyebrow">ATENÇÃO GENTIL</span><h2>Possíveis desafios</h2><p>{leader.challenges}</p></article>
        <article className="reflection-card"><span className="eyebrow">PARA REFLETIR</span><h2>Uma pergunta para levar</h2><p>{leader.reflection}</p></article>
      </section>}
      {!leader && <section className="insight-grid" aria-label="Tipos com pontuação empatada">
        {result.leaders.map(type => {
          const profile = getProfile(type)
          return <article key={type}><span className="eyebrow">TIPO {type} · {profile.name.toUpperCase()}</span><h2>{profile.summary}</h2><p><strong>Para refletir:</strong> {profile.reflection}</p></article>
        })}
      </section>}
      <section className="scores-section"><div className="scores-heading"><div><span className="eyebrow">PANORAMA COMPLETO</span><h2>Os nove tipos <em>em perspectiva.</em></h2></div><p>Soma de 15 respostas por tipo, cada uma de 1 a 5 pontos. Participação relativa ao total das nove somas.</p></div>
        <div className="score-list">{result.scores.map(score => <div className="score-row" key={score.type}><div className="score-label"><strong>{String(score.type).padStart(2, '0')}</strong><span>{getProfile(score.type).name}</span></div><div className="score-track" role="img" aria-label={`Tipo ${score.type}: ${score.raw} de ${score.maximum} pontos; ${score.percentage.toFixed(1)}% do total`}><div className={result.leaders.includes(score.type) ? 'leader' : ''} style={{ width: `${((score.raw - score.minimum) / (score.maximum - score.minimum)) * 100}%` }} /></div><strong className="score-value">{score.raw}<span> / {score.maximum}</span><small>{score.percentage.toFixed(1)}%</small></strong></div>)}</div>
        <p className="score-explainer">O percentual é a soma do tipo dividida pela soma dos nove tipos. A barra mostra a posição no intervalo de 15 a 75 pontos. Nenhum deles indica probabilidade, percentil ou precisão.</p>
      </section>
      <div className="result-actions"><button className="button button-navy" onClick={handleDownload} disabled={downloading}><Download size={18} />{downloading ? 'Gerando relatório…' : 'Baixar meu relatório'}</button><button className="button button-outline" onClick={onRestart}><RotateCcw size={17} /> Reiniciar teste</button></div>
      {pdfError && <p className="form-error" role="alert">{pdfError}</p>}
      <p className="disclaimer">Questionário utilizado pelo Emotional Coaching, reproduzido nesta plataforma conforme autorização informada pelo responsável do projeto. As pontuações descrevem estas respostas e não substituem avaliação profissional.</p>
    </main>
  )
}

export function App() {
  const assessment = activeAssessment as Assessment | null
  const instrument = assessment?.instrument ?? null
  const [view, setView] = useState<View>('home')
  const [participantName, setParticipantName] = useState('')
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [performedAt, setPerformedAt] = useState<Date | null>(null)
  const [configurationError, setConfigurationError] = useState('')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [view])

  function start() {
    if (!assessment) return
    try { validateInstrument(assessment.instrument); setConfigurationError(''); setView('quiz') }
    catch (cause) { setConfigurationError(cause instanceof Error ? cause.message : 'Questionário indisponível.') }
  }
  function finish(score: ScoreResult) { setResult(score); setPerformedAt(new Date()); setView('result') }
  function restart() { setResult(null); setPerformedAt(null); setParticipantName(''); setView('home') }

  if (view === 'home' && new URLSearchParams(window.location.search).get('design') !== 'anterior') {
    return <div className="app-shell"><ExperimentalLanding participantName={participantName} onNameChange={setParticipantName} onStart={start} available={!!instrument} />{configurationError && <p className="config-error container" role="alert">{configurationError}</p>}</div>
  }

  return <div className="app-shell">
    <header className={`site-header${view === 'home' ? ' site-header-home' : ''}`}>
      <div className="container header-inner"><Brand />{view === 'home' && <nav aria-label="Navegação principal"><a href="#about-enneagram">Sobre o Eneagrama</a></nav>}</div>
    </header>
    {view === 'home' && <Home instrument={instrument} participantName={participantName} onNameChange={setParticipantName} onStart={start} />}
    {view === 'quiz' && assessment && <Quiz assessment={assessment} onFinish={finish} onBack={restart} />}
    {view === 'result' && result && performedAt && <Results result={result} performedAt={performedAt} participantName={participantName} onRestart={restart} />}
    {configurationError && <p className="config-error container" role="alert">{configurationError}</p>}
    <footer className="site-footer"><div className="container footer-inner"><Brand light /><div><p>Uma experiência de autoconhecimento a partir do Eneagrama.</p><small>Este material não substitui avaliação psicológica profissional.</small></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Eneagrama</span><span>Respostas processadas apenas no navegador</span></div></footer>
  </div>
}
