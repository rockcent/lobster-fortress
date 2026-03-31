import React, { useState } from 'react';
import { Database, Plus, ShieldCheck, Globe, Sparkles, Loader2, Paperclip } from 'lucide-react';
import { StructuredNeed } from '../../types';
import EditableNeedCard from '../ui/EditableNeedCard';
import ResourceDashboard from '../ui/ResourceDashboard';

interface KnowledgeSectionProps {
  knowledgeBase: StructuredNeed[];
  setKnowledgeBase: React.Dispatch<React.SetStateAction<StructuredNeed[]>>;
  userPlan: 'free' | 'pro';
  onUpgrade: () => void;
  activeTab: string;
  onTabChange: (tab: 'chat' | 'knowledge' | 'matchmaking' | 'agent' | 'network') => void;
  resourceInput: string;
  setResourceInput: (val: string) => void;
  isExtractingResource: boolean;
  onAddResource: () => void;
}

function KnowledgeSection({
  knowledgeBase,
  setKnowledgeBase,
  userPlan,
  onUpgrade,
  activeTab,
  onTabChange,
  resourceInput,
  setResourceInput,
  isExtractingResource,
  onAddResource,
}: KnowledgeSectionProps) {
  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-500" />
              全域感知与自进化资产库
            </h2>
            <p className="text-zinc-500 mt-3 text-lg">不仅是静态存储，更是"活数据"。AI 实时监听全网动态，深度解析多模态资产，为您沉淀高维度的商业向量。</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium border border-emerald-100 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            数据安全隔离，仅您可见
          </div>
        </div>

        {/* Omni-network Monitoring Section */}
        <div className="mb-10 bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              全网品牌动态监听 (Live Data Feed)
            </h3>
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              实时感知中
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded uppercase">新品发布</span>
                <span className="text-xs text-zinc-400">10 分钟前</span>
              </div>
              <p className="text-sm text-white font-medium mb-1">喜茶 x 原神 联名第二弹预热</p>
              <p className="text-xs text-zinc-400">AI 提取标签: #二次元 #游戏IP #年轻化</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded uppercase">营销战役</span>
                <span className="text-xs text-zinc-400">1 小时前</span>
              </div>
              <p className="text-sm text-white font-medium mb-1">lululemon 开启「夏日乐章」百城瑜伽</p>
              <p className="text-xs text-zinc-400">AI 提取标签: #女性健康 #社群营销 #线下体验</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded uppercase">高管变动</span>
                <span className="text-xs text-zinc-400">3 小时前</span>
              </div>
              <p className="text-sm text-white font-medium mb-1">某头部新消费美妆品牌 CMO 离职</p>
              <p className="text-xs text-zinc-400">AI 提示: 合作策略可能发生调整，建议观望</p>
            </div>
          </div>
        </div>

        {/* Multimodal Asset Upload */}
        <div className="mb-10 bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-500" />
              多模态资产注入 (Multimodal Ingestion)
            </h3>
            <span className="text-xs text-zinc-500">支持文本、音频、视频，AI 自动转化为高维向量</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={resourceInput}
                onChange={(e) => setResourceInput(e.target.value)}
                placeholder="输入文本需求、品牌介绍或粘贴网址..."
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-300 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && onAddResource()}
                disabled={isExtractingResource}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <label className="flex items-center justify-center w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-all text-zinc-500 hover:text-violet-600 group relative">
                <Paperclip className="w-5 h-5" />
                <input type="file" className="hidden" accept="video/*,audio/*,image/*,.pdf,.doc,.docx" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">上传音视频/文档</span>
              </label>
              <button
                onClick={onAddResource}
                disabled={isExtractingResource || !resourceInput.trim()}
                className="bg-zinc-950 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md h-14"
              >
                {isExtractingResource ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                向量化入库
              </button>
            </div>
          </div>
          
          <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-900 mb-1">AI 深度理解与向量化</p>
              <p className="text-xs text-violet-700/80">上传的音视频和文档将被 AI 拆解为多维特征向量，用于暗池中的微秒级精准匹配，超越传统的关键词搜索。</p>
            </div>
          </div>
        </div>

        <ResourceDashboard knowledgeBase={knowledgeBase} />

        {knowledgeBase.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-zinc-200 border-dashed shadow-sm">
            <Database className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-zinc-900">资源库为空</h3>
            <p className="text-zinc-500 mt-3 max-w-md mx-auto">
              请在"需求对话"界面与AI交互，或上传文件，AI将自动为您提取结构化的营销需求并存入此处。
            </p>
            <button 
              onClick={() => onTabChange('chat')}
              className="mt-8 px-8 py-3 bg-zinc-950 text-white rounded-full font-medium hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
            >
              去输入需求
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {knowledgeBase.map((need, index) => (
              <EditableNeedCard 
                key={need.id} 
                need={need} 
                index={index} 
                userPlan={userPlan}
                onUpgrade={onUpgrade}
                onUpdate={(updatedNeed) => {
                  setKnowledgeBase(prev => prev.map(n => n.id === updatedNeed.id ? updatedNeed : n));
                }}
                onDelete={(id) => {
                  setKnowledgeBase(prev => prev.filter(n => n.id !== id));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeSection;
