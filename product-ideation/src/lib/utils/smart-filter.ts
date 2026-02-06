// 니즈 키워드 (수익화 신호)
const NEED_KEYWORDS = [
  'i need',
  'i want',
  'i wish',
  "i'd pay",
  'looking for',
  'frustrated with',
  'anyone built',
  'does anyone know',
  'how do i',
  'is there a',
  "why isn't there",
  'would pay for',
  'shut up and take my money',
  'please make',
  'someone should build',
  'desperately need',
  'willing to pay',
];

// 돈 관련 키워드
const MONEY_KEYWORDS = [
  '$',
  'dollar',
  'pay',
  'paid',
  'price',
  'cost',
  'subscription',
  'saas',
  'revenue',
  'mrr',
  'arr',
  'profitable',
  'monetize',
  'business',
  'customer',
  'pricing',
  'budget',
];

export interface KeywordAnalysis {
  hasNeedKeyword: boolean;
  hasMoneyKeyword: boolean;
  priorityScore: number;
  detectedKeywords: string[];
}

export class SmartFilter {
  static analyze(text: string): KeywordAnalysis {
    const lowerText = text.toLowerCase();
    const detectedKeywords: string[] = [];

    // 니즈 키워드 검사
    let hasNeedKeyword = false;
    for (const kw of NEED_KEYWORDS) {
      if (lowerText.includes(kw)) {
        detectedKeywords.push(kw);
        hasNeedKeyword = true;
      }
    }

    // 돈 키워드 검사
    let hasMoneyKeyword = false;
    for (const kw of MONEY_KEYWORDS) {
      if (lowerText.includes(kw)) {
        if (!detectedKeywords.includes(kw)) {
          detectedKeywords.push(kw);
        }
        hasMoneyKeyword = true;
      }
    }

    // 우선순위 점수 계산 (0-10)
    let priorityScore = 0;
    if (hasNeedKeyword) priorityScore += 5;
    if (hasMoneyKeyword) priorityScore += 3;
    priorityScore += Math.min(detectedKeywords.length - (hasNeedKeyword ? 1 : 0) - (hasMoneyKeyword ? 1 : 0), 2);

    return {
      hasNeedKeyword,
      hasMoneyKeyword,
      priorityScore: Math.min(Math.max(priorityScore, 0), 10),
      detectedKeywords,
    };
  }

  static getAnalysisForDb(text: string) {
    const analysis = this.analyze(text);
    return {
      hasNeedKeyword: analysis.hasNeedKeyword,
      hasMoneyKeyword: analysis.hasMoneyKeyword,
      priorityScore: analysis.priorityScore,
      detectedKeywords: JSON.stringify(analysis.detectedKeywords),
    };
  }
}
