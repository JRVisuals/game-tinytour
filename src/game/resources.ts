import type { Resources } from './types'

/** Starting outfit stub — economy TBD */
export function createStartingResources(budget = 200): Resources {
  return {
    cash: budget,
    food: 3,
    beer: 2,
    drugs: 0,
    tickets: 0,
    gas: 0,
    hasVehicle: false,
  }
}

export const RESOURCE_LABELS: Record<keyof Resources, string> = {
  cash: 'Cash',
  food: 'Food',
  beer: 'Beer',
  drugs: 'Substances',
  tickets: 'Tickets',
  gas: 'Gas',
  hasVehicle: 'Vehicle',
}
