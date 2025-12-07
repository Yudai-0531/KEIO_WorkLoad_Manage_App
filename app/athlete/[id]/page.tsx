'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, DailyLog } from '@/types'
import { calculateSRPE, calculateACWR } from '@/lib/calculations'

const PAIN_AREAS = ['なし', '右肩', '左肩', '右肘', '左肘', '右膝', '左膝', '腰', '右足首', '左足首', 'その他']

export default function AthletePage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-white text-xl">選手が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-dark p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-navy-dark">
            {player.name} ({player.position})
          </h1>
          <p className="text-gray-600">目標体重: {player.goal_weight}kg</p>
        </div>

        {/* 日付選択 */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日付
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
          />
        </div>

        {/* タブ切り替え */}
        <div className="bg-white rounded-lg p-2 mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('pre')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
              activeTab === 'pre'
                ? 'bg-purple-accent text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            プレー前入力
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
              activeTab === 'post'
                ? 'bg-purple-accent text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            プレー後入力
          </button>
        </div>

        {/* プレー前入力フォーム */}
        {activeTab === 'pre' && (
          <div className="bg-white rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
                placeholder="例: 70.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                睡眠時間 (時間)
              </label>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
                placeholder="例: 7.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (軽い)</span>
                <span>10 (非常に重い)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 (最悪)</span>
                <span>100 (最高)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                不調部位
              </label>
              <select
                value={prePainArea}
                onChange={(e) => setPrePainArea(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
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
              className="w-full bg-purple-accent hover:bg-purple-deep text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : 'プレー前データを保存'}
            </button>
          </div>
        )}

        {/* プレー後入力フォーム */}
        {activeTab === 'post' && (
          <div className="bg-white rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (軽い)</span>
                <span>10 (非常に重い)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                運動時間 (分) *必須
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
                placeholder="例: 90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                不調部位
              </label>
              <select
                value={postPainArea}
                onChange={(e) => setPostPainArea(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-gray-900"
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
              className="w-full bg-purple-accent hover:bg-purple-deep text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : 'プレー後データを保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
