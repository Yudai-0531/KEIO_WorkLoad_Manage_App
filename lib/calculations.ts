import { DailyLog } from '@/types'

/**
 * sRPE (Session Rating of Perceived Exertion) を計算
 * sRPE = 運動時間(分) × 練習後RPE
 */
export function calculateSRPE(durationMinutes: number, postFatigueRPE: number): number {
  return durationMinutes * postFatigueRPE
}

/**
 * ACWR (Acute:Chronic Workload Ratio) を計算
 * Acute Load = 過去7日間の平均sRPE
 * Chronic Load = 過去28日間の平均sRPE
 * ACWR = Acute Load / Chronic Load
 */
export function calculateACWR(logs: DailyLog[], targetDate: string): number {
  const target = new Date(targetDate)
  
  // 過去28日間のログを取得
  const last28Days = logs.filter(log => {
    const logDate = new Date(log.date)
    const diffDays = Math.floor((target.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays < 28 && log.srpe !== null && log.srpe !== undefined
  })
  
  if (last28Days.length < 7) {
    return 0 // データ不足
  }
  
  // 過去7日間のログ（Acute）
  const last7Days = last28Days.filter(log => {
    const logDate = new Date(log.date)
    const diffDays = Math.floor((target.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 7
  })
  
  if (last7Days.length === 0) {
    return 0
  }
  
  // 平均を計算
  const acuteLoad = last7Days.reduce((sum, log) => sum + (log.srpe || 0), 0) / last7Days.length
  const chronicLoad = last28Days.reduce((sum, log) => sum + (log.srpe || 0), 0) / last28Days.length
  
  if (chronicLoad === 0) {
    return 0
  }
  
  return acuteLoad / chronicLoad
}

/**
 * ACWRリスクレベルを判定
 */
export function getACWRRiskLevel(acwr: number): 'safe' | 'warning' | 'danger' {
  if (acwr >= 0.8 && acwr <= 1.3) {
    return 'safe'
  } else if (acwr < 0.8 || (acwr > 1.3 && acwr <= 1.5)) {
    return 'warning'
  } else {
    return 'danger'
  }
}
