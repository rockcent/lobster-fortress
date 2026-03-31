import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, TrendingUp, Lock, Shield, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { StructuredNeed } from '../../types';

interface EditableNeedCardProps {
  need: StructuredNeed;
  index: number;
  onUpdate: (updated: StructuredNeed) => void;
  onDelete: (id: string) => void;
  userPlan?: 'free' | 'pro';
  onUpgrade?: () => void;
}

function EditableNeedCard({ need, index, onUpdate, onDelete, userPlan, onUpgrade }: EditableNeedCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNeed, setEditedNeed] = useState(need);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'select' | 'qr' | 'authorizing'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleSave = () => {
    onUpdate(editedNeed);
    setIsEditing(false);
  };

  const handleStartVerification = (platform: string) => {
    setSelectedPlatform(platform);
    setVerificationStep('qr');
    
    setTimeout(() => {
      setVerificationStep('authorizing');
      
      setTimeout(() => {
        setIsVerificationModalOpen(false);
        setVerificationStep('select');
        setSelectedPlatform(null);
        
        onUpdate({
          ...need,
          isVerified: true,
          totalFollowers: '150W+',
          engagementRate: '8.5%',
          socialAssets: [
            { platform: '微信公众号', followers: '50万+', icon: 'https://api.iconify.design/ri:wechat-fill.svg?color=%23059669' },
            { platform: '小红书', followers: '12万+', icon: 'https://api.iconify.design/simple-icons:xiaohongshu.svg?color=%23ef4444' },
            { platform: '抖音', followers: '88万+', icon: 'https://api.iconify.design/ic:baseline-tiktok.svg?color=%23000000' }
          ]
        });

        const toastEvent = new CustomEvent('showToast', { detail: '资产认证成功！已为您匹配到 12 个高意向跨界品牌，[立即查看]' });
        window.dispatchEvent(toastEvent);

      }, 3000);
    }, 2000);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-violet-200/60 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-zinc-900">编辑需求 #{index + 1}</h3>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">取消</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors">保存更改</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">公司/品牌名称</label>
            <input type="text" value={editedNeed.companyName} onChange={e => setEditedNeed({...editedNeed, companyName: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">所属行业</label>
            <input type="text" value={editedNeed.industry} onChange={e => setEditedNeed({...editedNeed, industry: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">预算范围</label>
            <input type="text" value={editedNeed.budgetRange} onChange={e => setEditedNeed({...editedNeed, budgetRange: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">目标受众</label>
            <input type="text" value={editedNeed.targetAudience} onChange={e => setEditedNeed({...editedNeed, targetAudience: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">营销目标 (逗号分隔)</label>
            <input type="text" value={editedNeed.marketingGoals.join(', ')} onChange={e => setEditedNeed({...editedNeed, marketingGoals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">偏好渠道 (逗号分隔)</label>
            <input type="text" value={editedNeed.preferredChannels.join(', ')} onChange={e => setEditedNeed({...editedNeed, preferredChannels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">核心卖点 (逗号分隔)</label>
            <input type="text" value={editedNeed.keySellingPoints.join(', ')} onChange={e => setEditedNeed({...editedNeed, keySellingPoints: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">跨界偏好 (逗号分隔)</label>
            <input type="text" value={editedNeed.crossBorderPreferences.join(', ')} onChange={e => setEditedNeed({...editedNeed, crossBorderPreferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 outline-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/60 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group relative"
    >
      {need.isVerified ? (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-[2.5rem] flex items-center gap-1 shadow-sm overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-white/30"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 3 }}
          />
          <CheckCircle2 className="w-3 h-3 relative z-10" />
          <span className="relative z-10">已认证金标</span>
        </div>
      ) : (
        <div className="absolute top-0 right-0 group/badge z-20">
          <div className="bg-zinc-100 text-zinc-500 text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-[2.5rem] flex items-center gap-1 shadow-sm cursor-help">
            <ShieldCheck className="w-3 h-3" />
            未认证
          </div>
          <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-200">
            绑定真实社交资产，可使您的跨界合作被邀约率提升 300%。
            <button 
              onClick={() => setIsVerificationModalOpen(true)}
              className="mt-2 text-amber-400 font-bold hover:text-amber-300 transition-colors block"
            >
              [立即认证]
            </button>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-8 pb-8 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              需求 #{index + 1}
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              {need.companyName}
            </h3>
          </div>
          <p className="text-zinc-500 flex items-center gap-2">
            <span className="font-medium text-zinc-700">{need.industry}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span>预算: {need.budgetRange}</span>
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          {!need.isVerified && (
            <button 
              onClick={() => setIsVerificationModalOpen(true)}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ShieldCheck className="w-4 h-4" />
              授权认证
            </button>
          )}
          <button onClick={() => setIsEditing(true)} className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors">
            编辑
          </button>
          <button onClick={() => onDelete(need.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
            删除
          </button>
        </div>
      </div>
      
      {need.isVerified && need.socialAssets && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              核心数字资产
            </h4>
            {userPlan === 'pro' ? (
              <button className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors border border-violet-100">
                <TrendingUp className="w-3.5 h-3.5" />
                已开启优先展示 (Boost)
              </button>
            ) : (
              <button 
                onClick={onUpgrade}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200"
              >
                <Lock className="w-3 h-3" />
                升级 Pro 解锁优先展示
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-amber-800/60 uppercase tracking-wider mb-1">全网粉丝量</div>
              <div className="text-2xl font-black text-amber-900">{need.totalFollowers || '150W+'}</div>
              <div className="mt-3 h-8 flex items-end gap-1">
                {[40, 60, 45, 80, 65, 90, 100].map((h, i) => (
                  <div key={i} className="w-full bg-amber-200 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-1">近期互动率</div>
              <div className="text-2xl font-black text-emerald-900">{need.engagementRate || '8.5%'}</div>
              <div className="mt-3 text-xs font-medium text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 较上月提升 1.2%
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">已绑定平台</div>
              <div className="flex flex-wrap gap-2">
                {need.socialAssets.map((asset, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                    {asset.icon ? (
                      <img src={asset.icon} alt={asset.platform} className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 bg-zinc-200 rounded-full" />
                    )}
                    <span className="text-xs font-bold text-zinc-700">{asset.platform}</span>
                    <span className="text-[10px] font-medium text-zinc-500">{asset.followers}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">目标受众</h4>
            <p className="text-[15px] text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">{need.targetAudience}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">营销目标</h4>
            <div className="flex flex-wrap gap-2">
              {need.marketingGoals.map((goal, i) => (
                <span key={i} className="text-[13px] bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-xl shadow-sm">
                  {goal}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">偏好渠道</h4>
            <div className="flex flex-wrap gap-2">
              {need.preferredChannels.map((channel, i) => (
                <span key={i} className="text-[13px] bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-xl shadow-sm">
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">核心卖点</h4>
            <ul className="list-disc list-inside text-[15px] text-zinc-700 space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              {need.keySellingPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">跨界偏好</h4>
            <ul className="list-disc list-inside text-[15px] text-zinc-700 space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              {need.crossBorderPreferences.map((pref, i) => (
                <li key={i}>{pref}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
            onClick={() => setIsVerificationModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200/50"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-amber-500" />
                  认证您的品牌数字资产
                </h3>
                <button 
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {verificationStep === 'select' && (
                <div className="space-y-6">
                  <p className="text-zinc-600">请选择您要授权的平台。授权后，系统将自动生成您的专属商业名片，提升撮合精准度。</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: '微信公众号', icon: 'https://api.iconify.design/ri:wechat-fill.svg?color=%23059669' },
                      { name: '小红书', icon: 'https://api.iconify.design/simple-icons:xiaohongshu.svg?color=%23ef4444' },
                      { name: '抖音', icon: 'https://api.iconify.design/ic:baseline-tiktok.svg?color=%23000000' },
                      { name: '淘宝/天猫', icon: 'https://api.iconify.design/ri:taobao-fill.svg?color=%23ff5000' }
                    ].map((platform) => (
                      <button
                        key={platform.name}
                        onClick={() => handleStartVerification(platform.name)}
                        className="flex flex-col items-center justify-center p-6 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all group"
                      >
                        <img src={platform.icon} alt={platform.name} className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-zinc-700">{platform.name}</span>
                        <span className="mt-2 text-[10px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">一键接入</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {verificationStep === 'qr' && (
                <motion.div 
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-zinc-900 mb-2">请使用 {selectedPlatform} 扫码授权</h4>
                    <p className="text-sm text-zinc-500">二维码将在 02:59 后过期</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 mb-6 relative group">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=rockcent_auth_${selectedPlatform}`} alt="QR Code" className="w-48 h-48" />
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <RefreshCw className="w-8 h-8 text-zinc-600" />
                    </div>
                  </div>
                  <button onClick={() => setVerificationStep('select')} className="text-sm font-medium text-zinc-500 hover:text-zinc-800">返回重新选择</button>
                </motion.div>
              )}

              {verificationStep === 'authorizing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-amber-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
                    <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-amber-500 animate-pulse" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 mb-2">🟢 授权中...</h4>
                  <p className="text-sm text-zinc-500 animate-pulse">AI 正在为您生成结构化资产报告...</p>
                </motion.div>
              )}
            </div>

            <div className="bg-zinc-50 px-8 py-4 border-t border-zinc-100 flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-700">数据安全声明：</strong>Rockcent 采用企业级加密技术。您授权的数据仅用于生成您的专属商业名片与提升撮合精准度，绝不公开您的核心隐私数据。
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default EditableNeedCard;
