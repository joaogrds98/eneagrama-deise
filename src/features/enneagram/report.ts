import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import { getProfile } from './profiles'
import type { ScoreResult } from './types'

const navy = rgb(0.03, 0.15, 0.34)
const gold = rgb(0.78, 0.59, 0.29)
const muted = rgb(0.35, 0.4, 0.47)
const paper = rgb(0.98, 0.98, 0.97)
const disclaimer = 'Questionário Emotional Coaching: 135 afirmações, 15 por tipo, respostas de 1 a 5 e soma de 15 a 75. Cada percentual é a soma do tipo dividida pela soma dos nove tipos. Empates são preservados. Percentuais não são probabilidade, precisão nem comparação populacional. Este relatório não substitui avaliação profissional.'

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

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, color = navy, leading = size * 1.5): number {
  for (const line of wrapText(text, font, size, width)) {
    page.drawText(line, { x, y, size, font, color })
    y -= leading
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
  doc.setTitle('Eneagrama — Relatório de autoconhecimento')
  doc.setAuthor('Deise A. Zardeto')
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const logoResponse = await fetch(`${import.meta.env.BASE_URL}branding/logo-original.png`)
  if (!logoResponse.ok) throw new Error('Não foi possível carregar a identidade visual do relatório.')
  const logo = await doc.embedPng(await logoResponse.arrayBuffer())
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(performedAt)
  const margin = 48
  const width = 595.28
  const height = 841.89
  let page = doc.addPage([width, height])
  page.drawRectangle({ x: 0, y: height - 14, width, height: 14, color: navy })
  page.drawImage(logo, { x: margin, y: height - 130, width: 80, height: 80 })
  page.drawText('Deise A. Zardeto', { x: 144, y: height - 75, size: 16, font: bold, color: navy })
  page.drawText('Psicologia Clínica e Neuropsicologia', { x: 144, y: height - 94, size: 8, font: regular, color: muted })
  page.drawText('Relatório de autoconhecimento · Eneagrama', { x: 144, y: height - 109, size: 9, font: regular, color: muted })
  let dividerY: number
  if (participantName.trim()) {
    const nameEnd = drawWrapped(page, participantName.trim(), bold, 12, 144, height - 128, width - margin - 144, navy, 14)
    const dateY = nameEnd - 2
    page.drawText(date, { x: 144, y: dateY, size: 9, font: regular, color: muted })
    dividerY = dateY - 14
  } else {
    page.drawText(date, { x: 144, y: height - 128, size: 9, font: regular, color: muted })
    dividerY = height - 158
  }
  page.drawLine({ start: { x: margin, y: dividerY }, end: { x: width - margin, y: dividerY }, thickness: 1, color: gold })
  let y = dividerY - 39
  const ensureSpace = (needed: number) => {
    if (y - needed < 70) {
      page = doc.addPage([width, height])
      page.drawText('ENEAGRAMA · CONTINUAÇÃO', { x: margin, y: height - 49, size: 10, font: bold, color: navy })
      page.drawLine({ start: { x: margin, y: height - 61 }, end: { x: width - margin, y: height - 61 }, thickness: 1, color: gold })
      y = height - 86
    }
  }
  const leaders = result.leaders.map(type => `${type} · ${getProfile(type).name}`)
  page.drawText(result.dominantType ? 'TIPO COM MAIOR PONTUAÇÃO' : 'PONTUAÇÕES MAIS ALTAS EM EMPATE', { x: margin, y, size: 9, font: bold, color: gold })
  y -= 34
  const headline = result.dominantType ? `Tipo ${leaders[0]}` : leaders.join('  /  ')
  y = drawWrapped(page, headline, bold, result.dominantType ? 23 : 15, margin, y, width - margin * 2, navy, 27) - 12
  if (result.dominantType) {
    const profile = getProfile(result.dominantType)
    y = drawWrapped(page, profile.summary, regular, 11, margin, y, width - margin * 2) - 20
    const sections = [
      ['Características frequentemente associadas', profile.traits.join(' · ')],
      ['Potenciais pontos fortes', profile.strengths],
      ['Possíveis desafios', profile.challenges],
      ['Para refletir', profile.reflection],
    ]
    for (const [label, body] of sections) {
      page.drawText(label, { x: margin, y, size: 10, font: bold, color: navy })
      y -= 17
      y = drawWrapped(page, body, regular, 10, margin, y, width - margin * 2, muted) - 10
    }
  } else {
    y = drawWrapped(page, 'O instrumento não distingue um único tipo neste conjunto de respostas. Observe os tipos empatados e use as descrições como pontos de reflexão.', regular, 10, margin, y, width - margin * 2, muted) - 18
    for (const type of result.leaders) {
      const profile = getProfile(type)
      ensureSpace(70)
      page.drawText(`Tipo ${type} · ${profile.name}`, { x: margin, y, size: 10, font: bold, color: navy })
      y -= 15
      y = drawWrapped(page, profile.summary, regular, 9, margin, y, width - margin * 2, muted, 12) - 4
      y = drawWrapped(page, `Para refletir: ${profile.reflection}`, regular, 9, margin, y, width - margin * 2, muted, 12) - 11
    }
  }
  ensureSpace(290)
  page.drawText('Distribuição dos nove tipos', { x: margin, y, size: 13, font: bold, color: navy })
  y -= 24
  const barX = margin + 128
  const barWidth = width - margin * 2 - 224
  for (const score of result.scores) {
    const isLeader = result.leaders.includes(score.type)
    page.drawText(`${score.type} · ${getProfile(score.type).name}`, { x: margin, y, size: 9, font: isLeader ? bold : regular, color: navy })
    page.drawRectangle({ x: barX, y: y - 1, width: barWidth, height: 9, color: paper })
    page.drawRectangle({ x: barX, y: y - 1, width: barWidth * ((score.raw - score.minimum) / (score.maximum - score.minimum)), height: 9, color: isLeader ? gold : navy })
    page.drawText(`${score.raw}/${score.maximum} · ${score.percentage.toFixed(1)}%`, { x: width - margin - 86, y, size: 9, font: isLeader ? bold : regular, color: navy })
    y -= 19
  }
  y -= 7
  y = drawWrapped(page, 'As barras mostram a posição da soma no intervalo de 15 a 75. Os percentuais representam a participação de cada soma no total das nove.', regular, 8, margin, y, width - margin * 2, muted, 12) - 14
  ensureSpace(64)
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: gold })
  y -= 20
  drawWrapped(page, disclaimer, regular, 8, margin, y, width - margin * 2, muted, 12)
  for (const [index, pdfPage] of doc.getPages().entries()) {
    pdfPage.drawText(`Deise A. Zardeto   |   ${index + 1}/${doc.getPageCount()}`, { x: margin, y: 28, size: 8, font: regular, color: muted })
  }
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
