import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import { getProfile } from './profiles'
import type { ScoreResult } from './types'

const navy = rgb(0.03, 0.15, 0.34)
const gold = rgb(0.78, 0.59, 0.29)
const goldPale = rgb(0.97, 0.94, 0.87)
const muted = rgb(0.35, 0.4, 0.47)
const paper = rgb(0.975, 0.975, 0.96)
const rule = rgb(0.86, 0.88, 0.89)
const disclaimer = 'Este relatório é uma ferramenta de reflexão. Não constitui diagnóstico psicológico e não substitui avaliação profissional.'
const method = 'Questionário Emotional Coaching: 135 afirmações, 15 por tipo, escala de respostas de 1 a 5 e soma direta, com faixa possível de 15 a 75 por tipo. Empates são preservados, sem desempate.'
const margin = 48
const pageWidth = 595.28
const pageHeight = 841.89
const contentWidth = pageWidth - margin * 2
const bottomLimit = 68

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate
    } else {
      if (line) lines.push(line)
      if (font.widthOfTextAtSize(word, size) <= width) {
        line = word
      } else {
        let fragment = ''
        for (const character of word) {
          if (fragment && font.widthOfTextAtSize(fragment + character, size) > width) {
            lines.push(fragment)
            fragment = character
          } else fragment += character
        }
        line = fragment
      }
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, color = navy, leading = size * 1.45): number {
  for (const line of wrapText(text, font, size, width)) {
    page.drawText(line, { x, y, size, font, color })
    y -= leading
  }
  return y
}

function wrappedHeight(text: string, font: PDFFont, size: number, width: number, leading: number): number {
  return wrapText(text, font, size, width).length * leading
}

function drawSectionLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont): void {
  page.drawText(text.toLocaleUpperCase('pt-BR'), { x, y, size: 7.2, font, color: gold })
}

function profileCardHeight(profile: ReturnType<typeof getProfile>, font: PDFFont, width: number, compact = false): number {
  const innerWidth = width - 28
  const summarySize = compact ? 8.9 : 9.4
  const bodySize = compact ? 8.5 : 9
  const summaryLeading = compact ? 11 : 12.2
  const bodyLeading = compact ? 10 : 11.7
  const sections = [
    profile.traits.join(' · '),
    profile.strengths,
    profile.challenges,
    profile.reflection,
  ]
  const summaryHeight = wrappedHeight(profile.summary, font, summarySize, innerWidth, summaryLeading)
  const sectionsHeight = sections.reduce((total, body) => total + wrappedHeight(body, font, bodySize, innerWidth, bodyLeading), 0)
  return compact ? 99 + summaryHeight + sectionsHeight : 155 + summaryHeight + sectionsHeight
}

function drawProfileCard(
  page: PDFPage,
  profile: ReturnType<typeof getProfile>,
  score: number,
  maximum: number,
  x: number,
  top: number,
  width: number,
  fonts: { regular: PDFFont; bold: PDFFont; serifBold: PDFFont },
  compact = false,
): number {
  const height = profileCardHeight(profile, fonts.regular, width, compact)
  const bottom = top - height
  const innerX = x + 14
  const innerWidth = width - 28
  page.drawRectangle({ x, y: bottom, width, height, color: paper, borderColor: rule, borderWidth: 0.65 })
  page.drawRectangle({ x, y: bottom, width: 3, height, color: gold })

  const badgeTop = compact ? top - 13 : top - 22
  page.drawCircle({ x: innerX + 13, y: badgeTop - 2, size: compact ? 8 : 10, color: navy })
  const number = String(profile.type).padStart(2, '0')
  const numberSize = compact ? 7 : 8
  const numberWidth = fonts.bold.widthOfTextAtSize(number, numberSize)
  page.drawText(number, { x: innerX + 13 - numberWidth / 2, y: badgeTop - (compact ? 4 : 5), size: numberSize, font: fonts.bold, color: goldPale })
  page.drawText(profile.name, { x: innerX + (compact ? 29 : 33), y: top - (compact ? 19 : 27), size: compact ? 13 : 14, font: fonts.serifBold, color: navy })
  const scoreLabel = `${score}/${maximum}`
  const scoreSize = compact ? 8.5 : 9
  const scoreWidth = fonts.bold.widthOfTextAtSize(scoreLabel, scoreSize)
  page.drawText(scoreLabel, { x: x + width - 14 - scoreWidth, y: top - (compact ? 19 : 25), size: scoreSize, font: fonts.bold, color: navy })

  let y = top - (compact ? 33 : 49)
  drawSectionLabel(page, 'Síntese', innerX, y, fonts.bold)
  y -= compact ? 9 : 13
  y = drawWrapped(page, profile.summary, fonts.regular, compact ? 8.9 : 9.4, innerX, y, innerWidth, muted, compact ? 11 : 12.2) - (compact ? 3 : 5)

  const sections = [
    ['Características', profile.traits.join(' · ')],
    ['Pontos fortes', profile.strengths],
    ['Possíveis desafios', profile.challenges],
    ['Para refletir', profile.reflection],
  ] as const
  for (const [label, body] of sections) {
    drawSectionLabel(page, label, innerX, y, fonts.bold)
    y -= compact ? 8 : 13
    y = drawWrapped(page, body, fonts.regular, compact ? 8.5 : 9, innerX, y, innerWidth, muted, compact ? 10 : 11.7) - (compact ? 3 : 7)
  }
  return bottom
}

function drawFooter(page: PDFPage, pageNumber: number, pageCount: number, regular: PDFFont, bold: PDFFont): void {
  page.drawLine({ start: { x: margin, y: 48 }, end: { x: pageWidth - margin, y: 48 }, thickness: 0.55, color: rule })
  page.drawText('Deise A. Zardeto Bello', { x: margin, y: 31, size: 7.5, font: bold, color: muted })
  const pageLabel = `${pageNumber} / ${pageCount}`
  const pageLabelWidth = regular.widthOfTextAtSize(pageLabel, 7.5)
  page.drawText(pageLabel, { x: pageWidth - margin - pageLabelWidth, y: 31, size: 7.5, font: regular, color: muted })
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
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
  }
  const logoResponse = await fetch(`${import.meta.env.BASE_URL}branding/logo-original.png`)
  if (!logoResponse.ok) throw new Error('Não foi possível carregar a identidade visual do relatório.')
  const logo = await doc.embedPng(await logoResponse.arrayBuffer())
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(performedAt)

  let page!: PDFPage
  let y = 0
  const addPage = (continuation: boolean) => {
    page = doc.addPage([pageWidth, pageHeight])
    page.drawRectangle({ x: 0, y: pageHeight - 10, width: pageWidth, height: 10, color: navy })
    if (continuation) {
      page.drawText('ENEAGRAMA  ·  CONTINUAÇÃO', { x: margin, y: pageHeight - 39, size: 8, font: fonts.bold, color: muted })
      page.drawLine({ start: { x: margin, y: pageHeight - 51 }, end: { x: pageWidth - margin, y: pageHeight - 51 }, thickness: 0.7, color: gold })
      y = pageHeight - 76
    }
  }
  addPage(false)
  const logoSize = logo.scaleToFit(68, 68)
  page.drawImage(logo, {
    x: margin + (68 - logoSize.width) / 2,
    y: pageHeight - 124 + (68 - logoSize.height) / 2,
    ...logoSize,
  })
  page.drawText('Deise A. Zardeto Bello', { x: 132, y: pageHeight - 57, size: 15, font: fonts.bold, color: navy })
  page.drawText('Psicologia Clínica e Neuropsicologia', { x: 132, y: pageHeight - 76, size: 8.5, font: fonts.regular, color: muted })
  page.drawText('RELATÓRIO DE AUTOCONHECIMENTO  ·  ENEAGRAMA', { x: 132, y: pageHeight - 96, size: 7.2, font: fonts.bold, color: gold })
  page.drawLine({ start: { x: margin, y: pageHeight - 135 }, end: { x: pageWidth - margin, y: pageHeight - 135 }, thickness: 0.7, color: gold })
  y = pageHeight - 159

  const uniqueLeader = result.dominantType !== null
  const leaders = [...result.leaders].sort((a, b) => a - b)
  const compactTie = !uniqueLeader && leaders.length >= 5
  if (!compactTie) {
    page.drawText('RESULTADO DO QUESTIONÁRIO', { x: margin, y, size: 7.5, font: fonts.bold, color: gold })
    y -= 25
  }

  if (uniqueLeader) {
    const leader = result.leaders[0]
    const profile = getProfile(leader)
    const topScore = result.scores.find(score => score.type === leader)!
    const cardY = y - 66
    page.drawRectangle({ x: margin, y: cardY, width: contentWidth, height: 66, color: navy })
    page.drawRectangle({ x: margin, y: cardY, width: 4, height: 66, color: gold })
    page.drawCircle({ x: margin + 37, y: cardY + 33, size: 19, color: gold })
    const number = String(leader).padStart(2, '0')
    const numberWidth = fonts.bold.widthOfTextAtSize(number, 12)
    page.drawText(number, { x: margin + 37 - numberWidth / 2, y: cardY + 28, size: 12, font: fonts.bold, color: navy })
    page.drawText('MAIOR PONTUAÇÃO', { x: margin + 68, y: y - 17, size: 7, font: fonts.bold, color: goldPale })
    page.drawText(`Tipo ${leader}  ·  ${profile.name}`, { x: margin + 68, y: y - 41, size: 18, font: fonts.serifBold, color: rgb(1, 1, 1) })
    const scoreLabel = `${topScore.raw}/${topScore.maximum}`
    const scoreWidth = fonts.bold.widthOfTextAtSize(scoreLabel, 11)
    page.drawText(scoreLabel, { x: pageWidth - margin - scoreWidth - 17, y: cardY + 28, size: 11, font: fonts.bold, color: rgb(1, 1, 1) })
    y = cardY - 18
  } else {
    const tieText = `Empate entre ${result.leaders.length} tipos`
    const tieBoxHeight = compactTie ? 43 : 55
    page.drawRectangle({ x: margin, y: y - tieBoxHeight, width: contentWidth, height: tieBoxHeight, color: goldPale, borderColor: gold, borderWidth: 0.7 })
    page.drawText(tieText, { x: margin + 15, y: y - (compactTie ? 19 : 24), size: compactTie ? 15 : 17, font: fonts.serifBold, color: navy })
    page.drawText('As pontuações iguais são apresentadas sem escolher um vencedor.', { x: margin + 15, y: y - (compactTie ? 34 : 42), size: compactTie ? 8 : 8.7, font: fonts.regular, color: muted })
    y -= compactTie ? 53 : 72
  }

  const participant = participantName.trim()
  if (participant) {
    page.drawText('PARTICIPANTE', { x: margin, y, size: 6.8, font: fonts.bold, color: gold })
    y -= 13
    y = drawWrapped(page, participant, fonts.regular, 9, margin, y, contentWidth, navy, 11.5) - 5
    page.drawText(`REALIZADO EM  ${date}`, { x: margin, y, size: 8.5, font: fonts.regular, color: muted })
    y -= 23
  } else {
    page.drawText(`REALIZADO EM  ${date}`, { x: margin, y, size: 8.5, font: fonts.regular, color: muted })
    y -= 23
  }

  if (!compactTie) {
    page.drawText(uniqueLeader ? 'Sobre este tipo' : 'Perspectivas empatadas', { x: margin, y, size: 15, font: fonts.serifBold, color: navy })
    y -= 25
  }
  let profileCardsOnPage = 0
  for (const type of leaders) {
    const profile = getProfile(type)
    const score = result.scores.find(item => item.type === type)!
    const cardHeight = profileCardHeight(profile, fonts.regular, contentWidth, compactTie)
    if (y - cardHeight < bottomLimit || (compactTie && profileCardsOnPage >= 3)) {
      addPage(true)
      profileCardsOnPage = 0
      if (!compactTie) {
        page.drawText(uniqueLeader ? 'Sobre este tipo' : 'Perspectivas empatadas', { x: margin, y, size: 13, font: fonts.serifBold, color: navy })
        y -= 24
      }
    }
    const bottom = drawProfileCard(page, profile, score.raw, score.maximum, margin, y, contentWidth, fonts, compactTie)
    y = bottom - 13
    profileCardsOnPage += 1
  }

  addPage(true)
  page.drawText('Distribuição das pontuações', { x: margin, y, size: 19, font: fonts.serifBold, color: navy })
  y -= 17
  page.drawText('Panorama das nove somas obtidas no questionário.', { x: margin, y, size: 9, font: fonts.regular, color: muted })
  y -= 27

  const typeX = margin
  const barX = margin + 120
  const barWidth = 218
  const scoreX = barX + barWidth + 12
  const percentX = scoreX + 55
  page.drawText('TIPO', { x: typeX, y, size: 6.8, font: fonts.bold, color: muted })
  page.drawText('SOMA / 75', { x: scoreX, y, size: 6.8, font: fonts.bold, color: muted })
  page.drawText('PARTICIPAÇÃO', { x: percentX, y, size: 6.8, font: fonts.bold, color: muted })
  y -= 17
  page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: pageWidth - margin, y: y + 8 }, thickness: 0.55, color: rule })

  for (const score of result.scores) {
    const profile = getProfile(score.type)
    const isLeader = result.leaders.includes(score.type)
    const rowTop = y
    page.drawCircle({ x: typeX + 6, y: rowTop + 3, size: 5.5, color: isLeader ? gold : navy })
    page.drawText(String(score.type).padStart(2, '0'), { x: typeX + 17, y: rowTop, size: 8.2, font: fonts.bold, color: isLeader ? navy : muted })
    page.drawText(profile.name, { x: typeX + 36, y: rowTop, size: 8.2, font: isLeader ? fonts.bold : fonts.regular, color: navy })
    page.drawRectangle({ x: barX, y: rowTop - 1, width: barWidth, height: 8, color: paper, borderColor: rule, borderWidth: 0.35 })
    page.drawRectangle({ x: barX, y: rowTop - 1, width: barWidth * (score.raw / score.maximum), height: 8, color: isLeader ? gold : navy })
    page.drawText(`${score.raw}/${score.maximum}`, { x: scoreX, y: rowTop, size: 8.3, font: isLeader ? fonts.bold : fonts.regular, color: navy })
    page.drawText(`${score.percentage.toFixed(1)}%`, { x: percentX, y: rowTop, size: 7.8, font: fonts.regular, color: muted })
    y -= 28
  }

  y -= 4
  page.drawText('SOMA EM RELAÇÃO AO MÁXIMO DE 75 PONTOS', { x: barX, y, size: 6.7, font: fonts.regular, color: muted })
  y -= 24
  y = drawInfoCard(page, 'Metodologia', method, y, fonts)
  y -= 12
  y = drawInfoCard(page, 'Como ler os percentuais', 'O percentual representa a participação de cada soma no total das nove. Não corresponde à probabilidade de uma personalidade nem a uma comparação populacional.', y, fonts)
  y -= 12
  y = drawInfoCard(page, 'Nota de uso', disclaimer, y, fonts)

  for (const [index, pdfPage] of doc.getPages().entries()) {
    drawFooter(pdfPage, index + 1, doc.getPageCount(), fonts.regular, fonts.bold)
  }
  return doc.save()
}

function drawInfoCard(page: PDFPage, title: string, body: string, top: number, fonts: { regular: PDFFont; bold: PDFFont }): number {
  const padding = 11
  const bodySize = 8.1
  const leading = 11.2
  const bodyHeight = wrappedHeight(body, fonts.regular, bodySize, contentWidth - padding * 2, leading)
  const height = padding * 2 + 10 + bodyHeight
  const bottom = top - height
  page.drawRectangle({ x: margin, y: bottom, width: contentWidth, height, color: paper, borderColor: rule, borderWidth: 0.55 })
  page.drawRectangle({ x: margin, y: bottom, width: 2.5, height, color: gold })
  page.drawText(title, { x: margin + padding, y: top - padding - 7, size: 8.1, font: fonts.bold, color: navy })
  const end = drawWrapped(page, body, fonts.regular, bodySize, margin + padding, top - padding - 20, contentWidth - padding * 2, muted, leading)
  return Math.min(bottom, end - padding)
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
