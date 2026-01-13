// Server-side API route for audio chord analysis using Gemini Flash
// API key is kept server-side only - never exposed to client

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Use Gemini Flash for audio analysis (supports native audio input)
const AUDIO_MODEL = 'google/gemini-2.0-flash-exp:free';

const CHORD_ANALYSIS_SYSTEM_PROMPT = `You are an expert music theorist and chord analyst specializing in audio analysis.

Listen to the audio and provide a detailed chord progression analysis.

For the audio, provide:
1. The key and mode (major/minor)
2. Estimated tempo (BPM)
3. Time signature
4. The chord progression - IMPORTANT: Summarize by showing unique progressions only, not every repeated bar
   - If a 4-chord loop repeats 8 times, just show it once as "Main Loop"
   - Only show a new section when the progression actually changes
5. For each chord, provide:
   - Chord name (e.g., Cmaj7, Am7, G7, Dm, F#m7b5)
   - Roman numeral analysis (e.g., Imaj7, vi7, V7, ii)
   - Harmonic function: T (Tonic), PD (Predominant), D (Dominant)
   - Beat position and duration

CRITICAL: Return ONLY valid JSON in this exact format:
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
  "analysis": "Brief analysis of the harmonic style, notable chord substitutions, and any interesting harmonic devices used"
}`;

export async function POST(request: NextRequest) {
  try {
    const { audioData, format, fileName } = await request.json();
    
    // Validate input
    if (!audioData) {
      return NextResponse.json(
        { success: false, error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Get API key from server environment (never exposed to client)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured on server' },
        { status: 500 }
      );
    }

    // Determine audio format
    const audioFormat = format || detectAudioFormat(fileName || '');
    
    const userPrompt = `Analyze the chord progression in this audio file${fileName ? ` (${fileName})` : ''}.

Identify all chords, their timing, and harmonic functions. 
Remember to summarize - don't repeat the same progression multiple times, just indicate it's a loop.
Return ONLY valid JSON.`;

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://harmsub.vercel.app',
          'X-Title': 'Harmsub Audio Analysis',
        },
        body: JSON.stringify({
          model: AUDIO_MODEL,
          messages: [
            { role: 'system', content: CHORD_ANALYSIS_SYSTEM_PROMPT },
            { 
              role: 'user', 
              content: [
                {
                  type: 'text',
                  text: userPrompt,
                },
                {
                  type: 'input_audio',
                  input_audio: {
                    data: audioData,
                    format: audioFormat,
                  },
                },
              ],
            },
          ],
          max_tokens: 3000,
          temperature: 0.3, // Lower temperature for more consistent analysis
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini audio analysis failed: ${response.status}`, errorText);
        return NextResponse.json(
          { success: false, error: `Audio analysis failed: ${response.status}` },
          { status: response.status }
        );
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
          
          // Process sections to create unique progression summary
          const uniqueProgression = extractUniqueProgression(analysis.sections || []);
          
          return NextResponse.json({
            success: true,
            analysis: {
              ...analysis,
              fileName: fileName || 'Uploaded Audio',
              uniqueProgression,
              analysisMethod: 'audio-ai',
            },
            model: 'Gemini 2.0 Flash',
          });
        } catch (parseError) {
          console.error('Failed to parse JSON from Gemini:', parseError);
          console.error('Raw content:', content);
          return NextResponse.json(
            { success: false, error: 'Failed to parse analysis results' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { success: false, error: 'No analysis content returned' },
        { status: 500 }
      );
    } catch (fetchError) {
      console.error('Gemini API error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to connect to analysis service' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Audio analysis API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Detect audio format from filename
function detectAudioFormat(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const formatMap: Record<string, string> = {
    'mp3': 'mp3',
    'wav': 'wav',
    'ogg': 'ogg',
    'm4a': 'm4a',
    'flac': 'flac',
    'webm': 'webm',
    'aac': 'aac',
  };
  return formatMap[ext || ''] || 'mp3';
}

// Extract unique chord progression from sections (deduplicate repeated loops)
function extractUniqueProgression(sections: Array<{
  name: string;
  chords: Array<{
    name: string;
    roman: string;
    function: string;
    beat: number;
    duration: number;
  }>;
}>): Array<{
  name: string;
  roman: string;
  function: 'T' | 'PD' | 'D' | 'AMB';
  beat: number;
  duration: number;
  selected: boolean;
  sectionName: string;
}> {
  const uniqueChords: Array<{
    name: string;
    roman: string;
    function: 'T' | 'PD' | 'D' | 'AMB';
    beat: number;
    duration: number;
    selected: boolean;
    sectionName: string;
  }> = [];
  
  const seenProgressions = new Set<string>();
  
  for (const section of sections) {
    // Create a signature for this section's progression
    const progressionSignature = section.chords
      .map(c => `${c.name}-${c.roman}`)
      .join('|');
    
    // Only add if we haven't seen this exact progression
    if (!seenProgressions.has(progressionSignature)) {
      seenProgressions.add(progressionSignature);
      
      for (const chord of section.chords) {
        uniqueChords.push({
          name: chord.name,
          roman: chord.roman,
          function: normalizeFunction(chord.function),
          beat: chord.beat,
          duration: chord.duration,
          selected: false,
          sectionName: section.name,
        });
      }
    }
  }
  
  return uniqueChords;
}

// Normalize function to valid values
function normalizeFunction(func: string): 'T' | 'PD' | 'D' | 'AMB' {
  const normalized = func?.toUpperCase();
  if (normalized === 'T' || normalized === 'TONIC') return 'T';
  if (normalized === 'PD' || normalized === 'PREDOMINANT' || normalized === 'SD' || normalized === 'SUBDOMINANT') return 'PD';
  if (normalized === 'D' || normalized === 'DOMINANT' || normalized === 'DOM') return 'D';
  return 'AMB';
}
