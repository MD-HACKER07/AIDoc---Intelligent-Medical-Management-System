import type { Message, PatientInfo } from '../types';

export interface Analysis {
  id: string;
  chatId: string;
  userId: string;
  type: 'analysis' | 'summary' | 'transcript';
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  patientInfo: PatientInfo;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  analysisIds: string[];
}

export interface ChatSessionInput {
  userId: string;
  patientInfo: PatientInfo;
  messages: Message[];
  analysisIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to generate unique IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const chatService = {
  // Save new chat session
  async saveChatSession(userId: string, patientInfo: PatientInfo, messages: Message[]) {
    try {
      const chatSession: ChatSessionInput = {
        userId,
        patientInfo,
        messages,
        analysisIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Get existing sessions from localStorage
      const existingSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      
      // Create new session with ID
      const newSession = {
        ...chatSession,
        id: generateId()
      };
      
      // Add to existing sessions
      existingSessions.push(newSession);
      
      // Save back to localStorage
      localStorage.setItem('chatSessions', JSON.stringify(existingSessions));
      
      return newSession.id;
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw new Error('Failed to save chat session. Please try again.');
    }
  },

  // Get chat history for a user
  async getChatHistory(userId: string): Promise<ChatSession[]> {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      return sessions
        .filter((session: ChatSession) => session.userId === userId)
        .sort((a: ChatSession, b: ChatSession) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw new Error('Failed to load chat history. Please try again.');
    }
  },

  // Get a single chat session
  async getChatSession(chatId: string): Promise<ChatSession | null> {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const session = sessions.find((s: ChatSession) => s.id === chatId);
      return session || null;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to load chat session. Please try again.');
    }
  },

  // Update existing chat session
  async updateChatSession(chatId: string, messages: Message[]) {
    try {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const sessionIndex = sessions.findIndex((s: ChatSession) => s.id === chatId);
      
      if (sessionIndex === -1) {
        throw new Error('Chat session not found');
      }
      
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        messages,
        updatedAt: new Date()
      };
      
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error updating chat session:', error);
      throw new Error('Failed to update chat. Please try again.');
    }
  },

  // Save analysis document
  async saveAnalysis(userId: string, chatId: string, type: 'analysis' | 'summary' | 'transcript', content: string) {
    try {
      const analysis = {
        id: generateId(),
        chatId,
        userId,
        type,
        content,
        createdAt: new Date()
      };
      
      // Get existing analyses from localStorage
      const existingAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      
      // Add new analysis
      existingAnalyses.push(analysis);
      
      // Save back to localStorage
      localStorage.setItem('analyses', JSON.stringify(existingAnalyses));
      
      // Update chat session with analysis ID
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const sessionIndex = sessions.findIndex((s: ChatSession) => s.id === chatId);
      
      if (sessionIndex !== -1) {
        sessions[sessionIndex].analysisIds.push(analysis.id);
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
      }
      
      return analysis.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw new Error('Failed to save analysis. Please try again.');
    }
  },

  // Get all analyses for a chat session
  async getChatAnalyses(chatId: string): Promise<Analysis[]> {
    try {
      const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      return analyses
        .filter((analysis: Analysis) => analysis.chatId === chatId)
        .sort((a: Analysis, b: Analysis) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting analyses:', error);
      throw new Error('Failed to load analyses. Please try again.');
    }
  },

  // Get latest analysis of each type for a chat
  async getLatestAnalyses(chatId: string): Promise<Record<string, Analysis>> {
    try {
      const analyses = await this.getChatAnalyses(chatId);
      const latest: Record<string, Analysis> = {};
      
      analyses.forEach(analysis => {
        if (!latest[analysis.type] || analysis.createdAt > latest[analysis.type].createdAt) {
          latest[analysis.type] = analysis;
        }
      });
      
      return latest;
    } catch (error) {
      console.error('Error getting latest analyses:', error);
      throw new Error('Failed to load latest analyses. Please try again.');
    }
  },

  // Subscribe to real-time chat updates (simulated with localStorage)
  subscribeToChat(chatId: string, callback: (session: ChatSession) => void) {
    // Since we're using localStorage, we'll simulate real-time updates
    // by checking localStorage periodically
    const interval = setInterval(() => {
      const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const session = sessions.find((s: ChatSession) => s.id === chatId);
      if (session) {
        callback(session);
      }
    }, 1000); // Check every second
    
    // Return cleanup function
    return () => clearInterval(interval);
  }
};