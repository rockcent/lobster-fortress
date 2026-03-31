/**
 * 络享云 AI 服务 — 统一通过后端火山方舟代理
 * 所有 AI 调用经由 /api/ai 代理，保护 API Key 安全
 * 后端: Express 5 → 火山方舟 Doubao API
 */
import { StructuredNeed, MatchmakingSuggestion } from "../types";

const API_BASE = "/api/ai";

// ============ 通用 API 调用 ============

async function arkChat(params: {
  messages: { role: string; content: string }[];
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  maxTokens?: number;
}): Promise<any> {
  const body: any = {
    model: params.model || "doubao-pro-32k",
    messages: params.messages,
  };

  if (params.systemInstruction) {
    body.messages = [
      { role: "system", content: params.systemInstruction },
      ...params.messages,
    ];
  }

  if (params.temperature !== undefined) body.temperature = params.temperature;
  if (params.maxTokens) body.max_tokens = params.maxTokens;

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ark API error: ${response.status}`);
  }

  return response.json();
}

async function arkContent(params: {
  prompt: string;
  model?: string;
  responseMimeType?: string;
  responseSchema?: any;
}): Promise<string> {
  const model = params.model || "doubao-pro-32k";
  const messages = [{ role: "user", content: params.prompt }];

  const body: any = {
    model,
    messages,
    stream: false,
  };

  if (params.responseMimeType) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ark API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============ 品牌营销需求提取 ============

export async function extractMarketingNeeds(
  input: string,
  fileContent?: string
): Promise<StructuredNeed | null> {
  const prompt = `
你是跨界营销平台的 AI 市场分析师。
分析用户的输入（可能是自然语言、URL 或文件内容），提取结构化营销需求。
重要：所有提取的值必须使用简体中文。

用户输入: ${input}
${fileContent ? `文件内容: ${fileContent}` : ""}

请提取以下信息并返回 JSON 对象：
- companyName: 公司或品牌名称（若未明确说明则推断或使用"未知"）
- industry: 公司所在行业（中文）
- targetAudience: 营销目标受众（中文）
- marketingGoals: 营销目标数组（如：品牌曝光, 潜在客户挖掘）（中文）
- budgetRange: 预算区间（如："低", "中", "高" 或具体数字）（中文）
- preferredChannels: 偏好营销渠道数组（如：社交媒体, 电子邮件, 搜索引擎优化）（中文）
- keySellingPoints: 核心卖点数组（中文）
- crossBorderPreferences: 跨境偏好数组（如：目标国家, 合作伙伴类型）（中文）
`;

  try {
    const text = await arkContent({
      prompt,
      responseMimeType: "application/json",
    });
    const data = JSON.parse(text);
    return {
      id: crypto.randomUUID(),
      ...data,
      rawInput: input,
    };
  } catch (error) {
    console.error("Error extracting marketing needs:", error);
    return null;
  }
}

// ============ BD 谈判模拟 ============

export async function simulateBDNegotiation(
  chatHistory: { role: "user" | "assistant"; content: string }[],
  config: {
    merchantName: string;
    targetCompany: string;
    audienceOverlap: number;
    sharedSocialBacking: string;
    maxBudget: number;
    initialOffer: string;
    persona: string;
    negativePrompts: string;
    glossary: string;
  }
): Promise<{ response: string; isHandoff: boolean }> {
  const systemInstruction = `
# 角色与人设
你是 ${config.merchantName} 的数字孪生商务拓展（BD）代表。
你的人设是"${config.persona}"。
你的语气必须极其高效、数据驱动、客观、礼貌。你代表的是一个高端品牌形象。

# 负面约束（严格遵守）
1. 禁止使用任何表情符号（如 😊, 🙏）。
2. 禁止使用网络俚语、过于热情的语言或口语（如"亲", "宝子", "哈喽"）。
3. 每次回复不超过 80 字。
4. 前两轮谈判中绝不能透露你的[最高置换预算]。
5. ${config.negativePrompts}

# 品牌术语表（严格遵守）
${config.glossary}

# 商业上下文与动态变量
- 目标公司: ${config.targetCompany}
- 受众重合度: ${config.audienceOverlap}%
- 共有社媒背书: ${config.sharedSocialBacking}
- 我方最高预算上限: ${config.maxBudget} 元
- 初始报价/目标: ${config.initialOffer}

# 谈判规则（价值交换协议）
<规则1: 破冰>
在第一条消息中，立即说明 ${config.audienceOverlap}% 的受众重合度。若提供了 ${config.sharedSocialBacking}，自然提及作为信用背书。明确说明我们的 ${config.initialOffer}。
<规则2: 议价>
若目标公司要求更高预算或更多资源，你不能直接同意。必须要求互惠营销权益（如："我们可以增加10%预算，前提是您在我们应用上提供顶级 Banner 曝光"）。
<规则3: 红线>
在任何情况下，你都不能同意超过 ${config.maxBudget} 元的条款。

# 升级与交接（黄金交接）
你必须监控对话状态。
若：
A. 双方在预算范围内达成初步协议。
B. 谈判陷入僵局（连续3轮无妥协）。
C. 目标公司提出复杂的法律或非常专业的产品问题。

则：
你必须立即输出精确的系统标记：<HANDOFF_TRIGGER>
然后以礼貌的结束语收尾，例如："我已记录您的核心需求。现在将升级给我们的人类业务负责人来对接最终细节。"停止所有进一步谈判。
`;

  try {
    const messages = chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const data = await arkChat({
      model: "doubao-pro-32k",
      messages,
      systemInstruction,
      temperature: 0.7,
    });

    let responseText = data.choices?.[0]?.message?.content || "";
    let isHandoff = false;

    if (responseText.includes("<HANDOFF_TRIGGER>")) {
      isHandoff = true;
      responseText = responseText.replace(/<HANDOFF_TRIGGER>/g, "").trim();
    }

    return { response: responseText, isHandoff };
  } catch (error) {
    console.error("Error in BD negotiation:", error);
    return { response: "抱歉，系统连接异常，请稍后再试。", isHandoff: false };
  }
}

// ============ 跨界营销撮合推荐 ============

export async function generateMatchmaking(
  needs: StructuredNeed[]
): Promise<MatchmakingSuggestion[]> {
  if (needs.length === 0) return [];

  const prompt = `
你是跨界营销 AI 撮合专家和战略家。
根据以下资源库中的各商家结构化营销需求，生成 3 条高质量跨界营销撮合建议和策略。
重要：所有生成内容必须使用简体中文。

资源库：
${JSON.stringify(needs, null, 2)}

每条建议需提供：
- partnerCompany: 适合跨界营销的潜在合作公司名称（中文）
- partnerIndustry: 合作伙伴所在行业（中文）
- matchReason: 为什么这是基于资源库的良好匹配（中文）
- strategy: 这段合作关系的详细跨界营销策略（中文）
- estimatedROI: 预估投资回报率（如："150-200%"）
- recommendedAction: 启动这段合作的下一步建议行动（中文）
- matchScores: 评估匹配精度的 0-100 分评分
  - audience: 目标受众重合度评分
  - brandTone: 品牌调性匹配评分
  - budget: 预算对等评分
  - complementarity: 资源互补性评分
- similarCase: 类似合作的真实成功案例
  - brands: 涉及的品牌（如："Manner × 某宠物品牌"）
  - description: 他们做了什么以及为什么成功
`;

  try {
    const text = await arkContent({ prompt, responseMimeType: "application/json" });
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : data.suggestions || [];
    return items.map((item: any) => ({
      id: crypto.randomUUID(),
      status: "suggested",
      ...item,
    }));
  } catch (error) {
    console.error("Error generating matchmaking:", error);
    return [];
  }
}

// ============ 通用 AI 对话 ============

export async function chatWithAI(
  messages: { role: string; content: string }[]
): Promise<string> {
  try {
    const data = await arkChat({
      model: "doubao-pro-32k",
      messages,
    });
    return data.choices?.[0]?.message?.content || "抱歉，我无法处理该请求。";
  } catch (error) {
    console.error("Error chatting with AI:", error);
    return "与 AI 通信时发生错误。";
  }
}

// ============ 细化合作方案 ============

export async function refineMatchmakingPlan(
  suggestion: MatchmakingSuggestion
): Promise<string> {
  const prompt = `
你是跨界营销 AI 战略专家。
用户想要细化以下跨界营销撮合计划，请提供高度详细、可操作的分步营销执行计划。

合作伙伴公司: ${suggestion.partnerCompany}
行业: ${suggestion.partnerIndustry}
匹配原因: ${suggestion.matchReason}
初始策略: ${suggestion.strategy}

请基于此初始策略提供详细的执行计划，包括：
- 时间线
- 预算分配建议
- 关键绩效指标（KPI）
- 潜在风险与应对措施

重要：必须使用简体中文，使用 Markdown 格式。
`;

  try {
    const text = await arkContent({ prompt });
    return text || "抱歉，无法生成细化方案。";
  } catch (error) {
    console.error("Error refining plan:", error);
    return "生成细化方案时发生错误。";
  }
}

// ============ 生成合作邀请函 ============

export async function generatePitchDeck(
  suggestion: MatchmakingSuggestion
): Promise<string> {
  const prompt = `
你是 B2B 商务拓展经理。
用户想要基于以下撮合计划向目标公司发起跨界营销合作，请生成专业、有说服力的合作邀请函或 Pitch Deck。

合作伙伴公司: ${suggestion.partnerCompany}
行业: ${suggestion.partnerIndustry}
匹配原因: ${suggestion.matchReason}
初始策略: ${suggestion.strategy}

语气要专业、互利、行动导向。
重要：必须使用简体中文，使用 Markdown 格式。
`;

  try {
    const text = await arkContent({ prompt });
    return text || "抱歉，无法生成合作邀请函。";
  } catch (error) {
    console.error("Error generating pitch deck:", error);
    return "生成合作邀请函时发生错误。";
  }
}

// ============ 生成 MOU 协议 ============

export async function generateMoU(
  suggestion: MatchmakingSuggestion
): Promise<string> {
  const prompt = `
你是法律顾问和 B2B 合作伙伴经理。
基于以下跨界营销撮合计划，生成标准谅解备忘录（MoU）或初步合同草案。

甲方: 用户公司
乙方: ${suggestion.partnerCompany}
策略: ${suggestion.strategy}

MoU 应包括：
1. 合作目的 (Purpose of Cooperation)
2. 合作内容及形式 (Content and Form of Cooperation)
3. 双方权责划分 (Rights and Responsibilities - specify brand exposure, resource commitment)
4. 预算承担与分润机制 (Budget Allocation and Profit Sharing)
5. 保密条款 (Confidentiality)

重要：必须使用简体中文，使用 Markdown 格式。文档要看起来正式。
`;

  try {
    const text = await arkContent({ prompt });
    return text || "抱歉，无法生成合作协议。";
  } catch (error) {
    console.error("Error generating MoU:", error);
    return "生成合作协议时发生错误。";
  }
}

// ============ 生成执行时间线 ============

export async function generateTimeline(
  suggestion: MatchmakingSuggestion
): Promise<{ date: string; task: string }[]> {
  const prompt = `
你是营销项目经理。
基于以下跨界营销撮合计划，生成联合营销执行时间线。

合作伙伴公司: ${suggestion.partnerCompany}
策略: ${suggestion.strategy}

请提供 5-7 个关键里程碑（如：Kickoff, Asset Creation, Teaser, Launch, Post-Campaign Analysis）。
使用相对日期如 "Day 1", "Week 2", "Month 1"。
重要：必须使用简体中文。
`;

  try {
    const text = await arkContent({ prompt, responseMimeType: "application/json" });
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error generating timeline:", error);
    return [];
  }
}
