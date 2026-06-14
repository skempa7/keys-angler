import { useEffect, useState } from 'react'
import { db } from '../db/db.js'
import { useRewards } from '../hooks/useRewards.js'

// Subtle global toast on a new badge or rank-up. First-ever load initializes the
// "seen" state silently so retroactive achievements don't spam.
export default function RewardsToast() {
  const r = useRewards()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const rec = await db.settings.get('rewardsSeen')
      const earnedIds = r.badges.filter((b) => b.earned).map((b) => b.id)
      if (!rec) {
        await db.settings.put({ key: 'rewardsSeen', value: { level: r.level, badges: earnedIds } })
        return
      }
      const seen = rec.value
      const newBadge = r.badges.find((b) => b.earned && !seen.badges.includes(b.id))
      const leveled = r.level > (seen.level || 1)
      if (newBadge || leveled) {
        await db.settings.put({ key: 'rewardsSeen', value: { level: r.level, badges: earnedIds } })
        if (!cancelled) {
          setToast(newBadge ? `${newBadge.icon} Badge unlocked — ${newBadge.name}` : `⚓ Rank up — you're now ${r.rank}`)
          setTimeout(() => !cancelled && setToast(null), 3800)
        }
      }
    })()
    return () => { cancelled = true }
  }, [r.xp, r.level, r.earnedCount])

  if (!toast) return null
  return <div className="rewards-toast" role="status">{toast}</div>
}
