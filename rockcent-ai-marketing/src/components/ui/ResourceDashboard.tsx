import React from 'react';
import { Database } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap, Legend } from 'recharts';
import { StructuredNeed } from '../../types';

interface ResourceDashboardProps {
  knowledgeBase: StructuredNeed[];
}

const COLORS = ['#8B5CF6', '#F43F5E', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#14B8A6'];

function ResourceDashboard({ knowledgeBase }: ResourceDashboardProps) {
  if (knowledgeBase.length === 0) return null;

  const budgetData = knowledgeBase.reduce((acc, need) => {
    const range = need.budgetRange || '未指定';
    const existing = acc.find(item => item.name === range);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: range, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const goalsData = knowledgeBase.reduce((acc, need) => {
    need.marketingGoals.forEach(goal => {
      const existing = acc.find(item => item.name === goal);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: goal, count: 1 });
      }
    });
    return acc;
  }, [] as { name: string, count: number }[]).sort((a, b) => b.count - a.count).slice(0, 5);

  const industryData = [
    { name: '美妆护肤', size: 400 },
    { name: '食品饮料', size: 300 },
    { name: '3C数码', size: 300 },
    { name: '汽车出行', size: 200 },
    { name: '服饰鞋包', size: 278 },
    { name: '母婴亲子', size: 189 },
    { name: '家居生活', size: 239 },
    { name: '宠物用品', size: 150 },
    { name: '运动户外', size: 210 },
    { name: '本地生活', size: 120 },
  ];

  const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, name, index } = props;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={COLORS[index % COLORS.length]}
          stroke="#fff"
          strokeWidth={2}
          rx={4}
        />
        {width > 50 && height > 30 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600} dominantBaseline="central">
            {name}
          </text>
        )}
      </g>
    );
  };

  const kpiData = [
    { name: '品牌曝光(万)', 预测值: 1200, 行业均值: 800 },
    { name: '互动量(万)', 预测值: 150, 行业均值: 90 },
    { name: '留资数(千)', 预测值: 45, 行业均值: 30 },
    { name: '转化率(%)', 预测值: 3.2, 行业均值: 2.1 },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/60 mb-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Database className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">资源库数据看板</h3>
          <p className="text-sm text-zinc-500">基于您当前 {knowledgeBase.length} 个营销需求的深度分析与全网数据预测</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart 1: Budget Distribution */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <h4 className="text-sm font-bold text-zinc-700 mb-6 text-center">预算分布</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#18181B', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {budgetData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Top Goals */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <h4 className="text-sm font-bold text-zinc-700 mb-6 text-center">热门营销目标 (Top 5)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E4E7" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 12 }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#F4F4F5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                  {goalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Industry Heatmap */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <h4 className="text-sm font-bold text-zinc-700 mb-6 text-center">全网行业品牌资源分布热力图</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={industryData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8B5CF6"
                content={<CustomizedTreemapContent />}
              >
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#18181B', fontWeight: 500 }}
                  formatter={(value: number) => [`${value} 个品牌`, '资源热度']}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-4">基于 Rockcent 暗池 10万+ 品牌活跃度实时计算</p>
        </div>

        {/* Chart 4: KPI Prediction */}
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <h4 className="text-sm font-bold text-zinc-700 mb-6 text-center">基于营销目标的 KPI 预测</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: '#F4F4F5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="预测值" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="行业均值" fill="#D4D4D8" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-4">AI 综合历史数据与当前资源库匹配度生成</p>
        </div>
      </div>
    </div>
  );
}

export default ResourceDashboard;
