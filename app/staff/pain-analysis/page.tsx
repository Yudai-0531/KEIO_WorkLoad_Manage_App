'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog } from '@/types'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// 不調部位の定義
const PAIN_AREAS = [
  '右肩', '左肩', '右肘', '左肘', '右手首', '左手首',
  '腰', '右股関節', '左股関節', '右膝', '左膝', 
  '右足首', '左足首', 'その他'
]

interface PainData {
  date: string
  painCounts: { [key: string]: number }
  playersByPain: { [key: string]: string[] } // 部位ごとの選手名リスト
}

interface MonthlyData {
  month: string
  [key: string]: number | string // 各部位の件数
}

interface YearlyData {
  year: string
  [key: string]: number | string // 各部位の件数
}

type ViewMode = 'daily' | 'monthly' | 'yearly'

export default function PainAnalysisPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const [selectedPainArea, setSelectedPainArea] = useState<string | null>(null)

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
      setDailyLogs(logsData || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 選手IDから選手名を取得
  const getPlayerName = (playerId: string): string => {
    const player = players.find(p => p.id === playerId)
    return player ? player.name : '不明'
  }

  // 日次データの計算
  const getDailyPainData = (): PainData => {
    const painCounts: { [key: string]: number } = {}
    const playersByPain: { [key: string]: string[] } = {}

    PAIN_AREAS.forEach(area => {
      painCounts[area] = 0
      playersByPain[area] = []
    })

    const logsForDate = dailyLogs.filter(log => log.date === selectedDate)
    
    logsForDate.forEach(log => {
      // プレー前の不調部位
      if (log.pre_pain_area && log.pre_pain_area !== 'なし' && log.pre_pain_area !== '') {
        const areas = log.pre_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            painCounts[area] = (painCounts[area] || 0) + 1
            if (!playersByPain[area]) playersByPain[area] = []
            const playerName = getPlayerName(log.player_id)
            if (!playersByPain[area].includes(playerName)) {
              playersByPain[area].push(playerName)
            }
          }
        })
      }

      // プレー後の不調部位
      if (log.post_pain_area && log.post_pain_area !== 'なし' && log.post_pain_area !== '') {
        const areas = log.post_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            painCounts[area] = (painCounts[area] || 0) + 1
            if (!playersByPain[area]) playersByPain[area] = []
            const playerName = getPlayerName(log.player_id)
            if (!playersByPain[area].includes(playerName)) {
              playersByPain[area].push(playerName)
            }
          }
        })
      }
    })

    return { date: selectedDate, painCounts, playersByPain }
  }

  // 月次データの計算
  const getMonthlyPainData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, { [key: string]: number }>()

    dailyLogs.forEach(log => {
      const month = log.date.slice(0, 7) // YYYY-MM形式
      
      if (!monthlyMap.has(month)) {
        const counts: { [key: string]: number } = {}
        PAIN_AREAS.forEach(area => counts[area] = 0)
        monthlyMap.set(month, counts)
      }

      const counts = monthlyMap.get(month)!

      // プレー前の不調部位
      if (log.pre_pain_area && log.pre_pain_area !== 'なし' && log.pre_pain_area !== '') {
        const areas = log.pre_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            counts[area]++
          }
        })
      }

      // プレー後の不調部位
      if (log.post_pain_area && log.post_pain_area !== 'なし' && log.post_pain_area !== '') {
        const areas = log.post_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            counts[area]++
          }
        })
      }
    })

    return Array.from(monthlyMap.entries())
      .map(([month, counts]) => ({
        month,
        ...counts
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  // 年次データの計算
  const getYearlyPainData = (): YearlyData[] => {
    const yearlyMap = new Map<string, { [key: string]: number }>()

    dailyLogs.forEach(log => {
      const year = log.date.slice(0, 4) // YYYY形式
      
      if (!yearlyMap.has(year)) {
        const counts: { [key: string]: number } = {}
        PAIN_AREAS.forEach(area => counts[area] = 0)
        yearlyMap.set(year, counts)
      }

      const counts = yearlyMap.get(year)!

      // プレー前の不調部位
      if (log.pre_pain_area && log.pre_pain_area !== 'なし' && log.pre_pain_area !== '') {
        const areas = log.pre_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            counts[area]++
          }
        })
      }

      // プレー後の不調部位
      if (log.post_pain_area && log.post_pain_area !== 'なし' && log.post_pain_area !== '') {
        const areas = log.post_pain_area.split(',').map(a => a.trim())
        areas.forEach(area => {
          if (PAIN_AREAS.includes(area)) {
            counts[area]++
          }
        })
      }
    })

    return Array.from(yearlyMap.entries())
      .map(([year, counts]) => ({
        year,
        ...counts
      }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }

  // カラーパレット（部位ごとの色）
  const getColorForPainArea = (index: number): string => {
    const colors = [
      '#0066CC', '#CC0033', '#FFB81C', '#6A1B9A', '#00897B',
      '#E65100', '#C62828', '#558B2F', '#0277BD', '#5D4037',
      '#AD1457', '#00695C', '#F57C00', '#303F9F'
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-keio-blue text-xl">読み込み中...</div>
      </div>
    )
  }

  const dailyData = viewMode === 'daily' ? getDailyPainData() : null
  const monthlyData = viewMode === 'monthly' ? getMonthlyPainData() : []
  const yearlyData = viewMode === 'yearly' ? getYearlyPainData() : []

  return (
    <div className="min-h-screen bg-keio-blue p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4 border-4 border-keio-blue">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold text-keio-blue mb-2">
                不調部位分析
              </h1>
              <p className="text-keio-blue">チームの不調部位データを統計分析</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/staff/team-analysis"
                className="bg-keio-blue hover:bg-blue-900 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center min-h-[60px] flex items-center justify-center shadow-md"
              >
                チーム分析
              </Link>
              <Link
                href="/staff/dashboard"
                className="bg-keio-blue hover:bg-blue-900 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center min-h-[60px] flex items-center justify-center shadow-md"
              >
                ダッシュボード
              </Link>
              <Link
                href="/"
                className="bg-keio-red hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-center min-h-[60px] flex items-center justify-center shadow-md"
              >
                ホームへ
              </Link>
            </div>
          </div>
        </div>

        {/* 表示モード切替 */}
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-keio-blue">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'daily'
                  ? 'bg-keio-blue text-white'
                  : 'bg-gray-200 text-keio-blue hover:bg-gray-300'
              }`}
            >
              日次表示
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-keio-blue text-white'
                  : 'bg-gray-200 text-keio-blue hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'yearly'
                  ? 'bg-keio-blue text-white'
                  : 'bg-gray-200 text-keio-blue hover:bg-gray-300'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* 日次表示 */}
        {viewMode === 'daily' && dailyData && (
          <>
            {/* 日付選択 */}
            <div className="bg-white rounded-lg p-4 mb-4 border-2 border-keio-blue">
              <label className="block text-keio-blue font-semibold mb-2">日付を選択:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedPainArea(null)
                }}
                className="w-full md:w-auto px-4 py-2 border-2 border-keio-blue rounded-lg text-keio-blue"
              />
            </div>

            {/* 不調部位カウント */}
            <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
              <h2 className="text-2xl font-bold text-keio-blue mb-4">
                {selectedDate} の不調部位件数
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {PAIN_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedPainArea(selectedPainArea === area ? null : area)}
                    className={`p-4 rounded-lg font-semibold transition-all ${
                      selectedPainArea === area
                        ? 'bg-keio-blue text-white shadow-lg scale-105'
                        : dailyData.painCounts[area] > 0
                        ? 'bg-keio-gold text-keio-blue hover:bg-yellow-400'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-sm">{area}</div>
                    <div className="text-2xl mt-1">{dailyData.painCounts[area]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 選手リスト */}
            {selectedPainArea && dailyData.playersByPain[selectedPainArea]?.length > 0 && (
              <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
                <h3 className="text-xl font-bold text-keio-blue mb-3">
                  {selectedPainArea} の不調を報告した選手
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dailyData.playersByPain[selectedPainArea].map((playerName, idx) => (
                    <span
                      key={idx}
                      className="bg-keio-gold text-keio-blue px-4 py-2 rounded-lg font-semibold"
                    >
                      {playerName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 月次表示 */}
        {viewMode === 'monthly' && (
          <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
            <h2 className="text-2xl font-bold text-keio-blue mb-4">
              月別不調部位件数
            </h2>
            {monthlyData.length > 0 ? (
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {PAIN_AREAS.map((area, index) => (
                      <Bar
                        key={area}
                        dataKey={area}
                        fill={getColorForPainArea(index)}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-keio-blue text-center py-8">データがありません</p>
            )}
          </div>
        )}

        {/* 年次表示 */}
        {viewMode === 'yearly' && (
          <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
            <h2 className="text-2xl font-bold text-keio-blue mb-4">
              年別不調部位件数
            </h2>
            {yearlyData.length > 0 ? (
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {PAIN_AREAS.map((area, index) => (
                      <Bar
                        key={area}
                        dataKey={area}
                        fill={getColorForPainArea(index)}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-keio-blue text-center py-8">データがありません</p>
            )}
          </div>
        )}

        {/* 参考情報 */}
        <div className="bg-white rounded-lg p-4 border-2 border-keio-blue">
          <h3 className="font-semibold text-keio-blue mb-2">使い方</h3>
          <ul className="text-sm text-keio-blue space-y-1">
            <li>• <span className="font-medium">日次表示</span>: カレンダーで日付を選択し、その日の不調部位件数を表示</li>
            <li>• <span className="font-medium">不調部位ボタン</span>: クリックすると、その部位を報告した選手のリストを表示</li>
            <li>• <span className="font-medium">Monthly</span>: 月別の不調部位件数を積み上げ棒グラフで表示</li>
            <li>• <span className="font-medium">Year</span>: 年別の不調部位件数を積み上げ棒グラフで表示</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
