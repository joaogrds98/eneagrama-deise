import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import { getProfile } from './profiles'
import type { ScoreResult } from './types'

const navy = rgb(0.03, 0.15, 0.34)
const gold = rgb(0.72, 0.52, 0.22)
const muted = rgb(0.36, 0.4, 0.46)
const lightRule = rgb(0.83, 0.85, 0.87)
const track = rgb(0.91, 0.92, 0.92)
const disclaimer = 'Este relatório é uma ferramenta de reflexão. Não constitui diagnóstico psicológico nem substitui avaliação profissional.'
const method = 'Questionário Emotional Coaching: 135 afirmações, 15 por tipo, escala de respostas de 1 a 5 e soma direta de 15 a 75 pontos por tipo. Empates são preservados, sem desempate.'
const percentNote = 'Os percentuais representam a participação de cada soma no total das nove. Não correspondem à probabilidade de uma personalidade nem a uma comparação populacional.'
const margin = 48
const pageWidth = 595.28
const pageHeight = 841.89
const contentWidth = pageWidth - margin * 2
const bottomLimit = 60

type Fonts = { regular: PDFFont; bold: PDFFont; serif: PDFFont; serifBold: PDFFont }

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    if (font.widthOfTextAtSize(word, size) <= width) {
      line = word
      continue
    }
    let fragment = ''
    for (const character of word) {
      if (fragment && font.widthOfTextAtSize(fragment + character, size) > width) {
        lines.push(fragment)
        fragment = character
      } else fragment += character
    }
    line = fragment
  }
  if (line) lines.push(line)
  return lines
}

function drawParagraph(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, color = navy, leading = size * 1.4): number {
  for (const line of wrapText(text, font, size, width)) {
    page.drawText(line, { x, y, size, font, color })
    y -= leading
  }
  return y
}

function textHeight(text: string, font: PDFFont, size: number, width: number, leading: number): number {
  return wrapText(text, font, size, width).length * leading
}

function sectionsFor(profile: ReturnType<typeof getProfile>) {
  return [
    ['Características', profile.traits.join(' · ')],
    ['Pontos fortes', profile.strengths],
    ['Possíveis desafios', profile.challenges],
    ['Para refletir', profile.reflection],
  ] as const
}

function profileHeight(profile: ReturnType<typeof getProfile>, fonts: Fonts, width: number): number {
  const bodyWidth = width - 120
  const sectionHeight = sectionsFor(profile).reduce((height, [, body]) => height + Math.max(1, wrapText(body, fonts.regular, 8.4, bodyWidth).length) * 10.5 + 2, 0)
  return 44 + textHeight(profile.summary, fonts.regular, 9.2, width, 11.5) + sectionHeight
}

function drawProfile(page: PDFPage, profile: ReturnType<typeof getProfile>, score: number, maximum: number, x: number, top: number, width: number, fonts: Fonts): number {
  const title = `Tipo ${profile.type}  ·  ${profile.name}`
  page.drawText(title, { x, y: top, size: 13.2, font: fonts.serifBold, color: navy })
  const scoreText = `${score}/${maximum}`
  const scoreWidth = fonts.bold.widthOfTextAtSize(scoreText, 9)
  page.drawText(scoreText, { x: x + width - scoreWidth, y: top + 1, size: 9, font: fonts.bold, color: navy })

  let y = top - 19
  y = drawParagraph(page, profile.summary, fonts.regular, 9.2, x, y, width, muted, 11.5) - 5
  for (const [label, body] of sectionsFor(profile)) {
    const labelText = `${label.toLocaleUpperCase('pt-BR')}  ·`
    const labelSize = 6.6
    const bodySize = 8.4
    const labelWidth = fonts.bold.widthOfTextAtSize(labelText, labelSize) + 7
    const bodyX = x + labelWidth
    const bodyWidth = width - labelWidth
    const lines = wrapText(body, fonts.regular, bodySize, bodyWidth)
    lines.forEach((line, index) => {
      if (index === 0) page.drawText(labelText, { x, y, size: labelSize, font: fonts.bold, color: gold })
      page.drawText(line, { x: bodyX, y, size: bodySize, font: fonts.regular, color: muted })
      y -= 10.5
    })
    y -= 2
  }
  const end = y - 2
  page.drawLine({ start: { x, y: end }, end: { x: x + width, y: end }, thickness: 0.45, color: lightRule })
  return end - 10
}

function drawBrandHeader(page: PDFPage, logo: Awaited<ReturnType<PDFDocument['embedPng']>>, fonts: Fonts): void {
  page.drawRectangle({ x: 0, y: pageHeight - 7, width: pageWidth, height: 7, color: navy })
  const size = logo.scaleToFit(54, 54)
  page.drawImage(logo, { x: margin + (54 - size.width) / 2, y: pageHeight - 79 + (54 - size.height) / 2, ...size })
  page.drawText('Deise A. Zardeto Bello', { x: 122, y: pageHeight - 44, size: 15, font: fonts.bold, color: navy })
  page.drawText('Psicologia Clínica e Neuropsicologia', { x: 122, y: pageHeight - 62, size: 8.5, font: fonts.regular, color: muted })
  page.drawText('RELATÓRIO DE AUTOCONHECIMENTO  ·  ENEAGRAMA', { x: 122, y: pageHeight - 78, size: 6.8, font: fonts.bold, color: gold })
  page.drawLine({ start: { x: margin, y: pageHeight - 101 }, end: { x: pageWidth - margin, y: pageHeight - 101 }, thickness: 0.65, color: gold })
}

function drawContinuationHeader(page: PDFPage, fonts: Fonts): void {
  page.drawRectangle({ x: 0, y: pageHeight - 7, width: pageWidth, height: 7, color: navy })
  page.drawText('ENEAGRAMA  ·  CONTINUAÇÃO', { x: margin, y: pageHeight - 37, size: 8, font: fonts.bold, color: muted })
  page.drawLine({ start: { x: margin, y: pageHeight - 49 }, end: { x: pageWidth - margin, y: pageHeight - 49 }, thickness: 0.55, color: gold })
}

function drawFooter(page: PDFPage, pageNumber: number, pageCount: number, fonts: Fonts): void {
  page.drawLine({ start: { x: margin, y: 42 }, end: { x: pageWidth - margin, y: 42 }, thickness: 0.45, color: lightRule })
  page.drawText('Deise A. Zardeto Bello', { x: margin, y: 27, size: 7.3, font: fonts.bold, color: muted })
  const pageLabel = `${pageNumber} / ${pageCount}`
  page.drawText(pageLabel, { x: pageWidth - margin - fonts.regular.widthOfTextAtSize(pageLabel, 7.3), y: 27, size: 7.3, font: fonts.regular, color: muted })
}

function chartHeight(fonts: Fonts): number {
  return 291 + textHeight(method, fonts.regular, 7.8, contentWidth, 10.5)
    + textHeight(percentNote, fonts.regular, 7.8, contentWidth, 10.5)
    + textHeight(disclaimer, fonts.regular, 7.8, contentWidth, 10.5)
}

function drawChartAndContext(page: PDFPage, result: ScoreResult, top: number, fonts: Fonts): number {
  let y = top
  page.drawText('Distribuição das pontuações', { x: margin, y, size: 17, font: fonts.serifBold, color: navy })
  y -= 15
  page.drawText('As barras mostram as somas em relação ao máximo possível de 75 pontos.', { x: margin, y, size: 8.2, font: fonts.regular, color: muted })
  y -= 24

  const typeX = margin
  const barX = margin + 139
  const barWidth = 198
  const scoreX = barX + barWidth + 12
  const percentX = scoreX + 48
  page.drawText('TIPO', { x: typeX, y, size: 6.5, font: fonts.bold, color: muted })
  page.drawText('SOMA / 75', { x: scoreX, y, size: 6.5, font: fonts.bold, color: muted })
  page.drawText('PARTICIPAÇÃO', { x: percentX, y, size: 6.5, font: fonts.bold, color: muted })
  y -= 15

  for (const score of result.scores) {
    const profile = getProfile(score.type)
    const leader = result.leaders.includes(score.type)
    page.drawText(`${String(score.type).padStart(2, '0')}  ${profile.name}`, {
      x: typeX,
      y,
      size: 8.2,
      font: leader ? fonts.bold : fonts.regular,
      color: leader ? navy : muted,
    })
    const fillWidth = barWidth * (score.raw / score.maximum)
    page.drawRectangle({ x: barX, y: y + 1, width: barWidth, height: 4, color: track })
    page.drawRectangle({ x: barX, y: y + 1, width: fillWidth, height: 4, color: leader ? gold : navy })
    page.drawText(`${score.raw}/${score.maximum}`, { x: scoreX, y, size: 8.6, font: leader ? fonts.bold : fonts.regular, color: navy })
    page.drawText(`${score.percentage.toFixed(1)}%`, { x: percentX, y, size: 7.3, font: fonts.regular, color: muted })
    y -= 20
  }

  y -= 3
  page.drawLine({ start: { x: margin, y: y + 7 }, end: { x: pageWidth - margin, y: y + 7 }, thickness: 0.45, color: lightRule })
  y -= 12
  for (const [label, body] of [
    ['Metodologia', method],
    ['Leitura dos percentuais', percentNote],
    ['Nota de uso', disclaimer],
  ]) {
    page.drawText(label, { x: margin, y, size: 7.3, font: fonts.bold, color: navy })
    y -= 10
    y = drawParagraph(page, body, fonts.regular, 7.8, margin, y, contentWidth, muted, 10.5) - 4
  }
  return y
}

export function sanitizeFilenameName(name: string): string {
  return name.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 72)
    .replace(/[.-]+$/g, '')
}

export function reportFilename(participantName = ''): string {
  const safeName = sanitizeFilenameName(participantName)
  return safeName ? `Eneagrama-${safeName}.pdf` : 'Eneagrama-Resultado.pdf'
}

export async function createReport(result: ScoreResult, performedAt: Date, participantName = ''): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle('Eneagrama - Relatório de autoconhecimento')
  doc.setAuthor('Deise A. Zardeto Bello')
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
  }
  const logoResponse = await fetch(`${import.meta.env.BASE_URL}branding/logo-original.png`)
  if (!logoResponse.ok) throw new Error('Não foi possível carregar a identidade visual do relatório.')
  const logo = await doc.embedPng(await logoResponse.arrayBuffer())
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(performedAt)
  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0
  const addPage = (first = false) => {
    page = doc.addPage([pageWidth, pageHeight])
    pages.push(page)
    if (first) {
      drawBrandHeader(page, logo, fonts)
      y = pageHeight - 124
    } else {
      drawContinuationHeader(page, fonts)
      y = pageHeight - 72
    }
  }

  addPage(true)
  const leaders = [...result.leaders].sort((a, b) => a - b)
  const uniqueLeader = result.dominantType !== null
  const participant = participantName.trim()
  if (uniqueLeader) {
    const profile = getProfile(result.dominantType!)
    const score = result.scores.find(item => item.type === result.dominantType)!
    page.drawText(`Tipo ${profile.type}  ·  ${profile.name}`, { x: margin, y, size: 22, font: fonts.serifBold, color: navy })
    y -= 24
    page.drawText(`Maior pontuação  ·  ${score.raw}/${score.maximum}`, { x: margin, y, size: 9, font: fonts.bold, color: gold })
    y -= 17
  } else {
    page.drawText('Perspectivas empatadas', { x: margin, y, size: 21, font: fonts.serifBold, color: navy })
    y -= 22
    page.drawText(`${leaders.length} tipos com a mesma pontuação  ·  sem tipo vencedor`, { x: margin, y, size: 8.7, font: fonts.regular, color: muted })
    y -= 17
  }

  if (participant) {
    page.drawText('PARTICIPANTE', { x: margin, y, size: 6.5, font: fonts.bold, color: gold })
    y -= 10
    y = drawParagraph(page, participant, fonts.regular, 8.5, margin, y, contentWidth, navy, 10.5) - 2
  }
  page.drawText(`REALIZADO EM  ${date}`, { x: margin, y, size: 7.8, font: fonts.regular, color: muted })
  y -= 20

  if (uniqueLeader) {
    const profile = getProfile(leaders[0])
    y = drawParagraph(page, profile.summary, fonts.regular, 9.5, margin, y, contentWidth, navy, 12) - 4
    for (const [label, body] of sectionsFor(profile)) {
      const labelText = `${label.toLocaleUpperCase('pt-BR')}  ·`
      const labelWidth = fonts.bold.widthOfTextAtSize(labelText, 6.7) + 7
      page.drawText(labelText, { x: margin, y, size: 6.7, font: fonts.bold, color: gold })
      const bodyLines = wrapText(body, fonts.regular, 8.6, contentWidth - labelWidth)
      bodyLines.forEach((line, index) => page.drawText(line, { x: margin + labelWidth, y: y - index * 10.8, size: 8.6, font: fonts.regular, color: muted }))
      y -= Math.max(1, bodyLines.length) * 10.8 + 4
    }
  } else {
    const heights = leaders.map(type => profileHeight(getProfile(type), fonts, contentWidth))
    const firstPageCapacity = y - bottomLimit
    const continuationCapacity = pageHeight - 72 - bottomLimit
    let profilePageSplit = 0
    let firstPageUsed = 0
    for (let index = 0; index < heights.length; index += 1) {
      firstPageUsed += heights[index]
      if (firstPageUsed > firstPageCapacity) break
      const remainder = heights.slice(index + 1).reduce((total, height) => total + height, 0)
      const chartFitsFirstPage = index === heights.length - 1 && y - firstPageUsed - chartHeight(fonts) >= bottomLimit
      const remainingFitsContinuation = index < heights.length - 1 && remainder + chartHeight(fonts) <= continuationCapacity
      if (chartFitsFirstPage || remainingFitsContinuation) profilePageSplit = index + 1
    }

    for (const [index, type] of leaders.entries()) {
      if (profilePageSplit > 0 && profilePageSplit < leaders.length && index === profilePageSplit) addPage()
      const profile = getProfile(type)
      const score = result.scores.find(item => item.type === type)!
      const needed = profileHeight(profile, fonts, contentWidth)
      if (y - needed < bottomLimit) {
        addPage()
      }
      y = drawProfile(page, profile, score.raw, score.maximum, margin, y, contentWidth, fonts)
    }
  }

  const chartNeedsOwnPage = y - chartHeight(fonts) < bottomLimit
  if (chartNeedsOwnPage) addPage()
  drawChartAndContext(page, result, y - 2, fonts)

  for (const [index, reportPage] of pages.entries()) drawFooter(reportPage, index + 1, pages.length, fonts)
  return doc.save()
}

export async function downloadReport(result: ScoreResult, performedAt: Date, participantName = ''): Promise<void> {
  const bytes = await createReport(result, performedAt, participantName)
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = reportFilename(participantName)
    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
