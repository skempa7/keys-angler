// Render a shareable catch card to a PNG (canvas) and share/download it.
const FONT = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = (text || '').split(' ')
  let line = ''
  const lines = []
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh))
}

export async function shareCatchCard(c) {
  const S = 1080
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const x = canvas.getContext('2d')

  const g = x.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#0c2c39')
  g.addColorStop(1, '#06141b')
  x.fillStyle = g
  x.fillRect(0, 0, S, S)

  // reef silhouette along the bottom
  x.fillStyle = 'rgba(54,197,240,0.10)'
  x.beginPath()
  x.moveTo(0, S)
  x.lineTo(0, S - 150)
  for (let i = 0; i <= S; i += 60) x.lineTo(i, S - 150 + Math.sin(i / 80) * 22)
  x.lineTo(S, S)
  x.closePath()
  x.fill()

  x.strokeStyle = '#16404f'
  x.lineWidth = 4
  x.strokeRect(40, 40, S - 80, S - 80)

  x.textAlign = 'center'
  x.fillStyle = '#36c5f0'
  x.font = `700 34px ${FONT}`
  x.fillText('K E Y S   A N G L E R', S / 2, 150)

  x.fillStyle = '#eaf6fb'
  x.font = `800 92px ${FONT}`
  wrapText(x, c.species, S / 2, 400, S - 200, 104)

  if (c.lengthIn) {
    x.fillStyle = '#f2c14e'
    x.font = `800 128px ${FONT}`
    x.fillText(`${c.lengthIn}"${c.weightLb ? `  ·  ${c.weightLb} lb` : ''}`, S / 2, 600)
  }

  x.fillStyle = '#a3c4d0'
  x.font = `400 40px ${FONT}`
  x.fillText([fmtDate(c.caughtAt), c.tide, c.bait].filter(Boolean).join('   ·   '), S / 2, 710)
  if (c.moonPhase) {
    x.fillStyle = '#6f97a4'
    x.font = `400 34px ${FONT}`
    x.fillText(c.moonPhase, S / 2, 770)
  }

  x.fillStyle = '#36c5f0'
  x.font = `700 30px ${FONT}`
  x.fillText('UPPER FLORIDA KEYS', S / 2, S - 95)

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  const file = new File([blob], 'keys-angler-catch.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: c.species, text: `${c.species} — Keys Angler` }) } catch { /* cancelled */ }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'keys-angler-catch.png'
    a.click()
    URL.revokeObjectURL(url)
  }
}
