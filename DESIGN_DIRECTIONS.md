# Keys Angler — design direction (revamp in progress)

Modern reinterpretation of the **PSP/PS2-era Sony XMB "console dashboard"** look — dark
glass, a faint cyan "wave" wash, thin letter-spaced type, and a glowing cyan gauge —
executed crisply with modern CSS. Light theme is the same DNA in a bright, glare-legible
key. Keeps the existing bones (score ring, cards, custom line icons, bottom tab bar) and
the two-theme `data-theme` sea/sun model in `src/styles/theme.css`.

## LOCKED (2026-06-15): "XMB Drift", two keys

### Dark / "Sea" → **Option D · XMB Drift (dark)**
Near-black glassy console dashboard, neon-cyan accents + glow, thin spaced type.
Starter tokens (refine on build):
- `--bg:#05080c`, bg wash `radial-gradient(120% 60% at 20% -10%, rgba(54,224,240,.18), transparent 60%)` + faint diagonal cyan wave band
- panels: `background:rgba(255,255,255,.05)` glass, `border:1px solid rgba(54,224,240,.22)` with brighter top edge `rgba(54,224,240,.5)`
- `--accent:#36e0f0` (glow cyan) · `--accent-deep:#1d4650`
- `--text:#eafdff` · `--text-dim:#6fb9c6` · `--text-faint:#5b818a`
- gauge: cyan conic ring + glow; score number thin-weight, cyan text-shadow
- headers: `font-weight:300; letter-spacing:.18–.22em` (XMB signature)
- `--good:#36e0f0`/green glow · tab active = cyan with glow

### Light / "Sun" → **light version of D (bright XMB)**
Same DNA, bright key for hard sun: airy ice/sky background, frosted-white glass panels,
DARK teal ink for text (cyan reserved for fills/icons/gauge so contrast holds).
Starter tokens (refine on build):
- `--bg` soft `linear-gradient(#f6fdff,#dcf1f8 55%,#c4e8f4)` + faint cyan wave
- panels: frosted `rgba(255,255,255,.78)`, `border:1px solid #bfe3ee`, cyan top edge, soft shadow
- `--accent:#0a9bd0` (cyan darkened for contrast on white) · `--accent-deep:#0b6e93`
- `--text:#08323f` (deep teal ink) · `--text-dim:#3f6f7d` · `--text-faint:#6b97a3`
- gauge: cyan ring on light track, ink number; verdict "GO NOW" in `#0a9bd0`
- same thin letter-spaced headers, in ink

## Considered, not chosen
B "Brushed Helm" (dark instrument), C "Pearl OS" (iOS-6 light), E "Luna" (XP), F "Grunge Rig".
Kept here in case we want accents later (e.g. F's hazard stripe, B's brushed metal).

## Build notes (when implementing)
- Reskin only: tokens in `theme.css`, component gloss in `global.css`; do NOT touch
  engines/logic. Map every new color to the existing role vars (bg/surface/accent/
  good/caution/bad/text…) so components inherit automatically.
- Keep ≥48px tap targets, ≥11px text, glare legibility (the light theme must stay clean
  — dark ink on light, cyan only as accent/fill, never as body text).
- Gloss/glow via crisp CSS gradients + box-shadow (no raster textures); keep it sharp.
- The thin letter-spaced display type is the XMB signature — apply it to headers/labels,
  but keep body + numbers at normal weight for legibility on a rocking boat.
