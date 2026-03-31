import React, { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim()) {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        onLogin(company);
      }, 2500);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 font-sans selection:bg-rose-500/30">
      {/* Left Hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex bg-[#0A0A0B]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-rose-500/20 to-orange-500/20 mix-blend-overlay" />
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-violet-500/40 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-rose-500/40 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
        
        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
            <Logo className="h-12 w-auto" variant="dark" />
          </div>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold leading-[1.2] tracking-tighter text-white"
          >
            每一个品牌都应该有<br />
            <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              自己的朋友圈
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-md text-lg text-zinc-400"
          >
            Rockcent AI 跨界营销云 —— 通过自然语言交互，精准识别营销需求，构建资源库，一键生成跨界撮合与营销策略。
          </motion.p>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          &copy; 2026 Rockcent. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-24 z-20 relative">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-3">商户入驻</h2>
            <p className="text-[15px] text-zinc-500">简单注册，立即开启您的智能营销之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">公司/品牌名称</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-[15px] text-zinc-900 transition-all focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/10 hover:border-zinc-300"
                  placeholder="例如：星巴克中国"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">联系邮箱/手机号</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-[15px] text-zinc-900 transition-all focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/10 hover:border-zinc-300"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">登录密码</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-[15px] text-zinc-900 transition-all focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/10 hover:border-zinc-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="group relative w-full overflow-hidden rounded-2xl bg-zinc-900 px-4 py-4 text-[15px] font-semibold text-white transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/20 active:scale-[0.98] mt-4 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 正在生成品牌画像...
                  </>
                ) : (
                  <>
                    进入营销工作台
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
