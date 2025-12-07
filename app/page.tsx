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
    <div className="min-h-screen bg-keio-blue flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full border-4 border-keio-blue">
        <h1 className="text-3xl font-bold text-keio-gold mb-2 text-center">
          KEIO HANDBALL
        </h1>
        <h2 className="text-xl text-keio-red mb-8 text-center">
          Work Load Checker
        </h2>

        {loading ? (
          <div className="text-center text-keio-blue">読み込み中...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 選手用セクション */}
            <div className="bg-white p-6 rounded-lg border-2 border-keio-blue">
              <h3 className="text-lg font-semibold text-keio-blue mb-4 text-center">
                選手用
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-keio-blue mb-2">
                    選手を選択してください
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full p-3 text-base border-2 border-keio-blue rounded-lg focus:outline-none focus:border-keio-gold text-keio-blue bg-white"
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
                  <Link
                    href={`/athlete/${selectedPlayerId}`}
                    className="block w-full bg-keio-gold hover:bg-yellow-600 text-keio-blue font-semibold py-4 px-6 rounded-lg text-center transition-colors"
                  >
                    データ入力
                  </Link>
                )}
              </div>
            </div>

            {/* スタッフ用セクション */}
            <div className="bg-white p-6 rounded-lg border-2 border-keio-blue flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-keio-blue mb-4 text-center">
                スタッフ用
              </h3>
              <Link
                href="/staff/login"
                className="block w-full bg-keio-red hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
              >
                スタッフログイン
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
