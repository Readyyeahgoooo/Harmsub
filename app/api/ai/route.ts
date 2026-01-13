// Server-side API route to protect OpenRouter API key

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONFIG, rateLimiter, getClientIdentifier } from '@/lib/security';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Model priority (free models)
const AI_MODELS = [
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek', priority: 1 },
  { id: 'zhipu-ai/glm-4-flash', name: 'GLM-4', priority: 2 },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini', priority: 3 },
];

export async function POST(request: NextRequest) {
  try {
    // CORS protection
    const origin = request.headers.get('origin');
    const allowed = SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin || '');
    if (!allowed && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // Rate limiting
    const clientIp = getClientIdentifier(request);
    const minuteCheck = rateLimiter.perMinute.check(clientIp);
    const hourCheck = rateLimiter.perHour.check(clientIp);

    if (!minuteCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((minuteCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((minuteCheck.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(minuteCheck.remaining),
          }
        }
      );
    }

    if (!hourCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hourly limit exceeded. Please try again later.',
          retryAfter: Math.ceil((hourCheck.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((hourCheck.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(hourCheck.remaining),
          }
        }
      );
    }

    // Request size limit
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { success: false, error: `Request too large. Maximum ${SECURITY_CONFIG.MAX_REQUEST_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    const { prompt, systemPrompt, action } = await request.json();

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid prompt' },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Prompt too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Try each model in priority order
    for (const model of AI_MODELS) {
      try {
        // Timeout protection
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SECURITY_CONFIG.API_TIMEOUT_MS);

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://harmsub.vercel.app',
            'X-Title': 'Harmsub',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model.id,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`Model ${model.name} failed with status ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        if (content) {
          return NextResponse.json({
            success: true,
            content,
            model: model.name,
          });
        }
      } catch (error) {
        console.warn(`Model ${model.name} error:`, error);
        continue;
      }
    }

    return NextResponse.json(
      { success: false, error: 'All models failed. Please try again later.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
