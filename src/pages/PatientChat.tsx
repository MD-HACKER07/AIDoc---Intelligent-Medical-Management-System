import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateChatResponse } from '../services/api';
import { ArrowLeft, Send, Loader2, FileText, User, Bot, AlertTriangle } from 'lucide-react';
import type { Message } from '../types';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  patientId: string;
  dateOfBirth: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
}

interface LocalMessage extends Message {
  id: string;
  timestamp: Date;
}

export default function PatientChat() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load patient data
  useEffect(() => {
    if (patientId) {
      const savedPatient = localStorage.getItem(`patient_${patientId}`);
      if (savedPatient) {
        setPatient(JSON.parse(savedPatient));
      }
    }
  }, [patientId]);

  // Load chat messages and create system message
  useEffect(() => {
    if (patientId) {
      const savedMessages = localStorage.getItem(`chat_${patientId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } else if (patient) {
        // Create patient-specific system message
        const systemMessage: LocalMessage = {
          id: Date.now().toString(),
          content: `This is a medical consultation for patient ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId}). 
Patient details:
- Age: ${patient.age} years
- Gender: ${patient.gender}
- Medical History: ${patient.medicalHistory || 'None provided'}
- Current Medications: ${patient.medications || 'None provided'}
- Allergies: ${patient.allergies || 'None provided'}

Please provide medical consultation based on this information. Remember to maintain medical ethics, patient confidentiality, and provide evidence-based responses.`,
          role: 'system',
          timestamp: new Date()
        };
        setMessages([systemMessage]);
      }
    }
  }, [patientId, patient]);

  // Save messages to localStorage
  useEffect(() => {
    if (patientId && messages.length > 0) {
      localStorage.setItem(`chat_${patientId}`, JSON.stringify(messages));
    }
  }, [messages, patientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !patientId || !user || !patient) return;
    
    try {
      setSending(true);
      
      // Create user message
      const userMessage: LocalMessage = {
        id: Date.now().toString(),
        content: newMessage,
        role: 'user',
        timestamp: new Date()
      };
      
      // Update local state immediately
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      
      // Get all messages to provide context to AI
      const allMessages: Message[] = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Generate AI response
      const aiResponse = await generateChatResponse(allMessages);
      
      if (aiResponse) {
        // Create AI message
        const assistantMessage: LocalMessage = {
          id: Date.now().toString(),
          content: aiResponse.content,
          role: aiResponse.role,
          timestamp: new Date()
        };
        
        // Update local state
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/consultations')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Patient not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/consultations')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono">{patient.patientId}</span>
                <span>•</span>
                <span>{patient.age} years</span>
                <span>•</span>
                <span>{patient.gender}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileText className="mr-1 h-4 w-4" />
            View Complete Record
          </button>
        </div>
      </header>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.filter(msg => msg.role !== 'system').map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-1 rounded-full ${
                    message.role === 'user'
                      ? 'bg-blue-500'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>
                <div className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-3/4 rounded-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-gray-500 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 