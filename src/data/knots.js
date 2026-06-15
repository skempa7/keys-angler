// Offline knot & rig reference — the connections the species playbooks name but
// never show. Step text is the real value (works with no signal); the diagram is
// a schematic aid. `kind` selects the diagram in KnotDiagram.
export const KNOTS = [
  {
    id: 'fg', name: 'FG Knot', cat: 'Line-to-leader', kind: 'braid-leader',
    useFor: 'Braid → fluoro leader. Thin, strong, casts through the guides — the offshore & flats standard.',
    steps: [
      'Put the braid under tension (loop it on a foot or a rod butt).',
      'Lay the leader across the braid; wrap the braid over-then-under the leader ~20 times, alternating sides.',
      'Pin the wraps, then lock with 2–3 half-hitches of braid around the leader.',
      'Trim the leader tag close; finish with a few half-hitches over both, trim braid.',
    ],
  },
  {
    id: 'double-uni', name: 'Double Uni', cat: 'Line-to-leader', kind: 'twist',
    useFor: 'Quick, reliable braid/mono to leader join when you can\'t tie an FG on a rolling deck.',
    steps: [
      'Overlap the two lines a few inches.',
      'With one tag, make a loop and wrap back through it 5–6 times (4 for mono); snug.',
      'Repeat with the other tag, 5–6 wraps; snug.',
      'Pull the standing lines apart so the two knots slide together; trim tags.',
    ],
  },
  {
    id: 'loop', name: 'Non-Slip Loop', cat: 'Knot-to-lure', kind: 'loop',
    useFor: 'Open loop at the lure/jig/fly so it swings freely — more action, more bites on the flats.',
    steps: [
      'Tie an overhand knot a few inches up the leader; pass the tag through the hook eye and back through the overhand.',
      'Wrap the tag around the standing line 5–6 times (light leader) or 4 (heavy).',
      'Pass the tag back through the overhand knot the same way it exited.',
      'Lube and seat slowly; trim. Loop size ≈ a dime.',
    ],
  },
  {
    id: 'clinch', name: 'Improved Clinch', cat: 'Knot-to-hook', kind: 'coil',
    useFor: 'Fast, snug hook/swivel tie for mono & fluoro to ~30 lb. The everyday workhorse.',
    steps: [
      'Thread the eye, make 5–7 wraps around the standing line.',
      'Pass the tag through the small loop by the eye, then back through the big loop you just made.',
      'Lube and pull the standing line; let the wraps seat evenly. Trim.',
    ],
  },
  {
    id: 'haywire', name: 'Haywire Twist', cat: 'Wire', kind: 'twist',
    useFor: 'Single-strand wire to hook for kings, wahoo & \'cuda — the only join that holds in wire.',
    steps: [
      'Pass wire through the eye, form a loop, and make 4–5 true twists (both wires wrapping each other, not one around the other).',
      'Follow with 4–5 tight barrel wraps.',
      'Crank the tag into a handle and rock it back and forth until it snaps clean — never cut wire (leaves a gaff point).',
    ],
  },
  {
    id: 'bimini', name: 'Bimini Twist', cat: 'Double line', kind: 'twist',
    useFor: 'A 100% double line for offshore leaders & IGFA work; the base of a wind-on.',
    steps: [
      'Double ~5 ft of line; put 20 twists in it (knees or a buddy holds the loop).',
      'Spread the loop to roll the twists back over themselves down to the column.',
      'Lock with a half-hitch around one leg, then both, then a 4–5 turn rosette; trim.',
    ],
  },
  {
    id: 'snell', name: 'Snell', cat: 'Knot-to-hook', kind: 'coil',
    useFor: 'Straight-line pull to a J-hook for live bait & bottom rigs — better hook-sets on muttons & grouper.',
    steps: [
      'Pass the leader through the eye twice, leaving a loop along the shank.',
      'Wrap the loop around the shank and leader 6–8 times, working toward the eye.',
      'Hold the wraps, pull the standing leader to close; seat against the eye. Trim.',
    ],
  },
  {
    id: 'knocker', name: 'Knocker Rig', cat: 'Rig', kind: 'knocker',
    useFor: 'Egg sinker riding right to the hook — yellowtail, mutton & grouper on the reef; weight stays pinned to the bait so you feel the bite.',
    steps: [
      'Slide an egg sinker onto the leader (size to hold bottom in the current).',
      'Tie the hook directly below it (snell or clinch) — sinker rests on the eye.',
      'Match leader to clarity: 15–20 lb fluoro clear water, heavier on the wrecks.',
    ],
  },
  {
    id: 'stinger', name: 'Stinger / Wire Rig', cat: 'Rig', kind: 'stinger',
    useFor: 'Trailing treble on a wire trace for short-striking kingfish & \'cuda on slow-trolled or live baits.',
    steps: [
      'Haywire-twist a single-strand wire trace to your main hook through the bait\'s nose.',
      'Add a short wire dropper with a small treble (the stinger) set near the bait\'s tail.',
      'Pin the stinger lightly so it pulls free on the strike.',
    ],
  },
  {
    id: 'freeline', name: 'Chum Free-line', cat: 'Rig', kind: 'freeline',
    useFor: 'No weight, just hook & bait drifting back naturally in a chum slick — the yellowtail killer.',
    steps: [
      'Start a chum slick; small hook (1/0–2/0), light fluoro, no weight.',
      'Pin a bait chunk and free-spool it back into the slick at the chum\'s speed.',
      'If the bite is deep, add the smallest split shot that gets you there.',
    ],
  },
]

export const KNOT_CATS = ['Line-to-leader', 'Knot-to-hook', 'Knot-to-lure', 'Wire', 'Double line', 'Rig']
