'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // 簡易認証（本番環境ではSupabase Authを使用）
  const STAFF_PASSWORD = 'KEIOHANDBALL'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password === STAFF_PASSWORD) {
      // 認証成功
      router.push('/staff/dashboard')
    } else {
      setError('パスワードが正しくありません')
    }
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-navy-dark mb-6 text-center">
          スタッフログイン
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-accent text-gray-900"
              placeholder="パスワードを入力"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-accent hover:bg-purple-deep text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ログイン
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            戻る
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          デモ用パスワード: KEIOHANDBALL
        </p>
      </div>
    </div>
  )
}
