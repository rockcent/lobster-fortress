import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Link as LinkIcon, Bot, Building2, Loader2, FileText, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Message, Attachment } from '../../types';
import Logo from '../ui/Logo';
import ReactMarkdown from 'react-markdown';

interface ChatSectionProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  isExtracting: boolean;
  selectedFile: File | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onClearFile: () => void;
}

function ChatSection({
  messages,
  input,
  setInput,
  isLoading,
  isExtracting,
  selectedFile,
  onFileUpload,
  onSendMessage,
  onClearFile,
}: ChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent z-10 pointer-events-none flex items-start justify-center pt-8">
        <div className="bg-white/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4">
          <Logo className="h-6 w-auto" variant="light" />
          <div className="w-px h-4 bg-zinc-200"></div>
          <span className="text-[13px] font-semibold text-zinc-600 tracking-wide">每一个品牌都应该有自己的朋友圈</span>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-12 pb-40">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' 
                    ? "bg-gradient-to-br from-rose-400 to-violet-500 text-white" 
                    : "bg-white border border-zinc-200 text-zinc-900"
                )}>
                  {msg.role === 'user' ? <Building2 className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "px-6 py-4 rounded-3xl text-[15px] leading-relaxed max-w-[80%]",
                  msg.role === 'user' 
                    ? "bg-zinc-900 text-white rounded-tr-sm shadow-md" 
                    : "bg-white text-zinc-800 rounded-tl-sm shadow-sm border border-zinc-100"
                )}>
                  <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:font-semibold">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-6 py-4 rounded-3xl bg-white text-zinc-800 rounded-tl-sm shadow-sm border border-zinc-100 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span className="text-sm text-zinc-500">
                  {isExtracting ? '正在深度解析营销需求并结构化...' : 'AI正在思考...'}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent pt-12 pb-8 px-6 z-20">
        <div className="max-w-4xl mx-auto">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {[
                "我想和咖啡品牌做一次跨界联名",
                "我们是美妆品牌，想找游戏IP合作",
                "预算10万，目标是提升品牌曝光",
                "寻找能触达Z世代的跨界营销伙伴"
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-zinc-200/60 rounded-full text-[13px] text-zinc-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-all shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div className="relative flex flex-col gap-2 bg-white/90 backdrop-blur-2xl border border-zinc-200/80 shadow-[0_8px_40px_rgb(0,0,0,0.08)] rounded-[2rem] p-3 transition-all focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:border-rose-300">
            {selectedFile && (
              <div className="flex items-center gap-2 bg-zinc-100 px-3 py-2 rounded-xl w-fit ml-2 mt-1">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-700 max-w-[200px] truncate">{selectedFile.name}</span>
                <button onClick={onClearFile} className="text-zinc-400 hover:text-rose-500 p-1 rounded-full hover:bg-zinc-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex gap-1 pb-1 pl-2">
                <label className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl cursor-pointer transition-colors">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={onFileUpload} accept=".txt,.md,.csv" />
                </label>
                <button className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors">
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您的营销需求，或粘贴相关网址..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] px-3 py-4 outline-none resize-none max-h-32 min-h-[56px] placeholder:text-zinc-400"
                rows={1}
                disabled={isLoading}
              />
              
              <button
                onClick={onSendMessage}
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="p-4 bg-zinc-950 text-white rounded-[1.5rem] hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all shrink-0 mb-0.5 mr-0.5 shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-4 text-[13px] text-zinc-400 font-medium flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>您的数据已加密保护，仅用于为您生成营销策略。AI 可能会产生不准确的信息，请核实重要内容。</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatSection;
