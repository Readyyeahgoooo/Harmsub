'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, FileAudio } from 'lucide-react';

interface FileUploaderProps {
  onFileUploaded: (file: File, type: 'midi' | 'xml' | 'logic' | 'audio') => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'mid' || extension === 'midi') {
        onFileUploaded(file, 'midi');
      } else if (extension === 'xml' || extension === 'musicxml') {
        onFileUploaded(file, 'xml');
      } else if (extension === 'logic' || extension === 'logicx') {
        onFileUploaded(file, 'logic');
      } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension || '')) {
        onFileUploaded(file, 'audio');
      }
    });
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/midi': ['.mid', '.midi'],
      'application/xml': ['.xml', '.musicxml'],
      'application/octet-stream': ['.logic', '.logicx'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
    },
    multiple: false
  });

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Upload Your Melody
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag & drop or click to upload
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-16 h-16 text-blue-500" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drop your file here...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-4">
              <Music className="w-12 h-12 text-gray-500" />
              <FileAudio className="w-12 h-12 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                Drop your file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                MIDI, MusicXML, Logic, or Audio files
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Supported formats: MIDI (.mid, .midi), MusicXML (.xml), 
        Logic (.logic, .logicx), Audio (.mp3, .wav, .ogg, .m4a, .flac)
      </div>
    </div>
  );
}