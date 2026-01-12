// AI Integration - Client-side wrapper for server API

// Rate limiting (client-side tracking)
const RATE_LIMITS = {
  perHour: 20,
  perDay: 100,
};

const STORAGE_KEYS = {
  hourlyCount: 'harmsub_hourly_count',
  hourlyReset: 'harmsub_hourly_reset',
  dailyCount: 'harmsub_daily_count',
  dailyReset: 'harmsub_daily_reset',
};

// Check rate limits (client-side)
function checkRateLimit(): { allowed: boolean; message: string } {
  if (typeof window === 'undefined') return { allowed: true, message: '' };
  
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Check hourly limit
  const hourlyReset = parseInt(localStorage.getItem(STORAGE_KEYS.hourlyReset) || '0');
  let hourlyCount = parseInt(localStorage.getItem(STORAGE_KEYS.hourlyCount) || '0');
  
  if (now > hourlyReset) {
    hourlyCount = 0;
    localStorage.setItem(STORAGE_KEYS.hourlyReset, String(now + hourMs));
    localStorage.setItem(STORAGE_KEYS.hourlyCount, '0');
  }
  
  if (hourlyCount >= RATE_LIMITS.perHour) {
    const resetIn = Math.ceil((hourlyReset - now) / 60000);
    return { allowed: false, message: `Hourly limit reached. Try again in ${resetIn} minutes.` };
  }
  
  // Check daily limit
  const dailyReset = parseInt(localStorage.getItem(STORAGE_KEYS.dailyReset) || '0');
  let dailyCount = parseInt(localStorage.getItem(STORAGE_KEYS.dailyCount) || '0');
  
  if (now > dailyReset) {
    dailyCount = 0;
    localStorage.setItem(STORAGE_KEYS.dailyReset, String(now + dayMs));
    localStorage.setItem(STORAGE_KEYS.dailyCount, '0');
  }
  
  if (dailyCount >= RATE_LIMITS.perDay) {
    return { allowed: false, message: 'Daily limit reached. Try again tomorrow.' };
  }
  
  return { allowed: true, message: '' };
}

// Increment rate limit counters
function incrementRateLimit(): void {
  if (typeof window === 'undefined') return;
  
  const hourlyCount = parseInt(localStorage.getItem(STORAGE_KEYS.hourlyCount) || '0');
  const dailyCount = parseInt(localStorage.getItem(STORAGE_KEYS.dailyCount) || '0');
  
  localStorage.setItem(STORAGE_KEYS.hourlyCount, String(hourlyCount + 1));
  localStorage.setItem(STORAGE_KEYS.dailyCount, String(dailyCount + 1));
}

// Get remaining requests
export function getRateLimitStatus(): { hourlyRemaining: number; dailyRemaining: number } {
  if (typeof window === 'undefined') {
    return { hourlyRemaining: RATE_LIMITS.perHour, dailyRemaining: RATE_LIMITS.perDay };
  }
  
  const hourlyCount = parseInt(localStorage.getItem(STORAGE_KEYS.hourlyCount) || '0');
  const dailyCount = parseInt(localStorage.getItem(STORAGE_KEYS.dailyCount) || '0');
  
  return {
    hourlyRemaining: Math.max(0, RATE_LIMITS.perHour - hourlyCount),
    dailyRemaining: Math.max(0, RATE_LIMITS.perDay - dailyCount),
  };
}

// Call server-side API route
export async function callAI(
  prompt: string,
  systemPrompt?: string
): Promise<{ success: boolean; content: string; model: string; error?: string }> {
  // Check rate limit
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    return { success: false, content: '', model: '', error: rateCheck.message };
  }
  
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      incrementRateLimit();
    }
    
    return data;
  } catch (error) {
    console.error('AI call error:', error);
    return { success: false, content: '', model: '', error: 'Network error. Please try again.' };
  }
}


// Analyze YouTube video for chord progression
export async function analyzeYouTubeChords(videoTitle: string, videoDescription?: string): Promise<{
  success: boolean;
  chords: string[];
  key: string;
  tempo?: number;
  error?: string;
}> {
  const systemPrompt = `You are a music theory expert. Analyze the song and provide chord progressions.
Return ONLY a JSON object with this exact format:
{
  "key": "C",
  "chords": ["C", "G", "Am", "F"],
  "tempo": 120
}
Use standard chord notation (C, Cm, C7, Cmaj7, Cdim, Caug, etc.)`;

  const prompt = `Analyze this song and provide the likely chord progression:
Title: ${videoTitle}
${videoDescription ? `Description: ${videoDescription}` : ''}

Provide the main chord progression used in this song.`;

  const result = await callAI(prompt, systemPrompt);
  
  if (!result.success) {
    return { success: false, chords: [], key: 'C', error: result.error };
  }
  
  try {
    // Extract JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        chords: parsed.chords || [],
        key: parsed.key || 'C',
        tempo: parsed.tempo,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  // Fallback: try to extract chords from text
  const chordPattern = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g;
  const matches = result.content.match(chordPattern) || [];
  
  return {
    success: true,
    chords: [...new Set(matches)].slice(0, 8),
    key: matches[0]?.replace(/[^A-G#b]/g, '') || 'C',
  };
}

// Generate harmonization suggestions for a melody
export async function suggestHarmonization(
  melodyNotes: string[],
  style: string,
  key: string
): Promise<{
  success: boolean;
  progressions: string[][];
  explanations: string[];
  error?: string;
}> {
  const systemPrompt = `You are a music composition expert specializing in harmonization.
Return ONLY a JSON object with this exact format:
{
  "progressions": [
    ["Cmaj7", "Am7", "Dm7", "G7"],
    ["C", "F", "G", "C"]
  ],
  "explanations": [
    "Jazz-influenced ii-V-I with extensions",
    "Simple pop progression"
  ]
}`;

  const prompt = `Suggest 3 chord progressions to harmonize this melody in ${style} style:
Key: ${key}
Melody notes: ${melodyNotes.slice(0, 20).join(', ')}

Provide progressions that complement these melody notes.`;

  const result = await callAI(prompt, systemPrompt);
  
  if (!result.success) {
    return { success: false, progressions: [], explanations: [], error: result.error };
  }
  
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        progressions: parsed.progressions || [],
        explanations: parsed.explanations || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return { success: false, progressions: [], explanations: [], error: 'Failed to parse response' };
}

// Explain a chord progression
export async function explainProgression(chords: string[], key: string): Promise<{
  success: boolean;
  explanation: string;
  analysis: { chord: string; function: string; roman: string }[];
  error?: string;
}> {
  const systemPrompt = `You are a music theory teacher. Analyze chord progressions.
Return ONLY a JSON object with this format:
{
  "explanation": "Brief explanation of the progression",
  "analysis": [
    {"chord": "C", "function": "Tonic", "roman": "I"},
    {"chord": "G", "function": "Dominant", "roman": "V"}
  ]
}`;

  const prompt = `Analyze this chord progression in the key of ${key}:
${chords.join(' - ')}

Explain the harmonic function of each chord.`;

  const result = await callAI(prompt, systemPrompt);
  
  if (!result.success) {
    return { success: false, explanation: '', analysis: [], error: result.error };
  }
  
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        explanation: parsed.explanation || '',
        analysis: parsed.analysis || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  
  return { success: false, explanation: '', analysis: [], error: 'Failed to parse response' };
}
