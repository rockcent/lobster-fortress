import React, { useState, useRef, useEffect } from 'react';
import { Bot, Settings2, Zap, MessageCircle, X, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AgentSectionProps {
  merchantName: string;
  selectedPersona: string;
  setSelectedPersona: (val: string) => void;
  maxBudget: number;
  setMaxBudget: (val: number) => void;
  agentStatus: string;
  showPersonaPreviewModal: boolean;
  setShowPersonaPreviewModal: (val: boolean) => void;
  showSimulationModal: boolean;
  setShowSimulationModal: (val: boolean) => void;
  simulationMessages: {role: 'user'|'assistant', content: string}[];
  simulationInput: string;
  setSimulationInput: (val: string) => void;
  isSimulating: boolean;
  simulationHandoff: boolean;
  simulationEndRef: React.RefObject<HTMLDivElement | null>;
  onSimulationSend: () => void;
  onStartSimulation: () => void;
  onScrollSimulationBottom: () => void;
}

function AgentSection({
  merchantName,
  selectedPersona,
  setSelectedPersona,
  maxBudget,
  setMaxBudget,
  agentStatus,
  showPersonaPreviewModal,
  setShowPersonaPreviewModal,
  showSimulationModal,
  setShowSimulationModal,
  simulationMessages,
  simulationInput,
  setSimulationInput,
  isSimulating,
  simulationHandoff,
  simulationEndRef,
  onSimulationSend,
  onStartSimulation,
  onScrollSimulationBottom,
}: AgentSectionProps) {
  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <Bot className="w-8 h-8 text-emerald-500" />
              专属数字分身 (Digital Twin BD)
            </h2>
            <p className="text-zinc-500 mt-3 text-lg">全天候自治商务智能体，在暗池中为您静默寻址、自动预谈判。</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border border-emerald-100 shadow-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Agent 活跃拓展中
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-100">
              <span className="animate-pulse">{agentStatus}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-zinc-400" />
                智能体边界设定
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-bold text-zinc-700">最低受众重合度</label>
                    <span className="text-sm font-bold text-emerald-600">80%</span>
                  </div>
                  <input type="range" min="50" max="100" defaultValue="80" className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <p className="text-xs text-zinc-500 mt-2">低于此阈值的合作方将被 Agent 自动否决。</p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-700 block">多级预算底线设定 (元)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-zinc-500 mb-1 block">首轮试探</span>
                      <input type="number" defaultValue="20000" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 mb-1 block">期望达成</span>
                      <input type="number" defaultValue="35000" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 mb-1 block">最高红线</span>
                      <input type="number" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Agent 将执行动态退让策略，逼近红线时自动要求对方增加对等权益。</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-700 block mb-2">绝对排斥竞品名单</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['瑞幸咖啡', '库迪咖啡'].map(brand => (
                      <span key={brand} className="text-xs bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded-md flex items-center gap-1">
                        {brand} <X className="w-3 h-3 cursor-pointer hover:text-rose-800" />
                      </span>
                    ))}
                  </div>
                  <input type="text" placeholder="输入品牌名称回车添加" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-zinc-700">沟通人设 (Persona)</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowPersonaPreviewModal(true)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        预览话术
                      </button>
                      <button 
                        onClick={onStartSimulation}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        模拟实战谈判
                      </button>
                    </div>
                  </div>
                  <select 
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none appearance-none"
                  >
                    <option value="活泼网感的消费品牌 PR">活泼网感的消费品牌 PR</option>
                    <option value="专业严谨的 500 强高管">专业严谨的 500 强高管</option>
                    <option value="真诚务实的创业者">真诚务实的创业者</option>
                  </select>
                  <p className="text-xs text-zinc-500 mt-2">AI 将以此人设在暗池中与其他品牌进行预谈判。</p>
                  
                  <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 block mb-1">负面约束清单 (Negative Prompts)</label>
                      <textarea 
                        defaultValue="禁用任何表情符号；禁用「亲亲/宝子」等词汇；回复字数控制在80字以内；多用短句和数据。"
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none resize-none h-16"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">严格控制 Tone of Voice，防止人设漂移。</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700 block mb-1">品牌专有词库 (Glossary)</label>
                      <textarea 
                        defaultValue="核心Slogan: 探索无限可能；专有产品名: Rockcent AI"
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none resize-none h-12"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">作为高权重资产注入长期记忆，确保对外发声绝对准确。</p>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-md">
                  保存设定
                </button>
              </div>
            </div>
          </div>

          {/* Autonomous Opportunities */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  高优意向单推送 (Golden Handoff)
                </h3>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  2 个待审批
                </span>
              </div>

              <div className="space-y-6">
                {/* Opportunity 1 */}
                <div className="border border-zinc-200 rounded-2xl p-6 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-bold text-zinc-900">OATLY 噢麦力</h4>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-100">匹配度 92%</span>
                      </div>
                      <p className="text-sm text-zinc-500">植物基燕麦奶领导品牌</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">预估 ROI</div>
                      <div className="text-xl font-black text-emerald-600">3.5x</div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-xl p-4 mb-6 border border-zinc-100">
                    <h5 className="text-xs font-bold text-zinc-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-zinc-400" />
                      AI 预谈判复盘摘要
                    </h5>
                    <ul className="space-y-3 text-sm text-zinc-600">
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold shrink-0">破冰策略:</span> 
                        <span>使用数据驱动与社交背书开场："系统测算我们两家受众重合度达 82%。注意到贵司近期与某咖啡品牌有精彩联动，作为长期合作伙伴，我们认为有一个高潜力机会。"</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">价值置换:</span> 
                        <span>对方逼近 5 万红线时，Agent 触发动态退让："可以追加 2 万预算，但我们需要贵司提供双微头条矩阵首发。"</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-500 font-bold shrink-0">熔断触发:</span> 
                        <span>检测到对方连续两轮未在核心条件让步，Agent 触发体面离场："细节已记录，接下来我将拉入我方业务负责人进行深度对齐。"</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20">
                      一键接管谈判 (生成 MoU)
                    </button>
                    <button className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors">
                      否决并优化策略
                    </button>
                  </div>
                </div>

                {/* Opportunity 2 */}
                <div className="border border-zinc-200 rounded-2xl p-6 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-bold text-zinc-900">Keep</h4>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-100">匹配度 88%</span>
                      </div>
                      <p className="text-sm text-zinc-500">运动科技平台</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">预估 ROI</div>
                      <div className="text-xl font-black text-emerald-600">2.8x</div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-xl p-4 mb-6 border border-zinc-100">
                    <h5 className="text-xs font-bold text-zinc-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-zinc-400" />
                      AI 预谈判复盘摘要
                    </h5>
                    <ul className="space-y-3 text-sm text-zinc-600">
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold shrink-0">破冰策略:</span> 
                        <span>直接抛出数学契合度："系统测算我们两家受众重合度达 88%，且贵司近期主推的春季燃脂活动与我方新品调性高度一致。"</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">价值置换:</span> 
                        <span>对方要求 10 万元奖品赞助，Agent 拒绝纯赞助并提出置换："我们可以提供 3 万元奖品，但需要置换贵司 App 内开屏广告 1 天及挑战赛冠名权。"</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-amber-500 font-bold shrink-0">熔断触发:</span> 
                        <span>对方同意该置换方案，达成初步意向。Agent 触发体面离场："针对这部分的细节，我已经记录了贵司的诉求，接下来我将拉入我方业务负责人进行深度对齐。"</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20">
                      一键接管谈判 (生成 MoU)
                    </button>
                    <button className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors">
                      否决并优化策略
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Preview Modal */}
      {showPersonaPreviewModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-emerald-50/50">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                人设话术预览: {selectedPersona}
              </h3>
              <button onClick={() => setShowPersonaPreviewModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-zinc-50/50 space-y-4">
              <div className="flex justify-center">
                <span className="bg-zinc-200/50 text-zinc-500 text-xs px-3 py-1 rounded-full font-medium">模拟场景：向潜在合作方发起初次邀约</span>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 text-sm text-zinc-700 leading-relaxed">
                  {selectedPersona === '活泼网感的消费品牌 PR' && (
                    <>哈喽！系统测算我们两家受众重合度达82%，有个超高潜力的合作机会！✨ 注意到你们最近和OATLY的联动太绝了，作为OATLY的老朋友，我们觉得结合Rockcent AI绝对能火一把！探索无限可能，一起搞点事情呀？😎</>
                  )}
                  {selectedPersona === '专业严谨的 500 强高管' && (
                    <>您好。系统测算我们两家受众重合度达85%，存在高潜力合作机会。注意到贵司近期与OATLY有精彩联动，作为OATLY长期合作伙伴，我们认为结合Rockcent AI能实现双赢。探索无限可能，期待探讨。</>
                  )}
                  {selectedPersona === '真诚务实的创业者' && (
                    <>你好。系统测算我们两家受众重合度达82%，有一个高潜力合作机会。注意到贵司近期与OATLY的联动，作为OATLY的合作伙伴，我们认为结合Rockcent AI能带来实际增长。探索无限可能，希望能有机会聊聊细节。</>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-white flex justify-end">
              <button 
                onClick={() => setShowPersonaPreviewModal(false)}
                className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 shadow-sm"
              >
                确认使用此人设
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Simulation Modal */}
      {showSimulationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                模拟实战谈判: {selectedPersona}
              </h3>
              <button onClick={() => setShowSimulationModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 space-y-4">
              <div className="flex justify-center mb-6">
                <span className="bg-zinc-200/50 text-zinc-500 text-xs px-3 py-1 rounded-full font-medium">
                  您正在扮演目标公司 (OATLY 噢麦力) 的商务代表
                </span>
              </div>
              
              {simulationMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-100 border-blue-200' : 'bg-emerald-100 border-emerald-200'}`}>
                    {msg.role === 'user' ? <User className={`w-4 h-4 text-blue-600`} /> : <Bot className={`w-4 h-4 text-emerald-600`} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none' : 'bg-white text-zinc-700 border-zinc-100 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSimulating && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 text-sm text-zinc-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-zinc-500">Agent 正在思考对策...</span>
                  </div>
                </div>
              )}
              {simulationHandoff && (
                <div className="flex justify-center mt-6">
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
                    <Zap className="w-4 h-4" />
                    已触发熔断机制，生成【高优意向单】并推送至小程序。
                  </div>
                </div>
              )}
              <div ref={simulationEndRef} />
            </div>
            <div className="p-4 border-t border-zinc-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSimulationSend();
                    }
                  }}
                  placeholder={simulationHandoff ? "谈判已结束" : "输入您的回复..."}
                  disabled={isSimulating || simulationHandoff}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                />
                <button 
                  onClick={onSimulationSend}
                  disabled={!simulationInput.trim() || isSimulating || simulationHandoff}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors shadow-md"
                >
                  发送
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AgentSection;
