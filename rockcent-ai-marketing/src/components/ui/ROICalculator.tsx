import React, { useState } from 'react';
import { Zap } from 'lucide-react';

function ROICalculator({ initialBudget = 50000, initialConversion = 2.5 }: { initialBudget?: number, initialConversion?: number }) {
  const [budget, setBudget] = useState(initialBudget);
  const [conversionRate, setConversionRate] = useState(initialConversion);
  
  const averageOrderValue = 500;
  const estimatedClicks = budget * 0.8;
  const estimatedConversions = Math.round(estimatedClicks * (conversionRate / 100));
  const estimatedRevenue = estimatedConversions * averageOrderValue;
  const roi = Math.round(((estimatedRevenue - budget) / budget) * 100);

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm mt-8">
      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-6 uppercase tracking-wider">
        <Zap className="w-4 h-4 text-emerald-500" />
        ROI 动态预估计算器 (模拟沙盘)
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">营销预算 (RMB)</label>
              <span className="text-sm font-bold text-zinc-900">¥{budget.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="10000" 
              max="500000" 
              step="5000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">预期转化率 (%)</label>
              <span className="text-sm font-bold text-zinc-900">{conversionRate.toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.1"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">预估营收</p>
              <p className="text-2xl font-bold text-emerald-900">¥{estimatedRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">投资回报率 (ROI)</p>
              <p className="text-2xl font-bold text-emerald-900">{roi}%</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-4">
            * 此数据为基于行业平均水平的模拟预测，仅供参考。实际效果受多种因素影响。
          </p>
        </div>
      </div>
    </div>
  );
}

export default ROICalculator;
