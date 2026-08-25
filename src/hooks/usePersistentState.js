import { useEffect, useState } from 'react'
import {
  readPersistentValue,
  writePersistentValue
} from '../services/professionalTerminalPersistence.js'

function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function usePersistentState(key, normalize) {
  const [value, setValue] = useState(() => readPersistentValue(browserStorage(), key, normalize))

  useEffect(() => {
    writePersistentValue(browserStorage(), key, value)
  }, [key, value])

  return [value, setValue]
}
