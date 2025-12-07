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
    <div className="bg-white rounded-lg p-3 sm:p-6 border-2 border-keio-blue">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-keio-blue mb-3 sm:mb-4">
        ワークロード分析
      </h2>
      
      {/* アラート表示 */}
      <div className="mb-3 sm:mb-4 space-y-2">
        {sortedData.slice(-7).map((item) => {
          const riskLevel = getACWRRiskLevel(item.acwr)
          if (riskLevel === 'warning' || riskLevel === 'danger') {
            return (
              <div
                key={item.date}
                className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border-2 ${
                  riskLevel === 'danger'
                    ? 'bg-white text-keio-red border-keio-red'
                    : 'bg-keio-gold text-keio-blue border-keio-blue'
                }`}
              >
                {riskLevel === 'danger' ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-medium">
                  {new Date(item.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}: ACWR {item.acwr.toFixed(2)} - 
                  {riskLevel === 'danger' ? '高リスク' : '注意'}
                  （推奨: 0.8～1.3）
                </span>
              </div>
            )
          }
          return null
        })}
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          
          <XAxis 
            dataKey="dateFormatted" 
            stroke="#0E1546"
            style={{ fontSize: '10px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          <YAxis 
            yAxisId="left" 
            stroke="#0E1546"
            style={{ fontSize: '10px' }}
            width={40}
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
            style={{ fontSize: '10px' }}
            width={40}
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
            radius={[4, 4, 0, 0]}
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

      {/* 参考情報 */}
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border-2 border-keio-blue">
        <h3 className="font-semibold text-keio-blue mb-2 text-sm sm:text-base">ACWRリスク範囲</h3>
        <ul className="text-xs sm:text-sm text-keio-blue space-y-1">
          <li>• <span className="font-medium">0.8～1.3</span>: 安全範囲</li>
          <li>• <span className="font-medium text-keio-gold">0.8未満/1.3～1.5</span>: 注意</li>
          <li>• <span className="font-medium text-keio-red">1.5超</span>: 高リスク</li>
        </ul>
      </div>
    </div>
  )
}
