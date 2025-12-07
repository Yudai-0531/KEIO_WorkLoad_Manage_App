'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, PainArea } from '@/types'
import Link from 'next/link'
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react'

export default function ManagePage() {
  // 選手管理の状態
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerPosition, setNewPlayerPosition] = useState('')
  const [newPlayerGoalWeight, setNewPlayerGoalWeight] = useState('')
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editPlayerName, setEditPlayerName] = useState('')
  const [editPlayerPosition, setEditPlayerPosition] = useState('')
  const [editPlayerGoalWeight, setEditPlayerGoalWeight] = useState('')

  // 不調部位管理の状態
  const [painAreas, setPainAreas] = useState<PainArea[]>([])
  const [newPainAreaName, setNewPainAreaName] = useState('')
  const [editingPainAreaId, setEditingPainAreaId] = useState<string | null>(null)
  const [editPainAreaName, setEditPainAreaName] = useState('')

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'players' | 'pain-areas'>('players')

  useEffect(() => {
    fetchPlayers()
    fetchPainAreas()
  }, [])

  // ========== 選手管理の関数 ==========
  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('選手データ取得エラー:', error)
      alert('選手データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPlayer() {
    if (!newPlayerName.trim() || !newPlayerPosition.trim() || !newPlayerGoalWeight) {
      alert('すべての項目を入力してください')
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .insert({
          name: newPlayerName.trim(),
          position: newPlayerPosition.trim(),
          goal_weight: parseFloat(newPlayerGoalWeight),
        })

      if (error) throw error

      alert('選手を追加しました')
      setNewPlayerName('')
      setNewPlayerPosition('')
      setNewPlayerGoalWeight('')
      fetchPlayers()
    } catch (error) {
      console.error('選手追加エラー:', error)
      alert('選手の追加に失敗しました')
    }
  }

  async function handleUpdatePlayer(playerId: string) {
    if (!editPlayerName.trim() || !editPlayerPosition.trim() || !editPlayerGoalWeight) {
      alert('すべての項目を入力してください')
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: editPlayerName.trim(),
          position: editPlayerPosition.trim(),
          goal_weight: parseFloat(editPlayerGoalWeight),
        })
        .eq('id', playerId)

      if (error) throw error

      alert('選手情報を更新しました')
      setEditingPlayerId(null)
      fetchPlayers()
    } catch (error) {
      console.error('選手更新エラー:', error)
      alert('選手情報の更新に失敗しました')
    }
  }

  async function handleDeletePlayer(playerId: string, playerName: string) {
    if (!confirm(`${playerName} を削除してもよろしいですか？\n\n※この選手に関連するすべてのデータも削除されます。`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      alert('選手を削除しました')
      fetchPlayers()
    } catch (error) {
      console.error('選手削除エラー:', error)
      alert('選手の削除に失敗しました')
    }
  }

  function startEditPlayer(player: Player) {
    setEditingPlayerId(player.id)
    setEditPlayerName(player.name)
    setEditPlayerPosition(player.position)
    setEditPlayerGoalWeight(player.goal_weight.toString())
  }

  function cancelEditPlayer() {
    setEditingPlayerId(null)
    setEditPlayerName('')
    setEditPlayerPosition('')
    setEditPlayerGoalWeight('')
  }

  // ========== 不調部位管理の関数 ==========
  async function fetchPainAreas() {
    try {
      const { data, error } = await supabase
        .from('pain_areas')
        .select('*')
        .order('display_order')

      if (error) throw error
      setPainAreas(data || [])
    } catch (error) {
      console.error('不調部位データ取得エラー:', error)
      alert('不調部位データの取得に失敗しました')
    }
  }

  async function handleAddPainArea() {
    if (!newPainAreaName.trim()) {
      alert('不調部位名を入力してください')
      return
    }

    try {
      // 最大のdisplay_orderを取得
      const maxOrder = painAreas.length > 0 
        ? Math.max(...painAreas.map(p => p.display_order)) 
        : -1

      const { error } = await supabase
        .from('pain_areas')
        .insert({
          name: newPainAreaName.trim(),
          display_order: maxOrder + 1,
        })

      if (error) throw error

      alert('不調部位を追加しました')
      setNewPainAreaName('')
      fetchPainAreas()
    } catch (error) {
      console.error('不調部位追加エラー:', error)
      alert('不調部位の追加に失敗しました')
    }
  }

  async function handleUpdatePainArea(painAreaId: string) {
    if (!editPainAreaName.trim()) {
      alert('不調部位名を入力してください')
      return
    }

    try {
      const { error } = await supabase
        .from('pain_areas')
        .update({
          name: editPainAreaName.trim(),
        })
        .eq('id', painAreaId)

      if (error) throw error

      alert('不調部位を更新しました')
      setEditingPainAreaId(null)
      fetchPainAreas()
    } catch (error) {
      console.error('不調部位更新エラー:', error)
      alert('不調部位の更新に失敗しました')
    }
  }

  async function handleDeletePainArea(painAreaId: string, painAreaName: string) {
    if (!confirm(`「${painAreaName}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('pain_areas')
        .delete()
        .eq('id', painAreaId)

      if (error) throw error

      alert('不調部位を削除しました')
      fetchPainAreas()
    } catch (error) {
      console.error('不調部位削除エラー:', error)
      alert('不調部位の削除に失敗しました')
    }
  }

  function startEditPainArea(painArea: PainArea) {
    setEditingPainAreaId(painArea.id)
    setEditPainAreaName(painArea.name)
  }

  function cancelEditPainArea() {
    setEditingPainAreaId(null)
    setEditPainAreaName('')
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
                データ管理
              </h1>
              <p className="text-sm sm:text-base text-keio-blue">選手と不調部位の追加・編集・削除</p>
            </div>
            <Link
              href="/staff/dashboard"
              className="bg-keio-red hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              ダッシュボードへ
            </Link>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="bg-white rounded-lg p-1.5 sm:p-2 mb-3 sm:mb-4 flex gap-1.5 sm:gap-2 border-2 border-keio-blue">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              activeTab === 'players'
                ? 'bg-keio-blue text-white'
                : 'bg-white text-keio-blue hover:bg-keio-gold active:bg-keio-gold border-2 border-keio-blue'
            }`}
          >
            選手管理
          </button>
          <button
            onClick={() => setActiveTab('pain-areas')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              activeTab === 'pain-areas'
                ? 'bg-keio-blue text-white'
                : 'bg-white text-keio-blue hover:bg-keio-gold active:bg-keio-gold border-2 border-keio-blue'
            }`}
          >
            不調部位
          </button>
        </div>

        {/* 選手管理タブ */}
        {activeTab === 'players' && (
          <div className="space-y-3 sm:space-y-4">
            {/* 選手追加フォーム */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-keio-blue">
              <h2 className="text-lg sm:text-xl font-bold text-keio-blue mb-3 sm:mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                新しい選手を追加
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="選手名"
                  className="p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                />
                <input
                  type="text"
                  value={newPlayerPosition}
                  onChange={(e) => setNewPlayerPosition(e.target.value)}
                  placeholder="ポジション"
                  className="p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                />
                <input
                  type="number"
                  step="0.1"
                  value={newPlayerGoalWeight}
                  onChange={(e) => setNewPlayerGoalWeight(e.target.value)}
                  placeholder="目標体重 (kg)"
                  className="p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                />
                <button
                  onClick={handleAddPlayer}
                  className="bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  追加
                </button>
              </div>
            </div>

            {/* 選手リスト */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-keio-blue">
              <h2 className="text-lg sm:text-xl font-bold text-keio-blue mb-3 sm:mb-4">
                選手一覧 ({players.length}名)
              </h2>
              {players.length === 0 ? (
                <p className="text-sm sm:text-base text-keio-blue text-center py-6 sm:py-8">選手がまだ登録されていません</p>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 border-2 border-keio-blue rounded-lg"
                    >
                      {editingPlayerId === player.id ? (
                        // 編集モード
                        <>
                          <input
                            type="text"
                            value={editPlayerName}
                            onChange={(e) => setEditPlayerName(e.target.value)}
                            className="flex-1 p-2 border-2 border-keio-blue rounded-lg text-keio-blue"
                          />
                          <input
                            type="text"
                            value={editPlayerPosition}
                            onChange={(e) => setEditPlayerPosition(e.target.value)}
                            className="w-32 p-2 border-2 border-keio-blue rounded-lg text-keio-blue"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={editPlayerGoalWeight}
                            onChange={(e) => setEditPlayerGoalWeight(e.target.value)}
                            className="w-32 p-2 border-2 border-keio-blue rounded-lg text-keio-blue"
                          />
                          <button
                            onClick={() => handleUpdatePlayer(player.id)}
                            className="p-2 bg-keio-gold hover:bg-yellow-600 text-keio-blue rounded-lg transition-colors"
                            title="保存"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditPlayer}
                            className="p-2 bg-gray-300 hover:bg-gray-400 text-keio-blue rounded-lg transition-colors"
                            title="キャンセル"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        // 表示モード
                        <>
                          <div className="flex-1">
                            <p className="font-semibold text-keio-blue">{player.name}</p>
                            <p className="text-sm text-keio-blue">
                              {player.position} / 目標体重: {player.goal_weight}kg
                            </p>
                          </div>
                          <button
                            onClick={() => startEditPlayer(player)}
                            className="p-2 bg-keio-blue hover:bg-blue-800 text-white rounded-lg transition-colors"
                            title="編集"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            className="p-2 bg-keio-red hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 不調部位管理タブ */}
        {activeTab === 'pain-areas' && (
          <div className="space-y-3 sm:space-y-4">
            {/* 不調部位追加フォーム */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-keio-blue">
              <h2 className="text-lg sm:text-xl font-bold text-keio-blue mb-3 sm:mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                新しい不調部位を追加
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  type="text"
                  value={newPainAreaName}
                  onChange={(e) => setNewPainAreaName(e.target.value)}
                  placeholder="不調部位名（例: 右手首）"
                  className="flex-1 p-3 border-2 border-keio-blue rounded-lg text-keio-blue"
                />
                <button
                  onClick={handleAddPainArea}
                  className="bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  追加
                </button>
              </div>
            </div>

            {/* 不調部位リスト */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border-2 border-keio-blue">
              <h2 className="text-lg sm:text-xl font-bold text-keio-blue mb-3 sm:mb-4">
                不調部位一覧 ({painAreas.length}件)
              </h2>
              {painAreas.length === 0 ? (
                <p className="text-sm sm:text-base text-keio-blue text-center py-6 sm:py-8">不調部位がまだ登録されていません</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {painAreas.map((painArea) => (
                    <div
                      key={painArea.id}
                      className="flex items-center gap-4 p-4 border-2 border-keio-blue rounded-lg"
                    >
                      {editingPainAreaId === painArea.id ? (
                        // 編集モード
                        <>
                          <input
                            type="text"
                            value={editPainAreaName}
                            onChange={(e) => setEditPainAreaName(e.target.value)}
                            className="flex-1 p-2 border-2 border-keio-blue rounded-lg text-keio-blue"
                          />
                          <button
                            onClick={() => handleUpdatePainArea(painArea.id)}
                            className="p-2 bg-keio-gold hover:bg-yellow-600 text-keio-blue rounded-lg transition-colors"
                            title="保存"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditPainArea}
                            className="p-2 bg-gray-300 hover:bg-gray-400 text-keio-blue rounded-lg transition-colors"
                            title="キャンセル"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        // 表示モード
                        <>
                          <div className="flex-1">
                            <p className="font-semibold text-keio-blue">{painArea.name}</p>
                          </div>
                          <button
                            onClick={() => startEditPainArea(painArea)}
                            className="p-2 bg-keio-blue hover:bg-blue-800 text-white rounded-lg transition-colors"
                            title="編集"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePainArea(painArea.id, painArea.name)}
                            className="p-2 bg-keio-red hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
