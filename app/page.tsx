'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Player } from '@/types'
import Link from 'next/link'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('選手データの取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-navy-dark mb-2 text-center">
          KEIO HANDBALL
        </h1>
        <h2 className="text-xl text-gray-600 mb-8 text-center">
          Work Load Checker
        </h2>

        {loading ? (
          <div className="text-center text-gray-500">読み込み中...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選手を選択してください
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-accent text-gray-900"
              >
                <option value="">選手を選択...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position})
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayerId && (
              <div className="space-y-3">
                <Link
                  href={`/athlete/${selectedPlayerId}`}
                  className="block w-full bg-purple-accent hover:bg-purple-deep text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
                >
                  データ入力
                </Link>
                
                <Link
                  href="/staff/login"
                  className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors text-sm"
                >
                  スタッフログイン
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
