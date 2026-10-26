import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import { getProfile } from './profiles'
import { getResultVisualData, typeColors } from './resultVisuals'
import type { EnneagramType, ScoreResult } from './types'

const navy = '#082857'
const gold = '#c99a4a'
const muted = '#586570'
const lightRule = '#d9e0e5'
const pageWidth = 841.89
const pageHeight = 595.28
const margin = 36
const disclaimer = 'Este relatório é uma ferramenta de reflexão e não constitui diagnóstico psicológico nem substitui avaliação profissional.'
const method = 'Instrumento Emotional Coaching: 135 afirmações, 15 por tipo, respondidas em escala de 1 a 5; cada tipo é calculado pela soma direta das respostas (15 a 75 pontos). Os empates são preservados.'

type Fonts = { regular: PDFFont; bold: PDFFont }

function color(hex: string) {
  return rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255)
}

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate
    else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawRight(page: PDFPage, text: string, xRight: number, y: number, size: number, font: PDFFont, fill: string) {
  page.drawText(text, { x: xRight - font.widthOfTextAtSize(text, size), y, size, font, color: color(fill) })
}

function drawHeader(page: PDFPage, fonts: Fonts, logo: Awaited<ReturnType<PDFDocument['embedPng']>>, performedAt: Date, participantName: string) {
  page.drawRectangle({ x: 0, y: pageHeight - 6, width: pageWidth, height: 6, color: color(navy) })
  const size = logo.scaleToFit(43, 43)
  page.drawImage(logo, { x: margin, y: pageHeight - 60 + (43 - size.height) / 2, ...size })
  page.drawText('Deise A. Zardeto Bello', { x: 91, y: pageHeight - 32, size: 13.5, font: fonts.bold, color: color(navy) })
  page.drawText('Psicologia Clínica e Neuropsicologia', { x: 91, y: pageHeight - 48, size: 8.4, font: fonts.regular, color: color(muted) })
  page.drawText('RELATÓRIO DE AUTOCONHECIMENTO  ·  ENEAGRAMA', { x: 91, y: pageHeight - 61, size: 6.4, font: fonts.bold, color: color(gold) })
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(performedAt)
  drawRight(page, 'TESTE REALIZADO EM', pageWidth - margin, pageHeight - 31, 6.5, fonts.bold, gold)
  drawRight(page, date, pageWidth - margin, pageHeight - 45, 8.7, fonts.regular, navy)
  if (participantName.trim()) {
    const lines = wrapText(`Participante: ${participantName.trim()}`, fonts.regular, 8, 235).slice(0, 2)
    lines.forEach((line, index) => drawRight(page, line, pageWidth - margin, pageHeight - 60 - index * 10, 8, fonts.regular, muted))
  }
  page.drawLine({ start: { x: margin, y: pageHeight - 76 }, end: { x: pageWidth - margin, y: pageHeight - 76 }, thickness: 0.7, color: color(gold) })
}

function drawTypeTable(page: PDFPage, fonts: Fonts, visual: ReturnType<typeof getResultVisualData>) {
  const x = margin
  const top = 458
  const widths = [107, 91, 91, 76]
  const tableWidth = widths.reduce((sum, value) => sum + value, 0)
  page.drawText('Tipos e centros de inteligência', { x, y: top, size: 11.5, font: fonts.bold, color: color(navy) })
  const headerTop = top - 10
  const headerHeight = 27
  const rowHeight = 31
  const bodyTop = headerTop - headerHeight
  page.drawRectangle({ x, y: bodyTop, width: tableWidth, height: headerHeight, color: color('#f2f4f5'), borderColor: color(lightRule), borderWidth: 0.6 })
  const columns = ['Tipo psicológico', 'Nome', 'Centro de\nInteligência', 'Representatividade']
  let columnX = x
  columns.forEach((label, index) => {
    const lines = label.split('\n')
    lines.forEach((line, lineIndex) => page.drawText(line, { x: columnX + 6, y: bodyTop + (lines.length > 1 ? 15 : 10) - lineIndex * 9, size: 6.4, font: fonts.bold, color: color(navy) }))
    columnX += widths[index]
    if (index < widths.length - 1) page.drawLine({ start: { x: columnX, y: bodyTop }, end: { x: columnX, y: headerTop }, thickness: 0.5, color: color(lightRule) })
  })

  visual.centers.forEach((center, groupIndex) => {
    const groupTop = bodyTop - groupIndex * rowHeight * 3
    const groupBottom = groupTop - rowHeight * 3
    const rowValues = visual.rows.filter(row => center.types.includes(row.type))
    rowValues.forEach((row, index) => {
      const rowTop = groupTop - index * rowHeight
      const rowBottom = rowTop - rowHeight
      if (index > 0) page.drawLine({ start: { x, y: rowTop }, end: { x: x + widths[0] + widths[1], y: rowTop }, thickness: 0.4, color: color(lightRule) })
      page.drawText(`Tipo ${row.type}`, { x: x + 7, y: rowBottom + 11, size: 8, font: fonts.bold, color: color(typeColors[row.type]) })
      page.drawText(row.name, { x: x + widths[0] + 7, y: rowBottom + 11, size: 7.8, font: fonts.regular, color: color(typeColors[row.type]) })
    })
    page.drawRectangle({ x, y: groupBottom, width: tableWidth, height: rowHeight * 3, borderColor: color(lightRule), borderWidth: 0.55 })
    const centerX = x + widths[0] + widths[1]
    page.drawLine({ start: { x: centerX, y: groupBottom }, end: { x: centerX, y: groupTop }, thickness: 0.5, color: color(lightRule) })
    page.drawLine({ start: { x: centerX + widths[2], y: groupBottom }, end: { x: centerX + widths[2], y: groupTop }, thickness: 0.5, color: color(lightRule) })
    page.drawText(center.name, { x: centerX + 7, y: groupBottom + rowHeight * 1.5 - 3, size: 8.2, font: fonts.regular, color: color(center.color) })
    page.drawText(`${center.percentage}%`, { x: centerX + widths[2] + 7, y: groupBottom + rowHeight * 1.5 - 3, size: 10.2, font: fonts.bold, color: color(center.color) })
  })
  const tableBottom = bodyTop - rowHeight * 9
  let cursor = x
  for (const width of widths.slice(0, -1)) {
    cursor += width
    page.drawLine({ start: { x: cursor, y: tableBottom }, end: { x: cursor, y: bodyTop }, thickness: 0.5, color: color(lightRule) })
  }
}

function drawBarChart(page: PDFPage, fonts: Fonts, visual: ReturnType<typeof getResultVisualData>, leaders: readonly EnneagramType[]) {
  const x = 410
  const width = pageWidth - margin - x
  const titleY = 458
  page.drawText('Representatividade dos tipos', { x, y: titleY, size: 11.5, font: fonts.bold, color: color(navy) })
  page.drawText('Pontuação direta · escala de 0 a 75', { x, y: titleY - 13, size: 7.2, font: fonts.regular, color: color(muted) })
  const plotLeft = x + 29
  const plotRight = x + width - 5
  const plotBottom = 257
  const plotHeight = 150
  for (const tick of [0, 15, 30, 45, 60, 75]) {
    const y = plotBottom + (tick / 75) * plotHeight
    page.drawLine({ start: { x: plotLeft, y }, end: { x: plotRight, y }, thickness: tick === 0 ? 0.7 : 0.35, color: color(tick === 0 ? '#a8b0b6' : '#e3e6e8') })
    drawRight(page, String(tick), plotLeft - 6, y - 2.3, 6.3, fonts.regular, muted)
  }
  const slot = (plotRight - plotLeft) / visual.rows.length
  visual.rows.forEach((row, index) => {
    const barWidth = 23
    const barX = plotLeft + slot * index + (slot - barWidth) / 2
    const height = (row.raw / 75) * plotHeight
    const isLeader = leaders.includes(row.type)
    page.drawRectangle({ x: barX, y: plotBottom, width: barWidth, height, color: color(typeColors[row.type]), borderColor: color(isLeader ? gold : typeColors[row.type]), borderWidth: isLeader ? 1.1 : 0 })
    const value = String(row.raw)
    const valueSize = 7.8
    page.drawText(value, { x: barX + (barWidth - fonts.bold.widthOfTextAtSize(value, valueSize)) / 2, y: plotBottom + height + 4, size: valueSize, font: fonts.bold, color: color(navy) })
    const label = `Tipo ${row.type}`
    const labelSize = 5.8
    page.drawText(label, { x: plotLeft + slot * index + (slot - fonts.regular.widthOfTextAtSize(label, labelSize)) / 2, y: plotBottom - 13, size: labelSize, font: fonts.regular, color: color(muted) })
  })
}

function drawPieSlice(page: PDFPage, centerX: number, centerY: number, radius: number, start: number, end: number, fill: string) {
  const steps = Math.max(8, Math.ceil((end - start) / 4))
  const points = [{ x: radius, y: radius }]
  for (let step = 0; step <= steps; step += 1) {
    const angle = (start + ((end - start) * step) / steps - 90) * Math.PI / 180
    points.push({ x: radius + radius * Math.cos(angle), y: radius + radius * Math.sin(angle) })
  }
  const path = `M ${points.map((point, index) => `${index === 0 ? '' : 'L '}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} Z`
  page.drawSvgPath(path, { x: centerX - radius, y: centerY + radius, color: color(fill), borderColor: rgb(1, 1, 1), borderWidth: 0.8 })
}

function drawCenterChart(page: PDFPage, fonts: Fonts, visual: ReturnType<typeof getResultVisualData>) {
  const x = 410
  page.drawText('Centros de inteligência', { x, y: 218, size: 11.5, font: fonts.bold, color: color(navy) })
  page.drawText('Percentuais das somas por centro · total arredondado para 100%', { x, y: 205, size: 6.8, font: fonts.regular, color: color(muted) })
  const centerX = x + 90
  const centerY = 120
  const radius = 72
  let angle = 0
  visual.centers.forEach(center => {
    const extent = (center.raw / (visual.total || 1)) * 360
    drawPieSlice(page, centerX, centerY, radius, angle, angle + extent, center.color)
    const middle = angle + extent / 2 - 90
    const labelX = centerX + Math.cos(middle * Math.PI / 180) * radius * 0.57
    const labelY = centerY - Math.sin(middle * Math.PI / 180) * radius * 0.57
    const label = `${center.percentage}%`
    page.drawText(label, { x: labelX - fonts.bold.widthOfTextAtSize(label, 9) / 2, y: labelY - 3, size: 9, font: fonts.bold, color: rgb(1, 1, 1) })
    angle += extent
  })
  visual.centers.forEach((center, index) => {
    const y = 155 - index * 22
    page.drawRectangle({ x: x + 196, y: y - 1, width: 9, height: 9, color: color(center.color) })
    page.drawText(center.name, { x: x + 212, y, size: 8, font: fonts.regular, color: color(muted) })
    drawRight(page, `${center.percentage}%`, pageWidth - margin, y, 8.2, fonts.bold, navy)
  })
}

function drawFooter(page: PDFPage, fonts: Fonts) {
  page.drawLine({ start: { x: margin, y: 34 }, end: { x: pageWidth - margin, y: 34 }, thickness: 0.5, color: color(lightRule) })
  const line1 = wrapText(method, fonts.regular, 6.5, pageWidth - margin * 2)
  const line2 = wrapText(disclaimer, fonts.regular, 6.5, pageWidth - margin * 2)
  page.drawText(line1[0], { x: margin, y: 22, size: 6.5, font: fonts.regular, color: color(muted) })
  page.drawText(line2[0], { x: margin, y: 12, size: 6.5, font: fonts.regular, color: color(muted) })
  drawRight(page, 'Deise A. Zardeto Bello  ·  Eneagrama', pageWidth - margin, 22, 6.5, fonts.bold, muted)
}

export function rankScoresForReport(result: ScoreResult): ScoreResult['scores'] {
  return [...result.scores].sort((a, b) => b.raw - a.raw || a.type - b.type)
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
  doc.setTitle('Eneagrama - Resultado')
  doc.setAuthor('Deise A. Zardeto Bello')
  const fonts: Fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) }
  const response = await fetch(`${import.meta.env.BASE_URL}branding/logo-original.png`)
  if (!response.ok) throw new Error('Não foi possível carregar a identidade visual do relatório.')
  const logo = await doc.embedPng(await response.arrayBuffer())
  const page = doc.addPage([pageWidth, pageHeight])
  const visual = getResultVisualData(result, type => getProfile(type).name)
  drawHeader(page, fonts, logo, performedAt, participantName)
  const title = 'Resultado Tipo Eneagrama'
  page.drawText(title, { x: (pageWidth - fonts.bold.widthOfTextAtSize(title, 19)) / 2, y: 488, size: 19, font: fonts.bold, color: color(navy) })
  if (result.leaders.length > 1) {
    const tieText = `Empate no topo: Tipos ${result.leaders.join(', ')} · ${result.topScore} pontos cada · sem desempate.`
    page.drawText(tieText, { x: (pageWidth - fonts.regular.widthOfTextAtSize(tieText, 7.5)) / 2, y: 475, size: 7.5, font: fonts.regular, color: color(muted) })
  }
  drawTypeTable(page, fonts, visual)
  drawBarChart(page, fonts, visual, result.leaders)
  drawCenterChart(page, fonts, visual)
  drawFooter(page, fonts)
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
