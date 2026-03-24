import { createAIService } from '@/lib/ai-service';

export interface WordDefinition {
  pos: string;
  meaning: string;
}

export interface WordData {
  word: string;
  translation: string;
  definitions: WordDefinition[];
  relatedForms: string[];
  example: string;
  exampleTranslation: string;
  distractorsZh: string[];
  distractorsEn: string[];
}

export const analyzeWords = async (words: string): Promise<WordData[]> => {
  const aiService = createAIService();

  const prompt = `请分析以下英语单词列表。对于每个单词，请提供：
1. 简短中文翻译（必须包含词性，例如 "n. 苹果" 或 "v. 跑"）（用于选择题的题干或选项。若该单词有多个意思或多个词性要同时给出来，简短一些）
2. 详细的词性和多重意思列表（请务必使用中文解释每个词性的含义，绝对不要使用英文释义）
3. 相关的词汇变形（如过去式、过去分词、复数、副词形式等，请注明变形类型）
4. 一个英文例句
5. 例句的中文翻译
6. 3个用于选择题的中文干扰项（必须包含词性，例如 "adj. 快的"）。注意：中文干扰项必须具有迷惑性，且选项之间不可以出现重复的词语（除非词性不同）。**非常重要：如果正确答案（简短中文翻译）包含多个词性或多个意思导致较长，请确保这3个干扰项也具有类似的长度和格式（例如也包含多个词性和意思），避免用户通过选项长度直接猜出正确答案。**
7. 3个用于选择题的英文干扰项（形近词或其他单词）

如果输入的文本中包含非英语单词或无意义的内容，请忽略它们。只返回有效英语单词的分析结果。

单词列表：
${words}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      words: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            word: { type: "STRING", description: "英文单词" },
            translation: { type: "STRING", description: "简短中文翻译（必须包含词性，如 n. 苹果）" },
            definitions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  pos: { type: "STRING", description: "词性缩写，如 n., v., adj." },
                  meaning: { type: "STRING", description: "该词性下的中文意思" }
                },
                required: ["pos", "meaning"]
              },
              description: "单词的详细词性和多重意思（必须使用中文解释）"
            },
            relatedForms: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "相关词汇变形（如过去式、过去分词、复数、副词形式等，例如 'went (过去式)'）"
            },
            example: { type: "STRING", description: "英文例句" },
            exampleTranslation: { type: "STRING", description: "例句中文翻译" },
            distractorsZh: { type: "ARRAY", items: { type: "STRING" }, description: "3个中文干扰项（必须包含词性，如 v. 跑。长度和格式必须与正确答案相似，避免过短）" },
            distractorsEn: { type: "ARRAY", items: { type: "STRING" }, description: "3个英文干扰项" },
          },
          required: ["word", "translation", "definitions", "relatedForms", "example", "exampleTranslation", "distractorsZh", "distractorsEn"]
        }
      }
    },
    required: ["words"]
  };

  const response = await aiService.generateContent({
    prompt,
    responseSchema,
  });

  if (!response.text) throw new Error("AI 未返回结果");

  try {
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.words || [];
  } catch (e) {
    console.error("Failed to parse AI response:", response.text);
    throw new Error("AI 返回的数据格式有误，请重试。");
  }
};
