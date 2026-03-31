import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Activity, Users, Heart, Gift, MessageCircle, Share2, ChevronRight, X, Building2, Coffee, Beer, Tent, Car, User, Send, Calendar } from 'lucide-react';

interface NetworkSectionProps {
  merchantName: string;
  showBrandDetailModal: boolean;
  setShowBrandDetailModal: (val: boolean) => void;
  selectedBrandDetail: any;
  setSelectedBrandDetail: (val: any) => void;
  showIcebreakerModal: boolean;
  setShowIcebreakerModal: (val: boolean) => void;
  showWarRoomModal: boolean;
  setShowWarRoomModal: (val: boolean) => void;
  showSocialGiftModal: boolean;
  setShowSocialGiftModal: (val: boolean) => void;
  socialGiftType: 'poster' | 'weibo';
  setSocialGiftType: (val: 'poster' | 'weibo') => void;
  showShareGiftModal: boolean;
  setShowShareGiftModal: (val: boolean) => void;
  shareStep: 1 | 2 | 3;
  setShareStep: (val: 1 | 2 | 3) => void;
  onToast: (message: string) => void;
  onTabChange: (tab: 'chat' | 'knowledge' | 'matchmaking' | 'agent' | 'network') => void;
  onSetInput: (input: string) => void;
}

const brandNodes = [
  { name: '瑞幸咖啡', top: '35%', left: '30%', icon: Coffee, color: 'blue', reach: '1.2亿', centrality: '极高', tags: ['早C晚A', '年轻化', '高频消费'], industry: '食品饮料' },
  { name: 'OATLY', top: '20%', left: '45%', color: 'blue', reach: '5000万', centrality: '高', tags: ['植物基', '健康环保'], industry: '食品饮料', isText: true },
  { name: '牧高笛', top: '70%', left: '70%', icon: Tent, color: 'rose', reach: '3000万', centrality: '高', tags: ['精致露营', '中产家庭'], industry: '运动户外' },
  { name: '蔚来', top: '30%', left: '75%', icon: Car, color: 'amber', reach: '1000万', centrality: '中', tags: ['新能源', '高净值'], industry: '汽车出行' },
];

function NetworkSection({ merchantName, showBrandDetailModal, setShowBrandDetailModal, selectedBrandDetail, setSelectedBrandDetail, showIcebreakerModal, setShowIcebreakerModal, showWarRoomModal, setShowWarRoomModal, showSocialGiftModal, setShowSocialGiftModal, socialGiftType, setSocialGiftType, showShareGiftModal, setShowShareGiftModal, shareStep, setShareStep, onToast, onTabChange, onSetInput }: NetworkSectionProps) {
  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" />
            品牌朋友圈
          </h2>
          <p className="text-zinc-500 mt-3 text-lg">打破信息孤岛，看清您在商业生态中的位置，AI 助您发起多边联合战役。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Brand Graph */}
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" />行业影响力热力图</h3>
                <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">查看完整图谱 <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="relative h-80 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center mb-6">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-8 left-8 text-blue-400/60 text-xs font-bold">早C晚A圈</div>
                <div className="absolute bottom-8 right-8 text-rose-400/60 text-xs font-bold">户外露营圈</div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center border-4 border-zinc-800"><span className="text-zinc-900 font-black text-sm">您</span></div>
                </div>
                {brandNodes.map((node) => (
                  <div key={node.name} className="absolute cursor-pointer group" style={{ top: node.top, left: node.left, transform: 'translate(-50%,-50%)' }} onClick={() => { setSelectedBrandDetail({ name: node.name, industry: node.industry, reach: node.reach, centrality: node.centrality, tags: node.tags }); setShowBrandDetailModal(true); }}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${node.color === 'blue' ? 'bg-blue-900/80 border-blue-400' : node.color === 'rose' ? 'bg-rose-900/80 border-rose-400' : 'bg-amber-900/80 border-amber-400'} group-hover:scale-110 transition-transform backdrop-blur-sm`}>
                      {node.isText ? <span className="text-blue-200 font-bold text-xs">{node.name}</span> : <node.icon className="w-5 h-5 text-white" />}
                    </div>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] font-bold text-white whitespace-nowrap bg-zinc-900/80 px-2 py-0.5 rounded">{node.name}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-600" />六度空间智能引荐</h4>
                <p className="text-sm text-blue-800 mb-3">AI 发现您可能想联系 <span className="font-bold">蔚来汽车</span>。通过您的长期盟友 <span className="font-bold">OATLY</span> 进行引荐，成功率预计提升 60%。</p>
                <button onClick={() => setShowIcebreakerModal(true)} className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold border border-blue-200 hover:bg-blue-50 transition-colors">生成破冰话术</button>
              </div>
            </div>

            {/* Multi-sided Tribes */}
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2"><Users className="w-5 h-5 text-violet-500" />生成式多边部落</h3>
                <span className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">1 个新提议</span>
              </div>
              <div className="border border-violet-200 rounded-2xl p-6 bg-gradient-to-br from-white to-violet-50/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">自治型群组造浪</span>
                      <span className="text-xs text-zinc-500">AI 测算受众重合度: 85%</span>
                    </div>
                    <h4 className="text-2xl font-bold text-zinc-900">「早C晚A」都市逃离计划</h4>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center"><Coffee className="w-4 h-4 text-zinc-500" /></div>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center"><Beer className="w-4 h-4 text-zinc-500" /></div>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center"><Tent className="w-4 h-4 text-zinc-500" /></div>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 mb-6">AI 感知到您与 瑞幸咖啡、燕京啤酒、牧高笛 近期都有营销预算且受众高度互补。建议联合发起一场针对一二线城市白领的周末露营快闪活动。</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowWarRoomModal(true)} className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-md">进入虚拟研讨室</button>
                  <button className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-colors">忽略提议</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
              <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" />全周期关系维护管家</h3>
              <div className="space-y-4">
                {[
                  { brand: 'OATLY 噢麦力', time: '2 小时前', event: '刚刚发布了双十一战报，全网销售额破亿。', icon: Activity, type: 'rose', action: () => { setSocialGiftType('poster'); setShowSocialGiftModal(true); }, label: '生成联名祝贺海报' },
                  { brand: 'Keep', time: '昨天', event: '品牌成立 9 周年纪念日。', icon: Calendar, type: 'zinc', action: () => { setSocialGiftType('weibo'); setShowSocialGiftModal(true); }, label: '发送微博互动方案' },
                  { brand: 'OATLY 噢麦力', time: '刚刚', event: '您的潜在盟友 OATLY 近期热度飙升，是否发送联名企划方案作为破冰礼物？', icon: Share2, type: 'blue', action: () => { setShareStep(1); setShowShareGiftModal(true); }, label: '生成跨界预案盲盒' },
                ].map((item, i) => (
                  <div key={i} className="relative flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'rose' ? 'bg-rose-100 text-rose-500' : item.type === 'blue' ? 'bg-blue-100 text-blue-500' : 'bg-zinc-100 text-zinc-500'}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-3 border border-zinc-200 shadow-sm">
                      <div className="flex justify-between items-start mb-1"><span className="font-bold text-zinc-900 text-sm">{item.brand}</span><span className="text-[10px] text-zinc-400">{item.time}</span></div>
                      <p className="text-xs text-zinc-600 mb-2">{item.event}</p>
                      <button onClick={item.action} className={`w-full py-1.5 rounded-md text-xs font-bold border ${item.type === 'rose' ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50' : item.type === 'blue' ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'}`}>{item.label}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showBrandDetailModal && selectedBrandDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><Building2 className="w-5 h-5" />品牌数字分身档案</h3>
                <button onClick={() => setShowBrandDetailModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center border-2 border-zinc-200"><span className="text-2xl font-black text-zinc-600">{selectedBrandDetail.name?.charAt(0)}</span></div>
                  <div><h4 className="text-2xl font-bold text-zinc-900">{selectedBrandDetail.name}</h4><p className="text-sm text-zinc-500">{selectedBrandDetail.industry}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100"><div className="text-xs font-bold text-zinc-400 uppercase mb-1">受众辐射范围</div><div className="text-xl font-black text-zinc-800">{selectedBrandDetail.reach}</div></div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100"><div className="text-xs font-bold text-zinc-400 uppercase mb-1">圈层中心度</div><div className="text-xl font-black text-blue-600">{selectedBrandDetail.centrality}</div></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase mb-2">品牌标签</div>
                  <div className="flex flex-wrap gap-2">{selectedBrandDetail.tags?.map((tag: string) => (<span key={tag} className="text-xs font-medium bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md border border-zinc-200">{tag}</span>))}</div>
                </div>
              </div>
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                <button onClick={() => setShowBrandDetailModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-600">关闭</button>
                <button onClick={() => { setShowBrandDetailModal(false); onTabChange('chat'); onSetInput(`我想和 ${selectedBrandDetail.name} 合作，请帮我分析一下可行性并生成一份初步的合作方案。`); }} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800">发起合作探讨</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showIcebreakerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-blue-50/50">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2"><Share2 className="w-5 h-5 text-blue-500" />六度空间智能引荐</h3>
                <button onClick={() => setShowIcebreakerModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-500 mb-4">AI 已为您生成通过 <span className="font-bold">OATLY</span> 联系 <span className="font-bold">蔚来汽车</span> 的破冰话术：</p>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-sm text-zinc-700 whitespace-pre-wrap font-medium leading-relaxed">Hi [蔚来团队负责人],\n\n我是 {merchantName} 的主理人。最近和我们的共同合作伙伴 OATLY 交流时，他强烈推荐了你们在生活方式领域的创新。\n\n我们近期在策划一场针对高净值车主的跨界活动，受众与蔚来极度契合。希望能借此机会交流一下潜在的合作空间。\n\n期待回复！</div>
              </div>
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                <button onClick={() => setShowIcebreakerModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-600">取消</button>
                <button onClick={() => { setShowIcebreakerModal(false); onToast('破冰话术已复制到剪贴板'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">复制并去联系</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showWarRoomModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col border border-zinc-200">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                <div><h3 className="text-xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-violet-200" />虚拟研讨室：「早C晚A」都市逃离计划</h3><p className="text-violet-200 text-sm mt-1 opacity-90">参与方：瑞幸咖啡、燕京啤酒、牧高笛、{merchantName}</p></div>
                <button onClick={() => setShowWarRoomModal(false)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 space-y-4">
                {[
                  { brand: '瑞幸咖啡 (AI分身)', icon: Coffee, color: 'blue', msg: '我们对这个企划很感兴趣。瑞幸可以提供全国 3000 家门店的早间屏幕轮播资源，以及 5 万张 9.9 元特价券作为引流。我们需要确保活动能在小红书上产生至少 1000 篇高质量 UGC。' },
                  { brand: '牧高笛 (AI分身)', icon: Tent, color: 'rose', msg: '同意瑞幸的引流方案。牧高笛可以赞助 10 套顶级天幕帐篷作为终极大奖，并在官方账号发起 #早C晚A露营 话题。我们希望您能提供一些高价值的实物赠品。' },
                  { brand: '燕京啤酒 (AI分身)', icon: Beer, color: 'amber', msg: '晚间的精酿畅饮我们包了！另外我们可以邀请两位厂牌 Rapper 到线下快闪店演出，提升现场氛围。前提是各方能在宣发中带上我们的新品 Tag。' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color === 'blue' ? 'bg-blue-100 border border-blue-200' : item.color === 'rose' ? 'bg-rose-100 border border-rose-200' : 'bg-amber-100 border border-amber-200'}`}>
                      <item.icon className={`w-5 h-5 ${item.color === 'blue' ? 'text-blue-600' : item.color === 'rose' ? 'text-rose-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-sm text-zinc-900">{item.brand}</span></div>
                      <p className="text-sm text-zinc-700 leading-relaxed">{item.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-zinc-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input type="text" placeholder="输入您的提议或资源承诺..." className="w-full pl-4 pr-12 py-3 bg-zinc-100 border-transparent focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-xl text-sm transition-all" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSocialGiftModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><Gift className="w-5 h-5 text-rose-500" />{socialGiftType === 'poster' ? '生成联名祝贺海报' : '生成微博互动方案'}</h3>
                <button onClick={() => setShowSocialGiftModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 bg-zinc-50/50">
                {socialGiftType === 'poster' ? (
                  <div className="space-y-4">
                    <div className="aspect-[3/4] w-full bg-gradient-to-br from-rose-400 via-orange-300 to-amber-200 rounded-xl shadow-inner flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                      <div className="relative z-10">
                        <h4 className="text-3xl font-black text-white drop-shadow-md mb-2 tracking-wider">OATLY</h4>
                        <p className="text-white/90 font-bold text-lg mb-8 drop-shadow">双十一全网破亿</p>
                        <div className="w-16 h-1 bg-white/50 mx-auto mb-8 rounded-full"></div>
                        <p className="text-white font-medium drop-shadow-sm">祝贺我们的超级盟友！</p>
                        <p className="text-white/80 text-sm mt-2">未来继续携手，创造更多可能。</p>
                        <div className="mt-12 inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-xs font-bold">{merchantName} 敬上</div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 text-center">AI 已根据 OATLY 的品牌视觉风格生成海报</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"><span className="text-xs font-bold text-zinc-500">You</span></div>
                        <div><p className="font-bold text-sm text-zinc-900">{merchantName}</p><p className="text-[10px] text-zinc-400">刚刚</p></div>
                      </div>
                      <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">祝 @Keep 9周年快乐！🏃‍♂️🏃‍♀️ 运动不止，探索不息。\n\n今天和我们的老朋友 Keep 一起搞个大动作！关注我们并转发此条微博，抽 9 位粉丝送出【Keep x {merchantName} 联名运动大礼包】！🎁\n\n#Keep9周年# #自律给我自由#</p>
                    </div>
                    <p className="text-xs text-zinc-500 text-center">AI 已结合双方品牌调性生成抽奖文案</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-zinc-100 bg-white flex justify-end gap-3">
                <button onClick={() => setShowSocialGiftModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-600">取消</button>
                <button onClick={() => { setShowSocialGiftModal(false); onToast(socialGiftType === 'poster' ? '海报已保存并发送至对方 BD 邮箱' : '方案已同步至您的社交媒体草稿箱'); }} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 shadow-sm">{socialGiftType === 'poster' ? '一键发送祝贺' : '采用此方案'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showShareGiftModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              {shareStep === 1 && (
                <>
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><Gift className="w-5 h-5 text-blue-500" />高定版「跨界预案盲盒」</h3>
                    <button onClick={() => setShowShareGiftModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 bg-white space-y-6">
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                      <div className="flex justify-center mb-4"><div className="flex items-center gap-2"><div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">{merchantName}</div><X className="w-4 h-4 text-zinc-400" /><div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">OATLY</div></div></div>
                      <h4 className="text-center font-bold text-zinc-900 mb-2">早 C 晚 A 联名企划草案</h4>
                      <p className="text-xs text-zinc-500 text-center mb-4">AI 测算受众重合度 92% | 预期 ROI 180%</p>
                      <div className="text-xs text-zinc-600 bg-white p-3 rounded-lg border border-zinc-200">
                        <p className="font-medium mb-1">核心亮点：</p>
                        <ul className="list-disc pl-4 space-y-1"><li>联合推出「燕麦拿铁特调」套餐</li><li>双微一抖矩阵资源互换</li><li>线下门店快闪打卡活动</li></ul>
                      </div>
                    </div>
                    <button onClick={() => setShareStep(2)} className="w-full py-3 bg-[#07C160] text-white rounded-xl font-bold hover:bg-[#06ad56] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"><Share2 className="w-4 h-4" />发送给微信好友 (OATLY 负责人)</button>
                  </div>
                </>
              )}
              {shareStep === 2 && (
                <div className="bg-[#EDEDED] h-[600px] flex flex-col">
                  <div className="bg-[#EDEDED] px-4 py-3 flex items-center justify-between border-b border-zinc-300">
                    <div className="flex items-center gap-2"><span className="font-medium text-zinc-900">OATLY 商务总监</span></div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                    <div className="flex justify-center"><span className="text-xs text-zinc-400 bg-zinc-200/50 px-2 py-1 rounded-md">昨天 14:20</span></div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-900 shrink-0 flex items-center justify-center text-white font-bold text-xs">OATLY</div>
                      <div className="bg-white p-3 rounded-lg rounded-tl-none max-w-[75%] text-[15px] text-zinc-900 shadow-sm">你好，之前提到的合作我们内部过了一下，觉得方向不错。</div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-10 h-10 rounded-md bg-zinc-900 shrink-0 flex items-center justify-center text-white font-bold text-xs">{merchantName.slice(0, 2)}</div>
                      <div className="bg-[#95EC69] p-3 rounded-lg rounded-tr-none max-w-[75%] text-[15px] text-zinc-900 shadow-sm">太好了！我用 Rockcent AI 生成了一份专属的联名企划草案，里面有详细的数据测算，您可以先看看。</div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse cursor-pointer group" onClick={() => setShareStep(3)}>
                      <div className="w-10 h-10 rounded-md bg-zinc-900 shrink-0 flex items-center justify-center text-white font-bold text-xs">{merchantName.slice(0, 2)}</div>
                      <div className="bg-white rounded-lg max-w-[75%] w-64 shadow-sm border border-zinc-200 overflow-hidden group-hover:bg-zinc-50 transition-colors">
                        <div className="p-3"><h4 className="text-[15px] font-medium text-zinc-900 leading-snug mb-1 line-clamp-2">【加密企划】一份为您专属生成的跨界联名合作备忘录</h4><p className="text-[12px] text-zinc-500 line-clamp-2">点击查收来自 {merchantName} 负责人的商务邀约与 AI 撮合权益。</p></div>
                        <div className="border-t border-zinc-100 p-2 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><Sparkles className="w-2 h-2 text-white" /></div><span className="text-[10px] text-zinc-400">Rockcent AI 跨界营销云</span></div></div></div></div></div><div className="bg-[#F7F7F7] border-t border-zinc-300 p-3 flex items-center gap-3"><div className="w-8 h-8 rounded-full border border-zinc-400 flex items-center justify-center"><Activity className="w-5 h-5 text-zinc-600" /></div><div className="flex-1 bg-white h-10 rounded-md border border-zinc-200"></div><div className="w-8 h-8 rounded-full border border-zinc-400 flex items-center justify-center"><Plus className="w-5 h-5 text-zinc-600" /></div></div></div>
              )}
              {shareStep === 3 && (
                <div className="bg-zinc-950 h-[600px] flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-zinc-900/90 to-zinc-950" />
                  <div className="relative z-10 flex-1 overflow-y-auto">
                    <div className="p-6 pt-12">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                          <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-2xl border border-white/10">{merchantName}</div>
                          <X className="w-6 h-6 text-white/50" />
                          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-2xl border border-white/10">OATLY</div>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">早 C 晚 A 联名企划</h2>
                        <p className="text-blue-300 text-sm">AI 测算受众重合度 92% | 预期 ROI 180%</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-400" /> 核心业务数据</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/20 rounded-xl p-4"><div className="text-white/60 text-xs mb-1">预计曝光增量</div><div className="text-2xl font-bold text-white">1500万+</div></div>
                          <div className="bg-black/20 rounded-xl p-4"><div className="text-white/60 text-xs mb-1">目标人群画像</div><div className="text-sm font-medium text-white">一二线白领 / 环保主义</div></div>
                        </div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent flex flex-col items-center justify-end pb-8 px-6">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full text-center shadow-2xl">
                          <Lock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                          <h4 className="text-white font-bold mb-2">该专属企划需由品牌主理人认领</h4>
                          <p className="text-white/60 text-xs mb-6">登录立即解锁完整方案，并激活您的专属数字分身 BD。</p>
                          <button onClick={() => setShowShareGiftModal(false)} className="w-full py-3 bg-[#07C160] text-white rounded-xl font-bold hover:bg-[#06ad56] transition-colors flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" />一键授权微信手机号登录</button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NetworkSection;
