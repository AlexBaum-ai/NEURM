/**
 * Voice Search Hook
 *
 * Hook for handling voice search using Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceSearchResult } from '../types/search.types';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseVoiceSearchOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: VoiceSearchResult) => void;
  onError?: (error: string) => void;
}

export const useVoiceSearch = (options: UseVoiceSearchOptions = {}) => {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = continuous;
        recognitionRef.current.interimResults = interimResults;
        recognitionRef.current.lang = lang;
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setTranscript('');
    setError(null);

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcriptText = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      setTranscript(transcriptText);

      const voiceResult: VoiceSearchResult = {
        transcript: transcriptText,
        confidence,
        isFinal,
      };

      onResult?.(voiceResult);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMsg = event.error || 'Speech recognition error';
      setError(errorMsg);
      setIsListening(false);
      onError?.(errorMsg);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start speech recognition';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isSupported, onResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
