import React from 'react';
import { Zap, Crown, Loader2, ExternalLink, Lock, Coins, CheckCircle2, X, Send, FileText, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MatchmakingSuggestion, StructuredNeed } from '../../types';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import ROICalculator from '../ui/ROICalculator';

interface MatchmakingSectionProps {
  matchmaking: MatchmakingSuggestion[];
  knowledgeBase: StructuredNeed[];
  isGeneratingMatch: boolean;
  userPlan: 'free' | 'pro';
  onGenerateMatchmaking: () => void;
  onRefinePlan: (suggestion: MatchmakingSuggestion) => void;
  onGeneratePitchDeck: (suggestion: MatchmakingSuggestion) => void;
  onGenerateMoU: (suggestion: MatchmakingSuggestion) => void;
  onGenerateTimeline: (suggestion: MatchmakingSuggestion) => void;
  onStatusChange: (suggestionId: string, newStatus: MatchmakingSuggestion['status']) => void;
  refiningId: string | null;
  generatingPitchDeckId: string | null;
  generatingMoUId: string | null;
  generatingTimelineId: string | null;
  onUpgrade: () => void;
  activeTab: string;
  onTabChange: (tab: 'chat' | 'knowledge' | 'matchmaking' | 'agent' | 'network') => void;
}

function MatchmakingSection({
  matchmaking,
  knowledgeBase,
  isGeneratingMatch,
  userPlan,
  onGenerateMatchmaking,
  onRefinePlan,
  onGeneratePitchDeck,
  onGenerateMoU,
  onGenerateTimeline,
  onStatusChange,
  refiningId,
  generatingPitchDeckId,
  generatingMoUId,
  generatingTimelineId,
  onUpgrade,
  activeTab,
  onTabChange,
}: MatchmakingSectionProps) {
  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">跨界撮合与策略</h2>
            <p className="text-zinc-500 mt-3 text-lg">基于您的资源库，AI为您量身定制的跨界营销合作方案。</p>
          </div>
          {matchmaking.length > 0 && (
            <button 
              onClick={onGenerateMatchmaking}
              className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-[15px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {isGeneratingMatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-500" />}
              重新生成
            </button>
          )}
        </div>

        {/* Expert Matchmaking Banner */}
        <div className="mb-10 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 md:w-2/3 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-bold text-white">高定专家撮合服务 (Human-in-the-loop)</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              对于千万级预算或S级战略合作，AI 筛选后由资深营销专家介入。提供深度背调、高层直接对接、定制化商业谈判支持。按效果收取成功佣金 (Success Fee)。
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <button className="px-6 py-3 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2">
              预约专家咨询
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {matchmaking.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <Zap className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-zinc-900">暂无撮合方案</h3>
            <p className="text-zinc-500 mt-3 max-w-md mx-auto mb-8">
              请先确保资源库中有结构化的营销需求，然后点击左下角的"一键生成营销策略"按钮。
            </p>
            {knowledgeBase.length === 0 ? (
              <button 
                onClick={() => onTabChange('chat')}
                className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
              >
                去建立资源库
              </button>
            ) : (
              <button 
                onClick={onGenerateMatchmaking}
                disabled={isGeneratingMatch}
                className="px-8 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2 mx-auto"
              >
                {isGeneratingMatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                一键生成营销策略
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-10">
            {/* Unverified Banner */}
            {knowledgeBase.some(need => !need.isVerified) && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-amber-900 mb-1">完成品牌资产认证，解锁更高质量匹配</h4>
                    <p className="text-sm text-amber-700/80">绑定真实社交资产，可使您的跨界合作被邀约率提升 300%。</p>
                  </div>
                </div>
                <button 
                  onClick={() => onTabChange('knowledge')}
                  className="px-6 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm shrink-0"
                >
                  去认证
                </button>
              </div>
            )}

            {matchmaking.map((match, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={match.id} 
                className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/60 overflow-hidden hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
              >
                <div className="bg-[#0A0A0B] p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/20 to-violet-500/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="bg-white/10 border border-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest backdrop-blur-md">
                        推荐方案 #{index + 1}
                      </span>
                      {index === 0 && (
                        <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          精选推荐
                        </span>
                      )}
                      <span className="text-rose-300 text-[15px] font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        预估 ROI: {match.estimatedROI}
                      </span>
                    </div>
                    <h3 className="text-4xl font-bold tracking-tight mb-3">与 {match.partnerCompany} 跨界合作</h3>
                    <p className="text-zinc-400 text-lg font-medium">合作方行业: {match.partnerIndustry}</p>
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-8">
                    {match.matchScores && (
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-wider">
                          <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                          多维匹配度
                        </h4>
                        <div className="relative h-64 bg-zinc-50 rounded-2xl border border-zinc-100 p-4 overflow-hidden">
                          <div className={cn("h-full w-full transition-all", userPlan === 'free' && "blur-md opacity-50")}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                { subject: '受众重合度', A: match.matchScores.audience, fullMark: 100 },
                                { subject: '品牌调性', A: match.matchScores.brandTone, fullMark: 100 },
                                { subject: '预算体量', A: match.matchScores.budget, fullMark: 100 },
                                { subject: '资源互补', A: match.matchScores.complementarity, fullMark: 100 },
                              ]}>
                                <PolarGrid stroke="#e4e4e7" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="匹配度" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          {userPlan === 'free' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] z-10">
                              <Lock className="w-8 h-8 text-violet-500 mb-2" />
                              <p className="text-sm font-bold text-zinc-900 mb-3">升级 Pro 解锁多维匹配雷达</p>
                              <button onClick={onUpgrade} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-violet-700 transition-colors">
                                立即升级
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        匹配理由
                      </h4>
                      <p className="text-[15px] text-zinc-600 leading-relaxed bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                        {match.matchReason}
                      </p>
                    </div>
                    
                    {match.similarCase && (
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-wider">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          相似成功案例
                        </h4>
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                          <p className="font-bold text-blue-900 mb-2">{match.similarCase.brands}</p>
                          <p className="text-[14px] text-blue-800 leading-relaxed">
                            {match.similarCase.description}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        下一步建议
                      </h4>
                      <p className="text-[15px] text-amber-900 leading-relaxed bg-amber-50 p-5 rounded-2xl border border-amber-100">
                        {match.recommendedAction}
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-8">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                        详细营销策略
                      </h4>
                      <div className="prose prose-sm max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-strong:text-zinc-900 bg-white border border-zinc-100 p-8 rounded-3xl shadow-sm">
                        <ReactMarkdown>{match.strategy}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-700 uppercase tracking-wider">当前状态:</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          match.status === 'suggested' && "bg-zinc-200 text-zinc-700",
                          match.status === 'invited' && "bg-blue-100 text-blue-700",
                          match.status === 'accepted' && "bg-emerald-100 text-emerald-700",
                          match.status === 'rejected' && "bg-rose-100 text-rose-700",
                        )}>
                          {match.status === 'suggested' && 'AI 推荐'}
                          {match.status === 'invited' && '已发送邀请'}
                          {match.status === 'accepted' && '对方已确认'}
                          {match.status === 'rejected' && '对方已婉拒'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap justify-end gap-3">
                        {match.status === 'suggested' && (
                          <>
                            <button 
                              onClick={() => onGeneratePitchDeck(match)}
                              disabled={generatingPitchDeckId === match.id}
                              className="flex items-center gap-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-5 py-2.5 rounded-xl transition-colors border border-rose-200/50"
                            >
                              {generatingPitchDeckId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                              {match.pitchDeck ? "重新生成邀请函" : "消耗 1 点数发送邀请"}
                            </button>
                            {match.pitchDeck && (
                              <button 
                                onClick={() => onStatusChange(match.id, 'invited')}
                                className="flex items-center gap-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                              >
                                发送邀请
                              </button>
                            )}
                          </>
                        )}

                        {match.status === 'invited' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onStatusChange(match.id, 'accepted')}
                              className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-colors border border-emerald-200/50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              模拟对方接受
                            </button>
                            <button 
                              onClick={() => onStatusChange(match.id, 'rejected')}
                              className="flex items-center gap-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-5 py-2.5 rounded-xl transition-colors border border-rose-200/50"
                            >
                              <X className="w-4 h-4" />
                              模拟对方婉拒
                            </button>
                          </div>
                        )}

                        {match.status === 'accepted' && (
                          <>
                            <button 
                              onClick={() => userPlan === 'pro' ? onGenerateMoU(match) : onUpgrade()}
                              disabled={generatingMoUId === match.id}
                              className={cn(
                                "flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors border",
                                userPlan === 'pro' 
                                  ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/50" 
                                  : "text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border-zinc-200"
                              )}
                            >
                              {generatingMoUId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (userPlan === 'pro' ? <FileText className="w-4 h-4" /> : <Lock className="w-4 h-4" />)}
                              {match.mou ? "重新生成 MoU" : "生成合作备忘录 (MoU)"}
                            </button>
                            <button 
                              onClick={() => userPlan === 'pro' ? onGenerateTimeline(match) : onUpgrade()}
                              disabled={generatingTimelineId === match.id}
                              className={cn(
                                "flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors border",
                                userPlan === 'pro' 
                                  ? "text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200/50" 
                                  : "text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border-zinc-200"
                              )}
                            >
                              {generatingTimelineId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (userPlan === 'pro' ? <Calendar className="w-4 h-4" /> : <Lock className="w-4 h-4" />)}
                              {match.timeline ? "重新生成排期" : "生成执行排期"}
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => onRefinePlan(match)}
                          disabled={refiningId === match.id}
                          className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-5 py-2.5 rounded-xl transition-colors border border-amber-200/50"
                        >
                          {refiningId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {match.refinedDetails ? "重新细化方案" : "AI 细化方案"}
                        </button>
                      </div>
                    </div>
                    
                    {/* Pitch Deck Details */}
                    {match.pitchDeck && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-zinc-100"
                      >
                        <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <Send className="w-4 h-4 text-rose-500" />
                          合作邀请函 (Pitch Deck)
                        </h4>
                        <div className="prose prose-sm max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-strong:text-zinc-900 bg-rose-50/50 border border-rose-100/50 p-8 rounded-3xl shadow-sm">
                          <ReactMarkdown>{match.pitchDeck}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}

                    {/* MoU Details */}
                    {match.mou && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-zinc-100"
                      >
                        <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          合作备忘录草案 (MoU)
                        </h4>
                        <div className="prose prose-sm max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-strong:text-zinc-900 bg-indigo-50/50 border border-indigo-100/50 p-8 rounded-3xl shadow-sm">
                          <ReactMarkdown>{match.mou}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}

                    {/* Timeline Details */}
                    {match.timeline && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-zinc-100"
                      >
                        <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          联合营销执行排期
                        </h4>
                        <div className="bg-teal-50/50 border border-teal-100/50 p-8 rounded-3xl shadow-sm">
                          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-teal-200 before:to-transparent">
                            {match.timeline.map((item, i) => (
                              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-teal-100 text-teal-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                  <span className="text-xs font-bold">{i + 1}</span>
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-teal-100 shadow-sm">
                                  <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-teal-900">{item.date}</div>
                                  </div>
                                  <div className="text-zinc-600 text-sm">{item.task}</div>
                                  {(item.task.includes('设计') || item.task.includes('制作') || item.task.includes('投放') || item.task.includes('物料') || item.task.includes('宣发')) && (
                                    <button className="mt-3 text-[11px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-violet-100 transition-colors border border-violet-100">
                                      <ExternalLink className="w-3 h-3" /> 
                                      寻源优质服务商
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Refined Details */}
                    {match.refinedDetails && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-zinc-100"
                      >
                        <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          AI 细化执行方案
                        </h4>
                        <div className="prose prose-sm max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-strong:text-zinc-900 bg-amber-50/50 border border-amber-100/50 p-8 rounded-3xl shadow-sm">
                          <ReactMarkdown>{match.refinedDetails}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}

                    {/* ROI Calculator */}
                    <ROICalculator />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {matchmaking.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200/50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                  精选营销服务商
                </h3>
                <p className="text-zinc-500 mt-2">为您推荐优质的第三方服务机构，助力跨界合作高效落地。</p>
              </div>
              <button className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                查看全部 <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: '奥美公关 (Ogilvy)', type: '全案营销', desc: '全球领先的整合营销传播公司，擅长大型跨界战役策划。', tags: ['品牌公关', '创意策划'] },
                { name: '无忧传媒', type: 'MCN 机构', desc: '国内头部 MCN，拥有海量达人资源，适合社交媒体种草与直播带货。', tags: ['达人分发', '直播带货'] },
                { name: '特赞 (Tezign)', type: '内容创意', desc: '科技赋能的内容创意平台，快速对接海量优秀设计师与创意人。', tags: ['视觉设计', '视频制作'] }
              ].map((provider, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-zinc-200/60 hover:border-violet-300 hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-zinc-900 text-lg group-hover:text-violet-600 transition-colors">{provider.name}</h4>
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-md uppercase tracking-wider">{provider.type}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-6 line-clamp-2">{provider.desc}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-2">
                      {provider.tags.map(tag => (
                        <span key={tag} className="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-md">{tag}</span>
                      ))}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchmakingSection;
