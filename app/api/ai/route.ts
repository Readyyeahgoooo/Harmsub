// Server-side API route to protect OpenRouter API key

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Model priority (free models)
const AI_MODELS = [
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek', priority: 1 },
  { id: 'zhipu-ai/glm-4-flash', name: 'GLM-4', priority: 2 },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini', priority: 3 },
];

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, action } = await request.json();
    
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
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://harmsub.vercel.app',
            'X-Title': 'Harmsub',
          },
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
