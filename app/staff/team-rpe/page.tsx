'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamRPETarget, WeeklyRPEData } from '@/types'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function TeamRPEPage() {
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [weeks, setWeeks] = useState<string[]>([])
  const [targetData, setTargetData] = useState<TeamRPETarget | null>(null)
  const [chartData, setChartData] = useState<WeeklyRPEData[]>([])
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  })

  useEffect(() => {
    initializeWeeks()
  }, [])

  useEffect(() => {
    if (selectedWeek) {
      fetchWeekData(selectedWeek)
    }
  }, [selectedWeek])

  function initializeWeeks() {
    // 過去8週間と今週を含む週のリストを生成
    const weekList: string[] = []
    const today = new Date()
    
    for (let i = 8; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - (i * 7))
      const monday = getMonday(date)
      weekList.push(monday)
    }
    
    setWeeks(weekList)
    setSelectedWeek(weekList[weekList.length - 1]) // 最新の週を選択
    setLoading(false)
  }

  function getMonday(date: Date): string {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 月曜日に調整
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  }

  async function fetchWeekData(weekStart: string) {
    try {
      // 目標RPEデータを取得
      const { data: targetData, error: targetError } = await supabase
        .from('team_rpe_targets')
        .select('*')
        .eq('week_start_date', weekStart)
        .single()

      if (targetError && targetError.code !== 'PGRST116') {
        console.error('目標RPE取得エラー:', targetError)
      }

      setTargetData(targetData || null)

      // 実際のRPEデータを取得（その週の全選手の平均）
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('date, post_fatigue_rpe')
        .gte('date', weekStart)
        .lte('date', weekEndStr)
        .not('post_fatigue_rpe', 'is', null)

      if (logsError) {
        console.error('実際のRPE取得エラー:', logsError)
      }

      // 日付ごとにRPEを集計
      const dailyRPEMap = new Map<string, number[]>()
      logsData?.forEach(log => {
        if (!dailyRPEMap.has(log.date)) {
          dailyRPEMap.set(log.date, [])
        }
        dailyRPEMap.get(log.date)!.push(log.post_fatigue_rpe)
      })

      // 各曜日のデータを生成
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dayKeys: (keyof TeamRPETarget)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      const weekData: WeeklyRPEData[] = []
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart)
        currentDate.setDate(currentDate.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]
        
        const rpeValues = dailyRPEMap.get(dateStr) || []
        const avgRPE = rpeValues.length > 0 
          ? rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length 
          : null

        weekData.push({
          date: dateStr,
          dayOfWeek: dayNames[i],
          targetRPE: targetData ? (targetData[dayKeys[i]] as number | undefined) || null : null,
          actualRPE: avgRPE
        })
      }

      setChartData(weekData)

      // 編集モード用のフォームデータを設定
      if (targetData) {
        setFormData({
          monday: targetData.monday?.toString() || '',
          tuesday: targetData.tuesday?.toString() || '',
          wednesday: targetData.wednesday?.toString() || '',
          thursday: targetData.thursday?.toString() || '',
          friday: targetData.friday?.toString() || '',
          saturday: targetData.saturday?.toString() || '',
          sunday: targetData.sunday?.toString() || ''
        })
      } else {
        setFormData({
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: ''
        })
      }
    } catch (error) {
      console.error('週データ取得エラー:', error)
    }
  }

  async function handleSave() {
    if (!selectedWeek) return

    try {
      const dataToSave = {
        week_start_date: selectedWeek,
        monday: formData.monday ? parseFloat(formData.monday) : null,
        tuesday: formData.tuesday ? parseFloat(formData.tuesday) : null,
        wednesday: formData.wednesday ? parseFloat(formData.wednesday) : null,
        thursday: formData.thursday ? parseFloat(formData.thursday) : null,
        friday: formData.friday ? parseFloat(formData.friday) : null,
        saturday: formData.saturday ? parseFloat(formData.saturday) : null,
        sunday: formData.sunday ? parseFloat(formData.sunday) : null
      }

      const { error } = await supabase
        .from('team_rpe_targets')
        .upsert(dataToSave, { onConflict: 'week_start_date' })

      if (error) throw error

      alert('目標RPEを保存しました')
      setEditMode(false)
      fetchWeekData(selectedWeek)
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  function handleInputChange(day: string, value: string) {
    // 数値チェック（0-10の範囲）
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 10)) {
      setFormData(prev => ({
        ...prev,
        [day]: value
      }))
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
    <div className="min-h-screen bg-keio-blue p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-3 sm:mb-4 border-2 sm:border-4 border-keio-blue">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-keio-blue mb-1 sm:mb-2">
                TEAM RPE
              </h1>
              <p className="text-sm sm:text-base text-keio-blue">チーム目標RPE vs 実際のRPE</p>
            </div>
            <Link
              href="/staff/dashboard"
              className="bg-keio-red hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm"
            >
              ダッシュボード
            </Link>
          </div>
        </div>

        {/* 週選択 */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-3 sm:mb-4 border-2 border-keio-blue">
          <label className="block text-sm font-medium text-keio-blue mb-2">
            表示する週を選択
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
          >
            {weeks.map((week) => {
              const weekEnd = new Date(week)
              weekEnd.setDate(weekEnd.getDate() + 6)
              return (
                <option key={week} value={week}>
                  {week} 〜 {weekEnd.toISOString().split('T')[0]}
                </option>
              )
            })}
          </select>
        </div>

        {/* グラフ */}
        <div className="bg-white rounded-lg p-4 sm:p-6 mb-3 sm:mb-4 border-2 border-keio-blue">
          <h2 className="text-lg sm:text-xl font-bold text-keio-blue mb-4">
            週間RPE比較グラフ
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dayOfWeek" 
                stroke="#003893"
                style={{ fontSize: '14px', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#003893"
                domain={[0, 10]}
                style={{ fontSize: '14px', fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #003893',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="targetRPE" 
                name="目標RPE" 
                stroke="#DC143C" 
                strokeWidth={3}
                dot={{ fill: '#DC143C', r: 6 }}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="actualRPE" 
                name="実際のRPE" 
                stroke="#FFD700" 
                strokeWidth={3}
                dot={{ fill: '#FFD700', r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 目標RPE設定 */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-keio-blue">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-keio-blue">
              目標RPE設定
            </h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-keio-blue hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                編集
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-keio-gold hover:bg-yellow-500 text-keio-blue font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditMode(false)
                    fetchWeekData(selectedWeek)
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
              const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              const dayLabelsJP = ['月', '火', '水', '木', '金', '土', '日']
              return (
                <div key={day} className="border-2 border-keio-blue rounded-lg p-3">
                  <label className="block text-sm font-bold text-keio-blue mb-2">
                    {dayLabels[index]} ({dayLabelsJP[index]})
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData[day as keyof typeof formData]}
                      onChange={(e) => handleInputChange(day, e.target.value)}
                      className="w-full p-2 border-2 border-keio-blue rounded text-keio-blue font-semibold"
                      placeholder="0-10"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-keio-blue text-center py-2">
                      {formData[day as keyof typeof formData] || '-'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {editMode && (
            <div className="mt-4 p-3 bg-keio-gold rounded-lg">
              <p className="text-sm text-keio-blue">
                💡 各曜日の目標RPE（0〜10）を入力してください。空欄の場合、その曜日の目標は設定されません。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
