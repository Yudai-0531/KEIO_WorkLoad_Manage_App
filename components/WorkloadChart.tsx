'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts'
import { ChartData } from '@/types'
import { getACWRRiskLevel } from '@/lib/calculations'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface WorkloadChartProps {
  data: ChartData[]
}

export default function WorkloadChart({ data }: WorkloadChartProps) {
  // データを日付順にソート
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // 日付フォーマット
  const formattedData = sortedData.map(item => ({
    ...item,
    dateFormatted: new Date(item.date).toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric'
    })
  }))

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold text-navy-dark mb-4">
        ワークロード分析
      </h2>
      
      {/* アラート表示 */}
      <div className="mb-4 space-y-2">
        {sortedData.slice(-7).map((item) => {
          const riskLevel = getACWRRiskLevel(item.acwr)
          if (riskLevel === 'warning' || riskLevel === 'danger') {
            return (
              <div
                key={item.date}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  riskLevel === 'danger'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {riskLevel === 'danger' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {item.date}: ACWR {item.acwr.toFixed(2)} - 
                  {riskLevel === 'danger' ? '高リスク' : '注意'}
                  （推奨範囲: 0.8～1.3）
                </span>
              </div>
            )
          }
          return null
        })}
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          
          <XAxis 
            dataKey="dateFormatted" 
            stroke="#333"
            style={{ fontSize: '12px' }}
          />
          
          <YAxis 
            yAxisId="left" 
            stroke="#333"
            style={{ fontSize: '12px' }}
          >
            <Label 
              value="sRPE" 
              angle={-90} 
              position="insideLeft" 
              style={{ textAnchor: 'middle', fill: '#333' }}
            />
          </YAxis>
          
          <YAxis 
            yAxisId="right" 
            orientation="right"
            domain={[0, 2]}
            stroke="#333"
            style={{ fontSize: '12px' }}
          >
            <Label 
              value="ACWR" 
              angle={90} 
              position="insideRight" 
              style={{ textAnchor: 'middle', fill: '#333' }}
            />
          </YAxis>
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ccc',
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
            fill="#A020F0"
            radius={[8, 8, 0, 0]}
            label={{ 
              position: 'top', 
              fill: '#333',
              fontSize: 10
            }}
          />
          
          {/* ACWR折れ線グラフ */}
          <Line 
            yAxisId="right" 
            type="monotone"
            dataKey="acwr" 
            stroke="#9932CC"
            strokeWidth={2}
            dot={{ fill: '#9932CC', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 参考情報 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">ACWRリスク範囲</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <span className="font-medium text-green-600">0.8～1.3</span>: 安全範囲</li>
          <li>• <span className="font-medium text-yellow-600">0.8未満 または 1.3～1.5</span>: 注意</li>
          <li>• <span className="font-medium text-red-600">1.5超</span>: 高リスク</li>
        </ul>
      </div>
    </div>
  )
}
