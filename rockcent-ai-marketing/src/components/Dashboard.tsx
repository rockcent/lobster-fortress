import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Sparkles, Database, Zap, Bot, Network, Crown, Coins, Plus, X, Loader2, Search, LogOut, ShieldCheck, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import ChatSection from './sections/ChatSection';
import KnowledgeSection from './sections/KnowledgeSection';
import MatchmakingSection from './sections/MatchmakingSection';
import AgentSection from './sections/AgentSection';
import NetworkSection from './sections/NetworkSection';
import OnboardingWizard from './ui/OnboardingWizard';
import Logo from './ui/Logo';
import { Message, StructuredNeed, MatchmakingSuggestion } from '../types';

interface DashboardProps { merchantName: string; onLogout: () => void; }

const generateMockMatchmaking = (): MatchmakingSuggestion[] => [
  { id: 'match-1', partnerCompany: 'OATLY 噢麦力', partnerIndustry: '食品饮料', matchReason: '两家品牌均主打一二线城市年轻白领用户，受众重合度高达92%。OATLY近期在「早C晚A」场景下频繁发力，与本品牌的健康生活调性高度契合。', strategy: '## 联合营销策略\n\n### 1. 联名产品开发\n**「燕麦拿铁」节气限定套餐**\n- 双方线下门店同步推出联名特调饮品\n- 设立专属打卡点，引导用户社媒分享\n\n### 2. 社交媒体联动\n- 联合发起 #早C晚A新玩法 话题挑战\n- 邀请KOL进行双品牌探店直播\n\n### 3. 线下快闪活动\n- 在双方标杆门店举办「都市逃离计划」快闪', estimatedROI: '280%', recommendedAction: '建议优先通过数字分身BD发起轻量级接触，以「联名活动共创」为由建立连接，同步发送本品牌的人群画像数据包作为诚意筹码。', matchScores: { audience: 92, brandTone: 88, budget: 95, complementarity: 85 }, similarCase: { brands: '瑞幸 x 椰树', description: '椰云拿铁首日销量破 66 万杯，相关话题阅读量超 5 亿。' }, status: 'suggested' },
  { id: 'match-2', partnerCompany: 'Keep', partnerIndustry: '运动科技', matchReason: 'Keep的「运动+生活」用户群体与本品牌的目标客群高度重叠，且Keep近期发力线下活动。', strategy: '## 联合营销策略\n\n### 1. 线上挑战赛\n联合发起 #城市探索挑战 话题\n- 用户使用本品牌产品完成Keep运动任务\n- 双平台流量互换\n\n### 2. 联名运动礼包\n- 推出限量联名运动套装', estimatedROI: '180%', recommendedAction: '建议通过平台官方对接渠道发起合作提案，以「用户价值共创」为核心切入点。', matchScores: { audience: 88, brandTone: 75, budget: 70, complementarity: 82 }, status: 'suggested' }
];

function Dashboard({ merchantName, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'matchmaking' | 'agent' | 'network'>('chat');
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [credits, setCredits] = useState(0);
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: '# 🎯 欢迎来到 Rockcent AI 跨界营销云\n\n我是您的专属 AI 营销助手。基于您的品牌「' + merchantName + '」，我可以帮您：\n\n1. **需求解析** — 深度理解您的营销需求，结构化为可操作的方案\n2. **智能撮合** — 在暗池中发现最契合的跨界合作伙伴\n3. **策略生成** — 一键生成完整营销策略、执行排期与 MoU 草案\n\n请告诉我您的需求，例如：「我想和咖啡品牌做一次跨界联名」' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<StructuredNeed[]>([]);
  const [resourceInput, setResourceInput] = useState('');
  const [isExtractingResource, setIsExtractingResource] = useState(false);
  const [matchmaking, setMatchmaking] = useState<MatchmakingSuggestion[]>([]);
  const [isGeneratingMatch, setIsGeneratingMatch] = useState(false);
  const [matchmakingCount, setMatchmakingCount] = useState(0);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [generatingPitchDeckId, setGeneratingPitchDeckId] = useState<string | null>(null);
  const [generatingMoUId, setGeneratingMoUId] = useState<string | null>(null);
  const [generatingTimelineId, setGeneratingTimelineId] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState('活泼网感的消费品牌 PR');
  const [maxBudget, setMaxBudget] = useState(50000);
  const [agentStatus] = useState('已完成 3 轮暗池寻址，正在预谈判...');
  const [showTutorial, setShowTutorial] = useState(true);
  const [showPersonaPreviewModal, setShowPersonaPreviewModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationMessages, setSimulationMessages] = useState<{role: 'user'|'assistant', content: string}[]>([{ role: 'assistant', content: '您好，我是 OATLY 的商务总监。请问您找我有什么合作机会想探讨？' }]);
  const [simulationInput, setSimulationInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationHandoff, setSimulationHandoff] = useState(false);
  const simulationEndRef = useRef<HTMLDivElement>(null);
  const [showBrandDetailModal, setShowBrandDetailModal] = useState(false);
  const [selectedBrandDetail, setSelectedBrandDetail] = useState<any>(null);
  const [showIcebreakerModal, setShowIcebreakerModal] = useState(false);
  const [showWarRoomModal, setShowWarRoomModal] = useState(false);
  const [showSocialGiftModal, setShowSocialGiftModal] = useState(false);
  const [socialGiftType, setSocialGiftType] = useState<'poster' | 'weibo'>('poster');
  const [showShareGiftModal, setShowShareGiftModal] = useState(false);
  const [shareStep, setShareStep] = useState<1 | 2 | 3>(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGlobalAlert, setShowGlobalAlert] = useState(false);

  const handleToast = useCallback((msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = '';
  };

  const handleSendMessage = () => {
    if (!input.trim() && !selectedFile) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() || `[上传文件: ${selectedFile?.name}]` };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsExtracting(true);
    setSelectedFile(null);
    setTimeout(() => {
      setIsExtracting(false);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '## 🎯 需求已深度解析\n\nAI 已从您的描述中提取出以下**结构化营销需求**：\n\n| 维度 | 分析结果 |\n|------|--------|\n| **行业定位** | 新消费生活方式品牌 |\n| **目标客群** | 22-35岁一二线城市白领 |\n| **预算范围** | 5-20万 |\n| **核心诉求** | 品牌曝光 + 用户增长 |\n\n已自动存入您的**资源库**，点击左下角「一键生成营销策略」让 AI 为您匹配高潜跨界伙伴。' }]);
      setIsLoading(false);
      setKnowledgeBase(prev => [...prev, { id: Date.now().toString(), companyName: merchantName, industry: '新消费生活方式', targetAudience: '22-35岁一二线城市白领', marketingGoals: ['品牌曝光', '用户增长', '跨界联名'], budgetRange: '5-20万', preferredChannels: ['社交媒体', '线下活动', 'KOL合作'], keySellingPoints: ['创新产品', '独特品牌调性', '精准用户画像'], crossBorderPreferences: ['咖啡茶饮', '运动健康', '生活方式'], rawInput: input }]);
    }, 2500);
  };

  const handleAddResource = () => {
    if (!resourceInput.trim()) return;
    setIsExtractingResource(true);
    setTimeout(() => {
      setKnowledgeBase(prev => [...prev, { id: Date.now().toString(), companyName: merchantName, industry: '新消费品牌', targetAudience: '都市白领/年轻人群', marketingGoals: ['品牌曝光', 'GMV增长'], budgetRange: '待定', preferredChannels: ['线上渠道'], keySellingPoints: ['产品差异化', '内容营销'], crossBorderPreferences: ['异业合作'], rawInput: resourceInput }]);
      setResourceInput('');
      setIsExtractingResource(false);
    }, 2000);
  };

  const handleGenerateMatchmaking = () => {
    if (userPlan === 'free' && matchmakingCount >= 3) { setShowUpgradeModal(true); return; }
    setIsGeneratingMatch(true);
    setTimeout(() => { setMatchmaking(generateMockMatchmaking()); setMatchmakingCount(prev => prev + 1); setIsGeneratingMatch(false); setActiveTab('matchmaking'); }, 3000);
  };

  const handleStatusChange = (suggestionId: string, newStatus: MatchmakingSuggestion['status']) => {
    setMatchmaking(prev => prev.map(s => s.id === suggestionId ? { ...s, status: newStatus } : s));
  };

  const handleRefinePlan = (suggestion: MatchmakingSuggestion) => {
    setRefiningId(suggestion.id);
    setTimeout(() => {
      setMatchmaking(prev => prev.map(s => s.id === suggestion.id ? { ...s, refinedDetails: '## AI 细化执行方案\n\n### Phase 1: 预热期 (T-14 ~ T-7)\n1. **话题预埋**：在微博/小红书发布悬念海报\n2. **KOL种草**：邀请契合品牌调性的 KOL 预热带节奏\n3. **私域预热**：在品牌私域社群发布预热信息\n\n### Phase 2: 爆发期 (T-1 ~ T+3)\n1. **联合官宣**：双方官方账号同步发布联名海报\n2. **线下快闪**：在一线城市热门商圈开设联名快闪店\n3. **UGC引爆**：发起挑战赛，激励用户生成内容\n\n### Phase 3: 长尾期 (T+4 ~ T+14)\n1. **战报发布**：联合发布营销战报，强化品牌势能\n2. **二次传播**：将优质 UGC 整理发布，进行二次传播\n3. **关系维护**：交换联系方式，建立长期合作机制' } : s));
      setRefiningId(null);
    }, 3000);
  };

  const handleGeneratePitchDeck = (suggestion: MatchmakingSuggestion) => {
    setGeneratingPitchDeckId(suggestion.id);
    setTimeout(() => {
      setMatchmaking(prev => prev.map(s => s.id === suggestion.id ? { ...s, pitchDeck: `## 📬 合作邀请函\n\n**致 ${suggestion.partnerCompany} 商务团队：**\n\n我是 ${merchantName} 的市场负责人。\n\n我们在 Rockcent AI 暗池中发现，${suggestion.partnerCompany} 与我们的品牌调性高度契合。\n\n**我们希望提出以下合作提案：**\n\n1. 🎯 **联名产品共创**：联合开发限定产品/套餐\n2. 📱 **社交媒体联动**：双平台联合发起话题挑战\n3. 🎪 **线下活动合作**：共同举办品牌快闪/体验活动\n\n根据 Rockcent AI 的测算，这次合作的预估 ROI 达到 **${suggestion.estimatedROI}**，潜在曝光增量可达 **1500万+**。\n\n期待您的回复！\n\n---\n*此邀请函由 Rockcent AI 营销云自动生成*` } : s));
      setGeneratingPitchDeckId(null);
      setCredits(prev => Math.max(0, prev - 1));
    }, 3000);
  };

  const handleGenerateMoU = (suggestion: MatchmakingSuggestion) => {
    setGeneratingMoUId(suggestion.id);
    setTimeout(() => {
      setMatchmaking(prev => prev.map(s => s.id === suggestion.id ? { ...s, mou: `## 📝 合作备忘录 (MoU)\n\n**甲方**：${merchantName}\n**乙方**：${suggestion.partnerCompany}\n**签署日期**：${new Date().toLocaleDateString('zh-CN')}\n\n### 一、合作目标\n双方希望通过本次跨界合作，提升品牌曝光度，扩大在目标用户群体中的影响力，实现品牌价值的共同增长。\n\n### 二、合作内容\n1. 联合推出联名产品/活动\n2. 社交媒体平台联动推广\n3. 线下活动资源互换\n\n### 三、双方权责\n- 甲方负责提供核心营销资源及产品支持\n- 乙方负责提供匹配的渠道资源及联合推广\n\n### 四、保密条款\n双方应对本备忘录内容保密，未经对方书面同意，不得向第三方披露。\n\n---\n*注：此为 AI 生成草案，具体条款以正式合同为准。*` } : s));
      setGeneratingMoUId(null);
    }, 4000);
  };

  const handleGenerateTimeline = (suggestion: MatchmakingSuggestion) => {
    setGeneratingTimelineId(suggestion.id);
    setTimeout(() => {
      setMatchmaking(prev => prev.map(s => s.id === suggestion.id ? { ...s, timeline: [{ date: 'T-14', task: '双方确认最终合作方案，签署正式合同' }, { date: 'T-10', task: '联合创意物料设计制作（海报/视频/文案）' }, { date: 'T-7', task: 'KOL & 媒体邀请，私域预热启动' }, { date: 'T-1', task: '双方官博/官微同步发布预热海报' }, { date: 'T+0', task: '联名活动正式上线，线下快闪店开业' }, { date: 'T+3', task: 'UGC 收集整理，KOL 二次传播' }, { date: 'T+7', task: '发布联合营销战报，确认后续合作意向' }] } : s));
      setGeneratingTimelineId(null);
    }, 4000);
  };

  const handleSimulationSend = () => {
    if (!simulationInput.trim()) return;
    setSimulationMessages(prev => [...prev, { role: 'user', content: simulationInput }]);
    setSimulationInput('');
    setIsSimulating(true);
    setTimeout(() => {
      const responses = ['这个方案听起来很有创意！能具体说说预期能达到多少曝光量吗？', '我们内部讨论一下。您能提供的资源置换方案是什么？', '初步看方向OK。但我们的预算红线是5万，超出这个数字需要特别审批。', '好的，那我们先按这个框架推进。'];
      setSimulationMessages(prev => [...prev, { role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)] }]);
      setIsSimulating(false);
      if (Math.random() > 0.7) setSimulationHandoff(true);
    }, 2000);
  };

  const startSimulation = () => { setShowSimulationModal(true); setSimulationMessages([{ role: 'assistant', content: '您好，我是 OATLY 的商务总监。请问您找我有什么合作机会想探讨？' }]); setSimulationHandoff(false); };

  useEffect(() => { if (showSimulationModal) simulationEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [simulationMessages, showSimulationModal]);

  const navItems = [
    { tab: 'chat' as const, icon: Sparkles, color: 'rose', label: '需求对话 (AI)' },
    { tab: 'knowledge' as const, icon: Database, color: 'violet', label: '资源库', count: knowledgeBase.length },
    { tab: 'matchmaking' as const, icon: Zap, color: 'amber', label: '跨界撮合策略', count: matchmaking.length },
    { tab: 'agent' as const, icon: Bot, color: 'emerald', label: '数字分身 BD' },
    { tab: 'network' as const, icon: Network, color: 'blue', label: '品牌朋友圈' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-zinc-900 selection:bg-rose-500/30">
      <AnimatePresence>{showTutorial && (<OnboardingWizard isOpen={showTutorial} onClose={() => setShowTutorial(false)} companyName={merchantName} onComplete={(persona, budget) => { setSelectedPersona(persona); setMaxBudget(budget); startSimulation(); }} />)}</AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-zinc-200/50 flex flex-col md:flex-row">
              <div className="flex-1 p-10 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6"><Crown className="w-6 h-6 text-amber-400" /><h3 className="text-2xl font-bold">升级 Pro 版</h3></div>
                  <p className="text-zinc-400 mb-8">解锁全维度的商业撮合能力。</p>
                  <div className="space-y-4 mb-10">
                    {['无限制的 AI 撮合推荐', '解锁「多维匹配度雷达图」深度分析', '不限次生成「合作备忘录 (MoU)」', '不限次生成「联合营销执行排期」', '品牌资产认证「全网多平台交叉验证」', '资源库优先展示特权 (Boost)'].map((f, i) => (<div key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" /><span className="text-sm text-zinc-300">{f}</span></div>))}
                  </div>
                  <button onClick={() => { setUserPlan('pro'); setShowUpgradeModal(false); handleToast('升级成功！您已解锁 Pro 版全部功能。'); }} className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-colors shadow-lg">立即升级 (¥999/月)</button>
                </div>
              </div>
              <div className="flex-1 p-10 bg-white">
                <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><Coins className="w-6 h-6 text-amber-500" /><h3 className="text-2xl font-bold text-zinc-900">充值连接点数</h3></div><button onClick={() => setShowUpgradeModal(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button></div>
                <p className="text-zinc-500 mb-8">消耗点数发送「合作邀请函」，按效果付费。</p>
                <div className="grid gap-4 mb-8">
                  {[{ points: 10, price: '¥99', popular: false }, { points: 50, price: '¥399', popular: true }, { points: 200, price: '¥999', popular: false }].map((pkg, i) => (<div key={i} className={cn("flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all", pkg.popular ? "border-amber-400 bg-amber-50/30" : "border-zinc-200 hover:border-amber-200 hover:bg-zinc-50")}><div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", pkg.popular ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-600")}>{pkg.points}</div><div><div className="font-bold text-zinc-900">连接点数</div>{pkg.popular && <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">最受欢迎</div>}</div></div><div className="font-black text-xl text-zinc-900">{pkg.price}</div></div>))}
                </div>
                <button onClick={() => { setCredits(prev => prev + 50); setShowUpgradeModal(false); handleToast('充值成功！已为您添加 50 点连接点数。'); }} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors shadow-lg">购买 50 点 (¥399)</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-72 bg-[#0A0A0B] flex flex-col border-r border-zinc-800/50 shadow-2xl z-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />
        <div className="p-6 relative z-10">
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg inline-block mb-4"><Logo className="h-10 w-auto" variant="dark" /></div>
            <p className="text-[11px] text-zinc-500 font-semibold tracking-widest uppercase">每一个品牌都应该有自己的朋友圈</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-bold shadow-inner border border-white/10">{merchantName.charAt(0).toUpperCase()}</div>
            <div className="flex-1 overflow-hidden"><p className="text-sm font-semibold text-white truncate">{merchantName}</p><p className="text-[11px] text-zinc-400 truncate uppercase tracking-wider mt-0.5">商户工作台</p></div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1.5 relative z-10">
          {navItems.map(({ tab, icon: Icon, color, label, count }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-300", activeTab === tab ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200")}>
              <Icon className={cn("w-5 h-5", activeTab === tab ? `text-${color}-400` : "opacity-70")} />
              {tab === 'chat' ? '需求对话 (AI)' : tab === 'knowledge' ? '资源库' : tab === 'matchmaking' ? '跨界撮合策略' : tab === 'agent' ? '数字分身 BD' : '品牌朋友圈'}
              {count !== undefined && count > 0 && (<span className={cn("ml-auto py-0.5 px-2.5 rounded-full text-xs border font-semibold", color === 'violet' ? "bg-violet-500/20 text-violet-300 border-violet-500/20" : color === 'amber' ? "bg-amber-500/20 text-amber-300 border-amber-500/20" : "")}>{count}</span>)}
            </button>
          ))}
        </nav>
        <div className="p-6 mt-auto space-y-4 relative z-10">
          <button onClick={handleGenerateMatchmaking} disabled={isGeneratingMatch || knowledgeBase.length === 0} className="w-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-white/5 disabled:text-zinc-500 py-4 rounded-2xl text-[15px] font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-transparent">
            <div className="flex items-center gap-2">{isGeneratingMatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}{isGeneratingMatch ? '正在生成策略...' : '一键生成营销策略'}</div>
            {userPlan === 'free' && <span className="text-[10px] text-zinc-500 font-normal">本月剩余次数: {Math.max(0, 3 - matchmakingCount)}/3</span>}
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"><LogOut className="w-4 h-4" />退出登录</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200/50 bg-white/80 backdrop-blur-md z-30 relative">
          <div className="flex items-center gap-2">
            {userPlan === 'pro' ? (<div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg text-xs font-bold shadow-sm"><Crown className="w-3.5 h-3.5" />PRO 版</div>) : (<><div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold border border-zinc-200">免费版</div><button onClick={() => setShowUpgradeModal(true)} className="text-xs font-bold text-violet-600 hover:text-violet-700 underline underline-offset-2 ml-2">升级解锁特权</button></>)}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-lg shadow-sm"><Coins className="w-4 h-4 text-amber-500" /><span className="text-sm font-bold text-amber-700">{credits} 点</span><button onClick={() => setShowUpgradeModal(true)} className="ml-2 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center hover:bg-amber-300 transition-colors"><Plus className="w-3 h-3" /></button></div>
          </div>
        </header>

        {activeTab === 'chat' && (<ChatSection messages={messages} input={input} setInput={setInput} isLoading={isLoading} isExtracting={isExtracting} selectedFile={selectedFile} onFileUpload={handleFileUpload} onSendMessage={handleSendMessage} onClearFile={() => setSelectedFile(null)} />)}
        {activeTab === 'knowledge' && (<KnowledgeSection knowledgeBase={knowledgeBase} setKnowledgeBase={setKnowledgeBase} userPlan={userPlan} onUpgrade={() => setShowUpgradeModal(true)} activeTab={activeTab} onTabChange={setActiveTab} resourceInput={resourceInput} setResourceInput={setResourceInput} isExtractingResource={isExtractingResource} onAddResource={handleAddResource} />)}
        {activeTab === 'matchmaking' && (<MatchmakingSection matchmaking={matchmaking} knowledgeBase={knowledgeBase} isGeneratingMatch={isGeneratingMatch} userPlan={userPlan} onGenerateMatchmaking={handleGenerateMatchmaking} onRefinePlan={handleRefinePlan} onGeneratePitchDeck={handleGeneratePitchDeck} onGenerateMoU={handleGenerateMoU} onGenerateTimeline={handleGenerateTimeline} onStatusChange={handleStatusChange} refiningId={refiningId} generatingPitchDeckId={generatingPitchDeckId} generatingMoUId={generatingMoUId} generatingTimelineId={generatingTimelineId} onUpgrade={() => setShowUpgradeModal(true)} activeTab={activeTab} onTabChange={setActiveTab} />)}
        {activeTab === 'agent' && (<AgentSection merchantName={merchantName} selectedPersona={selectedPersona} setSelectedPersona={setSelectedPersona} maxBudget={maxBudget} setMaxBudget={setMaxBudget} agentStatus={agentStatus} showPersonaPreviewModal={showPersonaPreviewModal} setShowPersonaPreviewModal={setShowPersonaPreviewModal} showSimulationModal={showSimulationModal} setShowSimulationModal={setShowSimulationModal} simulationMessages={simulationMessages} simulationInput={simulationInput} setSimulationInput={setSimulationInput} isSimulating={isSimulating} simulationHandoff={simulationHandoff} simulationEndRef={simulationEndRef} onSimulationSend={handleSimulationSend} onStartSimulation={startSimulation} onScrollSimulationBottom={() => simulationEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />)}
        {activeTab === 'network' && (<NetworkSection merchantName={merchantName} showBrandDetailModal={showBrandDetailModal} setShowBrandDetailModal={setShowBrandDetailModal} selectedBrandDetail={selectedBrandDetail} setSelectedBrandDetail={setSelectedBrandDetail} showIcebreakerModal={showIcebreakerModal} setShowIcebreakerModal={setShowIcebreakerModal} showWarRoomModal={showWarRoomModal} setShowWarRoomModal={setShowWarRoomModal} showSocialGiftModal={showSocialGiftModal} setShowSocialGiftModal={setShowSocialGiftModal} socialGiftType={socialGiftType} setSocialGiftType={setSocialGiftType} showShareGiftModal={showShareGiftModal} setShowShareGiftModal={setShowShareGiftModal} shareStep={shareStep} setShareStep={setShareStep} onToast={handleToast} onTabChange={setActiveTab} onSetInput={setInput} />)}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full bg-zinc-900 text-white rounded-2xl shadow-2xl border border-zinc-800 p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
