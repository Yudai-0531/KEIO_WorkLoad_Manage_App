export interface Player {
  id: string
  name: string
  position: string
  goal_weight: number
  created_at: string
}

export interface DailyLog {
  id: string
  player_id: string
  date: string
  // Pre-Practice
  weight?: number
  sleep_hours?: number
  pre_fatigue_rpe?: number
  pre_condition_vas?: number
  pre_pain_area?: string
  // Post-Practice
  post_fatigue_rpe?: number
  duration_minutes?: number
  post_pain_area?: string
  // Calculated
  srpe?: number
  acwr?: number
  created_at: string
}

export interface ChartData {
  date: string
  srpe: number
  acwr: number
}
