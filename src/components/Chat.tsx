import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { Send, Loader2, User, Bot, Paperclip, X, Brain, LogOut, History, Calendar, Clock, AlertCircle, MapPin, Phone, ClipboardList, Download, FileText } from 'lucide-react';
import { generateChatResponse } from '../services/api';
import { auth, db } from '../config/firebase';
import { chatService } from '../services/chatService';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Message, PatientInfo } from '../types';
import { DownloadOptions } from './DownloadOptions';
import { useHospital } from '../context/HospitalContext';
import { generateMedicalReport } from '../utils/reportGenerator';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { PSM } from 'tesseract.js';
import { extractTextFromFile, enhancedMedicalDocExtraction } from '../utils/textExtraction';

// Set CORS proxy for PDF.js if needed
const CORS_PROXY_URL = '';

// Get the current version of the PDF.js library
const pdfVersion = pdfjsLib.version;
console.log('PDF.js version:', pdfVersion);

// Set worker URL with exact version match
try {
  // Use CDN with version matching
  const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  console.log('PDF worker initialized with URL:', workerUrl);
} catch (error) {
  console.error('Error setting PDF worker URL:', error);
}

// Configure PDF.js worker - try different CDNs for better reliability
const configurePdfWorker = () => {
  try {
    // Explicit version for stability
    const knownWorkingVersion = pdfjsLib.version || '3.11.174';
    console.log('Configuring PDF.js worker with version:', knownWorkingVersion);
    
    // Try multiple CDNs in order of preference
    const cdnUrls = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${knownWorkingVersion}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${knownWorkingVersion}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${knownWorkingVersion}/pdf.worker.min.js`
    ];
    
    // Use the first URL as fallback
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrls[0];
      console.log('Worker set to fallback URL:', cdnUrls[0]);
    }
    
    return true;
  } catch (error) {
    console.error('Error configuring PDF worker:', error);
    return false;
  }
};

// Make sure to call the configuration function
configurePdfWorker();

// Add a function to validate the PDF worker
const validatePDFWorker = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Check if worker URL is already set
      const workerUrl = pdfjsLib.GlobalWorkerOptions.workerSrc;
      if (!workerUrl) {
        console.warn('PDF worker URL is not set, attempting to configure...');
        configurePdfWorker();
        // Check again after configuration
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          console.error('Failed to configure PDF worker URL');
          resolve(false);
          return;
        }
      }
      
      console.log('Checking worker URL:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Try multiple CDNs in case the default one fails
      const pdfVersion = pdfjsLib.version;
      const cdnUrls = [
        pdfjsLib.GlobalWorkerOptions.workerSrc, // Try current URL first
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`,
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`,
        `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`
      ];
      
      // Filter out duplicates
      const uniqueUrls = [...new Set(cdnUrls)];
      
      // Check each URL with a timeout
      let checkedCount = 0;
      let foundWorking = false;
      
      uniqueUrls.forEach(url => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        fetch(url, { 
          method: 'HEAD',
          signal: controller.signal
        })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            console.log('PDF worker is available at:', url);
            if (!foundWorking) {
              foundWorking = true;
              // Update the worker URL to this working one
              pdfjsLib.GlobalWorkerOptions.workerSrc = url;
              resolve(true);
            }
          } else {
            console.warn(`PDF worker check failed at ${url}: ${response.status} ${response.statusText}`);
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.warn(`Error checking PDF worker at ${url}:`, error.name === 'AbortError' 
            ? 'Request timed out' 
            : error.message);
        })
        .finally(() => {
          checkedCount++;
          // If we've checked all URLs and none worked
          if (checkedCount === uniqueUrls.length && !foundWorking) {
            console.error('No working PDF worker found at any CDN');
            
            // Last resort - try without worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            console.log('Falling back to workerless mode');
            resolve(false);
          }
        });
      });
      
      // Set a timeout for the entire validation process
      setTimeout(() => {
        if (checkedCount < uniqueUrls.length && !foundWorking) {
          console.error('PDF worker validation timed out after checking some URLs');
          resolve(false);
        }
      }, 8000); // 8 second overall timeout
      
    } catch (error) {
      console.error('Error validating PDF worker:', error);
      resolve(false);
    }
  });
};

const generateAnalysis = (messages: Message[]) => {
  // Extract symptoms and key points from the conversation
  const symptoms = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  const aiResponses = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n');

  return `# AI Analysis Report
Generated on: ${new Date().toLocaleString()}

## Patient Symptoms and Concerns
${symptoms}

## AI Assessment and Recommendations
${aiResponses}

## Key Points and Follow-up
- Consultation conducted via AI medical assistant
- Patient concerns documented and addressed
- Recommendations provided based on symptoms
- Follow-up advised if symptoms persist`;
};

const generateMedicalSummary = (messages: Message[], patientInfo: PatientInfo) => {
  return `# Medical Summary
Generated on: ${new Date().toLocaleString()}

## Patient Information
- Name: ${patientInfo.name}
- Age: ${patientInfo.age}
- Gender: ${patientInfo.gender}
- Country: ${patientInfo.country}

## Medical History
${patientInfo.medicalHistory.map(item => `- ${item}`).join('\n')}

## Current Medications
${patientInfo.currentMedications.map(item => `- ${item}`).join('\n')}

## Consultation Summary
${messages
  .filter(m => m.role === 'assistant' && m.content.includes('Assessment'))
  .map(m => m.content)
  .join('\n\n')}`;
};

// Add this new component for a more sophisticated typing animation
const TypingIndicator = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="flex flex-col space-y-2 p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100"
  >
    <div className="flex items-center space-x-2">
      <Bot className="w-4 h-4 text-blue-500" />
      <span className="text-sm text-blue-600 font-medium">AIDoc is thinking...</span>
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
    className="p-4 bg-red-50 border border-red-200 rounded-xl"
  >
    <div className="flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-red-800">Error</h4>
        <p className="text-sm text-red-600 mt-1">{message}</p>
      </div>
    </div>
  </motion.div>
);

// Add interface for doctor information
interface DoctorInfo {
  name: string;
  specialty: string;
  address: string;
  phone: string;
  city: string;
  reason?: string; // Why this doctor is recommended
}

const DoctorRecommendation = ({ doctor }: { doctor: DoctorInfo }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 p-4 mt-2 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-blue-100 rounded-full">
        <User className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-blue-800">{doctor.name}</h4>
        <p className="text-sm text-blue-600 mt-1">{doctor.specialty}</p>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            {doctor.address}
          </p>
          <p className="flex items-center">
            <Phone className="w-4 h-4 mr-2 text-gray-500" />
            {doctor.phone}
          </p>
          {doctor.city && (
            <p className="flex items-center text-xs bg-blue-50 py-1 px-2 rounded inline-block">
              <MapPin className="w-3 h-3 mr-1 text-blue-500" />
              {doctor.city}
            </p>
          )}
          {(doctor as any).reason && (
            <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">
              {(doctor as any).reason}
            </p>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { hospital } = useHospital();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(location.state?.chatId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(location.state?.patientInfo as PatientInfo);
  const restoredMessages = location.state?.messages as Message[];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add state for patient details
  const [patientDetails, setPatientDetails] = useState<any>(null);

  // Add new state for download content
  const [downloadableContent, setDownloadableContent] = useState({
    chatTranscript: '',
    medicalSummary: '',
    analysisResults: ''
  });

  // Add state for analyses
  const [analyses, setAnalyses] = useState<{
    analysis?: string;
    summary?: string;
    transcript?: string;
  }>({});

  // Add state for current topic
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  // Track if user is manually scrolling
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  // Add scroll event listener to detect user scrolling
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages-container');
    if (!chatContainer) return;
    
    let scrollTimer: number | null = null;
    
    const handleScroll = () => {
      // User is actively scrolling
      setIsUserScrolling(true);
      
      // Clear previous timer
      if (scrollTimer) window.clearTimeout(scrollTimer);
      
      // Reset after scrolling stops for 1 second
      scrollTimer = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };
    
    chatContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, []);
  
  // Modify scrollToBottom to respect user scrolling
  const scrollToBottom = () => {
    if (!isUserScrolling) {
      try {
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
          // Don't auto-scroll if user has scrolled up more than 200px
          const isScrolledUp = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight > 200;
          
          if (isScrolledUp) {
            console.log('User is viewing message history, not scrolling to bottom');
            return;
          }
          
          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            chatContainer.scrollTo({
              top: chatContainer.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
      } catch (error) {
        console.error('Error during scroll:', error);
        // Fallback method if smooth scrolling fails
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    }
  };

  // Store previous message count to determine if we need to scroll
  const [prevMessageCount, setPrevMessageCount] = useState(0);

  // Scroll to bottom only when new messages are added
  useEffect(() => {
    // Check if messages were added (not just initial load)
    if (messages.length > prevMessageCount) {
      // Only scroll when new messages are added
      setTimeout(() => scrollToBottom(), 50);
      setTimeout(() => scrollToBottom(), 300);
    }
    
    // Update the previous message count
    setPrevMessageCount(messages.length);
  }, [messages.length]);

  // Save chat session when messages update
  useEffect(() => {
    const saveChat = async () => {
      if (messages.length > 0 && auth.currentUser && patientInfo) {
        try {
          setError(null);
          if (!chatId) {
            // Create new chat session
            const newChatId = await chatService.saveChatSession(
              auth.currentUser.uid,
              patientInfo,
              messages
            );
            setChatId(newChatId);
          } else {
            // Update existing chat session
            await chatService.updateChatSession(chatId, messages);
          }
        } catch (error) {
          console.error('Error saving chat:', error);
          setError('.');
        }
      }
    };

    // Only save if messages have changed and it's not the initial load of a restored chat
    if (!restoredMessages || messages !== restoredMessages) {
      saveChat();
    }
  }, [messages, patientInfo, chatId, restoredMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (chatId) {
      const unsubscribe = chatService.subscribeToChat(chatId, (session) => {
        setMessages(session.messages);
      });

      return () => unsubscribe();
    }
  }, [chatId]);

  // Update downloadable content when messages change
  useEffect(() => {
    const transcript = messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'AiDoc'}: ${msg.content}`)
      .join('\n\n');

    const summary = messages
      .filter(msg => msg.role === 'assistant' && msg.content.includes('Summary'))
      .map(msg => msg.content)
      .join('\n\n');

    const analysis = messages
      .filter(msg => msg.role === 'assistant' && msg.content.includes('Analysis'))
      .map(msg => msg.content)
      .join('\n\n');

    setDownloadableContent({
      chatTranscript: transcript,
      medicalSummary: summary || 'No medical summary available yet.',
      analysisResults: analysis || 'No analysis results available yet.'
    });
  }, [messages]);

  // Function to save analyses
  const saveAnalyses = async () => {
    if (!chatId || !auth.currentUser) return;

    try {
      // Generate and save analysis
      const analysis = generateAnalysis(messages);
      await chatService.saveAnalysis(
        auth.currentUser.uid,
        chatId,
        'analysis',
        analysis
      );

      // Generate and save medical summary
      const summary = patientInfo 
        ? generateMedicalSummary(messages, patientInfo)
        : 'No patient information available for medical summary.';
      await chatService.saveAnalysis(
        auth.currentUser.uid,
        chatId,
        'summary',
        summary
      );

      // Save chat transcript
      const transcript = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'AiDoc'}: ${msg.content}`)
        .join('\n\n');
      await chatService.saveAnalysis(
        auth.currentUser.uid,
        chatId,
        'transcript',
        transcript
      );

      // Load latest analyses
      const latestAnalyses = await chatService.getLatestAnalyses(chatId);
      setAnalyses({
        analysis: latestAnalyses.analysis?.content,
        summary: latestAnalyses.summary?.content,
        transcript: latestAnalyses.transcript?.content
      });
    } catch (error) {
      console.error('Error saving analyses:', error);
      setError('Failed to save analyses. Please try again.');
    }
  };

  // Save analyses when messages update
  useEffect(() => {
    if (messages.length > 0 && chatId) {
      saveAnalyses();
    }
  }, [messages, chatId]);

  // Load analyses when chat loads
  useEffect(() => {
    const loadAnalyses = async () => {
      if (!chatId) return;

      try {
        const latestAnalyses = await chatService.getLatestAnalyses(chatId);
        setAnalyses({
          analysis: latestAnalyses.analysis?.content,
          summary: latestAnalyses.summary?.content,
          transcript: latestAnalyses.transcript?.content
        });
      } catch (error) {
        console.error('Error loading analyses:', error);
        setError('Failed to load analyses. Please try again.');
      }
    };

    loadAnalyses();
  }, [chatId]);

  // Modify the formatAIResponse function to handle doctor recommendations
  const formatAIResponse = (content: string): JSX.Element => {
    // First identify if this is a medical report response
    const isMedicalReport = content.includes('Test Results') || 
                           content.includes('Medical Report Analysis') || 
                           content.includes('Lab Results');
    
    // Process the content into sections
    const sections = content.split('\n').filter(line => line.trim());
    
    // Add emojis to common medical headings
    const addEmojis = (text: string): string => {
      // Only process if the text appears to be a heading
      if (!text.endsWith(':') && !text.startsWith('#')) return text;
      
      const lowerText = text.toLowerCase();
      
      // Add appropriate emojis based on section content
      if (lowerText.includes('test results') || lowerText.includes('lab results'))
        return '🔬 ' + text;
      if (lowerText.includes('key findings') || lowerText.includes('abnormal'))
        return '⚠️ ' + text;
      if (lowerText.includes('diagnosis') || lowerText.includes('interpretation'))
        return '🔍 ' + text;
      if (lowerText.includes('recommendation') || lowerText.includes('next steps'))
        return '✅ ' + text;
      if (lowerText.includes('specialist') || lowerText.includes('doctor'))
        return '👨‍⚕️ ' + text;
      if (lowerText.includes('urgency') || lowerText.includes('emergency'))
        return '🚨 ' + text;
      if (lowerText.includes('summary'))
        return '📋 ' + text;
      if (lowerText.includes('assessment'))
        return '📊 ' + text;
      if (lowerText.includes('symptoms') || lowerText.includes('concerns'))
        return '😷 ' + text;
      if (lowerText.includes('medication') || lowerText.includes('treatment'))
        return '💊 ' + text;
      if (lowerText.includes('follow') || lowerText.includes('next steps'))
        return '📅 ' + text;
      
      // Return the original text if no match
      return text;
    };
    
    // Format lab values with colored indicators
    const formatLabValue = (text: string): JSX.Element => {
      // Check if this line contains a lab value
      const hasLabValue = /(\d+\.?\d*)\s*([a-zA-Z]+\/[a-zA-Z]+|mg\/dL|mmol\/L|U\/L|mEq\/L|g\/dL|ng\/mL)/i.test(text);
      
      // Check if this is flagged as abnormal
      const isAbnormal = /abnormal|elevated|high|low|outside|critical|flag/i.test(text) || 
                        text.includes('⚠️') || 
                        text.includes('❗') ||
                        text.includes('H)') ||
                        text.includes('L)');
                        
      const isHighlightedWithBrackets = /\[\s*H\s*\]|\[\s*L\s*\]|\(\s*H\s*\)|\(\s*L\s*\)/i.test(text);
      
      if (!hasLabValue && !isAbnormal && !isHighlightedWithBrackets) {
        return <p className="text-gray-700 leading-relaxed">{text}</p>;
      }
      
      // Different styling for abnormal values
      if (isAbnormal || isHighlightedWithBrackets) {
        return (
          <p className="text-red-700 font-medium leading-relaxed flex items-start space-x-2">
            <span className="text-red-500 mr-1">⚠️</span>
            <span>{text}</span>
          </p>
        );
      }
      
      // Normal lab value
      return (
        <p className="text-emerald-700 leading-relaxed flex items-start space-x-2">
          <span className="text-emerald-500 mr-1">✓</span>
          <span>{text}</span>
        </p>
      );
    };
    
    // Format text with bold sections for text between ** markers
    const formatWithBold = (text: string): JSX.Element => {
      // First check for emoji indicators like "😷 - Text"
      const emojiIndicatorRegex = /^([\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}]+)\s*-\s*(.+)$/u;
      const emojiMatch = text.match(emojiIndicatorRegex);
      
      if (emojiMatch) {
        const [_, emoji, content] = emojiMatch;
        
        return (
          <span className="flex items-start">
            <span className="text-xl mr-2 flex-shrink-0">{emoji}</span>
            <span>{formatWithBold(content)}</span>
          </span>
        );
      }
      
      // Check if text contains ** for bold highlighting
      if (!text.includes('**')) {
        return <span>{text}</span>;
      }
      
      // Split by ** markers
      const parts = text.split('**');
      return (
        <span>
          {parts.map((part, i) => {
            // Even indices are normal text, odd indices are bold
            return i % 2 === 0 ? 
              <span key={i}>{part}</span> : 
              <span key={i} className="font-bold text-blue-800">{part}</span>;
          })}
        </span>
      );
    };
    
    return (
      <div className={`space-y-3 ${isMedicalReport ? 'medical-report-container' : ''}`}>
        {sections.map((section, index) => {
          // Handle divider lines (--) with improved styling
          if (section.trim() === '--') {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.2 }}
                className="my-4 border-t border-gray-200 w-full"
              />
            );
          }
          
          // Doctor recommendation section - check for both formats
          if (section.includes('Recommended Doctor:') || section.includes('Specialist Referral:')) {
            const doctorInfo = extractDoctorInfo(section);
            return doctorInfo ? <DoctorRecommendation key={index} doctor={doctorInfo} /> : null;
          }
          
          // Specialist Referrals section heading
          if (section.trim() === '## Specialist Referrals' || section.trim() === '## Doctor Recommendations') {
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 mb-2"
              >
                <div className="flex items-center bg-blue-50 p-3 rounded-t-lg border-l-4 border-blue-500">
                  <span className="text-xl mr-2">👨‍⚕️</span>
                  <h3 className="text-blue-800 font-bold text-[16px]">Specialist Referrals</h3>
                </div>
              </motion.div>
            );
          }

          // Enhanced handling for ## headers - convert to numbered/bulleted sections
          if (section.startsWith('##')) {
            const headingText = section.replace(/^##\s*/, '').trim();
            let emoji = '📋';
            
            // Choose emoji based on content
            if (headingText.toLowerCase().includes('key question')) emoji = '❓';
            else if (headingText.toLowerCase().includes('immediate step')) emoji = '⚡';
            else if (headingText.toLowerCase().includes('when to seek')) emoji = '🏥';
            else if (headingText.toLowerCase().includes('possible cause')) emoji = '🔍';
            else if (headingText.toLowerCase().includes('recommendation')) emoji = '✅';
            else if (headingText.toLowerCase().includes('symptom')) emoji = '😷';
            else if (headingText.toLowerCase().includes('treatment')) emoji = '💊';
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 mb-2"
              >
                <div className="flex items-center bg-blue-50 p-3 rounded-t-lg border-l-4 border-blue-500">
                  <span className="text-xl mr-2">{emoji}</span>
                  <h3 className="text-blue-800 font-bold text-[16px]">{headingText}</h3>
                </div>
                {index < sections.length - 1 && !sections[index + 1].startsWith('#') && 
                 !sections[index + 1].trim().startsWith('--') && (
                  <div className="ml-4 mt-2 pl-2 border-l-2 border-blue-100"></div>
                )}
              </motion.div>
            );
          }

          // Main heading (starts with #)
          if (section.startsWith('#')) {
            const headingText = section.replace('#', '').trim();
            const textWithEmoji = addEmojis(headingText);
            
            return (
              <motion.h2 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-gray-800 mt-5 mb-3 first:mt-0 pb-1 border-b border-gray-200"
              >
                {textWithEmoji}
              </motion.h2>
            );
          }
          
          // Section heading (ends with ':')
          if (section.trim().endsWith(':')) {
            const textWithEmoji = addEmojis(section);
            
            return (
              <motion.h3 
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-semibold text-gray-800 mt-4 first:mt-1 text-[16px]"
              >
                {textWithEmoji}
              </motion.h3>
            );
          }
          
          // Bullet points
          if (section.trim().startsWith('-') || section.trim().match(/^\d+\./)) {
            // Check if this might be a lab result line
            if (isMedicalReport && 
               (section.includes(':') || 
                /\d+\s*[a-zA-Z]+\/[a-zA-Z]+/.test(section) ||
                /normal range|reference range/.test(section.toLowerCase()))) {
              
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-start space-x-2 pl-4 my-1"
                >
                  {formatLabValue(section.replace(/^-|\d+\.\s*/, '').trim())}
                </motion.div>
              );
            }
            
            // Enhanced bullet points with better styling
            let bulletEmoji = '•';
            const bulletContent = section.replace(/^-|\d+\.\s*/, '').trim();
            
            // Add specific emoji for some common bullet points
            if (/fever|temperature|celsius|fahrenheit/i.test(bulletContent)) bulletEmoji = '🌡️';
            else if (/breath|cough|lung|chest|pneumonia/i.test(bulletContent)) bulletEmoji = '🫁';
            else if (/heart|cardiac|pulse/i.test(bulletContent)) bulletEmoji = '❤️';
            else if (/head|brain|neuro|confusion/i.test(bulletContent)) bulletEmoji = '🧠';
            else if (/drink|fluid|hydration|water/i.test(bulletContent)) bulletEmoji = '💧';
            else if (/sleep|rest|fatigue/i.test(bulletContent)) bulletEmoji = '😴';
            else if (/medic|pill|drug|ibuprofen|paracetamol|acetaminophen/i.test(bulletContent)) bulletEmoji = '💊';
            else if (/diet|food|eat/i.test(bulletContent)) bulletEmoji = '🍲';
            else if (/exercise|activity/i.test(bulletContent)) bulletEmoji = '🚶';
            else if (/doctor|hospital|emergency|911/i.test(bulletContent)) bulletEmoji = '🏥';
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start space-x-3 pl-4 my-2"
              >
                <span className="text-blue-500 flex-shrink-0">{bulletEmoji}</span>
                <p className="text-gray-700 leading-relaxed">
                  {formatWithBold(bulletContent)}
                </p>
              </motion.div>
            );
          }
          
          // Important points (starts with *)
          if (section.trim().startsWith('*')) {
            return (
              <motion.p 
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-amber-800 font-medium pl-4 leading-relaxed flex items-start space-x-2 bg-amber-50 p-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                <span>{formatWithBold(section.replace('*', '').trim())}</span>
              </motion.p>
            );
          }
          
          // Handle sections that might contain lab results
          if (isMedicalReport && 
             (section.includes(':') || 
              /\d+\s*[a-zA-Z]+\/[a-zA-Z]+/.test(section) ||
              /normal range|reference range/.test(section.toLowerCase()))) {
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="my-1"
              >
                {formatLabValue(section)}
              </motion.div>
            );
          }
          
          // Regular paragraph
          return (
            <motion.p 
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-700 leading-relaxed"
            >
              {formatWithBold(section)}
            </motion.p>
          );
        })}
        
        {/* Add a helpful message at the end if this is a medical report */}
        {isMedicalReport && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-sm bg-blue-50 p-3 rounded-lg text-blue-700"
          >
            <p className="font-medium flex items-center">
              <span className="mr-2">💡</span>
              <span>Have questions about your results? Let me know!</span>
            </p>
          </motion.div>
        )}
      </div>
    );
  };

  // Add this helper function to extract doctor information from the message
  const extractDoctorInfo = (section: string): DoctorInfo | null => {
    try {
      const lines = section.split('\n');
      const name = lines[0].replace('Recommended Doctor:', '').trim();
      const specialty = lines.find(l => l.includes('Specialty:'))?.split(':')[1]?.trim() || '';
      const address = lines.find(l => l.includes('Address:'))?.split(':')[1]?.trim() || '';
      const phone = lines.find(l => l.includes('Phone:'))?.split(':')[1]?.trim() || '';
      const city = lines.find(l => l.includes('City:'))?.split(':')[1]?.trim() || '';
      const reason = lines.find(l => l.includes('Note:'))?.split(':')[1]?.trim() || 
                    lines.find(l => l.includes('Reason:'))?.split(':')[1]?.trim();

      // Only return if we have at least a name and specialty
      if (name && specialty) {
        return {
          name,
          specialty,
          address,
          phone,
          city,
          ...(reason ? { reason } : {})
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting doctor info:', error);
      return null;
    }
  };

  // Add a function to force scroll to bottom regardless of user's scroll position
  const forceScrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });

        // Force scroll the container directly
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          });
        }
      } catch (error) {
        console.error('Error during forced scroll:', error);
      }
    }
  };

  // Add this helper function after the formatTestResults function
  const enhanceMedicalResponse = (response: Message): Message => {
    // Only process assistant messages that contain medical report analysis
    if (response.role !== 'assistant' || 
        !response.content.includes('Medical Report Analysis') && 
        !response.content.includes('Test Results') && 
        !response.content.includes('Lab Results')) {
      return response;
    }
    
    // Extract existing content
    const content = response.content as string;
    
    // Check if it already has the desired format (with headers using ###)
    if (content.includes('### **Medical Report Analysis:')) {
      return response;
    }
    
    // Parse the content to identify sections
    let structuredContent = '';
    let keyFindings: string[] = [];
    let possibleCauses: string[] = [];
    let recommendedSteps: string[] = [];
    
    // Try to identify patient and test info from the content
    const testTypeMatch = content.match(/(?:Analysis|Report) for\s+([^:]*)(?::|$)/i) || 
                         content.match(/([A-Za-z\s]+(?:Test|Panel|Report|Profile|Analysis|Function|CBC|LFT|KFT))/i);
    const testType = testTypeMatch ? testTypeMatch[1].trim() : "Medical Report";
    
    const patientMatch = content.match(/(?:Patient|Name):\s*([A-Za-z\s\.]+)/i) || 
                         content.match(/([A-Za-z\s\.]+)\s*\(\d+[MF]\)/i);
    const patientName = patientMatch ? patientMatch[1].trim() : "Patient";
    
    const ageGenderMatch = content.match(/\((\d+)([MF])\)/i) || 
                           content.match(/Age:\s*(\d+).*Gender:\s*([MF])/i);
    const ageGender = ageGenderMatch ? `(${ageGenderMatch[1]}${ageGenderMatch[2]})` : "";
    
    // Create report title
    structuredContent = `### **Medical Report Analysis: ${testType} for ${patientName} ${ageGender}**\n\n`;
    
    // Extract abnormal findings
    const lines = content.split('\n');
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Identify sections
      if (line.match(/abnormal|elevated|findings|concerning|key|values|parameters/i) && 
          (line.endsWith(':') || line.startsWith('#'))) {
        currentSection = 'findings';
        continue;
      } else if (line.match(/cause|diagnosis|indication|suggest|differential|conditions/i) && 
                (line.endsWith(':') || line.startsWith('#'))) {
        currentSection = 'causes';
        continue;
      } else if (line.match(/next steps|recommend|follow|action|test|referral|consult/i) && 
                (line.endsWith(':') || line.startsWith('#'))) {
        currentSection = 'steps';
        continue;
      }
      
      // Add content to appropriate section
      if (currentSection === 'findings') {
        // Look for lines with test values that are abnormal
        if ((line.includes(':') || line.match(/^\d+\./)) && 
            (line.toLowerCase().includes('high') || 
             line.toLowerCase().includes('low') || 
             line.toLowerCase().includes('abnormal') || 
             line.includes('⚠️'))) {
          keyFindings.push(line);
        }
      } else if (currentSection === 'causes') {
        if (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('*')) {
          possibleCauses.push(line);
        }
      } else if (currentSection === 'steps') {
        if (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('*')) {
          recommendedSteps.push(line);
        }
      }
    }
    
    // If we couldn't parse structured findings, do a more aggressive extraction
    if (keyFindings.length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for any lines that mention specific tests with abnormal values
        if (line.match(/^\d+\./) || line.startsWith('-') || line.includes(':')) {
          if (line.match(/bilirubin|sgot|sgpt|alt|ast|alp|ggt|liver|kidney|creatinine|wbc|rbc|platelet|hemoglobin/i) &&
              (line.toLowerCase().includes('high') || 
               line.toLowerCase().includes('low') || 
               line.toLowerCase().includes('abnormal') || 
               line.includes('⚠️'))) {
            keyFindings.push(line);
          }
        }
      }
    }
    
    // Format key findings
    if (keyFindings.length > 0) {
      structuredContent += "#### **Key Abnormal Findings:**\n";
      let count = 1;
      
      // Process each finding to improve formatting
      keyFindings.forEach(finding => {
        // Remove bullet points or numbers
        const cleanedFinding = finding.replace(/^\d+\.\s*|-\s*|\*\s*/, '');
        
        // Check if this is already formatted as a header
        if (cleanedFinding.startsWith('**')) {
          structuredContent += `${count}. ${cleanedFinding}\n`;
          count++;
          return;
        }
        
        // Extract test name and value
        const parts = cleanedFinding.split(':');
        if (parts.length >= 2) {
          const testName = parts[0].trim();
          const testValue = parts.slice(1).join(':').trim();
          
          // Format as requested
          structuredContent += `${count}. **${testName}**\n`;
          
          // Try to separate the value from the interpretation
          const valueParts = testValue.match(/([^(]*)(\([^)]*\))(.*)/) || [testValue, testValue, '', ''];
          const value = valueParts[1]?.trim() || testValue;
          const range = valueParts[2]?.trim() || '';
          const interpretation = valueParts[3]?.trim() || '';
          
          // Add the value line
          if (value) {
            structuredContent += `   - **${testName}:** **${value}** ${range}\n`;
          }
          
          // Add interpretation if available
          if (interpretation) {
            structuredContent += `   - **Interpretation:** ${interpretation}\n`;
          } else {
            // Try to generate a basic interpretation
            let autoInterpretation = '';
            if (testName.match(/bilirubin/i)) {
              autoInterpretation = "Suggests possible liver dysfunction or bile duct obstruction.";
            } else if (testName.match(/sgpt|alt/i)) {
              autoInterpretation = "Indicates possible liver cell damage.";
            } else if (testName.match(/sgot|ast/i)) {
              autoInterpretation = "May indicate liver, heart, or muscle damage.";
            } else if (testName.match(/alkaline phosphatase|alp/i)) {
              autoInterpretation = "Could indicate bile duct obstruction or bone disorders.";
            } else if (testName.match(/wbc/i)) {
              autoInterpretation = value.match(/high/i) ? 
                "Suggests possible infection or inflammation." : 
                "May indicate bone marrow suppression or viral infection.";
            } else if (testName.match(/hemoglobin|hb/i)) {
              autoInterpretation = value.match(/low/i) ? 
                "Indicates possible anemia." : 
                "May suggest polycythemia or dehydration.";
            } else if (testName.match(/platelet/i)) {
              autoInterpretation = value.match(/low/i) ? 
                "Risk of bleeding if severely decreased." : 
                "May indicate inflammatory condition or bone marrow disorder.";
            }
            
            if (autoInterpretation) {
              structuredContent += `   - **Interpretation:** ${autoInterpretation}\n`;
            }
          }
          
          // Add a blank line between findings
          structuredContent += '\n';
          count++;
        } else {
          // Unstructured finding
          structuredContent += `${count}. **${cleanedFinding}**\n\n`;
          count++;
        }
      });
    }
    
    // Format possible causes
    if (possibleCauses.length > 0) {
      structuredContent += "\n#### **Possible Causes:**\n";
      let count = 1;
      
      possibleCauses.forEach(cause => {
        // Remove bullet points or numbers
        const cleanedCause = cause.replace(/^\d+\.\s*|-\s*|\*\s*/, '');
        
        // Split into main cause and explanation if possible
        if (cleanedCause.includes(':')) {
          const [mainCause, explanation] = cleanedCause.split(':').map(part => part.trim());
          structuredContent += `${count}. **${mainCause}**\n`;
          if (explanation) {
            structuredContent += `   - ${explanation}\n`;
          }
        } else {
          structuredContent += `${count}. **${cleanedCause}**\n`;
        }
        count++;
      });
      
      structuredContent += '\n';
    }
    
    // Format recommended steps
    if (recommendedSteps.length > 0) {
      structuredContent += "#### **Recommended Next Steps:**\n";
      let count = 1;
      
      recommendedSteps.forEach(step => {
        // Remove bullet points or numbers
        const cleanedStep = step.replace(/^\d+\.\s*|-\s*|\*\s*/, '');
        structuredContent += `${count}. **${cleanedStep}**\n`;
        count++;
      });
      
      structuredContent += '\n';
    }
    
    // Add a summary section
    structuredContent += "---\n\n";
    structuredContent += "### **Summary:**\n";
    
    // Generate a concise summary
    let summary = `This ${testType} shows `;
    
    if (keyFindings.length > 0) {
      const findingTypes = [];
      
      if (keyFindings.some(f => f.match(/bilirubin|jaundice/i))) {
        findingTypes.push("elevated bilirubin");
      }
      if (keyFindings.some(f => f.match(/sgpt|alt|sgot|ast|transaminase/i))) {
        findingTypes.push("liver enzyme abnormalities");
      }
      if (keyFindings.some(f => f.match(/alp|ggt|alkaline phosphatase/i))) {
        findingTypes.push("cholestatic markers");
      }
      if (keyFindings.some(f => f.match(/creatinine|bun|urea/i))) {
        findingTypes.push("renal function changes");
      }
      if (keyFindings.some(f => f.match(/wbc|white/i))) {
        findingTypes.push("white cell count abnormalities");
      }
      if (keyFindings.some(f => f.match(/rbc|red|hemoglobin|hb|hct/i))) {
        findingTypes.push("red blood cell abnormalities");
      }
      if (keyFindings.some(f => f.match(/platelet|plt/i))) {
        findingTypes.push("platelet count changes");
      }
      
      if (findingTypes.length > 0) {
        summary += findingTypes.join(", ") + ". ";
      } else {
        summary += "several abnormal values. ";
      }
      
      // Add possible causes summary
      if (possibleCauses.length > 0) {
        summary += "The most urgent concerns are ";
        
        const causePhrases = possibleCauses.slice(0, 3).map(cause => {
          const cleaned = cause.replace(/^\d+\.\s*|-\s*|\*\s*/, '').split(':')[0];
          return cleaned.toLowerCase().replace(/^\w/, c => c.toUpperCase());
        });
        
        summary += causePhrases.join(", ") + ". ";
      }
      
      // Add recommended next steps
      if (recommendedSteps.length > 0) {
        summary += "Further testing is needed for a definitive diagnosis.";
      }
    } else {
      summary += "some abnormal values that require medical attention. Please consult with a healthcare provider for further evaluation.";
    }
    
    structuredContent += summary + "\n\n";
    structuredContent += "Would you like help interpreting additional details or next steps? *(Note: This is not a substitute for professional medical advice.)*";
    
    // Return the enhanced response
    return {
      role: 'assistant',
      content: structuredContent
    };
  };

  // Update the handleSubmit function to use enhanceMedicalResponse
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      let newMessages: Message[] = [];

      // Add user's message to the chat
      if (input.trim()) {
        // Check if the message contains test results and format it
        const formattedInput = formatTestResults(input.trim());
        
        const userMessage: Message = {
          role: 'user',
          content: formattedInput
        };
        newMessages.push(userMessage);
        setMessages(prev => [...prev, userMessage]);
        
        // Always force scroll to bottom when user sends a message
        forceScrollToBottom();
      }

      // Show typing indicator
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '...'
      }]);
      
      // Force scroll to show typing indicator
      forceScrollToBottom();

      // Get AI response
      const response = await generateChatResponse([...messages, ...newMessages]);
      
      // Enhance the response for medical reports if needed
      const enhancedResponse = enhanceMedicalResponse(response);
      
      // Remove typing indicator and add actual response
      setMessages(prev => [...prev.slice(0, -1), enhancedResponse]);
      
      // Force scroll to show AI response
      forceScrollToBottom();

      // Clear input and file
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setError('Failed to get response. Please try again.');
      // Remove typing indicator if present
      setMessages(prev => prev.filter(msg => msg.content !== '...'));
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I'm having trouble analyzing your report right now. Please try:
1. Checking your internet connection
2. Refreshing the page
3. Sending your message again

If you're sharing a medical report, make sure to include:
- All test values and their reference ranges
- Your current symptoms
- Medical history
- Current medications
- Your location (for doctor recommendations)

Need immediate medical attention? Please contact your healthcare provider directly.`
      }]);
      // Scroll to show error message
      setTimeout(scrollToBottom, 50);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhance the helper function to create better formatted medical reports
  const formatTestResults = (input: string): string => {
    // Check if the input looks like test results
    const hasTestIndications = 
      /test results|lab report|blood test|cbc|complete blood count|analysis|cholesterol|glucose|wbc|rbc|platelets|hemoglobin|hb|triglycerides|hdl|ldl|liver|kidney|function|test|lft|kft|sgot|sgpt|alt|ast|urine|creatinine|bilirubin|alkaline|phosphatase/i.test(input) ||
      /\d+(\.\d+)?\s*(mg\/dl|g\/dl|mmol\/l|µl|ul|fl|pg|%|ng\/ml|u\/l|mmhg|iu\/l)/i.test(input) ||
      /normal\s*range|reference\s*range|normal\s*values/i.test(input);
    
    // If it doesn't look like test results, return as is
    if (!hasTestIndications) return input;

    // Extract patient details (if present)
    let patientName = "";
    let patientAge = "";
    let patientGender = "";
    let testType = "";
    
    // Check for patient info patterns
    const nameMatch = input.match(/(?:patient|name)(?:\s*:|\s+is\s+)?\s*([A-Za-z\s\.]+?)(?:,|\n|$)/i);
    if (nameMatch) patientName = nameMatch[1].trim();
    
    const ageMatch = input.match(/(?:age|years old)(?:\s*:|\s+is\s+)?\s*(\d+)(?:\s*(?:years|yrs|y))?/i);
    if (ageMatch) patientAge = ageMatch[1].trim();
    
    const genderMatch = input.match(/(?:gender|sex)(?:\s*:|\s+is\s+)?\s*(male|female|m|f)/i);
    if (genderMatch) patientGender = genderMatch[1].trim().toUpperCase() === "M" ? "Male" : (genderMatch[1].trim().toUpperCase() === "F" ? "Female" : genderMatch[1].trim());
    
    // Try to determine test type
    if (/liver|function|lft|sgot|sgpt|alt|ast|bilirubin|alkaline phosphatase/i.test(input)) {
      testType = "Liver Function Test (LFT)";
    } else if (/kidney|renal|kft|creatinine|bun|urea|egfr/i.test(input)) {
      testType = "Kidney Function Test (KFT)";
    } else if (/cbc|complete blood count|wbc|rbc|hemoglobin|platelets|hematocrit/i.test(input)) {
      testType = "Complete Blood Count (CBC)";
    } else if (/lipid|cholesterol|triglycerides|hdl|ldl/i.test(input)) {
      testType = "Lipid Profile";
    } else if (/glucose|sugar|hba1c|diabetes/i.test(input)) {
      testType = "Blood Glucose Test";
    } else if (/thyroid|tsh|t3|t4|thyronine/i.test(input)) {
      testType = "Thyroid Function Test";
    } else if (/urine|urinalysis/i.test(input)) {
      testType = "Urine Analysis";
    } else if (/covid|sars|coronavirus/i.test(input)) {
      testType = "COVID-19 Test";
    } else if (/dengue|ns1|igg|igm/i.test(input)) {
      testType = "Dengue Test";
    } else {
      testType = "Medical Report";
    }

    // Create a formatted medical report template
    let formattedInput = "### MEDICAL TEST ANALYSIS REQUEST\n\n";
    
    // Add patient information section if available
    if (patientName || patientAge || patientGender) {
      formattedInput += "## Patient Information\n";
      if (patientName) formattedInput += `- **Name**: ${patientName}\n`;
      if (patientAge) formattedInput += `- **Age**: ${patientAge} years\n`;
      if (patientGender) formattedInput += `- **Gender**: ${patientGender}\n`;
      formattedInput += "\n";
    }
    
    // Add test type header
    formattedInput += `## ${testType} Results\n\n`;
    
    // Process all test values to identify and mark abnormal results
    let abnormalValues = [];
    let normalValues = [];
    
    // Split the input by newlines to process each line
    const lines = input.split('\n');
    
    // Process each line to extract test values and ranges
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip lines that are likely not test values
      if (/patient|name|age|gender|sex|date|doctor|report|test/i.test(line) && !line.includes(':')) {
        continue;
      }
      
      // Process test values with format "Test: Value (Range)"
      if (line.includes(':')) {
        const [testName, testValue] = line.split(':').map(part => part.trim());
        
        // Skip if it doesn't look like a test value
        if (!testValue || testName.length > 50) continue;
        
        // Check if the value has a normal range in parentheses
        if (testValue && testValue.includes('(') && testValue.includes(')')) {
          // Extract the numeric value and range
          const valueBeforeParenthesis = testValue.split('(')[0].trim();
          const numericValueMatch = valueBeforeParenthesis.match(/(\d+\.?\d*)/);
          const numericValue = numericValueMatch ? parseFloat(numericValueMatch[1]) : NaN;
          
          // Try to extract the range values (handles various formats)
          const rangeMatch = testValue.match(/\((.*?)\)/);
          const rangeText = rangeMatch ? rangeMatch[1] : "";
          
          // Check for numeric range (e.g., "0-1.2 mg/dL")
          const numericRangeMatch = rangeText.match(/(\d+\.?\d*)\s*[-–—to]\s*(\d+\.?\d*)/);
          
          if (numericRangeMatch && !isNaN(numericValue)) {
            const minRange = parseFloat(numericRangeMatch[1]);
            const maxRange = parseFloat(numericRangeMatch[2]);
            
            if (numericValue < minRange || numericValue > maxRange) {
              // Abnormal value
              abnormalValues.push({
                name: testName,
                value: valueBeforeParenthesis,
                range: rangeText,
                isLow: numericValue < minRange,
                isHigh: numericValue > maxRange,
                full: line
              });
            } else {
              // Normal value
              normalValues.push({
                name: testName,
                value: valueBeforeParenthesis,
                range: rangeText,
                full: line
              });
            }
          } else if (/high|elevated|low|abnormal|positive|negative|normal/i.test(rangeText)) {
            // Handle textual interpretations (e.g., "Normal: Negative")
            const isAbnormal = /high|elevated|abnormal|positive/i.test(rangeText) && 
                            !/normal/i.test(valueBeforeParenthesis);
            
            if (isAbnormal) {
              abnormalValues.push({
                name: testName,
                value: valueBeforeParenthesis,
                range: rangeText,
                isTextualAbnormal: true,
                full: line
              });
            } else {
              normalValues.push({
                name: testName,
                value: valueBeforeParenthesis,
                range: rangeText,
                full: line
              });
            }
          } else {
            // Can't determine if abnormal, just add as is
            formattedInput += `- ${testName}: ${testValue}\n`;
          }
        } else {
          // No range provided, add as is
          formattedInput += `- ${testName}: ${testValue}\n`;
        }
      } 
      // Process bullet points that might be test values
      else if (line.startsWith('-') || line.startsWith('•')) {
        const content = line.substring(1).trim();
        
        if (content.includes(':')) {
          // Process similar to above but for bulleted items
          const [testName, testValue] = content.split(':').map(part => part.trim());
          
          if (testValue && testValue.includes('(') && testValue.includes(')')) {
            const valueBeforeParenthesis = testValue.split('(')[0].trim();
            const numericValueMatch = valueBeforeParenthesis.match(/(\d+\.?\d*)/);
            const numericValue = numericValueMatch ? parseFloat(numericValueMatch[1]) : NaN;
            
            const rangeMatch = testValue.match(/\((.*?)\)/);
            const rangeText = rangeMatch ? rangeMatch[1] : "";
            
            const numericRangeMatch = rangeText.match(/(\d+\.?\d*)\s*[-–—to]\s*(\d+\.?\d*)/);
            
            if (numericRangeMatch && !isNaN(numericValue)) {
              const minRange = parseFloat(numericRangeMatch[1]);
              const maxRange = parseFloat(numericRangeMatch[2]);
              
              if (numericValue < minRange || numericValue > maxRange) {
                // Abnormal value
                abnormalValues.push({
                  name: testName,
                  value: valueBeforeParenthesis,
                  range: rangeText,
                  isLow: numericValue < minRange,
                  isHigh: numericValue > maxRange,
                  full: content
                });
              } else {
                // Normal value
                normalValues.push({
                  name: testName,
                  value: valueBeforeParenthesis,
                  range: rangeText,
                  full: content
                });
              }
            } else {
              formattedInput += `- ${testName}: ${testValue}\n`;
            }
          } else {
            formattedInput += `- ${testName}: ${testValue}\n`;
          }
        } else {
          // Just a regular bullet point
          formattedInput += `${line}\n`;
        }
      }
      // Handle symptoms section
      else if (line.toLowerCase().startsWith('symptoms:')) {
        formattedInput += `\n## Symptoms\n${line.substring(9).trim()}\n\n`;
      }
      // Other lines
      else if (!/test|report|results|analysis|date|time|lab|hospital/i.test(line)) {
        formattedInput += `${line}\n`;
      }
    }
    
    // Add abnormal values section with proper formatting
    if (abnormalValues.length > 0) {
      formattedInput += "\n## Abnormal Results\n";
      
      // Group abnormal values by system if possible
      abnormalValues.forEach(test => {
        const statusText = test.isLow ? "Low" : (test.isHigh ? "High" : "Abnormal");
        const testDetails = test.range ? `${test.value} (Normal range: ${test.range}, **${statusText}**)` : test.value;
        formattedInput += `- **${test.name}**: ${testDetails} ⚠️\n`;
      });
    }
    
    // Add normal values section
    if (normalValues.length > 0) {
      formattedInput += "\n## Normal Results\n";
      normalValues.forEach(test => {
        formattedInput += `- ${test.name}: ${test.value} (Normal range: ${test.range}) ✓\n`;
      });
    }
    
    // Extract any symptoms mentioned
    const symptomsMatch = input.match(/symptoms?\s*:?\s*(.*?)(?:\n\n|\n(?=[A-Z])|\n?$)/i);
    if (symptomsMatch && symptomsMatch[1] && !formattedInput.includes("## Symptoms")) {
      formattedInput += `\n## Symptoms\n${symptomsMatch[1].trim()}\n`;
    }
    
    // Add instructions for the AI to create a professional medical report
    formattedInput += `\n## Analysis Request\nPlease provide:
1. A complete analysis of these test results
2. Highlight abnormal values and their significance
3. Possible diagnoses based on the pattern of results
4. Recommended next steps and follow-up tests
5. Format as a professional medical report with sections for key findings, interpretation, and recommendations

Please use the following format for the response:
### **Medical Report Analysis: ${testType} for ${patientName || "Patient"}${patientAge ? ` (${patientAge}${patientGender ? patientGender.charAt(0) : ""})` : ""}**

#### **Key Abnormal Findings:**
1. **Abnormal Parameter 1**
   - **Value:** **X mg/dl** (High/Low, normal: A-B mg/dl)
   - **Interpretation:** What this means medically

2. **Abnormal Parameter 2**
   - **Value:** **X U/L** (High/Low, normal: A-B U/L)
   - **Interpretation:** What this means medically

#### **Possible Causes:**
1. **Primary Diagnosis**
   - Supporting evidence and explanation
2. **Differential Diagnosis**
   - Supporting evidence

#### **Recommended Next Steps:**
1. **Additional Tests**
2. **Specialist Consultation**
3. **Lifestyle Recommendations**
`;
    
    return formattedInput;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Add better type validation with feedback
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
      setError(null); // Clear any previous errors

      // Add a user message about the upload first
      const userUploadMessage: Message = {
        role: 'user',
        content: `I've uploaded a medical report: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      };
      
      setMessages(prev => [...prev, userUploadMessage]);
      
      // Force scroll after adding user message
      forceScrollToBottom();

      // Show immediate feedback as assistant response
      const processingMessage: Message = {
        role: 'assistant',
        content: `I'm processing your uploaded medical report (${file.name}). This may take a moment for detailed analysis...`
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Force scroll to show processing message
      forceScrollToBottom();

      // Now process the file with a slight delay to ensure messages appear
      setTimeout(() => {
        handleFileUpload(file);
      }, 500);
      } else {
      setError(`The file ${file.name} is not supported. Please upload only images or PDF files containing medical reports.`);
      }

    // Clear the file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim() && !isLoading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Update the message rendering to format AI responses on display
  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <p className="text-[15px] leading-relaxed">{message.content}</p>;
    }
    return formatAIResponse(message.content as string);
  };

  // Helper function to recommend specialists based on document type
  interface SpecialistRecommendation {
    name: string;
    specialty: string;
    address: string;
    phone: string;
    city: string;
    reason?: string;
  }

  const getSpecialistRecommendations = (fileName: string): SpecialistRecommendation[] => {
    const recommendations: SpecialistRecommendation[] = [];
    
    // Always include a general practitioner as a fallback option
    const generalPractitioner: SpecialistRecommendation = {
      name: "Dr. Rakesh Patil",
      specialty: "General Practitioner",
      address: "Sawata Mali Road, Parab Nagar, Indira Nagar Wadala, Nashik, 422209",
      phone: "+91-4068334455",
      city: "Nashik",
      reason: "For initial consultation and general medical advice"
    };
    
    recommendations.push(generalPractitioner);
    
    // Detect document type from filename and provide targeted recommendations
    const lowerFileName = fileName.toLowerCase();
    
    // Check for lab reports
    if (lowerFileName.includes('lab') || lowerFileName.includes('test') || lowerFileName.includes('blood') || 
        lowerFileName.includes('report') || lowerFileName.includes('result')) {
      
      // Endocrinologist for hormone-related tests
      recommendations.push({
        name: "Dr. Sujit Arun Chandratreya",
        specialty: "Endocrinologist",
        address: "Endocare Clinic, Mohiniraj Building, Gangapur Road, Near Vidya Vikas Circle, Shreerang Nagar, Nashik, 422013",
        phone: "+91-253-257-2805",
        city: "Nashik",
        reason: "For hormone and metabolic test interpretation"
      });
    }
    
    // Add cardiologist for heart-related documents
    if (lowerFileName.includes('heart') || lowerFileName.includes('cardiac') || lowerFileName.includes('ecg')) {
      recommendations.push({
        name: "Dr. Ashutosh Sahu",
        specialty: "Cardiologist",
        address: "Ashoka Medicover Hospitals, Sawata Mali Rd, Parab Nagar, Nashik, Maharashtra 422209",
        phone: "+91-4068334455",
        city: "Nashik",
        reason: "For heart-related evaluations"
      });
    }
    
    return recommendations.slice(0, 2);
  };

  // Helper function to format specialist recommendations as a string for chat messages
  const formatSpecialistRecommendations = (recommendations: SpecialistRecommendation[]): string => {
    if (recommendations.length === 0) return '';
    
    let result = '### 👨‍⚕️ Recommended Specialists\n\n';
    result += 'While I couldn\'t process your document, based on the document type, these specialists might be able to help:\n\n';
    
    recommendations.forEach((doc, index) => {
      // Add emoji based on specialty
      let specialtyEmoji = '👨‍⚕️';
      if (doc.specialty.toLowerCase().includes('general')) specialtyEmoji = '🩺';
      if (doc.specialty.toLowerCase().includes('cardio')) specialtyEmoji = '❤️';
      if (doc.specialty.toLowerCase().includes('endo')) specialtyEmoji = '🧪';
      if (doc.specialty.toLowerCase().includes('neuro')) specialtyEmoji = '🧠';
      if (doc.specialty.toLowerCase().includes('psychia')) specialtyEmoji = '🧠';
      if (doc.specialty.toLowerCase().includes('radio')) specialtyEmoji = '📷';
      if (doc.specialty.toLowerCase().includes('derma')) specialtyEmoji = '🔬';
      if (doc.specialty.toLowerCase().includes('gastro')) specialtyEmoji = '🔬';
      if (doc.specialty.toLowerCase().includes('pulmo')) specialtyEmoji = '🫁';
      if (doc.specialty.toLowerCase().includes('ortho')) specialtyEmoji = '🦴';
      if (doc.specialty.toLowerCase().includes('pedia')) specialtyEmoji = '👶';
      if (doc.specialty.toLowerCase().includes('nephro')) specialtyEmoji = '🧪';
      
      result += `### ${specialtyEmoji} ${doc.name}\n`;
      result += `**Specialty:** ${doc.specialty}\n`;
      result += `**Address:** ${doc.address}\n`;
      result += `**Phone:** ${doc.phone}\n`;
      result += `**City:** ${doc.city}\n`;
      
      if (doc.reason) {
        result += `\n*${doc.reason}*\n`;
      }
      
      if (index < recommendations.length - 1) {
        result += '\n---\n\n';
      }
    });
    
    result += '\n\nNote: These recommendations are based on limited information. For the most accurate guidance, please share specific details about your health concerns.';
    
    return result;
  };

  // Update the error handling in handleFileUpload to provide more user-friendly guidance
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);

    try {
      // Status update function
      const updateStatus = (status: string) => {
        // Remove the initial processing message
        setMessages((prevMessages: Message[]) => {
          // Find the last assistant message if it's a processing one
          const lastAssistantIndex = [...prevMessages].reverse()
            .findIndex(m => m.role === 'assistant' && m.content.includes('processing'));
          
          if (lastAssistantIndex >= 0) {
            const newMessages = [...prevMessages];
            const actualIndex = prevMessages.length - 1 - lastAssistantIndex;
            newMessages[actualIndex] = {
              role: 'assistant',
              content: `${status}`
            };
            return newMessages;
          }
          
          // If no processing message found, add a new status
          return [...prevMessages, {
            role: 'assistant',
            content: `${status}`
          }];
        });

        // Force scroll to keep status updates visible
        forceScrollToBottom();
      };

      updateStatus('Extracting text from your medical report...');

      let text = '';
      try {
        console.log('Starting text extraction from file:', file.name, file.type);
        
        // First try standard extraction
        text = await extractTextFromFile(file);
        console.log('Initial text extraction result length:', text.length);
        
        // If text is too short, it might be a complex document
        if (text.trim().length < 100) {
          updateStatus('Initial processing yielded limited results. Trying enhanced medical document processing...');
          console.log('Text too short, trying enhanced extraction');
          
          // Try enhanced extraction for complex medical documents
          text = await enhancedMedicalDocExtraction(file, updateStatus);
        }
      } catch (extractionError) {
        console.error('Standard extraction failed, trying enhanced method:', extractionError);
        updateStatus('Standard processing failed. Switching to enhanced medical document processing...');
        
        try {
          // Try enhanced approach
          text = await enhancedMedicalDocExtraction(file, updateStatus);
        } catch (enhancedError) {
          console.error('Enhanced extraction failed:', enhancedError);
          throw enhancedError;
        }
      }

      // Check if extraction was successful
      if (text.trim().length < 20) {
        throw new Error('No readable text found in the document. This may be a scanned document that requires specialized OCR processing.');
      }

      console.log('Successfully extracted text from document, length:', text.length);
      updateStatus('Successfully extracted text from your medical report. Analyzing content...');

      // Get specialist recommendations if any
      const specialistRecommendations = getSpecialistRecommendations(file.name);
      
      // Format the extracted text for processing
      const formattedContent = `### Uploaded Medical Report: ${file.name}\n\n${text}`;

      // Generate AI response for the extracted content
      try {
        const aiResponse = await generateChatResponse([...messages.filter(m => 
          // Filter out processing status messages
          !(m.role === 'assistant' && 
            (m.content.includes('processing') || 
             m.content.includes('Extracting text') || 
             m.content.includes('enhanced medical document')))
        ), {
          role: 'user',
          content: formattedContent
        }]);
        
        // Replace the status message with the AI analysis
        setMessages((prevMessages: Message[]) => {
          // Filter out all processing messages
          const filteredMessages = prevMessages.filter(m => 
            !(m.role === 'assistant' && 
              (m.content.includes('processing') || 
               m.content.includes('Extracting text') || 
               m.content.includes('enhanced medical document')))
          );
          
          // Add the AI response
          return [...filteredMessages, aiResponse];
        });
        
        setIsLoading(false);
        setSelectedFile(null);
        
        // Force scroll to bottom after receiving AI response
        forceScrollToBottom();
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        setError('Failed to analyze the document. Please try again or enter your question manually.');
        
        // Remove processing messages
        setMessages((prevMessages: Message[]) => 
          prevMessages.filter(m => 
            !(m.role === 'assistant' && 
              (m.content.includes('processing') || 
               m.content.includes('Extracting text') || 
               m.content.includes('enhanced medical document')))
          )
        );
      }
    } catch (error) {
      console.error('File upload error:', error);
      setIsLoading(false);
      
      // Create a helpful error message with interactive guidance
      const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
      
      // Interactive response that guides the user to input their results manually
      const manualEntryGuidance = `
I couldn't process your medical report file successfully. This is common with certain scanned documents and image formats.

### 🔍 How to Get Your Report Analyzed:

Instead of uploading, please type your test values directly in the chat using this format:

\`\`\`
Test: CBC Report
- WBC: 15,000/μL (Normal: 4,000–11,000)
- Platelets: 90,000/μL (Normal: 150,000–450,000)
- Hemoglobin: 13.5 g/dL (Normal: 13-17)

Symptoms: Fever for 3 days, fatigue, headache
\`\`\`

Would you like me to help with any specific tests or values from your report?
`;
      
      // Update the messages to remove processing status and add helpful guidance
      setMessages((prevMessages: Message[]) => {
        // Remove processing messages
        const filteredMessages = prevMessages.filter(m => 
          !(m.role === 'assistant' && 
            (m.content.includes('processing') || 
             m.content.includes('Extracting text') || 
             m.content.includes('enhanced medical document')))
        );
        
        // Add interactive guidance message
        return [...filteredMessages, {
          role: 'assistant',
          content: manualEntryGuidance
        }];
      });
      
      // Add helpful examples as follow-up after a short delay
      setTimeout(() => {
        const examplesMessage = {
          role: 'assistant' as const,
          content: `
### 📋 Example Format for Different Tests:

**For Blood Tests:**
\`\`\`
Blood Test Results:
- Glucose: 110 mg/dL (Normal: 70-99)
- Cholesterol: 220 mg/dL (Normal: <200)
\`\`\`

**For Urine Tests:**
\`\`\`
Urine Analysis:
- Color: Yellow (Normal: Pale to dark yellow)
- pH: 6.0 (Normal: 4.5-8.0)
- Protein: Negative (Normal: Negative)
\`\`\`

**For COVID/Dengue Tests:**
\`\`\`
COVID-19 Test:
- RT-PCR: Negative
- IgG Antibody: Positive (>1.4 AU/mL)
\`\`\`

You can type your values now, and I'll analyze them right away!
`
        };
        
        setMessages(prev => [...prev, examplesMessage]);
        forceScrollToBottom();
      }, 1000);
      
      setSelectedFile(null);
    }
  };

  // Add function to fetch patient data by ID
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setIsLoading(true);
        const patientRef = doc(db, 'patients', patientId);
        const patientSnap = await getDoc(patientRef);
        
        if (patientSnap.exists()) {
          const data = patientSnap.data();
          console.log('Fetched patient data:', data);
          
          // Store complete patient details
          setPatientDetails(data);
          
          // Create PatientInfo object for the existing code to use
          const patientInfoData: PatientInfo = {
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            age: data.age ? data.age.toString() : '',
            gender: data.gender || '',
            country: data.address?.country || '',
            weight: data.weight ? data.weight.toString() : '',
            ethnicity: data.ethnicity || '',
            medicalHistory: Array.isArray(data.medicalHistory) 
              ? data.medicalHistory 
              : data.medicalHistory ? [data.medicalHistory] : [],
            currentMedications: Array.isArray(data.medications) 
              ? data.medications 
              : data.medications ? [data.medications] : []
          };
          
          setPatientInfo(patientInfoData);
        } else {
          console.error('Patient not found');
          setError('Patient information not found');
        }
      } catch (err) {
        console.error('Error fetching patient info:', err);
        setError('Error loading patient information');
      } finally {
        setIsLoading(false);
      }
    };
    
    // If we have a patientId but no patientInfo, fetch the data
    if (patientId && !patientInfo) {
      fetchPatientData();
    }
  }, [patientId, patientInfo]);

  // Function to extract topic from AI response
  const extractTopic = (content: string): string | null => {
    const topicMatch = content.match(/# Current Topic: (.*?)(\n|$)/);
    return topicMatch ? topicMatch[1].trim() : null;
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    if (!patientInfo) {
      // Only redirect if there's no patientId being used to fetch patient info
      if (!patientId) {
        navigate('/form');
      }
      return;
    }

    // If we have restored messages, use them instead of the initial greeting
    if (restoredMessages && restoredMessages.length > 0) {
      setMessages(restoredMessages);
    } else {
      // Set initial greeting for new chats
      setMessages([{
        role: 'assistant',
        content: `👋 Hello ${patientInfo.name}! I'm AiDoc, your smart AI doctor assistant. I'm here to help you with any health-related concerns you may have! 🏥\n\nHow are you feeling today? 😊`
      }]);
    }
  }, [patientInfo, restoredMessages, navigate, patientId]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Left side - Logo and Title */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AIDoc</h1>
                </div>
              </div>
            </div>

            {/* Center - Status indicator */}
            <div className="hidden md:flex items-center space-x-1 bg-blue-50 py-1.5 px-3 rounded-full">
              <div className={`h-2 w-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-xs font-medium text-gray-600">
                {isLoading ? "AI Processing..." : "Ready to assist"}
              </span>
            </div>

            {/* Right side - User controls */}
            <div className="flex items-center space-x-2">
              <Link
                to="/history"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                title="View chat history"
              >
                <History className="h-5 w-5" />
              </Link>
              
                <button
                  onClick={handleSignOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                title="Sign out"
                >
                <LogOut className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Using flex-1 to take all available space */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full">
          {/* Left Sidebar - Patient Info */}
          <div className="lg:col-span-1 space-y-4 hidden lg:block">
            {/* Patient Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <h2 className="text-white font-semibold flex items-center mb-3">
                  <User className="h-4 w-4 mr-2 opacity-75" />
                Patient Information
              </h2>
                
                {patientInfo ? (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                      <User className="h-6 w-6 text-blue-600" />
                </div>
                    <div>
                      <h3 className="font-medium text-white">{patientInfo.name}</h3>
                      <p className="text-blue-100 text-xs">{patientInfo.gender}, {patientInfo.age} years</p>
                </div>
                </div>
                ) : (
                  <div className="flex items-center py-2">
                    <Loader2 className="h-6 w-6 text-white animate-spin mr-2" />
                    <p className="text-blue-100">Loading...</p>
                </div>
                )}
              </div>
              
              {patientInfo && (
                <div className="p-4 space-y-3">
                  {patientDetails?.patientId && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Patient ID</span>
                      <span className="font-medium text-gray-900 font-mono bg-gray-100 py-1 px-2 rounded">{patientDetails.patientId}</span>
                    </div>
                  )}
                  
                  {patientDetails?.contactNumber && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Contact</span>
                      <span className="font-medium text-gray-900">{patientDetails.contactNumber}</span>
                    </div>
                  )}
                  
                  {patientInfo?.country && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium text-gray-900">{patientInfo.country}</span>
                    </div>
                  )}
                  
                  {patientId && (
                    <button
                      onClick={() => navigate(`/patient/${patientId}`)}
                      className="w-full mt-2 px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                      View Full Profile
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Download Options */}
            <DownloadOptions
              chatTranscript={analyses.transcript || ''}
              medicalSummary={analyses.summary || ''}
              analysisResults={analyses.analysis || ''}
              patientInfo={patientInfo ? {
                name: patientInfo.name,
                age: patientInfo.age,
                gender: patientInfo.gender,
                country: patientInfo.country
              } : undefined}
            />

            {/* Quick Report Generation Button */}
            {messages.length > 0 && patientInfo && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Medical Report</h3>
                    <p className="text-xs text-gray-600">Generate comprehensive report</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Clean and format the report content
                    const userMessages = messages
                      .filter(m => m.role === 'user')
                      .map(m => m.content)
                      .join('\n\n');
                    
                    const aiMessages = messages
                      .filter(m => m.role === 'assistant')
                      .map(m => m.content)
                      .join('\n\n');
                    
                    const reportContent = `
CONSULTATION SUMMARY

Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

CHIEF COMPLAINT AND SYMPTOMS

${userMessages}

MEDICAL ASSESSMENT AND RECOMMENDATIONS

${aiMessages}

FOLLOW-UP INSTRUCTIONS

• Follow all prescribed medications as directed
• Monitor symptoms and report any changes
• Schedule follow-up appointment as recommended
• Maintain healthy lifestyle and diet
• Contact healthcare provider if symptoms worsen

DISCLAIMER

This report is generated based on AI-assisted consultation. For accurate diagnosis and treatment, please consult with a licensed healthcare professional in person.
                    `.trim();
                    
                    generateMedicalReport({
                      hospital: hospital ? {
                        name: hospital.name,
                        address: hospital.address,
                        city: hospital.city,
                        state: hospital.state,
                        phone: hospital.phone,
                        email: hospital.email
                      } : undefined,
                      patient: {
                        name: patientInfo.name,
                        age: patientInfo.age,
                        gender: patientInfo.gender,
                        country: patientInfo.country
                      },
                      reportType: 'Medical Consultation Report',
                      content: reportContent,
                      doctorName: 'AI Medical Assistant',
                      doctorSpecialty: 'General Medicine'
                    }, `Medical_Report_${patientInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Full Report</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Professional PDF with hospital letterhead
                </p>
              </div>
            )}

            {/* Session Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-3">Session Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Messages</span>
                  <span className="text-gray-900">{messages.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              {/* Mobile view patient info */}
              {patientInfo && (
                <div className="lg:hidden flex items-center p-3 border-b border-gray-100 bg-gray-50">
                  <User className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">{patientInfo.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{patientInfo.gender}, {patientInfo.age} years</span>
                </div>
              )}
              
              {/* Chat Messages */}
              <div 
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-50"
                id="chat-messages-container"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 #EDF2F7',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
                onClick={(e) => {
                  setIsUserScrolling(true);
                  setTimeout(() => setIsUserScrolling(false), 5000);
                }}
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={message.role === 'assistant' ? { opacity: 0, y: 10 } : { opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[85%] ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 rounded-tl-none'
                        }`}
                      >
                          {message.content === '...' ? (
                            <TypingIndicator />
                          ) : (
                          <div className={message.role === 'user' ? 'text-white' : 'text-gray-700'}>
                              {renderMessageContent(message)}
                          </div>
                          )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* File upload indicator */}
              {selectedFile && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-3 bg-white">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-full pl-3 pr-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-500 border border-gray-200">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                      placeholder="Type your message here..."
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800"
                        disabled={isLoading}
                      />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 ${isLoading ? 'text-gray-400' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'} rounded-full transition-colors`}
                      title="Attach file"
                      disabled={isLoading}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                    
                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedFile) || isLoading}
                      className={`p-2 rounded-full ${
                        isLoading || (!input.trim() && !selectedFile)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                          <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
                      </div>
                    </div>
              </div>
        </div>
      </div>
      
      {/* Custom copyright component inside the app instead of a separate footer */}
      <div className="w-full bg-white border-t border-gray-100 mt-auto py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500">© 2023 AIDoc. All rights reserved.</p>
            
            <div className="flex space-x-6 text-xs">
              <Link to="/privacy" className="text-gray-500 hover:text-blue-600">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-500 hover:text-blue-600">Terms of Service</Link>
              <a href="mailto:support@aidoc.com" className="text-gray-500 hover:text-blue-600">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

