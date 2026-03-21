import { NextResponse } from 'next/server';
import { createServerAIService } from '@/lib/ai-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. 速率限制 (Rate Limiting)
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    // 限制每个 IP 每分钟最多 20 次对话请求
    if (!rateLimit(ip, 20, 60 * 1000)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    // 2. 输入验证 (Input Validation)
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: '无效的请求' }, { status: 400 });
    }

    const { message, history, systemInstruction } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: '无效的消息内容' }, { status: 400 });
    }

    // 限制单次消息长度
    if (message.length > 2000) {
      return NextResponse.json({ error: '消息过长，请减少字数' }, { status: 400 });
    }

    // 验证历史记录格式
    if (history && !Array.isArray(history)) {
      return NextResponse.json({ error: '无效的历史记录格式' }, { status: 400 });
    }

    const service = createServerAIService();
    
    // 对于Gemini而言，历史管理略有不同，但OpenAIChat处理得很好。
    // 为了确保两者之间的兼容性，将历史记录传递给createChat。
    const chat = await service.createChat({ history, systemInstruction });
    const result = await chat.sendMessage({ message });
    
    return NextResponse.json(result);
  } catch (error: any) {
    // 3. 安全的错误处理 (Secure Error Handling)
    console.error('[API Chat Error]', error);
    return NextResponse.json(
      { error: '对话时发生错误，请稍后重试' }, 
      { status: 500 }
    );
  }
}
