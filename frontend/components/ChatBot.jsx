import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage } from '../utils/api';
import { useFeatureToggle } from '../hooks/useFeatureToggle';

const ChatBot = () => {
  const isChatbotEnabled = useFeatureToggle('chatbot');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  
  // If chatbot is disabled, don't render anything
  if (!isChatbotEnabled) {
    return null;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Power Grid AI Assistant. Ask me about project costs, delays, or statistics.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'text'
      }
    ]);

    // Clear messages on logout
    const handleLogout = () => {
      setMessages([]);
      setIsOpen(false);
    };

    window.addEventListener('logout', handleLogout);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(inputMessage);

      const botMessage = {
        id: messages.length + 2,
        text: data.response || data.message || "I couldn't process your request. Please try again.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: data.type || 'text',
        category: data.category
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "⚠️ Connection Error\n\nMake sure your backend is running on port 5000.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-4 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
              isExpanded 
                ? "w-[95vw] sm:w-[90vw] md:w-[700px] lg:w-[800px] h-[85vh] sm:h-[80vh] fixed bottom-4 sm:bottom-24 right-2 sm:right-6" 
                : "w-[90vw] sm:w-[400px] h-[70vh] sm:h-[600px]"
            }`}
          >
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black dark:bg-white flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">PowerGrid AI</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMessages([])}
                  title="Clear Chat"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  className="hidden sm:flex h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                </button>
                <button
                  className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full ${msg.sender === 'user' ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow-sm ${
                      msg.sender === 'user'
                        ? "bg-black dark:bg-white text-white dark:text-black rounded-br-none"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
                    }`}
                  >
                    <div className="leading-relaxed">
                      {formatMessage(msg.text)}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] mt-1 block opacity-70 ${
                      msg.sender === 'user' ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about projects, costs, or risks..."
                  className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black/20 dark:focus:border-white/20 transition-all text-xs sm:text-sm placeholder:text-gray-400 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  className={`absolute right-1 sm:right-1.5 h-7 w-7 sm:h-9 sm:w-9 rounded-lg transition-all flex items-center justify-center ${
                    inputMessage.trim() 
                      ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rotate-90" 
            : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        }`}
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
      </motion.button>
    </div>
  );
};

export default ChatBot;
