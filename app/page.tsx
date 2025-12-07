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
    <div className="min-h-screen bg-keio-blue flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 max-w-2xl w-full border-2 sm:border-4 border-keio-blue">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center" style={{ color: '#FDD34C' }}>
          KEIO HANDBALL
        </h1>
        <h2 className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-center" style={{ color: '#C4232D' }}>
          Work Load Checker
        </h2>

        {loading ? (
          <div className="text-center text-keio-blue text-base sm:text-lg">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 選手用セクション */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-keio-blue">
              <h3 className="text-base sm:text-lg font-semibold text-keio-blue mb-3 sm:mb-4 text-center">
                選手用
              </h3>
              <div className="space-y-3 sm:space-y-4">
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
                    className="block w-full bg-keio-gold hover:bg-yellow-600 active:bg-yellow-700 text-keio-blue font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-center transition-colors text-base sm:text-lg"
                  >
                    データ入力
                  </Link>
                )}
              </div>
            </div>

            {/* スタッフ用セクション */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-keio-blue flex flex-col justify-center">
              <h3 className="text-base sm:text-lg font-semibold text-keio-blue mb-3 sm:mb-4 text-center">
                スタッフ用
              </h3>
              <Link
                href="/staff/login"
                className="block w-full bg-keio-red hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-center transition-colors text-base sm:text-lg"
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
