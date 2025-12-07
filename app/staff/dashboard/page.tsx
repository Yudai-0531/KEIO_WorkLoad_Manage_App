'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog, ChartData } from '@/types'
import WorkloadChart from '@/components/WorkloadChart'
import Link from 'next/link'

export default function StaffDashboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    if (selectedPlayerId) {
      fetchPlayerData(selectedPlayerId)
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
      
      // 最初の選手を自動選択
      if (data && data.length > 0) {
        setSelectedPlayerId(data[0].id)
      }
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

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-dark p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-navy-dark mb-2">
                スタッフダッシュボード
              </h1>
              <p className="text-gray-600">チームのワークロード管理</p>
            </div>
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              ホームへ
            </Link>
          </div>
        </div>

        {/* 選手選択 */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            選手を選択
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.position})
              </option>
            ))}
          </select>
        </div>

        {/* 選手情報カード */}
        {selectedPlayer && (
          <div className="bg-white rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-navy-dark mb-4">
              {selectedPlayer.name} の情報
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">ポジション</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPlayer.position}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">目標体重</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPlayer.goal_weight} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">データ件数</p>
                <p className="text-lg font-semibold text-gray-900">
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
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600">
              この選手のデータがまだありません
            </p>
          </div>
        )}

        {/* 統計情報 */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg p-6 mt-4">
            <h2 className="text-xl font-bold text-navy-dark mb-4">
              直近7日間の統計
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">平均sRPE</p>
                <p className="text-2xl font-bold text-purple-accent">
                  {(chartData.slice(0, 7).reduce((sum, d) => sum + d.srpe, 0) / Math.min(7, chartData.length)).toFixed(0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">平均ACWR</p>
                <p className="text-2xl font-bold text-purple-accent">
                  {(chartData.slice(0, 7).reduce((sum, d) => sum + d.acwr, 0) / Math.min(7, chartData.length)).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">最大sRPE</p>
                <p className="text-2xl font-bold text-purple-accent">
                  {Math.max(...chartData.slice(0, 7).map(d => d.srpe))}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">最大ACWR</p>
                <p className="text-2xl font-bold text-purple-accent">
                  {Math.max(...chartData.slice(0, 7).map(d => d.acwr)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
