export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORD_TEMPLATES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  'major7': [0, 4, 7, 11],
  'minor7': [0, 3, 7, 10],
  'dominant7': [0, 4, 7, 10],
  'major6': [0, 4, 7, 9],
  'minor6': [0, 3, 7, 9],
};

export function noteToNumber(note: string): number {
  const [name, octave] = note.match(/([A-G]#?)(\d)/)?.slice(1) || ['C', '4'];
  const noteIndex = NOTE_NAMES.indexOf(name);
  return noteIndex + (parseInt(octave) * 12);
}

export function numberToNote(number: number): string {
  const octave = Math.floor(number / 12);
  const noteIndex = number % 12;
  return NOTE_NAMES[noteIndex] + octave;
}

export function frequencyToNote(frequency: number): string {
  const A4 = 440;
  const A4_NUMBER = 57;
  const noteNumber = Math.round(12 * Math.log2(frequency / A4) + A4_NUMBER);
  return numberToNote(noteNumber);
}

export function noteToFrequency(note: string): number {
  const A4 = 440;
  const A4_NUMBER = 57;
  const noteNumber = noteToNumber(note);
  return A4 * Math.pow(2, (noteNumber - A4_NUMBER) / 12);
}

export function createChord(root: string, type: keyof typeof CHORD_TEMPLATES): string[] {
  const rootNumber = noteToNumber(root);
  const intervals = CHORD_TEMPLATES[type];
  return intervals.map(interval => numberToNote(rootNumber + interval));
}

export function analyzeKey(notes: string[]): string {
  const noteCounts = notes.reduce((acc, note) => {
    const [name] = note.match(/([A-G]#?)/) || ['C'];
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(noteCounts).sort((a, b) => b[1] - a[1])[0][0];
}

export function generateChordProgression(key: string, length: number = 8): string[] {
  const progressions = [
    ['I', 'IV', 'V', 'I'],
    ['I', 'vi', 'IV', 'V'],
    ['I', 'V', 'vi', 'IV'],
    ['ii', 'V', 'I', 'I'],
  ];

  const selectedProgression = progressions[Math.floor(Math.random() * progressions.length)];
  const result: string[] = [];

  for (let i = 0; i < length; i++) {
    result.push(selectedProgression[i % selectedProgression.length]);
  }

  return result;
}

export function romanToChord(roman: string, key: string): string {
  const keyNumber = noteToNumber(key);
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const index = romanNumerals.indexOf(roman.toUpperCase());
  
  if (index === -1) return 'C';

  const isMinor = roman.toLowerCase() === roman && roman !== roman.toUpperCase();
  const rootNote = numberToNote(keyNumber + index);
  
  return isMinor ? rootNote + 'm' : rootNote;
}