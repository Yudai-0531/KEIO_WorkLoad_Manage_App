'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog } from '@/types'
import { calculateSRPE, calculateACWR } from '@/lib/calculations'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts'

const PAIN_AREAS = ['なし', '右肩', '左肩', '右肘', '左肘', '右膝', '左膝', '腰', '右足首', '左足首', 'その他']

export default function AthletePage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [activeTab, setActiveTab] = useState<'pre' | 'post' | 'record'>('pre')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recordData, setRecordData] = useState<DailyLog[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  // フォームデータ
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [preFatigueRpe, setPreFatigueRpe] = useState(5)
  const [preConditionVas, setPreConditionVas] = useState(50)
  const [prePainArea, setPrePainArea] = useState('なし')
  const [postFatigueRpe, setPostFatigueRpe] = useState(5)
  const [durationMinutes, setDurationMinutes] = useState('')
  const [postPainArea, setPostPainArea] = useState('なし')

  useEffect(() => {
    fetchPlayer()
    fetchRecordData()
  }, [playerId])

  async function fetchPlayer() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) throw error
      setPlayer(data)
    } catch (error) {
      console.error('選手データの取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecordData() {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('player_id', playerId)
        .order('date', { ascending: false })
        .limit(28)

      if (error) throw error
      setRecordData(data || [])
      
      // チャートデータの整形
      const chartData = (data || [])
        .filter(log => log.srpe !== null && log.acwr !== null)
        .map(log => ({
          date: log.date,
          dateFormatted: new Date(log.date).toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric'
          }),
          srpe: log.srpe || 0,
          acwr: log.acwr || 0,
        }))
        .reverse()
      
      setChartData(chartData)
    } catch (error) {
      console.error('記録データの取得エラー:', error)
    }
  }

  async function handleSubmitPre() {
    if (!player) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          player_id: playerId,
          date,
          weight: parseFloat(weight) || null,
          sleep_hours: parseFloat(sleepHours) || null,
          pre_fatigue_rpe: preFatigueRpe,
          pre_condition_vas: preConditionVas,
          pre_pain_area: prePainArea,
        }, {
          onConflict: 'player_id,date'
        })

      if (error) throw error
      alert('プレー前データを保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitPost() {
    if (!player || !durationMinutes) {
      alert('運動時間を入力してください')
      return
    }

    setSaving(true)
    try {
      const duration = parseFloat(durationMinutes)
      const srpe = calculateSRPE(duration, postFatigueRpe)

      // 保存
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          player_id: playerId,
          date,
          post_fatigue_rpe: postFatigueRpe,
          duration_minutes: duration,
          post_pain_area: postPainArea,
          srpe,
        }, {
          onConflict: 'player_id,date'
        })

      if (error) throw error

      // ACWR再計算
      await recalculateACWR()

      alert('プレー後データを保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  async function recalculateACWR() {
    try {
      // 過去28日分のデータを取得
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('player_id', playerId)
        .order('date', { ascending: false })
        .limit(28)

      if (!logs) return

      // 各日のACWRを再計算
      for (const log of logs) {
        const acwr = calculateACWR(logs, log.date)
        await supabase
          .from('daily_logs')
          .update({ acwr })
          .eq('id', log.id)
      }
    } catch (error) {
      console.error('ACWR再計算エラー:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-keio-blue text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-keio-blue text-xl">選手が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-keio-blue p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4 border-4 border-keio-blue">
          <button
            onClick={() => router.push('/')}
            className="text-keio-blue hover:text-keio-gold mb-4 font-semibold"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-keio-blue">
            {player.name} ({player.position})
          </h1>
          <p className="text-keio-blue">目標体重: {player.goal_weight}kg</p>
        </div>

        {/* 日付選択 */}
        <div className="bg-white rounded-lg p-6 mb-4 border-2 border-keio-blue">
          <label className="block text-sm font-medium text-keio-blue mb-2">
            日付
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
          />
        </div>

        {/* タブ切り替え */}
        <div className="bg-white rounded-lg p-2 mb-4 flex gap-2 border-2 border-keio-blue">
          <button
            onClick={() => setActiveTab('pre')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'pre'
                ? 'bg-keio-blue text-white'
                : 'bg-white text-keio-blue hover:bg-keio-gold border-2 border-keio-blue'
            }`}
          >
            プレー前入力
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'post'
                ? 'bg-keio-blue text-white'
                : 'bg-white text-keio-blue hover:bg-keio-gold border-2 border-keio-blue'
            }`}
          >
            プレー後入力
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'record'
                ? 'bg-keio-blue text-white'
                : 'bg-white text-keio-blue hover:bg-keio-gold border-2 border-keio-blue'
            }`}
          >
            記録
          </button>
        </div>

        {/* プレー前入力フォーム */}
        {activeTab === 'pre' && (
          <div className="bg-white rounded-lg p-6 space-y-6 border-2 border-keio-blue">
            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                placeholder="例: 70.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                睡眠時間 (時間)
              </label>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                placeholder="例: 7.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                主観的疲労度: {preFatigueRpe}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={preFatigueRpe}
                onChange={(e) => setPreFatigueRpe(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-keio-blue">
                <span>1 (軽い)</span>
                <span>10 (非常に重い)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                体調VAS: {preConditionVas}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preConditionVas}
                onChange={(e) => setPreConditionVas(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-keio-blue">
                <span>0 (最悪)</span>
                <span>100 (最高)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                不調部位
              </label>
              <select
                value={prePainArea}
                onChange={(e) => setPrePainArea(e.target.value)}
                className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
              >
                {PAIN_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmitPre}
              disabled={saving}
              className="w-full bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : 'プレー前データを保存'}
            </button>
          </div>
        )}

        {/* プレー後入力フォーム */}
        {activeTab === 'post' && (
          <div className="bg-white rounded-lg p-6 space-y-6 border-2 border-keio-blue">
            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                練習後疲労度 RPE: {postFatigueRpe}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={postFatigueRpe}
                onChange={(e) => setPostFatigueRpe(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-keio-blue">
                <span>1 (軽い)</span>
                <span>10 (非常に重い)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                運動時間 (分) *必須
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                placeholder="例: 90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-keio-blue mb-2">
                不調部位
              </label>
              <select
                value={postPainArea}
                onChange={(e) => setPostPainArea(e.target.value)}
                className="w-full p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
              >
                {PAIN_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmitPost}
              disabled={saving}
              className="w-full bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : 'プレー後データを保存'}
            </button>
          </div>
        )}

        {/* 記録タブ */}
        {activeTab === 'record' && (
          <div className="space-y-4">
            {/* 統計情報 */}
            <div className="bg-white rounded-lg p-6 border-2 border-keio-blue">
              <h2 className="text-xl font-bold text-keio-blue mb-4">
                直近7日間の統計
              </h2>
              {recordData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-keio-blue">
                    <p className="text-sm text-keio-blue mb-1">平均体重</p>
                    <p className="text-2xl font-bold text-keio-blue">
                      {(recordData.slice(0, 7).filter(d => d.weight).reduce((sum, d) => sum + (d.weight || 0), 0) / 
                        Math.max(1, recordData.slice(0, 7).filter(d => d.weight).length)).toFixed(1)} kg
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-keio-blue">
                    <p className="text-sm text-keio-blue mb-1">平均睡眠時間</p>
                    <p className="text-2xl font-bold text-keio-blue">
                      {(recordData.slice(0, 7).filter(d => d.sleep_hours).reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / 
                        Math.max(1, recordData.slice(0, 7).filter(d => d.sleep_hours).length)).toFixed(1)} h
                    </p>
                  </div>
                  <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                    <p className="text-sm text-keio-blue mb-1">平均sRPE</p>
                    <p className="text-2xl font-bold text-keio-blue">
                      {recordData.slice(0, 7).filter(d => d.srpe).length > 0
                        ? (recordData.slice(0, 7).filter(d => d.srpe).reduce((sum, d) => sum + (d.srpe || 0), 0) / 
                           recordData.slice(0, 7).filter(d => d.srpe).length).toFixed(0)
                        : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-keio-gold rounded-lg border-2 border-keio-blue">
                    <p className="text-sm text-keio-blue mb-1">平均ACWR</p>
                    <p className="text-2xl font-bold text-keio-blue">
                      {recordData.slice(0, 7).filter(d => d.acwr).length > 0
                        ? (recordData.slice(0, 7).filter(d => d.acwr).reduce((sum, d) => sum + (d.acwr || 0), 0) / 
                           recordData.slice(0, 7).filter(d => d.acwr).length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-keio-blue text-center py-4">データがまだありません</p>
              )}
            </div>

            {/* グラフ */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-lg p-6 border-2 border-keio-blue">
                <h2 className="text-xl font-bold text-keio-blue mb-4">
                  ワークロード推移
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    
                    <XAxis 
                      dataKey="dateFormatted" 
                      stroke="#0E1546"
                      style={{ fontSize: '12px' }}
                    />
                    
                    <YAxis 
                      yAxisId="left" 
                      stroke="#0E1546"
                      style={{ fontSize: '12px' }}
                    >
                      <Label 
                        value="sRPE" 
                        angle={-90} 
                        position="insideLeft" 
                        style={{ textAnchor: 'middle', fill: '#0E1546' }}
                      />
                    </YAxis>
                    
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      domain={[0, 2]}
                      stroke="#0E1546"
                      style={{ fontSize: '12px' }}
                    >
                      <Label 
                        value="ACWR" 
                        angle={90} 
                        position="insideRight" 
                        style={{ textAnchor: 'middle', fill: '#0E1546' }}
                      />
                    </YAxis>
                    
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #0E1546',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'srpe') return [value, 'sRPE']
                        if (name === 'acwr') return [value.toFixed(2), 'ACWR']
                        return [value, name]
                      }}
                    />
                    
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => {
                        if (value === 'srpe') return 'sRPE (負荷)'
                        if (value === 'acwr') return 'ACWR (比率)'
                        return value
                      }}
                    />
                    
                    {/* sRPE棒グラフ */}
                    <Bar 
                      yAxisId="left" 
                      dataKey="srpe" 
                      fill="#FDD34C"
                      radius={[8, 8, 0, 0]}
                    />
                    
                    {/* ACWR折れ線グラフ */}
                    <Line 
                      yAxisId="right" 
                      type="monotone"
                      dataKey="acwr" 
                      stroke="#C4232D"
                      strokeWidth={2}
                      dot={{ fill: '#C4232D', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 詳細データテーブル */}
            <div className="bg-white rounded-lg p-6 border-2 border-keio-blue">
              <h2 className="text-xl font-bold text-keio-blue mb-4">
                詳細データ（直近14日）
              </h2>
              {recordData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-keio-blue">
                        <th className="text-left p-2 text-keio-blue">日付</th>
                        <th className="text-right p-2 text-keio-blue">体重</th>
                        <th className="text-right p-2 text-keio-blue">睡眠</th>
                        <th className="text-right p-2 text-keio-blue">体調</th>
                        <th className="text-right p-2 text-keio-blue">sRPE</th>
                        <th className="text-right p-2 text-keio-blue">ACWR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordData.slice(0, 14).map((log) => (
                        <tr key={log.id} className="border-b border-keio-blue">
                          <td className="p-2 text-keio-blue">
                            {new Date(log.date).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="text-right p-2 text-keio-blue">
                            {log.weight ? `${log.weight} kg` : '-'}
                          </td>
                          <td className="text-right p-2 text-keio-blue">
                            {log.sleep_hours ? `${log.sleep_hours} h` : '-'}
                          </td>
                          <td className="text-right p-2 text-keio-blue">
                            {log.pre_condition_vas !== null ? log.pre_condition_vas : '-'}
                          </td>
                          <td className="text-right p-2 text-keio-blue">
                            {log.srpe ? log.srpe.toFixed(0) : '-'}
                          </td>
                          <td className={`text-right p-2 font-semibold ${
                            log.acwr && (log.acwr < 0.8 || log.acwr > 1.3)
                              ? 'text-keio-red'
                              : 'text-keio-blue'
                          }`}>
                            {log.acwr ? log.acwr.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-keio-blue text-center py-4">データがまだありません</p>
              )}
            </div>

            {/* 参考情報 */}
            <div className="bg-white rounded-lg p-4 border-2 border-keio-blue">
              <h3 className="font-semibold text-keio-blue mb-2">ACWRリスク範囲</h3>
              <ul className="text-sm text-keio-blue space-y-1">
                <li>• <span className="font-medium">0.8～1.3</span>: 安全範囲</li>
                <li>• <span className="font-medium text-keio-gold">0.8未満 または 1.3～1.5</span>: 注意</li>
                <li>• <span className="font-medium text-keio-red">1.5超</span>: 高リスク</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
