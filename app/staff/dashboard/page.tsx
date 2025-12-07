'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog, ChartData } from '@/types'
import WorkloadChart from '@/components/WorkloadChart'
import Link from 'next/link'

export default function StaffDashboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('team-average')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    if (selectedPlayerId) {
      if (selectedPlayerId === 'team-average') {
        fetchTeamAverageData()
      } else {
        fetchPlayerData(selectedPlayerId)
      }
    }
  }, [selectedPlayerId])

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) throw error
      setPlayers(data || [])
      
      // デフォルトでチーム平均を表示
      setSelectedPlayerId('team-average')
    } catch (error) {
      console.error('選手データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlayerData(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('player_id', playerId)
        .order('date', { ascending: false })
        .limit(28)

      if (error) throw error

      const chartData: ChartData[] = (data || [])
        .filter(log => log.srpe !== null && log.acwr !== null)
        .map(log => ({
          date: log.date,
          srpe: log.srpe || 0,
          acwr: log.acwr || 0,
        }))

      setChartData(chartData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    }
  }

  async function fetchTeamAverageData() {
    try {
      // 全選手のデータを取得
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      // 日付ごとにグループ化して平均を計算
      const dateMap = new Map<string, { srpe: number[], acwr: number[] }>()
      
      data?.forEach(log => {
        if (log.srpe !== null && log.acwr !== null) {
          if (!dateMap.has(log.date)) {
            dateMap.set(log.date, { srpe: [], acwr: [] })
          }
          dateMap.get(log.date)!.srpe.push(log.srpe)
          dateMap.get(log.date)!.acwr.push(log.acwr)
        }
      })

      // 平均値を計算してChartDataに変換
      const chartData: ChartData[] = Array.from(dateMap.entries())
        .map(([date, values]) => ({
          date,
          srpe: values.srpe.reduce((a, b) => a + b, 0) / values.srpe.length,
          acwr: values.acwr.reduce((a, b) => a + b, 0) / values.acwr.length,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-28) // 直近28日分

      setChartData(chartData)
    } catch (error) {
      console.error('チーム平均データ取得エラー:', error)
    }
  }

  const selectedPlayer = selectedPlayerId === 'team-average' 
    ? null 
    : players.find(p => p.id === selectedPlayerId)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-keio-blue text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-keio-blue p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4 border-4 border-keio-blue">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-keio-blue mb-2">
                スタッフダッシュボード
              </h1>
              <p className="text-keio-blue">チームのワークロード管理</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/staff/manage"
                className="bg-keio-blue hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                データ管理
              </Link>
              <Link
                href="/staff/pain-analysis"
                className="bg-keio-gold hover:bg-yellow-500 text-keio-blue font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                不調部位分析
              </Link>
              <Link
                href="/staff/team-analysis"
                className="bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                チーム分析
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

        {/* 選手選択 */}
        <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
          <label className="block text-sm font-medium text-keio-blue mb-2">
            表示データを選択
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
          >
            <option value="team-average">チーム平均</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.position})
              </option>
            ))}
          </select>
        </div>

        {/* 選手情報カード */}
        {selectedPlayerId === 'team-average' ? (
          <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
            <h2 className="text-xl font-bold text-keio-blue mb-4">
              チーム全体の情報
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-keio-blue">選手数</p>
                <p className="text-lg font-semibold text-keio-blue">
                  {players.length} 名
                </p>
              </div>
              <div>
                <p className="text-sm text-keio-blue">データ日数</p>
                <p className="text-lg font-semibold text-keio-blue">
                  {chartData.length} 日分
                </p>
              </div>
              <div>
                <p className="text-sm text-keio-blue">表示内容</p>
                <p className="text-lg font-semibold text-keio-blue">
                  全選手の平均
                </p>
              </div>
            </div>
          </div>
        ) : selectedPlayer && (
          <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
            <h2 className="text-xl font-bold text-keio-blue mb-4">
              {selectedPlayer.name} の情報
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-keio-blue">ポジション</p>
                <p className="text-lg font-semibold text-keio-blue">
                  {selectedPlayer.position}
                </p>
              </div>
              <div>
                <p className="text-sm text-keio-blue">目標体重</p>
                <p className="text-lg font-semibold text-keio-blue">
                  {selectedPlayer.goal_weight} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-keio-blue">データ件数</p>
                <p className="text-lg font-semibold text-keio-blue">
                  {chartData.length} 日分
                </p>
              </div>
            </div>
          </div>
        )}

        {/* グラフ */}
        {chartData.length > 0 ? (
          <WorkloadChart data={chartData} />
        ) : (
          <div className="bg-white rounded-lg p-12 text-center border-2 border-keio-blue">
            <p className="text-keio-blue">
              この選手のデータがまだありません
            </p>
          </div>
        )}

        {/* 統計情報 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg p-6 mt-4 border-2 border-keio-blue">
            <h2 className="text-xl font-bold text-keio-blue mb-4">
              直近7日間の統計
              {selectedPlayerId === 'team-average' && (
                <span className="text-sm font-normal ml-2">(チーム平均)</span>
              )}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                <p className="text-sm text-keio-blue mb-1">平均sRPE</p>
                <p className="text-2xl font-bold text-keio-blue">
                  {(chartData.slice(-7).reduce((sum, d) => sum + d.srpe, 0) / Math.min(7, chartData.length)).toFixed(0)}
                </p>
              </div>
              <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                <p className="text-sm text-keio-blue mb-1">平均ACWR</p>
                <p className="text-2xl font-bold text-keio-blue">
                  {(chartData.slice(-7).reduce((sum, d) => sum + d.acwr, 0) / Math.min(7, chartData.length)).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                <p className="text-sm text-keio-blue mb-1">最大sRPE</p>
                <p className="text-2xl font-bold text-keio-blue">
                  {Math.max(...chartData.slice(-7).map(d => d.srpe)).toFixed(0)}
                </p>
              </div>
              <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                <p className="text-sm text-keio-blue mb-1">最大ACWR</p>
                <p className="text-2xl font-bold text-keio-blue">
                  {Math.max(...chartData.slice(-7).map(d => d.acwr)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
