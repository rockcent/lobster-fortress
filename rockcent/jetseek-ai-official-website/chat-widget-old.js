// 乐宸AI智能客服 - 小乐
// 使用方法：在HTML中引入此JS文件

(function() {
  // 配置
  const CONFIG = {
    position: 'right',
    bottom: '20px',
    right: '20px',
    primaryColor: '#8B5CF6',
    GeminiApiKey: '', // 可选，如果不填则使用预设回复
  };

  // 知识库
  const KNOWLEDGE_BASE = {
    '乐宸': '乐宸科技是一家AI+金融科技公司，旗下有JetSeek、黄大仙、藏金洞、络享等产品。',
    'jetseek': 'JetSeek（捷策）是AI智能决策助手，专注投资分析、政策解读、竞品对比。官网：jetseek.ai',
    '黄大仙': '黄大仙数字庙宇是AI驱动的线上求签解签平台，传承黄大仙文化。官网：wong.9997642.xyz',
    '藏金洞': '藏金洞是乐宸旗下的财经公众号，提供商业财经热点内容。',
    '乐总说透了': '乐总说透了是乐总（黄乐钊）的个人IP公众号，分享创业/AI/投资感悟。',
    '络享': '络享是跨界营销云平台，帮助企业营销数字化。',
    '电话': '乐宸客服电话：020-28187838',
    '邮箱': '官方邮箱：jetseek@rockcent.com',
  };

  // 常见问题回复
  const FAQ = {
    '产品': '乐宸旗下有：JetSeek（AI决策）、黄大仙（数字庙宇）、藏金洞（财经）、络享（营销云）',
    '是什么': '我是乐宸AI客服"小乐"，可以回答关于乐宸产品和公司的任何问题～',
    '如何': '请问您具体想了解什么？可以问我：产品介绍、联系方式、如何使用等',
  };

  // 创建UI
  function createWidget() {
    // 悬浮按钮
    const button = document.createElement('div');
    button.id = 'lechen-chat-button';
    button.innerHTML = '💬';
    button.style.cssText = `
      position: fixed;
      ${CONFIG.position}: ${CONFIG.right};
      bottom: ${CONFIG.bottom};
      width: 50px;
      height: 50px;
      background: ${CONFIG.primaryColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      transition: transform 0.2s;
    `;
    button.onmouseenter = () => button.style.transform = 'scale(1.1)';
    button.onmouseleave = () => button.style.transform = 'scale(1)';

    // 对话窗口
    const chatWindow = document.createElement('div');
    chatWindow.id = 'lechen-chat-window';
    chatWindow.style.cssText = `
      position: fixed;
      ${CONFIG.position}: ${CONFIG.right};
      bottom: 80px;
      width: 350px;
      height: 450px;
      background: #1a1a1a;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 9999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #333;
    `;

    chatWindow.innerHTML = `
      <div style="background: ${CONFIG.primaryColor}; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: white; font-weight: bold;">🤖 小乐</span>
        <span id="lechen-chat-close" style="cursor: pointer; color: white; font-size: 20px;">✕</span>
      </div>
      <div id="lechen-chat-messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="background: #333; padding: 10px 14px; border-radius: 12px 12px 12px 0; max-width: 80%;">
          <span style="color: #eee;">你好！我是小乐，乐宸AI客服～ 有什么可以帮你的吗？😊</span>
        </div>
      </div>
      <div style="padding: 12px; border-top: 1px solid #333; display: flex; gap: 8px;">
        <input id="lechen-chat-input" type="text" placeholder="输入问题..." style="flex: 1; padding: 10px 14px; border: none; border-radius: 8px; background: #333; color: white; outline: none;">
        <button id="lechen-chat-send" style="padding: 10px 16px; background: ${CONFIG.primaryColor}; border: none; border-radius: 8px; color: white; cursor: pointer;">发送</button>
      </div>
    `;

    document.body.appendChild(button);
    document.body.appendChild(chatWindow);

    // 事件绑定
    button.onclick = () => {
      chatWindow.style.display = 'flex';
      button.style.display = 'none';
    };

    document.getElementById('lechen-chat-close').onclick = () => {
      chatWindow.style.display = 'none';
      button.style.display = 'flex';
    };

    const input = document.getElementById('lechen-chat-input');
    const sendBtn = document.getElementById('lechen-chat-send');

    const sendMessage = () => {
      const msg = input.value.trim();
      if (!msg) return;
      addMessage(msg, 'user');
      input.value = '';
      
      // 模拟AI回复
      setTimeout(() => {
        const reply = getReply(msg);
        addMessage(reply, 'bot');
      }, 500);
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
  }

  function addMessage(text, type) {
    const container = document.getElementById('lechen-chat-messages');
    const div = document.createElement('div');
    div.style.cssText = type === 'user' 
      ? 'align-self: flex-end; background: #8B5CF6; padding: 10px 14px; border-radius: 12px 12px 0 12px; max-width: 80%;'
      : 'align-self: flex-start; background: #333; padding: 10px 14px; border-radius: 12px 12px 12px 0; max-width: 80%;';
    div.innerHTML = `<span style="color: ${type === 'user' ? 'white' : '#eee'};">${text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function getReply(question) {
    const q = question.toLowerCase();
    
    // 精确匹配
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (q.includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // FAQ匹配
    for (const [key, value] of Object.entries(FAQ)) {
      if (q.includes(key)) {
        return value;
      }
    }
    
    // 默认回复
    return '抱歉，我不太明白您的问题。您可以问我：\n• 乐宸是做什么的？\n• JetSeek是什么？\n• 如何联系你们？\n• 黄大仙怎么用？';
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
