// Share-a-catch card v2 → PNG. Built around the app's own visual language: a
// time-of-day sky (from the catch hour), a drawn moon for that night, a bite-score
// badge, a fish silhouette, and the bundled display font.
const DISP = "'Space Grotesk', -apple-system, 'Helvetica Neue', Arial, sans-serif"
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif"
const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

const skyFor = (h) => {
  if (h < 5 || h >= 20) return ['#0b1b34', '#050d16']
  if (h < 8) return ['#3b3a5e', '#0a131e']
  if (h < 17) return ['#0c2c39', '#06141b']
  return ['#51401f', '#08131a']
}
const scoreTone = (s) => (s == null ? '#36c5f0' : s >= 78 ? '#3ddc84' : s >= 60 ? '#8fd14f' : s >= 42 ? '#f2c14e' : '#e8854e')
const illumFor = (name = '') => {
  const base = /New/.test(name) ? 0.04 : /Crescent/.test(name) ? 0.25 : /Quarter/.test(name) ? 0.5 : /Gibbous/.test(name) ? 0.78 : /Full/.test(name) ? 1 : 0.5
  return { illum: base, waning: /Waning|Last/.test(name) }
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = (text || '').split(' ')
  let line = ''; const lines = []
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh))
  return lines.length
}

function drawFish(x, cx, cy, w, color) {
  const h = w * 0.42
  x.save(); x.fillStyle = color; x.beginPath()
  x.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.moveTo(cx + w / 2 - 6, cy)
  x.lineTo(cx + w / 2 + w * 0.22, cy - h * 0.5); x.lineTo(cx + w / 2 + w * 0.22, cy + h * 0.5)
  x.closePath(); x.fill()
  x.restore()
}

function drawMoon(x, cx, cy, r, name) {
  const { illum, waning } = illumFor(name)
  x.save()
  x.fillStyle = '#f2c14e'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill()
  const shade = Math.max(0, 1 - illum) // fraction of the disc in shadow
  if (shade > 0.02) {
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip()
    x.fillStyle = 'rgba(8,16,26,0.95)'
    const w = shade * 2 * r
    // waxing → lit on the right (shade the left); waning → lit on the left (shade the right)
    x.fillRect(waning ? cx + r - w : cx - r, cy - r, w, r * 2)
  }
  x.restore()
}

export async function shareCatchCard(c) {
  try { await document.fonts?.ready } catch { /* ignore */ }
  const S = 1080
  const canvas = document.createElement('canvas'); canvas.width = S; canvas.height = S
  const x = canvas.getContext('2d')

  const [c0, c1] = skyFor(new Date(c.caughtAt).getHours())
  const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, c0); g.addColorStop(1, c1)
  x.fillStyle = g; x.fillRect(0, 0, S, S)

  // moon high in the sky for night/low-light catches
  if (c.moonPhase) drawMoon(x, S - 210, 210, 64, c.moonPhase)

  // subtle fish silhouette behind the title
  drawFish(x, S / 2 - 30, 430, 560, 'rgba(54,197,240,0.08)')

  // reef silhouette along the bottom
  x.fillStyle = 'rgba(54,197,240,0.10)'; x.beginPath(); x.moveTo(0, S); x.lineTo(0, S - 150)
  for (let i = 0; i <= S; i += 60) x.lineTo(i, S - 150 + Math.sin(i / 80) * 22)
  x.lineTo(S, S); x.closePath(); x.fill()

  x.strokeStyle = '#16404f'; x.lineWidth = 4; x.strokeRect(40, 40, S - 80, S - 80)

  x.textAlign = 'center'
  x.fillStyle = '#36c5f0'; x.font = `700 34px ${DISP}`
  x.fillText('KEYS ANGLER', S / 2, 140)

  // bite-score badge (if captured)
  if (c.scoreAtCatch != null) {
    x.textAlign = 'left'
    x.fillStyle = scoreTone(c.scoreAtCatch); x.font = `800 52px ${DISP}`
    x.fillText(`${c.scoreAtCatch}`, 95, 230)
    x.fillStyle = '#7fa7b6'; x.font = `700 22px ${SANS}`
    x.fillText('BITE', 96, 262)
    x.textAlign = 'center'
  }

  x.fillStyle = '#eaf6fb'; x.font = `700 90px ${DISP}`
  wrapText(x, c.species, S / 2, 430, S - 220, 100)

  if (c.lengthIn) {
    x.fillStyle = '#f2c14e'; x.font = `800 132px ${DISP}`
    x.fillText(`${c.lengthIn}"${c.weightLb ? `  ·  ${c.weightLb} lb` : ''}`, S / 2, 610)
  }

  const cond = c.cond || {}
  const sub = [fmtDate(c.caughtAt), c.tide, c.bait, cond.windKn != null ? `${Math.round(cond.windKn)} kn` : null, cond.sstF != null ? `${Math.round(cond.sstF)}°F` : null].filter(Boolean)
  x.fillStyle = '#a3c4d0'; x.font = `400 38px ${SANS}`
  x.fillText(sub.join('   ·   '), S / 2, 720)
  if (c.moonPhase) { x.fillStyle = '#6f97a4'; x.font = `400 32px ${SANS}`; x.fillText(c.moonPhase, S / 2, 772) }

  x.fillStyle = '#36c5f0'; x.font = `700 30px ${DISP}`
  x.fillText('UPPER FLORIDA KEYS', S / 2, S - 90)

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  const file = new File([blob], 'keys-angler-catch.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: c.species, text: `${c.species} — Keys Angler` }) } catch { /* cancelled */ }
  } else {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'keys-angler-catch.png'; a.click(); URL.revokeObjectURL(url)
  }
}
