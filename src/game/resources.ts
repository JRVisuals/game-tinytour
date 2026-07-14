import { BALANCE } from './config'
import type { Resources } from './types'

const R = BALANCE.resources

export function createStartingResources(budget = R.defaultBudget): Resources {
  return {
    cash: budget,
    food: R.startingFood,
    beer: R.startingBeer,
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

export { R as RESOURCE_BALANCE }
