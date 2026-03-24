export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: any;
  role?: string;
  attachments?: string[];
}

export interface Chat {
  id: string;
  patientId: string;
  createdAt: any;
  updatedAt: any;
  messages: Message[];
  title?: string;
  summary?: string;
  status?: 'active' | 'archived' | 'completed';
} 