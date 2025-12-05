import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, CheckCircle } from 'lucide-react';
import './VoiceInput.css';

const VOICE_QUESTIONS = [
  { field: 'voltage_level_kv', question: 'What is the voltage level in kV?', type: 'number', examples: '132, 220, 400, or 765' },
  { field: 'line_length_km', question: 'What is the line length in kilometers?', type: 'number' },
  { field: 'target_cost_inr', question: 'What is the target cost in crores?', type: 'number', multiplier: 10000000 },
  { field: 'target_duration_days', question: 'What is the target duration in months?', type: 'number', multiplier: 30 },
  { field: 'terrain_complexity_index', question: 'What is the terrain complexity? Say 1 for Simple, 2 for Moderate, 3 for Complex, or 4 for Very Complex', type: 'choice', mapping: {1: 3, 2: 5, 3: 7, 4: 10} },
  { field: 'environmental_impact_severity', question: 'What is the environmental impact? Say 1 for Low, 2 for Medium, 3 for High, or 4 for Critical', type: 'choice', mapping: {1: 2, 2: 3, 3: 5, 4: 8} },
  { field: 'regulatory_hotspot_region', question: 'What is the regulatory risk? Say 1 for Low, 2 for Medium, or 3 for High', type: 'choice', choices: ['Low', 'Medium', 'High'] },
  { field: 'vendor_performance_rating', question: 'What is the vendor performance rating from 1 to 5?', type: 'number' },
  { field: 'material_availability_issue', question: 'What is the material availability? Say 1 for Good, 2 for Moderate, or 3 for Poor', type: 'choice', choices: ['Low', 'Medium', 'High'] }
];

export default function VoiceInput({ onComplete, isOpen = false, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    
    recognitionRef.current.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      processVoiceInput(result);
    };

    recognitionRef.current.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (isOpen && currentStep < VOICE_QUESTIONS.length) {
      const question = VOICE_QUESTIONS[currentStep];
      speak(question.question + (question.examples ? `. For example, ${question.examples}` : ''), () => {
        startListening();
      });
    }
  }, [currentStep, isOpen]);

  const speak = (text, onEnd) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    setError('');
    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch (err) {
      setError('Failed to start listening');
    }
  };

  const processVoiceInput = (input) => {
    const question = VOICE_QUESTIONS[currentStep];
    let value;

    if (question.type === 'number') {
      const match = input.match(/\d+(\.\d+)?/);
      value = match ? parseFloat(match[0]) : null;
      if (question.multiplier && value) {
        value = value * question.multiplier;
      }
    } else if (question.type === 'choice') {
      const numberMatch = input.match(/\b(one|two|three|four|1|2|3|4)\b/i);
      if (numberMatch) {
        const num = numberMatch[0].toLowerCase();
        const choiceNum = num === 'one' || num === '1' ? 1 : 
                         num === 'two' || num === '2' ? 2 : 
                         num === 'three' || num === '3' ? 3 : 4;
        
        if (question.mapping) {
          value = question.mapping[choiceNum];
        } else if (question.choices) {
          value = question.choices[choiceNum - 1];
        }
      }
    }

    if (value !== null && value !== undefined) {
      setResponses(prev => ({ ...prev, [question.field]: value }));
      
      if (currentStep < VOICE_QUESTIONS.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 1000);
      } else {
        completeVoiceInput();
      }
    } else {
      setError('Could not understand the input. Please try again.');
      setTimeout(() => startListening(), 2000);
    }
  };

  const completeVoiceInput = () => {
    speak('Great! I have collected all the information. Processing your prediction now.', () => {
      onComplete(responses);
    });
  };

  const progress = ((currentStep + 1) / VOICE_QUESTIONS.length) * 100;
  const currentQuestion = VOICE_QUESTIONS[currentStep];

  if (!isOpen) return null;

  return (
    <div className="voice-input-overlay">
      <div className="voice-input-panel">
        <div className="voice-panel-header">
          <div>
            <h3>Voice Assistant</h3>
            <p className="voice-subtitle">Question {currentStep + 1} of {VOICE_QUESTIONS.length}</p>
          </div>
          <button onClick={() => { synthRef.current.cancel(); recognitionRef.current?.stop(); onClose?.() || onComplete({}) }} className="voice-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="voice-progress-bar">
          <div className="voice-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="voice-content">
          {error && (
            <div className="voice-error">
              <p>{error}</p>
            </div>
          )}

          <div className="voice-question">
            <span className="question-badge">Q{currentStep + 1}</span>
            <p>{currentQuestion.question}</p>
            {currentQuestion.examples && (
              <span className="voice-hint">Examples: {currentQuestion.examples}</span>
            )}
          </div>

          {currentQuestion.type === 'choice' && currentQuestion.choices && (
            <div className="voice-choices">
              {currentQuestion.choices.map((choice, idx) => (
                <div key={idx} className="voice-choice-item">
                  <span className="choice-number">{idx + 1}</span>
                  <span>{choice}</span>
                </div>
              ))}
            </div>
          )}

          <div className="voice-mic-indicator">
            <div className={`mic-circle ${isListening ? 'listening' : isSpeaking ? 'speaking' : ''}`}>
              {isSpeaking ? <Volume2 size={48} className="pulsing" /> : <Mic size={48} />}
            </div>
            <p className="voice-status">
              {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening...' : 'Ready'}
            </p>
          </div>

          {transcript && (
            <div className="voice-transcript">
              <p><strong>You said:</strong> {transcript}</p>
            </div>
          )}

          <div className="voice-responses">
            <p className="responses-title">
              <CheckCircle size={16} /> Collected {Object.keys(responses).length} responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
