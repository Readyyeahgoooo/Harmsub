// API route for YouTube chord analysis using AI

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const AI_MODELS = [
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek', priority: 1 },
  { id: 'zhipu-ai/glm-4-flash', name: 'GLM-4', priority: 2 },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini', priority: 3 },
];

const CHORD_ANALYSIS_PROMPT = `You are an expert music theorist and chord analyst. Analyze the song and provide a detailed chord progression analysis.

For the song, provide:
1. The key and mode (major/minor)
2. Estimated tempo (BPM)
3. The main chord progression as a loop (most songs have a 4-8 chord repeating pattern)
4. For each chord, provide:
   - Chord name (e.g., Cmaj7, Am7, G7, Dm)
   - Roman numeral (e.g., Imaj7, vi7, V7, ii)
   - Function: T (Tonic), PD (Predominant), D (Dominant)

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "key": "C",
  "mode": "major",
  "tempo": 120,
  "timeSignature": "4/4",
  "confidence": 0.85,
  "sections": [
    {
      "name": "Main Loop",
      "chords": [
        {"name": "Cmaj7", "roman": "Imaj7", "function": "T", "beat": 1, "duration": 4},
        {"name": "Am7", "roman": "vi7", "function": "T", "beat": 5, "duration": 4},
        {"name": "Dm7", "roman": "ii7", "function": "PD", "beat": 9, "duration": 4},
        {"name": "G7", "roman": "V7", "function": "D", "beat": 13, "duration": 4}
      ]
    }
  ],
  "analysis": "Brief analysis of the harmonic style and notable features"
}`;

export async function POST(request: NextRequest) {
  try {
    const { videoId, title, description } = await request.json();
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const userPrompt = `Analyze the chord progression for this song:
Title: "${title || 'Unknown Song'}"
${description ? `Description: "${description.slice(0, 500)}"` : ''}
Video ID: ${videoId}

Based on the title and any context, identify the likely chord progression. If you recognize the song, provide the actual chords. If not, make an educated guess based on the genre/style implied by the title.

Remember to return ONLY valid JSON.`;

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
              { role: 'system', content: CHORD_ANALYSIS_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 2000,
            temperature: 0.3, // Lower temperature for more consistent JSON
          }),
        });

        if (!response.ok) {
          console.warn(`Model ${model.name} failed with status ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        if (content) {
          // Try to parse JSON from the response
          try {
            // Extract JSON from the response (handle markdown code blocks)
            let jsonStr = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            
            const analysis = JSON.parse(jsonStr.trim());
            
            return NextResponse.json({
              success: true,
              analysis: {
                ...analysis,
                videoId,
                title: title || 'Unknown Song',
                analysisMethod: 'ai',
              },
              model: model.name,
            });
          } catch (parseError) {
            console.warn(`Failed to parse JSON from ${model.name}:`, parseError);
            // Continue to next model if JSON parsing fails
            continue;
          }
        }
      } catch (error) {
        console.warn(`Model ${model.name} error:`, error);
        continue;
      }
    }

    // Fallback: Return a generic analysis
    return NextResponse.json({
      success: true,
      analysis: generateFallbackAnalysis(videoId, title),
      model: 'fallback',
    });
  } catch (error) {
    console.error('YouTube analysis API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFallbackAnalysis(videoId: string, title?: string) {
  // Generate a reasonable fallback based on common progressions
  const progressions = [
    {
      key: 'C', mode: 'major',
      chords: [
        { name: 'Cmaj7', roman: 'Imaj7', function: 'T' },
        { name: 'Am7', roman: 'vi7', function: 'T' },
        { name: 'Dm7', roman: 'ii7', function: 'PD' },
        { name: 'G7', roman: 'V7', function: 'D' },
      ]
    },
    {
      key: 'G', mode: 'major',
      chords: [
        { name: 'Gmaj7', roman: 'Imaj7', function: 'T' },
        { name: 'Em7', roman: 'vi7', function: 'T' },
        { name: 'Cmaj7', roman: 'IVmaj7', function: 'PD' },
        { name: 'D7', roman: 'V7', function: 'D' },
      ]
    },
    {
      key: 'A', mode: 'minor',
      chords: [
        { name: 'Am7', roman: 'i7', function: 'T' },
        { name: 'Fmaj7', roman: 'VImaj7', function: 'PD' },
        { name: 'Cmaj7', roman: 'IIImaj7', function: 'T' },
        { name: 'E7', roman: 'V7', function: 'D' },
      ]
    },
  ];

  const selected = progressions[Math.floor(Math.random() * progressions.length)];
  
  return {
    videoId,
    title: title || 'Unknown Song',
    key: selected.key,
    mode: selected.mode,
    tempo: 120,
    timeSignature: '4/4',
    confidence: 0.5,
    sections: [{
      name: 'Main Loop',
      chords: selected.chords.map((c, i) => ({
        ...c,
        beat: i * 4 + 1,
        duration: 4,
      })),
    }],
    analysis: 'Fallback analysis - AI models unavailable. This is a common progression pattern.',
    analysisMethod: 'fallback',
  };
}
