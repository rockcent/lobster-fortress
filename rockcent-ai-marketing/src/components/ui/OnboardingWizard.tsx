import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Radar, CheckCircle2, MessageCircle, Camera, Globe, Info, Briefcase, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Persona {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

const personas: Persona[] = [
  {
    id: 'expert',
    title: '沉稳内敛的行业专家',
    description: '用数据和专业术语说话，强调 ROI 和长期品牌价值。',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    id: 'trendsetter',
    title: '活泼网感的潮流制造者',
    description: '熟练使用网络热梗，强调话题性、Z世代吸引力和短期爆发。',
    icon: Zap,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  }
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onComplete: (persona: string, budget: number) => void;
}

function OnboardingWizard({ isOpen, onClose, companyName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [budget, setBudget] = useState(50000);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (step === 3) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 z-10 transition-colors">
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-10 pt-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-zinc-900 text-white font-bold text-2xl flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-xl">
                    {companyName.slice(0, 2)}
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">欢迎入驻，{companyName}</h3>
                  <p className="text-zinc-500">系统已初步识别您的行业属性，正在为您生成专属营销模型...</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <button className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-zinc-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-zinc-700">微信公众号</span>
                    <span className="text-xs text-zinc-400 mt-1">获取粉丝画像与推文风格</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-zinc-100 hover:border-rose-500 hover:bg-rose-50 transition-all group">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-zinc-700">小红书</span>
                    <span className="text-xs text-zinc-400 mt-1">获取种草笔记与达人互动</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-zinc-100 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-zinc-700">全网舆情扫描</span>
                    <span className="text-xs text-zinc-400 mt-1">自动聚合近期品牌大事件</span>
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mb-8">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">全网脉搏监测已就绪：</span>
                    AI 发现 {companyName} 近期发布了 3 款新品，并在多个社交平台获得超过 500w 曝光。是否一键认领这些数据作为您的初始谈判筹码？
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20"
                >
                  一键认领并生成数字分身 <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">配置您的 AI 谈判分身</h3>
                  <p className="text-zinc-500">基于您的品牌调性，选择最适合的沟通风格，并设定首轮出击的预算边界。</p>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-zinc-700 mb-4">1. 选择分身沟通风格</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {personas.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPersona(p.id)}
                        className={cn(
                          "p-5 rounded-2xl border-2 cursor-pointer transition-all",
                          selectedPersona === p.id ? `border-zinc-900 bg-zinc-50 shadow-md` : `border-zinc-100 hover:border-zinc-300`
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", p.bg, p.color)}>
                          <p.icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-zinc-900 mb-1">{p.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-zinc-700 mb-4">
                    2. 设定最高置换预算 (RMB)
                    <span className="block text-xs font-normal text-zinc-400 mt-1">作为 AI 首次出击的边界，绝不越线。</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="10000" 
                      max="500000" 
                      step="5000"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                    />
                    <span className="font-bold text-zinc-900 w-24 text-right">¥{budget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-4 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedPersona}
                    className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/20"
                  >
                    启动暗池雷达扫描 <Radar className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8"
              >
                {isScanning ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-8">
                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                      <Radar className="absolute inset-0 m-auto w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-2">暗池雷达扫描中...</h3>
                    <p className="text-zinc-500">正在匹配全网高潜品牌与受众重合度</p>
                  </div>
                ) : scanComplete ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 mb-4">首战告捷！锁定高潜品牌</h3>
                    
                    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8 text-left">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-900 text-white font-bold flex items-center justify-center rounded-xl shadow-sm">OATLY</div>
                          <div>
                            <h4 className="font-bold text-zinc-900 text-lg">OATLY 噢麦力</h4>
                            <p className="text-sm text-zinc-500">植物蛋白饮品领导品牌</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-600">92%</div>
                          <div className="text-xs text-zinc-500 font-medium">受众重合度</div>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-700 bg-white p-3 rounded-lg border border-zinc-100">
                        <span className="font-bold">AI 洞察：</span>
                        OATLY 的一二线城市白领受众与 {companyName} 的目标客群高度重合。他们近期正在寻找生活方式类的跨界合作，您的品牌调性非常契合。
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onComplete(selectedPersona || 'expert', budget);
                        onClose();
                      }}
                      className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      立即让数字分身发起首轮破冰谈判 <Zap className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default OnboardingWizard;
