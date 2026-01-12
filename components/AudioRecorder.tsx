'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  onNotesDetected: (notes: Array<{ note: string; time: number }>) => void;
}

const MAX_DURATION = 60;

export default function AudioRecorder({
  onAudioRecorded,
  onNotesDetected
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const detectNotes = async (audioBlob: Blob) => {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const notes: Array<{ note: string; time: number }> = [];

    for (let i = 0; i < channelData.length; i += sampleRate * 0.1) {
      const time = i / sampleRate;
      const sample = channelData[i];

      if (Math.abs(sample) > 0.1) {
        const note = frequencyToNote(calculatePitch(channelData, i, sampleRate));
        if (note && notes.length === 0 || notes[notes.length - 1].note !== note) {
          notes.push({ note, time });
        }
      }
    }

    onNotesDetected(notes);
  };

  const calculatePitch = (buffer: Float32Array, startIndex: number, sampleRate: number): number => {
    let sum = 0;
    for (let i = startIndex; i < startIndex + sampleRate * 0.1 && i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / (sampleRate * 0.1));

    if (rms < 0.01) return 0;

    let period = 0;
    const threshold = 0.2;
    const searchLength = Math.floor(sampleRate * 0.1);

    for (let offset = 1; offset < searchLength; offset++) {
      let correlation = 0;
      let normalization = 0;

      for (let i = startIndex; i < startIndex + searchLength && i < buffer.length - offset; i++) {
        correlation += buffer[i] * buffer[i + offset];
        normalization += buffer[i] * buffer[i];
      }

      correlation /= normalization;

      if (correlation > threshold) {
        period = offset;
        break;
      }
    }

    if (period === 0) return 0;

    return sampleRate / period;
  };

  const frequencyToNote = (frequency: number): string => {
    if (frequency < 20 || frequency > 5000) return '';

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const A4_OCTAVE = 4;

    const semitones = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = ((semitones % 12) + 12) % 12;
    const octave = A4_OCTAVE + Math.floor((semitones + 9) / 12);

    return NOTE_NAMES[noteIndex] + octave;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onAudioRecorded(audioBlob);
        await detectNotes(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);

      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= MAX_DURATION) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Live Audio Recording
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Record your melody (max 1 minute)
        </p>
      </div>

      <div className="text-4xl font-mono mb-4 text-gray-800 dark:text-gray-200">
        {formatTime(elapsedTime)}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-8 py-3 rounded-full font-medium transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isRecording ? '● Stop Recording' : '○ Start Recording'}
      </button>

      <div className="flex items-center gap-2 mt-2">
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isRecording ? 'Recording...' : 'Ready to record'}
        </span>
      </div>
    </div>
  );
}