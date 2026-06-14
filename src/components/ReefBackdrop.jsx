// Subtle layered reef silhouette — a quiet watermark for the dashboard hero.
// Theme-aware (uses --accent at low opacity); purely decorative.
export default function ReefBackdrop() {
  return (
    <svg className="reef-backdrop" viewBox="0 0 400 88" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 88V58c34-9 52 5 92-2s54-19 104-13 70 14 120 6 56 6 84 2v37z" fill="var(--accent)" opacity="0.09" />
      <path d="M0 88V70c46-7 78 4 128-3s84 7 134 1 76 8 138 2v18z" fill="var(--accent)" opacity="0.07" />
      <g opacity="0.13" fill="var(--accent)">
        <path d="M60 88c2-12 4-16 6-22 2 6 4 10 6 22z" />
        <path d="M210 88c2-16 5-22 7-30 3 8 5 14 7 30z" />
        <path d="M330 88c2-10 4-14 5-20 2 6 4 10 6 20z" />
      </g>
    </svg>
  )
}
