import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Loader2, User, Bot, AlertCircle } from 'lucide-react';
import { generateChatResponse } from '../services/api';
import { auth } from '../config/firebase';
import { chatService } from '../services/chatService';
import { useHospital } from '../context/HospitalContext';
import type { Message, PatientInfo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Add this new component for a more sophisticated typing animation
const TypingIndicator = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="flex flex-col space-y-2 p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 rounded-xl border border-blue-100 dark:border-blue-900/50"
  >
    <div className="flex items-center space-x-2">
      <Bot className="w-4 h-4 text-blue-500" />
      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">AI is thinking...</span>
    </div>
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{
            repeat: Infinity,
            duration: 1,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
          className="w-2 h-2 bg-blue-500 rounded-full"
        />
      ))}
    </div>
  </motion.div>
);

// Add this new component for error messages
const ErrorMessage = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl"
  >
    <div className="flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-red-800 dark:text-red-400">Error</h4>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{message}</p>
      </div>
    </div>
  </motion.div>
);

// Define a type for doctor
interface Doctor {
  name: string;
  specialization: string;
}

export function HospitalChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hospital } = useHospital();
  
  const [patientInfo] = useState<PatientInfo | null>(
    location.state?.patientInfo || null
  );
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  // Initial system message to provide hospital-specific context
  useEffect(() => {
    if (hospital && !messages.length) {
      // Initialize with a system message that includes hospital information
      const systemMessage: Message = {
        role: 'system',
        content: `You are an AI medical assistant for ${hospital.name} in ${hospital.city || 'your city'}, ${hospital.state || 'your state'}. ${
          hospital.specialties ? `This hospital specializes in: ${hospital.specialties}.` : ''
        } 
        
When making recommendations, prioritize doctors from this hospital. When patients ask about services, refer to the specialties of this hospital. Always respond as if you're representing ${hospital.name}.`
      };
      
      setMessages([systemMessage]);
    }
  }, [hospital, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: message
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setError(null);
    setIsLoading(true);

    try {
      // Generate AI response
      const aiResponse = await generateChatResponse([
        ...messages.filter(m => m.role !== 'system'), // Don't send system messages to API
        userMessage
      ]);

      // Add AI response to chat
      setMessages(prev => [...prev, aiResponse]);

      // Save chat to database if not already saved
      if (!chatId && auth.currentUser) {
        if (patientInfo) {
          const newChatId = await chatService.saveChatSession(
            auth.currentUser.uid,
            patientInfo,
            [...messages, userMessage, aiResponse]
          );
          setChatId(newChatId);
        } else {
          // If no patient info, request it
          navigate('/patient-form', { 
            state: { 
              returnTo: '/hospital-chat', 
              messages: [...messages, userMessage, aiResponse] 
            }
          });
        }
      } else if (chatId) {
        // Update existing chat
        await chatService.updateChatSession(chatId, [...messages, userMessage, aiResponse]);
      }
    } catch (err: any) {
      console.error('Error in chat:', err);
      setError(err.message || 'Failed to process your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Detect Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimeStamp = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hospital?.logo ? (
              <img 
                src={hospital.logo} 
                alt={`${hospital.name} Logo`} 
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-bold">
                  {hospital?.name?.charAt(0) || 'H'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">
                {hospital?.name || 'Hospital'} AI Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {patientInfo ? `Patient: ${patientInfo.name}` : 'New Consultation'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Message */}
          {messages.length <= 1 && (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to {hospital?.name || 'AI'} Medical Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                How can I help you today? You can ask about your symptoms, medical conditions, or general health questions.
              </p>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.filter(m => m.role !== 'system').map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm rounded-tl-none'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className="mr-2">
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5 text-blue-200" />
                    ) : (
                      <Bot className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    )}
                  </div>
                  <div className={msg.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}>
                    {msg.role === 'user' ? 'You' : hospital?.name ? `${hospital.name} AI` : 'AI Assistant'}
                  </div>
                </div>
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>
                {/* <div className="text-xs mt-2 text-right text-gray-400">
                  {formatTimeStamp(msg.timestamp || Date.now())}
                </div> */}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex justify-center">
              <div className="max-w-[80%]">
                <ErrorMessage message={error} />
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={2}
              disabled={isLoading}
            ></textarea>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Powered by {hospital?.name || 'Medical'} AI. For emergency situations, please call emergency services.
          </p>
        </div>
      </div>
    </div>
  );
} 