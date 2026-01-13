import {
    ChordCandidate,
    HarmonizationSettings,
    HarmonizationOutput,
    MelodyNote,
    NOTE_NAMES
} from '../types/harmonyTypes';
import { Note, ChordUI, ChordProgression } from '../types';
import { generateCandidates } from './candidateEngine';
import { findBestPath } from './progressionGraph';
import { generateVoicing } from './voicingEngine';
import { noteToNumber } from './musicTheory';

// ============================================
// MAIN SERVICE
// ============================================

export class Harmonizer {

    /**
     * Harmonize a melody with the given settings
     */
    static harmonize(
        melody: Note[],
        keyRoot: number, // 0-11
        settings: HarmonizationSettings
    ): HarmonizationOutput {

        // 1. Preprocess melody
        const melodyNotes = this.preprocessMelody(melody);

        // 2. Generate Candidate Grid
        // We group melody notes into "Harmonic Rhythm" slots.
        // For simplicity, we'll try to harmonize every strong beat or every 2 beats depending on settings.
        // HARSH SIMPLIFICATION FOR V1: One chord per melody note is too chaotic.
        // Better: One chord per bar or half-bar.
        // Let's assume the melody is segmented into "Chord Slots".
        // For now, let's just chunk the melody by say 2 seconds or every K notes?
        // Better: Basic beat detection or fixed slots.
        // Let's try: One chord every 2 beats (approx 1s if 120bpm).

        // Grouping logic:
        // This is complex. Let's simplify: Take the melody, find significant notes (long duration, on beat).
        // Or just generating a chord for every note is insane.
        // Let's assume we want 4 chords for an 8-note melody.
        // Let's group notes into buckets.

        const chordSlots = this.segmentMelody(melodyNotes);
        const candidateGrid: ChordCandidate[][] = [];

        chordSlots.forEach(slot => {
            // Find the most prominent note in this slot to harmonize
            // Or harmonize against all notes in the slot?
            // `generateCandidates` takes a single note.
            // We should probably pass the "Target Note" of the phrase.
            const targetNote = this.findTargetNote(slot);

            const candidates = generateCandidates(
                targetNote,
                keyRoot,
                settings.maxDistance
            );

            // Filter/Adjust candidates based on other notes in the slot?
            // (TODO: Advanced feature)

            candidateGrid.push(candidates);
        });

        // 3. Find Best Path (Progression Logic)
        const bestPath = findBestPath(candidateGrid, settings.style);

        // 4. Voice the Chords (pass roman chord through for display)
        const voicedChords = bestPath.map(candidate =>
            generateVoicing(candidate.chord, settings.voicingStyle, candidate.romanChord)
        );

        // 5. Construct Output
        return {
            melody: melodyNotes,
            chordPath: voicedChords,
            key: keyRoot,
            mode: 'major', // Assumed for now
            settings,
            alternativeChords: candidateGrid
        };
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Convert basic notes to rich MelodyNotes
     */
    private static preprocessMelody(notes: Note[]): MelodyNote[] {
        if (notes.length === 0) return [];

        const firstTime = notes[0].startTime;

        return notes.map(n => {
            const midi = noteToNumber(n.name) + 12; // Basic noteToNumber returns C4=60? Check util.
            // Actually lib/musicTheory noteToNumber C4 -> 48 ?
            // Let's re-verify noteToNumber in musicTheory.ts:
            // index('C') + 4*12 = 0 + 48 = 48.
            // Midi C4 is 60. So we need +12 offset if we want Standard MIDI.

            const normalizedMidi = noteToNumber(n.name) + 12;

            return {
                pitch: normalizedMidi,
                pitchClass: normalizedMidi % 12,
                startTime: n.startTime - firstTime,
                duration: n.duration,
                velocity: 100,
                isStrongBeat: false // TODO: Real beat detection
            };
        });
    }

    /**
     * Segment melody into harmonizable chunks
     */
    private static segmentMelody(notes: MelodyNote[]): MelodyNote[][] {
        // Simple fixed-count segmentation for now
        // e.g., every 2 notes = 1 chord
        // Or based on time?
        const chunks: MelodyNote[][] = [];
        const chunkSize = 2; // Arbitrary 2 notes per chord for demo

        for (let i = 0; i < notes.length; i += chunkSize) {
            chunks.push(notes.slice(i, i + chunkSize));
        }

        return chunks;
    }

    private static findTargetNote(slot: MelodyNote[]): MelodyNote {
        // Return longest note, or first note
        return slot.reduce((prev, curr) => curr.duration > prev.duration ? curr : prev, slot[0]);
    }
}
