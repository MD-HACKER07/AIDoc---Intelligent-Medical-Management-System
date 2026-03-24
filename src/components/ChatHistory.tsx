import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { chatService, ChatSession } from '../services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function ChatHistory() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChatHistory = async () => {
      if (auth.currentUser) {
        try {
          const history = await chatService.getChatHistory(auth.currentUser.uid);
          setChatSessions(history);
        } catch (error) {
          console.error('Error loading chat history:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadChatHistory();
  }, []);

  const handleSessionClick = (session: ChatSession) => {
    navigate('/chat', { 
      state: { 
        patientInfo: session.patientInfo, 
        messages: session.messages,
        chatId: session.id 
      }
    });
  };

  const getFormattedDate = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Chat History</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {chatSessions.map((session) => (
            <div 
              key={session.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSessionClick(session)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{session.patientInfo.name}</h3>
                  <p className="text-sm text-gray-600">
                    {session.messages[session.messages.length - 1]?.content.substring(0, 100) || 'No messages'}...
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {getFormattedDate(session.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <div className="text-center text-gray-500">
              No chat history available
            </div>
          )}
        </div>
      )}
    </div>
  );
}