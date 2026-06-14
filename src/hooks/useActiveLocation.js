import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { HOME_PORT } from '../config.js'

// Active fishing location (defaults to the home port until the user sets one).
export function useActiveLocation() {
  const loc = useLiveQuery(async () => (await db.settings.get('activeLocation'))?.value, [], undefined)
  return loc || HOME_PORT
}

export const setActiveLocation = (value) => db.settings.put({ key: 'activeLocation', value })
export const resetActiveLocation = () => db.settings.delete('activeLocation')
