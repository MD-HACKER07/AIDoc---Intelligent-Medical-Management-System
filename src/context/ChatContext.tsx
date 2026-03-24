import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatMessage {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp: number;
}

interface ChatContextType {
	messages: ChatMessage[];
	addMessage: (text: string, sender: 'user' | 'ai') => void;
	clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);

	useEffect(() => {
		const savedMessages = localStorage.getItem('chatHistory');
		if (savedMessages) {
			try {
				setMessages(JSON.parse(savedMessages));
			} catch {
				localStorage.removeItem('chatHistory');
			}
		}
	}, []);

	useEffect(() => {
		if (messages.length > 0) {
			localStorage.setItem('chatHistory', JSON.stringify(messages));
		}
	}, [messages]);

	const addMessage = (text: string, sender: 'user' | 'ai') => {
		const newMessage: ChatMessage = {
			id: Date.now().toString(),
			text,
			sender,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, newMessage]);
	};

	const clearMessages = () => {
		setMessages([]);
		localStorage.removeItem('chatHistory');
	};

	return (
		<ChatContext.Provider value={{ messages, addMessage, clearMessages }}>
			{children}
		</ChatContext.Provider>
	);
}

export function useChat() {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error('useChat must be used within a ChatProvider');
	}
	return context;
}


