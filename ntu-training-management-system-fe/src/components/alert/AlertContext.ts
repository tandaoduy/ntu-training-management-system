import { createContext } from 'react'

import type { AlertContextValue } from './types'

export const AlertContext = createContext<AlertContextValue | undefined>(undefined)
