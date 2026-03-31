export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'file' | 'url';
  name: string;
  url?: string;
  content?: string;
}

export interface StructuredNeed {
  id: string;
  companyName: string;
  industry: string;
  targetAudience: string;
  marketingGoals: string[];
  budgetRange: string;
  preferredChannels: string[];
  keySellingPoints: string[];
  crossBorderPreferences: string[];
  rawInput: string;
  isVerified?: boolean;
  socialAssets?: { platform: string; followers: string; icon?: string }[];
  totalFollowers?: string;
  engagementRate?: string;
}

export interface MatchmakingSuggestion {
  id: string;
  partnerCompany: string;
  partnerIndustry: string;
  matchReason: string;
  strategy: string;
  estimatedROI: string;
  recommendedAction: string;
  refinedDetails?: string;
  pitchDeck?: string;
  matchScores?: {
    audience: number;
    brandTone: number;
    budget: number;
    complementarity: number;
  };
  similarCase?: {
    brands: string;
    description: string;
  };
  status?: 'suggested' | 'invited' | 'accepted' | 'rejected';
  mou?: string;
  timeline?: { date: string; task: string }[];
}
