import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  Search, 
  ShieldCheck, 
  Zap, 
  Database, 
  LineChart, 
  Users, 
  MessageSquare, 
  FileText, 
  CheckCircle2,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#05050a] text-white font-sans selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#05050a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">JETSEEK <span className="text-purple-400">捷策</span></span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
              <a href="#features" className="hover:text-white transition-colors">核心功能</a>
              <a href="#audience" className="hover:text-white transition-colors">适用人群</a>
              <a href="#solution" className="hover:text-white transition-colors">解决方案</a>
              <a href="#pricing" className="hover:text-white transition-colors">收费模式</a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a href="https://www.rockcent.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                返回官网
              </a>
              <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                登录
              </a>
              <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors">
                免费体验
              </a>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">核心功能</a>
              <a href="#audience" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">适用人群</a>
              <a href="#solution" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">解决方案</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">收费模式</a>
              <div className="h-px bg-white/10 my-2" />
              <a href="https://www.rockcent.com" target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">返回官网</a>
              <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">登录</a>
              <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="block mx-4 py-2 px-4 rounded-full bg-white text-black text-sm font-semibold text-center hover:bg-gray-200 transition-colors">免费体验</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(120,0,255,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              全新AI智能体品牌上线
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              AI时代的<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">随身智囊团</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
              你的第二大脑，让判断更快、更准、更可信。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center gap-2">
                立即开始体验 <ChevronRight className="w-5 h-5" />
              </a>
              <a href="#solution" className="px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-all">
                了解解决方案
              </a>
            </div>
            
            {/* Mockup / Visual */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/20 to-transparent z-20 pointer-events-none" />
              <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#0a0a12] backdrop-blur-sm text-left flex flex-col md:flex-row h-[450px] md:h-[550px] relative z-10">
                {/* Sidebar */}
                <div className="hidden md:flex flex-col w-64 border-r border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">历史对话</div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/10 text-sm text-gray-200 truncate border border-white/5">美国在2025年6月到期...</div>
                    <div className="p-3 rounded-xl hover:bg-white/5 text-sm text-gray-500 truncate transition-colors cursor-pointer">人形机器人早期项目投资...</div>
                    <div className="p-3 rounded-xl hover:bg-white/5 text-sm text-gray-500 truncate transition-colors cursor-pointer">新能源主题基金分析...</div>
                    <div className="p-3 rounded-xl hover:bg-white/5 text-sm text-gray-500 truncate transition-colors cursor-pointer">600234 科新发展的投资机会</div>
                  </div>
                </div>
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative">
                  {/* Header */}
                  <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-white/5">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-sm">JetSeek 深度推理模式</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>策略点: 7700</span>
                    </div>
                  </div>
                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6 relative">
                    {/* System/Welcome */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                        <BrainCircuit className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-sm text-gray-300 max-w-[85%] shadow-sm leading-relaxed">
                        Hi！欢迎使用JetSeek。请聚焦你的任务目标——我们用每一分算力，为你的高质量决策提效。越专业的问题，越高价值的答案。
                      </div>
                    </div>
                    {/* User Message */}
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-gray-600">
                        <span className="text-xs font-bold text-gray-300">我</span>
                      </div>
                      <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-tr-none p-4 text-sm text-purple-50 max-w-[85%] shadow-sm leading-relaxed">
                        美国在2025年6月到期和全年即将到期的美债一共有多少，需要找到权威数据来验证结论。
                      </div>
                    </div>
                    {/* AI Thinking & Response */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                        <BrainCircuit className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col gap-3 max-w-[85%]">
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full w-fit border border-emerald-400/20">
                            <CheckCircle2 className="w-3 h-3" /> 深度思考完成
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full w-fit border border-blue-400/20">
                            <Search className="w-3 h-3" /> 搜索到参考材料 20 篇
                          </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-5 text-sm text-gray-300 shadow-sm leading-relaxed">
                          <p className="mb-3">好的，我需要回答用户关于2025年6月及全年美债到期规模的问题，并找到权威数据验证。</p>
                          <p className="mb-3">首先，检查用户问题是否存在常识性错误。用户询问的是2025年6月和全年的美债到期量，需要权威数据支持。</p>
                          <p className="text-gray-400">接下来，查看提供的正文材料。材料中多个来源提到了美债到期情况。例如，材料 <span className="text-purple-400 cursor-pointer hover:underline">[1]</span> 来自公众号“一瑜中的”的文章指出，以每年1月1日为观察日，2025年美债到期规模为10.8万亿美元...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-24 bg-black/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">为什么决策越来越难？</h2>
            <p className="text-gray-400 text-lg">70%的人生困局，始于决策时的信息偏差。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <Search className="w-10 h-10 text-red-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">传统搜索失效</h3>
              <p className="text-gray-400 text-sm leading-relaxed">擅长“找到内容”，但无法“组织逻辑”。结果显示按“热度”，低质内容泛滥，越查越多，思路越乱。</p>
            </div>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <BrainCircuit className="w-10 h-10 text-yellow-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">通用AI的“幻觉”</h3>
              <p className="text-gray-400 text-sm leading-relaxed">缺乏专业知识和可靠数据，依靠联网搜索，无法判断信息真伪，生成看似合理但经不起推敲的答案。</p>
            </div>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <Database className="w-10 h-10 text-orange-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">内容污染严重</h3>
              <p className="text-gray-400 text-sm leading-relaxed">自媒体为博流量拆碎知识体系，AI学的是“碎片+标题党”，给你的答案可能都是错的。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prequel / History */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">22年后，我们决定做一个决策的<span className="text-purple-400">“第二大脑”</span></h2>
              <div className="space-y-8">
                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-purple-500 before:to-transparent">
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-purple-500" />
                  <h3 className="text-xl font-bold text-purple-400 mb-2">2003年</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    两家公司的创始人，曾携手打造中国证券<span className="text-white font-medium">行业首家</span>大型卖方投研管理平台，进入了<span className="text-white font-medium">专业投研报告数字化</span>管理新模式。从此开启，携宁在金融投研领域深耕20余年，积累了丰富的专业知识库、行业经验和技术能力，服务了众多大型金融机构。
                  </p>
                </div>
                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-blue-500 before:to-transparent">
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-blue-500" />
                  <h3 className="text-xl font-bold text-blue-400 mb-2">2025年</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    双方在积累的成熟技术、海量数据和丰富应用场景基础上，面向更广泛的高质量决策需求，打造了<span className="text-white font-medium">全新的AI智能体品牌——捷策 Jetseek AI</span>。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6">联合打造</h3>
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-xl font-bold text-blue-400">Rockcent 乐宸</div>
                  <div className="text-gray-500">X</div>
                  <div className="text-xl font-bold text-purple-400">携宁科技</div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h4 className="font-bold text-purple-300 mb-2">乐宸科技创始人 - 黄乐钊</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• 15年头部券商金融从业经验</li>
                      <li>• 国内首批互联网、证券电商人</li>
                      <li>• 头部券商品牌与公关负责人</li>
                      <li>• 10年创业经历</li>
                      <li>• 财经新媒体创始人</li>
                      <li>• 营销技术&AI智能体创始人</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section id="audience" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">谁需要捷策提升决策效率？</h2>
            <p className="text-gray-400 text-lg">适合需要基于可信数据和清晰逻辑做出重要判断的用户群体</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20">
              <LineChart className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">金融从业人员</h3>
              <p className="text-sm text-purple-300 mb-4">投资顾问 / 银行理财经理 / 经纪人</p>
              <p className="text-gray-400 text-sm">注重结果可验证性、逻辑完整性与效率 ROI。需要一个随时“讲得清逻辑、拿得出数据”的高效展业助手。</p>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/20">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">企业管理者 / 咨询顾问</h3>
              <p className="text-sm text-blue-300 mb-4">战略咨询 / 企业服务</p>
              <p className="text-gray-400 text-sm">决策代价高，时间窗口短，每天都在面对“不确定性”。需要数据支撑与推理链，降低决策失误风险。</p>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/20">
              <FileText className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">财经内容创作者 / 研究者</h3>
              <p className="text-sm text-emerald-300 mb-4">研究员 / 学生</p>
              <p className="text-gray-400 text-sm">选题难、追热点怕翻车、观点空泛缺数据。需要不仅能讲，还能撑得住推理逻辑和引用溯源。</p>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-900/40 to-black border border-orange-500/20">
              <ShieldCheck className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">大众投资者 / 职场白领</h3>
              <p className="text-sm text-orange-300 mb-4">普通白领人士</p>
              <p className="text-gray-400 text-sm">不敢盲信网络答案，也没时间啃研报。深受小作文伤害，需要快速给出靠谱建议，降低试错成本。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Solution */}
      <section id="solution" className="py-24 bg-black/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">专业、可靠、智能的解决方案</h2>
            <p className="text-gray-400 text-lg">打通“数据采集-知识加工-智能检索-深度分析”全链路赋能决策体系</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Database className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">20年积累私有知识库</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> 金融领域垂直知识库体系</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> 动态更新：覆盖95%以上专业研报，5000+主流信源</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" /> 数据处理：去重清洗率&gt;95%，无效信息过滤准确率98%+</li>
              </ul>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">RAG检索增强 + 知识图谱</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 混合检索支持千万级知识单元管理</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 金融事件引擎+动态实体关系深度抽取</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 动态维护500万实体知识图谱，识别准确率98%</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-emerald-400">工作流优化降低幻觉</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 构建完整推理链，结论带数据溯源</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 支持跨文档分析与多轮智能追问</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 数据不足不允许幻觉回复</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">产品核心功能</h2>
            <p className="text-gray-400 text-lg">专为提升决策效率设计的AI智能体</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
              <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">任务导向对话引擎</h3>
              <p className="text-sm text-gray-400">基于问题场景检索专业知识库，构建完整推理链，生成回复并附带引用链接。</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">话题广场</h3>
              <p className="text-sm text-gray-400">发现高质量问题，借力共创智慧。一键复用优质提问，获取个性化AI推理结果。</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
              <FileText className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">会员资讯</h3>
              <p className="text-sm text-gray-400">每日精选热点与个性推荐，让资讯成为可操作的AI提问入口，洞察先机。</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
              <Database className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">私有知识库</h3>
              <p className="text-sm text-gray-400">构建专属知识地图，沉淀行业理解、判断逻辑与内容偏好，实现长期认知复利。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">捷策与通用AI智能体有什么不同？</h2>
            <p className="text-gray-400 text-lg">显著减少幻觉 (AI Hallucination)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-6 text-left text-gray-400 font-medium w-1/5">维度</th>
                  <th className="py-4 px-6 text-left text-gray-400 font-medium w-2/5">通用AI + 联网搜索</th>
                  <th className="py-4 px-6 text-left text-purple-400 font-medium w-2/5">捷策AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">内容来源</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">即时抓取网页或搜索摘要，质量取决于网页来源，内容碎片化，信噪比低</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">私有化预处理的高质量结构化数据（舆情、研报、公告、图表、财报）</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">数据组织能力</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">靠语义摘要，多为零散内容拼接</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">内置知识图谱 + 实体抽取 + RAG语义重排</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">判断方式</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">回答表面问题，但难推导“为什么这样判断”。多数为概率生成，难以验证出处或引用断链</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">强调因果链推理、结论溯源和变量解释。所有结论均附溯源链接，支持原文核查</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">追问机制</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">可能陷入上下文混乱或语义偏离</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">多轮逻辑链稳定递进，支持结构补全</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">抗幻觉机制</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">存在“逻辑幻觉”风险，不确定信息也强答</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">多轮追问 + 结果扩展校验 + 不确定性提示</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-6 px-6 font-medium">适用场景</td>
                  <td className="py-6 px-6 text-gray-400 text-sm">闲聊陪伴、写文案、翻译、知识科普等</td>
                  <td className="py-6 px-6 text-purple-200 text-sm">投资分析、政策解读、竞品对比、数据归因、报告生成</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-black/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">收费模式</h2>
            <p className="text-gray-400 text-lg">基于算力消耗，按需使用，公平合理 (100策略点 = 1元)</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-bold mb-2">日常使用客户</h3>
              <div className="h-px w-full bg-white/10 my-6" />
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 首次注册获得免费体验策略点</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 购买单次套餐，按需使用</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 参与活动获得策略点奖励</li>
              </ul>
            </div>
            <div className="p-8 rounded-3xl border border-purple-500/50 bg-purple-900/20 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold">推荐</div>
              <h3 className="text-xl font-bold mb-2 text-purple-400">高频使用客户</h3>
              <div className="h-px w-full bg-white/10 my-6" />
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 订阅不同档次的月费套餐</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 获得不同策略点额度和会员权益</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 连续包月和年付客户额外折扣</li>
              </ul>
            </div>
            <div className="p-8 rounded-3xl border border-white/10 bg-white/5">
              <h3 className="text-xl font-bold mb-2">企业级客户</h3>
              <div className="h-px w-full bg-white/10 my-6" />
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 开通专业投资版账户</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 定制企业私有化部署、API对接</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" /> 批量优惠采购策略额度</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">你不信？<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">不如现在就试一次？</span></h2>
          <p className="text-xl text-gray-300 mb-10">
            请用你的专业技能，按照结构化的提问技巧，提出一个深度问题。<br/>
            对比问题的检索来源、数据依据、推理思维链、最终结论与建议！
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <a href="https://www.jetseek.cn" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center gap-2">
              立即体验 JetSeek <ChevronRight className="w-5 h-5" />
            </a>
            <p className="text-sm text-purple-300 font-medium">
              ✨ 扫码免费获取1000点策略点
            </p>
          </div>
          <p className="mt-8 text-gray-400 italic">"不试你不知道，试完你就换不回去了！"</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">JETSEEK <span className="text-purple-400">捷策</span></span>
              </div>
              <p className="text-gray-400 mb-2">期待捷策成为您最信赖的决策伙伴。</p>
              <p className="text-gray-400 mb-2">客服电话：020-28187838</p>
              <p className="text-gray-400">官方邮箱：jetseek@rockcent.com</p>
              <p className="text-gray-400">公司地址：广州市天河区黄埔大道西农信大厦</p>
            </div>
            <div className="flex gap-8 md:justify-end">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-lg mb-2 flex items-center justify-center text-xs text-gray-500">
                  公众号二维码
                </div>
                <p className="text-sm text-gray-400">官方公众号</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-lg mb-2 flex items-center justify-center text-xs text-gray-500">
                  客服二维码
                </div>
                <p className="text-sm text-gray-400">捷策客服</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Rockcent 乐宸科技. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
