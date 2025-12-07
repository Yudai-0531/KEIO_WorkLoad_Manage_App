'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog, ChartData } from '@/types'
import WorkloadChart from '@/components/WorkloadChart'
import Link from 'next/link'

interface PlayerStats {
  id: string
  name: string
  position: string
  avgWeight: number
  avgSleepHours: number
  avgPreFatigueRpe: number
  avgPreConditionVas: number
  avgPostFatigueRpe: number
  avgDurationMinutes: number
  avgSRPE: number
  avgACWR: number
  dataCount: number
}

export default function TeamAnalysisPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // 選手データを取得
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (playersError) throw playersError

      // 全ログデータを取得
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .order('date', { ascending: false })

      if (logsError) throw logsError

      setPlayers(playersData || [])

      // 各選手の統計を計算
      const stats: PlayerStats[] = (playersData || []).map(player => {
        const playerLogs = (logsData || []).filter(log => log.player_id === player.id)
        const recentLogs = playerLogs.slice(0, 28) // 直近28日

        const weightLogs = recentLogs.filter(log => log.weight !== null)
        const sleepLogs = recentLogs.filter(log => log.sleep_hours !== null)
        const preFatigueRpeLogs = recentLogs.filter(log => log.pre_fatigue_rpe !== null)
        const preConditionVasLogs = recentLogs.filter(log => log.pre_condition_vas !== null)
        const postFatigueRpeLogs = recentLogs.filter(log => log.post_fatigue_rpe !== null)
        const durationLogs = recentLogs.filter(log => log.duration_minutes !== null)
        const srpeLogs = recentLogs.filter(log => log.srpe !== null)
        const acwrLogs = recentLogs.filter(log => log.acwr !== null)

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          avgWeight: weightLogs.length > 0 
            ? weightLogs.reduce((sum, log) => sum + (log.weight || 0), 0) / weightLogs.length 
            : 0,
          avgSleepHours: sleepLogs.length > 0
            ? sleepLogs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / sleepLogs.length
            : 0,
          avgPreFatigueRpe: preFatigueRpeLogs.length > 0
            ? preFatigueRpeLogs.reduce((sum, log) => sum + (log.pre_fatigue_rpe || 0), 0) / preFatigueRpeLogs.length
            : 0,
          avgPreConditionVas: preConditionVasLogs.length > 0
            ? preConditionVasLogs.reduce((sum, log) => sum + (log.pre_condition_vas || 0), 0) / preConditionVasLogs.length
            : 0,
          avgPostFatigueRpe: postFatigueRpeLogs.length > 0
            ? postFatigueRpeLogs.reduce((sum, log) => sum + (log.post_fatigue_rpe || 0), 0) / postFatigueRpeLogs.length
            : 0,
          avgDurationMinutes: durationLogs.length > 0
            ? durationLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / durationLogs.length
            : 0,
          avgSRPE: srpeLogs.length > 0
            ? srpeLogs.reduce((sum, log) => sum + (log.srpe || 0), 0) / srpeLogs.length
            : 0,
          avgACWR: acwrLogs.length > 0
            ? acwrLogs.reduce((sum, log) => sum + (log.acwr || 0), 0) / acwrLogs.length
            : 0,
          dataCount: recentLogs.length
        }
      })

      setPlayerStats(stats)

      // チーム全体のチャートデータを作成（日付ごとの平均）
      const dateMap = new Map<string, { srpe: number[], acwr: number[] }>()
      
      logsData?.forEach(log => {
        if (log.srpe !== null && log.acwr !== null) {
          if (!dateMap.has(log.date)) {
            dateMap.set(log.date, { srpe: [], acwr: [] })
          }
          dateMap.get(log.date)!.srpe.push(log.srpe)
          dateMap.get(log.date)!.acwr.push(log.acwr)
        }
      })

      // 平均値を計算してChartDataに変換
      const teamChartData: ChartData[] = Array.from(dateMap.entries())
        .map(([date, values]) => ({
          date,
          srpe: values.srpe.reduce((a, b) => a + b, 0) / values.srpe.length,
          acwr: values.acwr.reduce((a, b) => a + b, 0) / values.acwr.length,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-28) // 直近28日分

      setChartData(teamChartData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-keio-blue text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-keio-blue p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4 border-4 border-keio-blue">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-keio-blue mb-2">
                チーム分析
              </h1>
              <p className="text-keio-blue">各選手の平均データとチーム全体のワークロード推移</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/staff/dashboard"
                className="bg-keio-blue hover:bg-blue-900 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                ダッシュボード
              </Link>
              <Link
                href="/"
                className="bg-keio-red hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                ホームへ
              </Link>
            </div>
          </div>
        </div>

        {/* チーム全体のグラフ */}
        {chartData.length > 0 ? (
          <div className="mb-4">
            <WorkloadChart data={chartData} />
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 mb-4 text-center border-2 border-keio-blue">
            <p className="text-keio-blue">チームデータがまだありません</p>
          </div>
        )}

        {/* 選手別統計テーブル */}
        <div className="bg-white rounded-lg p-6 border-2 border-keio-blue">
          <h2 className="text-2xl font-bold text-keio-blue mb-4">
            選手別平均データ（直近28日間）
          </h2>
          
          {playerStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-keio-blue">
                    <th className="text-left p-3 text-keio-blue whitespace-nowrap">選手名</th>
                    <th className="text-left p-3 text-keio-blue whitespace-nowrap">ポジション</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均体重<br/>(kg)</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均睡眠<br/>(時間)</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均疲労度<br/>(プレー前)</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均体調<br/>(VAS)</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均疲労度<br/>(プレー後)</th>
                    <th className="text-right p-3 text-keio-blue whitespace-nowrap">平均運動時間<br/>(分)</th>
                    <th className="text-right p-3 text-keio-blue bg-keio-gold whitespace-nowrap">平均sRPE</th>
                    <th className="text-right p-3 text-keio-blue bg-keio-gold whitespace-nowrap">平均ACWR</th>
                    <th className="text-center p-3 text-keio-blue whitespace-nowrap">データ数</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((stat) => (
                    <tr key={stat.id} className="border-b border-keio-blue hover:bg-keio-gold hover:bg-opacity-20">
                      <td className="p-3 text-keio-blue font-semibold whitespace-nowrap">{stat.name}</td>
                      <td className="p-3 text-keio-blue whitespace-nowrap">{stat.position}</td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgWeight > 0 ? stat.avgWeight.toFixed(1) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgSleepHours > 0 ? stat.avgSleepHours.toFixed(1) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgPreFatigueRpe > 0 ? stat.avgPreFatigueRpe.toFixed(1) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgPreConditionVas > 0 ? stat.avgPreConditionVas.toFixed(0) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgPostFatigueRpe > 0 ? stat.avgPostFatigueRpe.toFixed(1) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue">
                        {stat.avgDurationMinutes > 0 ? stat.avgDurationMinutes.toFixed(0) : '-'}
                      </td>
                      <td className="text-right p-3 text-keio-blue font-semibold bg-keio-gold bg-opacity-30">
                        {stat.avgSRPE > 0 ? stat.avgSRPE.toFixed(0) : '-'}
                      </td>
                      <td className={`text-right p-3 font-semibold bg-keio-gold bg-opacity-30 ${
                        stat.avgACWR > 0 && (stat.avgACWR < 0.8 || stat.avgACWR > 1.3)
                          ? 'text-keio-red'
                          : 'text-keio-blue'
                      }`}>
                        {stat.avgACWR > 0 ? stat.avgACWR.toFixed(2) : '-'}
                      </td>
                      <td className="text-center p-3 text-keio-blue">{stat.dataCount}日</td>
                    </tr>
                  ))}
                </tbody>
                {/* チーム平均行を追加 */}
                <tfoot>
                  <tr className="border-t-2 border-keio-blue bg-keio-gold bg-opacity-50">
                    <td className="p-3 text-keio-blue font-bold whitespace-nowrap" colSpan={2}>
                      チーム平均
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgWeight > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgWeight, 0) / 
                           playerStats.filter(s => s.avgWeight > 0).length).toFixed(1)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgSleepHours > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgSleepHours, 0) / 
                           playerStats.filter(s => s.avgSleepHours > 0).length).toFixed(1)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgPreFatigueRpe > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgPreFatigueRpe, 0) / 
                           playerStats.filter(s => s.avgPreFatigueRpe > 0).length).toFixed(1)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgPreConditionVas > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgPreConditionVas, 0) / 
                           playerStats.filter(s => s.avgPreConditionVas > 0).length).toFixed(0)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgPostFatigueRpe > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgPostFatigueRpe, 0) / 
                           playerStats.filter(s => s.avgPostFatigueRpe > 0).length).toFixed(1)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgDurationMinutes > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgDurationMinutes, 0) / 
                           playerStats.filter(s => s.avgDurationMinutes > 0).length).toFixed(0)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgSRPE > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgSRPE, 0) / 
                           playerStats.filter(s => s.avgSRPE > 0).length).toFixed(0)
                        : '-'}
                    </td>
                    <td className="text-right p-3 text-keio-blue font-bold">
                      {playerStats.filter(s => s.avgACWR > 0).length > 0
                        ? (playerStats.reduce((sum, s) => sum + s.avgACWR, 0) / 
                           playerStats.filter(s => s.avgACWR > 0).length).toFixed(2)
                        : '-'}
                    </td>
                    <td className="text-center p-3 text-keio-blue font-bold">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-keio-blue text-center py-4">選手データがありません</p>
          )}
        </div>

        {/* 参考情報 */}
        <div className="bg-white rounded-lg p-4 mt-4 border-2 border-keio-blue">
          <h3 className="font-semibold text-keio-blue mb-2">データの見方</h3>
          <ul className="text-sm text-keio-blue space-y-1">
            <li>• 各選手の直近28日間の平均値を表示しています</li>
            <li>• グラフはチーム全体の日次平均値の推移を表示しています</li>
            <li>• <span className="font-medium">ACWR 0.8～1.3</span>: 安全範囲</li>
            <li>• <span className="font-medium text-keio-gold">ACWR 0.8未満 または 1.3～1.5</span>: 注意</li>
            <li>• <span className="font-medium text-keio-red">ACWR 1.5超</span>: 高リスク</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
