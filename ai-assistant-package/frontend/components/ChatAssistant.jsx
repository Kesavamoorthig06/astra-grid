import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, fileAPI } from '../services/api';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import './ChatAssistant.css';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your Power Grid AI Assistant. Ask me anything about:\n\n📊 Project costs, timelines, and regional data\n🌐 Power grid technologies and policies\n📁 Upload project documents for risk analysis\n🎤 Use voice to ask questions\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { isListening, transcript, toggleListening, isSupported, setTranscript } = useVoiceRecognition();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      setTranscript('');
    }
  }, [transcript, isListening, setTranscript]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(userMessage);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.response || 'Sorry, I could not process your request.',
        data: response.data,
        chartType: response.chart_type
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '❌ Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessages(prev => [...prev, {
      type: 'user',
      text: `📎 Uploading file: ${file.name}`
    }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fileAPI.uploadFile(formData);

      if (response.success) {
        let resultText = '✅ **File Processed Successfully!**\n\n';
        
        if (response.extracted_data) {
          resultText += '**Extracted Information:**\n';
          Object.entries(response.extracted_data).forEach(([key, value]) => {
            if (key !== 'original_text') {
              resultText += `• ${key}: ${value}\n`;
            }
          });
        }
        
        if (response.prediction) {
          resultText += `\n**Risk Analysis:**\n`;
          resultText += `• Risk Level: ${response.prediction.risk_level}\n`;
          if (response.prediction.interpretation) {
            resultText += `\n${response.prediction.interpretation}`;
          }
        }

        setMessages(prev => [...prev, { type: 'bot', text: resultText }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `❌ Error: ${response.error || 'Failed to process file'}`
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '❌ Failed to upload file. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderDataTable = (data) => {
    if (!data) return null;
    
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      return (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  {headers.map(header => (
                    <td key={header}>
                      {typeof row[header] === 'number' 
                        ? row[header].toLocaleString() 
                        : row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="table-note">Showing 10 of {data.length} results</p>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="chat-assistant">
      <div className="chat-header">
        <div className="chat-title">
          <i className="fas fa-robot"></i>
          <span>Power Grid AI Assistant</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <div className="message-avatar">
              <i className={`fas ${message.type === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
            </div>
            <div className="message-content">
              <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                {message.text}
              </div>
              {message.data && renderDataTable(message.data)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot-message">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <i className="fas fa-spinner fa-spin"></i> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isListening && (
        <div className="voice-indicator active">
          <i className="fas fa-microphone"></i> Listening... Speak now
        </div>
      )}

      <div className="chat-input-container">
        <button
          className="btn btn-icon"
          onClick={() => fileInputRef.current?.click()}
          title="Upload file"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".txt,.pdf,.docx,.doc"
          onChange={handleFileUpload}
        />
        <input
          type="text"
          className="chat-input"
          placeholder="Ask me anything about power grid projects..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          className={`btn btn-icon ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={!isSupported}
          title={isSupported ? 'Voice input' : 'Voice input not supported'}
        >
          <i className="fas fa-microphone"></i>
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
