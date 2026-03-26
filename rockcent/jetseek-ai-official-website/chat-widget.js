// 乐宸AI智能客服 - 小乐 (智能版+Gemini fallback)
// 使用方法：在HTML中引入此JS文件

(function() {
  // 配置 - Gemini备用
  const CONFIG = {
    position: 'right',
    bottom: '20px',
    right: '20px',
    primaryColor: '#8B5CF6',
    // 在这里填入Gemini API Key（可选）
    geminiApiKey: '', // 如需Gemini fallback，填入API Key
    geminiModel: 'gemini-2.0-flash',
  };

  // 智能知识库
  const KNOWLEDGE = {
    // 公司基础
    '公司': '乐宸科技是一家AI+金融科技公司，专注人工智能技术应用。',
    '乐宸': '乐宸科技是一家AI+金融科技公司，旗下有JetSeek、黄大仙、藏金洞、络享等产品。',
    '关于': '乐宸科技是一家AI+金融科技公司，致力于让AI成为最信赖的决策伙伴。',
    '做什么': '乐宸科技是一家AI+金融科技公司，主要产品包括JetSeek（AI决策助手）、黄大仙（数字庙宇）、络享（营销云）等。',
    
    // JetSeek
    'jetseek': 'JetSeek（捷策）是乐宸旗下的AI智能决策助手，专注投资分析、政策解读。官网：jetseek.ai',
    '捷策': 'JetSeek（捷策）是乐宸旗下的AI智能决策助手，专注投资分析、政策解读。官网：jetseek.ai',
    'ai决策': 'JetSeek是AI智能决策助手，可以帮助您做投资分析、政策解读、竞品对比等专业决策。',
    '投资': 'JetSeek可以辅助投资决策，提供数据分析、政策解读、风险评估等功能。',
    '分析': 'JetSeek是专业的AI分析工具，支持投资分析、竞品对比、行业研究等。',
    
    // 黄大仙
    '黄大仙': '黄大仙数字庙宇是AI驱动的线上求签解签平台，传承黄大仙文化。官网：wong.9997642.xyz',
    '求签': '黄大仙是线上求签平台，在wong.9997642.xyz可以体验传统求签文化，AI智能解签。',
    '解签': '黄大仙提供AI智能解签服务，每次求签后都有详细解读。官网：wong.9997642.xyz',
    '庙宇': '黄大仙数字庙宇是传承千年黄大仙文化的线上平台，可以求签、解签、还愿。',
    '算命': '黄大仙提供传统的求签问卜服务，配合AI智能解读。官网：wong.9997642.xyz',
    '抽签': '在黄大仙数字庙宇可以体验传统的抽签仪式，获得AI解读。官网：wong.9997642.xyz',
    
    // 藏金洞
    '藏金洞': '藏金洞是乐宸旗下的财经公众号，提供商业财经热点解读和投资洞察。',
    '财经': '藏金洞是乐宸的财经公众号，每天分享商业财经热点和投资分析。',
    '公众号': '乐宸旗下有藏金洞（财经）和乐总说透了（个人IP）两个公众号。',
    
    // 乐总说透了
    '乐总': '乐总（黄乐钊）是乐宸科技创始人，负责公司战略和方向。',
    '乐总说': '乐总说透了是乐总的个人公众号，分享创业、AI、投资的感悟和见解。',
    '创始人': '乐宸科技创始人是黄乐钊，负责公司整体战略。',
    
    // 络享
    '络享': '络享是乐宸旗下的跨界营销云平台，帮助企业实现营销数字化。',
    '营销': '络享是跨界营销云平台，提供企业营销数字化解决方案。',
    '推广': '络享提供营销推广服务，帮助企业获客和品牌建设。',
    
    // 联系方式
    '电话': '乐宸客服电话：020-28187838',
    '邮箱': '乐宸官方邮箱：jetseek@rockcent.com',
    '联系': '联系我们：电话 020-28187838，邮箱 jetseek@rockcent.com',
    '地址': '公司地址：广州市天河区黄埔大道西农信大厦',
    '在哪里': '乐宸公司地址：广州市天河区黄埔大道西农信大厦',
    
    // 产品相关
    '产品': '乐宸旗下产品：JetSeek（AI决策）、黄大仙（数字庙宇）、藏金洞（财经）、络享（营销云）',
    '有哪些': '乐宸产品：JetSeek、黄大仙、藏金洞、络享、乐总说透了',
    '官网': '乐宸官网：rockcent.com',
    '网站': '乐宸官网：rockcent.com',
  };

  // 常见问题
  const FAQ = {
    '是什么': '我是乐宸AI客服小乐～ 可以回答关于乐宸公司、产品、服务的任何问题！',
    '干嘛的': '我是乐宸AI客服小乐，专门解答关于乐宸产品和服务的问题～',
    '能做什么': '我可以帮你了解乐宸的产品和服务，比如JetSeek怎么用、黄大仙怎么求签、怎么联系客服等～',
    '帮助': '你可以问我：\n• 乐宸是做什么的？\n• JetSeek是什么？\n• 黄大仙怎么用？\n• 怎么联系你们？',
    '你好': '你好！我是小乐，乐宸AI客服～ 有什么可以帮你的吗？😊',
    'hi': '你好！我是小乐，乐宸AI客服～ 有什么可以帮你的吗？😊',
    'hello': '你好！我是小乐，乐宸AI客服～ 有什么可以帮你的吗？😊',
  };

  // 创建UI
  function createWidget() {
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

    const sendMessage = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      addMessage(msg, 'user');
      input.value = '';
      
      // 先用本地知识库
      const localReply = getSmartReply(msg);
      addMessage(localReply, 'bot');
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
    div.innerHTML = `<span style="color: ${type === 'user' ? 'white' : '#eee'}; white-space: pre-wrap;">${text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // 智能匹配算法
  function getSmartReply(question) {
    const q = question.toLowerCase().trim();
    
    // 1. 精确匹配FAQ
    for (const [key, value] of Object.entries(FAQ)) {
      if (q.includes(key)) {
        return value;
      }
    }
    
    // 2. 智能匹配知识库
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, value] of Object.entries(KNOWLEDGE)) {
      let score = 0;
      const keyLower = key.toLowerCase();
      
      if (q.includes(keyLower)) {
        score += 10;
      }
      
      const qWords = q.split(/\s+/);
      const keyWords = keyLower.split(/\s+/);
      for (const qw of qWords) {
        for (const kw of keyWords) {
          if (qw.includes(kw) || kw.includes(qw)) {
            score += 2;
          }
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
    }
    
    if (bestScore >= 2) {
      return bestMatch;
    }
    
    // 3. 匹配不到，尝试Gemini fallback
    if (CONFIG.geminiApiKey) {
      return getGeminiReply(question);
    }
    
    // 4. 默认回复
    return '抱歉，我不太明白您的问题～\n\n你可以问我：\n• 乐宸是做什么的？\n• JetSeek是什么？\n• 黄大仙怎么用？\n• 怎么联系你们？';
  }

  // Gemini API调用
  async function getGeminiReply(question) {
    const apiKey = CONFIG.geminiApiKey;
    if (!apiKey) return null;
    
    const systemPrompt = `你是乐宸集团AI客服"小乐"，根据以下知识库回答用户问题：

【乐宸科技】AI+金融科技公司，旗下JetSeek、黄大仙、藏金洞、络享。电话020-28187838
【JetSeek】AI决策助手，jetseek.ai
【黄大仙】数字庙宇，wong.9997642.xyz
【藏金洞】财经公众号
【络享】营销云平台
【地址】广州市天河区黄埔大道西农信大厦

回答简洁，不超过100字。`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n用户问题: ' + question }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.error('Gemini error:', e);
    }
    return null;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
