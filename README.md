# Harmsub - AI-Powered Harmony Substitution

A comprehensive music harmonization app that analyzes reference tracks, generates chord progression variations, and applies harmonic progressions to user melodies.

## Features

### 🎹 Multiple Input Methods
- **Virtual Piano**: 3-octave keyboard for melody input
- **Audio Recording**: Live microphone recording with pitch detection (1 min limit)
- **File Upload**: MIDI, MusicXML, Logic, and audio file support
- **YouTube Analysis**: AI-powered chord extraction from YouTube videos

### 🎵 Comprehensive Harmony Engine
Based on the "Chord Generator Rulebook v1.0":

- **Chord Object Model**: Full representation with root, quality, extensions, alterations, bass notes
- **Scale/Mode System**: Major, minor, harmonic/melodic minor, all modes with tension legality tables
- **Functional Harmony**: T (Tonic), PD (Predominant), D (Dominant) classification with grammar rules
- **7-Level Distance Ladder**: From diatonic (0) to atonal (6)
- **Substitution Ladders**: Ranked substitutions for tonic, predominant, and dominant functions
- **Progression Engines**: Functional graph, circle-of-fifths, cadence insertion, template expansion
- **Scoring System**: Chord fit, transition, voice-leading, and distance penalty scoring
- **Voicing Engine**: 7 presets (Clear/Spacious, Rootless A/B, Quartal, Neo-soul, SATB, Cinematic)

### 🎨 Style Packs
- Jazz (complex harmonies, altered dominants)
- Bossa Nova (smooth ii-V movements)
- Pop (simple, catchy progressions)
- Radiohead-ish (modal, chromatic mediants)
- Classical (functional, SATB voicing)
- Cinematic (epic, wide voicings)
- Neo-Soul (rich extensions, gospel influences)
- R&B (smooth 7ths and 9ths)

### 🤖 AI Integration
- OpenRouter API with free models (DeepSeek → GLM → Gemini fallback)
- Rate limiting (20/hour, 100/day)
- YouTube chord extraction
- Melody-to-chord suggestions

## Deployment

### Environment Variables
Set the following in Vercel:
```
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add the environment variable above
3. Deploy!

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Tech Stack
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Tone.js / @tonejs/midi for audio
- OpenRouter AI API

## License
MIT
