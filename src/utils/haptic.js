// Haptics with a small semantic vocabulary so actions feel distinct without looking
// (wet hands, glare). No-op where unsupported / on desktop. haptic() still takes a
// raw ms for back-compat; haptic.logged()/tick()/window()/error() are named patterns.
const buzz = (p) => { try { navigator.vibrate?.(p) } catch { /* unsupported */ } }

export const haptic = (ms = 12) => buzz(ms)
haptic.tick = () => buzz(10)              // light confirm
haptic.logged = () => buzz([18, 40, 18])  // catch logged — double pulse
haptic.window = () => buzz([24, 50, 24, 50, 24]) // bite window ON — triple buzz
haptic.error = () => buzz([60])           // something failed — one thud
