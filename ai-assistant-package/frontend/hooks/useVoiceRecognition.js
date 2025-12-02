import { useState, useEffect, useRef } from 'react';

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.maxAlternatives = 3;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognitionRef.current.onresult = (event) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          let bestTranscript = result[0].transcript;
          let bestConfidence = result[0].confidence;

          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > bestConfidence) {
              bestTranscript = result[j].transcript;
              bestConfidence = result[j].confidence;
            }
          }

          if (result.isFinal) {
            finalTranscript += bestTranscript;
          } else {
            interimTranscript += bestTranscript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript) {
          setTranscript(currentTranscript);
        }

        if (finalTranscript && finalTranscript.trim().length > 0) {
          timeoutRef.current = setTimeout(() => {
            recognitionRef.current?.stop();
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    setTranscript,
  };
};
