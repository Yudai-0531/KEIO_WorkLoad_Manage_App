export interface Player {
  id: string
  name: string
  position: string
  goal_weight: number
  created_at: string
}

export interface PainArea {
  id: string
  name: string
  display_order: number
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

export interface TeamRPETarget {
  id: string
  week_start_date: string
  monday?: number
  tuesday?: number
  wednesday?: number
  thursday?: number
  friday?: number
  saturday?: number
  sunday?: number
  created_at: string
  updated_at: string
}

export interface WeeklyRPEData {
  date: string
  dayOfWeek: string
  targetRPE: number | null
  actualRPE: number | null
}
