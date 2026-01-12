# Harmsub - AI-Powered Music Harmonization

A comprehensive web application for music harmonization that allows users to analyze reference tracks, generate chord variations, and harmonize their melodies.

## Features

### 1. **Multiple Input Methods**
- **Virtual Piano**: Play and record your melody on a 3-octave piano
- **Live Audio Recording**: Record your melody live (up to 1 minute) with automatic pitch detection
- **File Upload**: Upload MIDI, MusicXML, Logic, or audio files
- **YouTube Analysis**: Paste YouTube links to analyze chord structures

### 2. **Intelligent Harmonization**
- Analyze reference track chord progressions
- Generate multiple harmonic variations
- AI-powered chord suggestions for your melody

### 3. **Export Options**
- Export harmonized results as MIDI files
- Play back generated harmonizations directly in the browser
- Download for use in your DAW

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Tone.js** for audio processing
- **@tonejs/midi** for MIDI file handling
- **Pitchfinder** for pitch detection
- **React Dropzone** for file uploads
- **Lucide React** for icons
- **Radix UI** for UI components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Readyyeahgoooo/Harmsub.git
cd Harmsub
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Step 1: Input Your Melody
Choose one of four input methods:
- **Piano Tab**: Click the virtual piano keys to play notes, then press "Record Melody" to start recording
- **Audio Tab**: Click "Start Recording" and sing or play your melody
- **File Tab**: Drag and drop your MIDI, XML, Logic, or audio file
- **YouTube Tab**: Paste a YouTube link to analyze a reference track

### Step 2: Analyze Reference Track (Optional)
If you uploaded a YouTube link, the app will analyze the chord structure and provide a progression template.

### Step 3: Generate Harmonizations
Click "Generate Harmonizations" to create multiple chord progression variations based on your melody and the reference analysis.

### Step 4: Export Results
- Click "Play" to hear the harmonization
- Click "Export MIDI" to download the file for use in your DAW

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "Add New Project" and import your repository
4. Vercel will automatically detect Next.js and configure the build
5. Click "Deploy" and wait for the deployment to complete

### Environment Variables

No environment variables are required for basic functionality.

## Project Structure

```
harmsub/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # UI components (Radix UI)
│   │   └── tabs.tsx
│   ├── VirtualPiano.tsx    # Virtual piano component
│   ├── AudioRecorder.tsx   # Audio recording component
│   ├── FileUploader.tsx    # File upload component
│   ├── YouTubeAnalyzer.tsx # YouTube analysis component
│   ├── ChordProgressionDisplay.tsx
│   └── HarmonizationResults.tsx
├── lib/
│   ├── musicTheory.ts      # Music theory utilities
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript type definitions
```

## Future Enhancements

- Integration with Chord AI API for accurate chord detection
- Support for more file formats (ABC notation, Guitar Pro, etc.)
- Real-time MIDI input from external keyboards
- Advanced chord progression algorithms
- Machine learning models for better harmonization
- Cloud storage for saved projects
- Collaboration features for sharing harmonizations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Tone.js for audio synthesis
- @tonejs/midi for MIDI file handling
- Radix UI for beautiful, accessible components
- Next.js team for the amazing framework

## Contact

For questions or suggestions, please open an issue on GitHub.

---

Made with ❤️ for musicians everywhere