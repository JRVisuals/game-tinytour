import { useGame } from '../game/GameContext'
import { CrewCreateScreen } from '../screens/CrewCreateScreen'
import { DayJobScreen } from '../screens/DayJobScreen'
import { PreDayJobScreen } from '../screens/PreDayJobScreen'
import { LocationScreen } from '../screens/LocationScreen'
import { PostShowScreen } from '../screens/PostShowScreen'
import { PostShowShakedownScreen } from '../screens/PostShowShakedownScreen'
import { RunRecapScreen } from '../screens/RunRecapScreen'
import { ShakedownScreen } from '../screens/ShakedownScreen'
import { ShowScreen } from '../screens/ShowScreen'
import { StatsScreen } from '../screens/StatsScreen'
import { TitleScreen } from '../screens/TitleScreen'
import { TravelScreen } from '../screens/TravelScreen'

export function PhaseRouter() {
  const { state } = useGame()
  switch (state.phase) {
    case 'title':
      return <TitleScreen />
    case 'crew':
      return <CrewCreateScreen />
    case 'stats':
      return <StatsScreen />
    case 'travel':
      return <TravelScreen />
    case 'shakedown':
      return <ShakedownScreen />
    case 'location':
      return <LocationScreen />
    case 'show':
      return <ShowScreen />
    case 'post_show':
      return <PostShowScreen />
    case 'post_show_shakedown':
      return <PostShowShakedownScreen />
    case 'run_recap':
      return <RunRecapScreen />
    case 'pre_day_job':
      return <PreDayJobScreen />
    case 'day_job':
      return <DayJobScreen />
  }
}
