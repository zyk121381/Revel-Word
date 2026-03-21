import { NextResponse } from 'next/server';
import { createServerAIService } from '@/lib/ai-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. 速率限制 (Rate Limiting)
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    // 限制每个 IP 每分钟最多 10 次生成请求
    if (!rateLimit(ip, 10, 60 * 1000)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    // 2. 输入验证 (Input Validation)
    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== 'string' || body.prompt.trim() === '') {
      return NextResponse.json({ error: '无效的请求参数' }, { status: 400 });
    }
    
    // 限制 prompt 长度，防止恶意长文本消耗 token
    if (body.prompt.length > 5000) {
      return NextResponse.json({ error: '文本过长，请减少字数' }, { status: 400 });
    }

    const service = createServerAIService();
    const result = await service.generateContent(body);
    return NextResponse.json(result);
  } catch (error: any) {
    // 3. 安全的错误处理 (Secure Error Handling)
    // 在服务端记录详细错误日志，但不暴露给前端
    console.error('[API Generate Error]', error);
    return NextResponse.json(
      { error: '生成内容时发生错误，请稍后重试' }, 
      { status: 500 }
    );
  }
}
