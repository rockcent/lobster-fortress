import { GoogleGenAI, Type } from "@google/genai";
import { StructuredNeed, MatchmakingSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractMarketingNeeds(input: string, fileContent?: string): Promise<StructuredNeed | null> {
  const prompt = `
    You are an expert AI marketing analyst for a cross-border marketing platform.
    Your task is to analyze the user's input (which could be natural language, a URL, or file content) and extract structured marketing needs.
    IMPORTANT: All extracted values MUST be in Simplified Chinese (简体中文).
    
    User Input: ${input}
    ${fileContent ? `File Content: ${fileContent}` : ''}
    
    Extract the following information and return it as a JSON object:
    - companyName: The name of the company or brand (infer if not explicitly stated, or use "未知").
    - industry: The industry the company operates in (in Chinese).
    - targetAudience: The target audience for their marketing (in Chinese).
    - marketingGoals: An array of their marketing goals (e.g., 品牌曝光, 潜在客户挖掘) (in Chinese).
    - budgetRange: Their budget range (e.g., "低", "中", "高", or specific numbers if provided) (in Chinese).
    - preferredChannels: An array of preferred marketing channels (e.g., 社交媒体, 电子邮件, 搜索引擎优化) (in Chinese).
    - keySellingPoints: An array of their key selling points or unique value propositions (in Chinese).
    - crossBorderPreferences: An array of preferences for cross-border marketing (e.g., 目标国家, 合作伙伴类型) (in Chinese).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            industry: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            marketingGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
            budgetRange: { type: Type.STRING },
            preferredChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
            keySellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            crossBorderPreferences: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["companyName", "industry", "targetAudience", "marketingGoals", "budgetRange", "preferredChannels", "keySellingPoints", "crossBorderPreferences"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        ...data,
        rawInput: input,
      };
    }
    return null;
  } catch (error) {
    console.error("Error extracting marketing needs:", error);
    return null;
  }
}

export async function simulateBDNegotiation(
  chatHistory: { role: 'user' | 'assistant', content: string }[],
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
# Role & Persona
You are the Digital Twin Business Development (BD) Representative for ${config.merchantName}.
Your persona is "${config.persona}". 
Your tone must be highly efficient, data-driven, objective, and polite. You represent a premium brand image.

# Negative Constraints (Strictly Follow)
1. DO NOT use any emojis (e.g., 😊, 🙏).
2. DO NOT use casual internet slang, overly enthusiastic words, or colloquialisms (e.g., "亲", "宝子", "哈喽").
3. DO NOT exceed 80 words per response. Keep it concise.
4. NEVER reveal your [最高置换预算] in the first two rounds of negotiation.
5. ${config.negativePrompts}

# Brand Glossary (Strictly Follow)
${config.glossary}

# Business Context & Dynamic Variables
- Target Company: ${config.targetCompany}
- Audience Overlap Rate: ${config.audienceOverlap}%
- Shared Social Backing: ${config.sharedSocialBacking}
- Our Max Budget Limit: ${config.maxBudget} 元
- Initial Offer/Goal: ${config.initialOffer}

# Negotiation Rules (Value Trade-off Protocol)
<Rule 1: Ice-breaking> 
In your first message, immediately state the ${config.audienceOverlap}% audience overlap. If ${config.sharedSocialBacking} is provided, naturally mention them as a credibility backing. State our ${config.initialOffer} clearly.
<Rule 2: Bargaining> 
If the Target Company requests a higher budget or more resources, you must NOT agree directly. You must ask for reciprocal marketing rights (e.g., "We can increase the budget by 10%, provided that you offer top-tier banner exposure on your app").
<Rule 3: Red Line> 
Under NO circumstances can you agree to terms that exceed the ${config.maxBudget} 元.

# Escalation & Handoff (The Golden Handoff)
You must monitor the conversation state. 
IF:
A. Both parties reach a preliminary agreement within the budget.
B. The negotiation enters a deadlock (3 consecutive turns without compromise).
C. The Target Company asks a complex legal or highly specific product question.

THEN:
You must immediately output the exact system flag: <HANDOFF_TRIGGER>
Followed by a polite closing statement, e.g., "I have noted your core requirements. I will now escalate this to our human business leaders to align on the final details." Stop all further negotiation.
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Replay history
    for (let i = 0; i < chatHistory.length - 1; i++) {
      await chat.sendMessage({ message: chatHistory[i].content });
    }

    // Send latest message
    const lastMessage = chatHistory[chatHistory.length - 1].content;
    const response = await chat.sendMessage({ message: lastMessage });
    
    let responseText = response.text || '';
    let isHandoff = false;

    if (responseText.includes('<HANDOFF_TRIGGER>')) {
      isHandoff = true;
      responseText = responseText.replace(/<HANDOFF_TRIGGER>/g, '').trim();
    }

    return { response: responseText, isHandoff };
  } catch (error) {
    console.error("Error in BD negotiation:", error);
    return { response: "抱歉，系统连接异常，请稍后再试。", isHandoff: false };
  }
}

export async function generateMatchmaking(needs: StructuredNeed[]): Promise<MatchmakingSuggestion[]> {
  if (needs.length === 0) return [];

  const prompt = `
    You are an expert AI cross-border marketing matchmaker and strategist.
    Based on the following resource library of structured marketing needs from various merchants, generate 3 high-quality cross-border marketing matchmaking suggestions and strategies.
    IMPORTANT: All generated content MUST be in Simplified Chinese (简体中文).
    
    Resource Library:
    ${JSON.stringify(needs, null, 2)}
    
    For each suggestion, provide:
    - partnerCompany: A fictional or real potential partner company name that would be a good fit for cross-border marketing (in Chinese).
    - partnerIndustry: The industry of the partner company (in Chinese).
    - matchReason: Why this is a good match based on the resource library (in Chinese).
    - strategy: A detailed cross-border marketing strategy for this partnership (in Chinese).
    - estimatedROI: An estimated ROI (e.g., "150-200%").
    - recommendedAction: The next recommended action to initiate this partnership (in Chinese).
    - matchScores: A set of scores from 0-100 evaluating the match precision.
      - audience: Target audience overlap score.
      - brandTone: Brand tone alignment score.
      - budget: Budget parity score.
      - complementarity: Resource complementarity score.
    - similarCase: A real-world successful cross-border marketing case similar to this suggestion.
      - brands: The brands involved (e.g., "Manner × 某宠物品牌").
      - description: A brief description of what they did and why it worked.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              partnerCompany: { type: Type.STRING },
              partnerIndustry: { type: Type.STRING },
              matchReason: { type: Type.STRING },
              strategy: { type: Type.STRING },
              estimatedROI: { type: Type.STRING },
              recommendedAction: { type: Type.STRING },
              matchScores: {
                type: Type.OBJECT,
                properties: {
                  audience: { type: Type.NUMBER },
                  brandTone: { type: Type.NUMBER },
                  budget: { type: Type.NUMBER },
                  complementarity: { type: Type.NUMBER },
                },
                required: ["audience", "brandTone", "budget", "complementarity"],
              },
              similarCase: {
                type: Type.OBJECT,
                properties: {
                  brands: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["brands", "description"],
              },
            },
            required: ["partnerCompany", "partnerIndustry", "matchReason", "strategy", "estimatedROI", "recommendedAction", "matchScores", "similarCase"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((item: any) => ({
        id: crypto.randomUUID(),
        status: 'suggested',
        ...item,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error generating matchmaking:", error);
    return [];
  }
}

export async function chatWithAI(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => msg.content).join('\\n');
    const prompt = `
      You are a helpful AI assistant for a cross-border marketing platform.
      Help the user with their marketing queries, explain the platform's features, and guide them on how to input their needs.
      IMPORTANT: You MUST respond entirely in Simplified Chinese (简体中文).
      
      Conversation history:
      ${formattedMessages}
      
      Respond to the last message as the AI assistant in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "抱歉，我无法处理该请求。";
  } catch (error) {
    console.error("Error chatting with AI:", error);
    return "与 AI 通信时发生错误。";
  }
}

export async function refineMatchmakingPlan(suggestion: MatchmakingSuggestion): Promise<string> {
  const prompt = `
    You are an expert AI cross-border marketing strategist.
    The user wants to refine and detail the following cross-border marketing matchmaking plan.
    
    Partner Company: ${suggestion.partnerCompany}
    Industry: ${suggestion.partnerIndustry}
    Match Reason: ${suggestion.matchReason}
    Initial Strategy: ${suggestion.strategy}
    
    Please provide a highly detailed, actionable, and step-by-step marketing execution plan based on this initial strategy. 
    Include timeline, budget allocation suggestions, key performance indicators (KPIs), and potential risks & mitigations.
    IMPORTANT: You MUST respond entirely in Simplified Chinese (简体中文) using Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "抱歉，无法生成细化方案。";
  } catch (error) {
    console.error("Error refining plan:", error);
    return "生成细化方案时发生错误。";
  }
}

export async function generatePitchDeck(suggestion: MatchmakingSuggestion): Promise<string> {
  const prompt = `
    You are an expert B2B business development manager.
    The user wants to initiate a cross-border marketing partnership with the following company based on this matchmaking plan:
    
    Partner Company: ${suggestion.partnerCompany}
    Industry: ${suggestion.partnerIndustry}
    Match Reason: ${suggestion.matchReason}
    Initial Strategy: ${suggestion.strategy}
    
    Please generate a professional, persuasive, and concise "Pitch Deck" or "Partnership Invitation Email" to send to this potential partner.
    The tone should be professional, mutually beneficial, and action-oriented.
    IMPORTANT: You MUST respond entirely in Simplified Chinese (简体中文) using Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "抱歉，无法生成合作邀请函。";
  } catch (error) {
    console.error("Error generating pitch deck:", error);
    return "生成合作邀请函时发生错误。";
  }
}

export async function generateMoU(suggestion: MatchmakingSuggestion): Promise<string> {
  const prompt = `
    You are an expert legal counsel and B2B partnership manager.
    Based on the following cross-border marketing matchmaking plan, generate a standard Memorandum of Understanding (MoU) or preliminary contract draft.
    
    Partner A: The user's company
    Partner B: ${suggestion.partnerCompany}
    Strategy: ${suggestion.strategy}
    
    The MoU should include:
    1. 合作目的 (Purpose of Cooperation)
    2. 合作内容及形式 (Content and Form of Cooperation)
    3. 双方权责划分 (Rights and Responsibilities - specify brand exposure, resource commitment)
    4. 预算承担与分润机制 (Budget Allocation and Profit Sharing)
    5. 保密条款 (Confidentiality)
    
    IMPORTANT: You MUST respond entirely in Simplified Chinese (简体中文) using Markdown formatting. Make it look like a formal document.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "抱歉，无法生成合作协议。";
  } catch (error) {
    console.error("Error generating MoU:", error);
    return "生成合作协议时发生错误。";
  }
}

export async function generateTimeline(suggestion: MatchmakingSuggestion): Promise<{ date: string; task: string }[]> {
  const prompt = `
    You are an expert marketing project manager.
    Based on the following cross-border marketing matchmaking plan, generate a joint marketing execution timeline.
    
    Partner Company: ${suggestion.partnerCompany}
    Strategy: ${suggestion.strategy}
    
    Provide a timeline with 5-7 key milestones (e.g., Kickoff, Asset Creation, Teaser, Launch, Post-Campaign Analysis).
    Use relative dates like "Day 1", "Week 2", "Month 1".
    
    IMPORTANT: You MUST respond entirely in Simplified Chinese (简体中文).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              task: { type: Type.STRING },
            },
            required: ["date", "task"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error generating timeline:", error);
    return [];
  }
}
