import { createContext, useState, useContext, ReactNode } from 'react';

interface User {
	email: string;
	name?: string;
}

interface SiteContextType {
	user: User | null;
	setUser: (user: User | null) => void;
	isLoggedIn: boolean;
	setIsLoggedIn: (value: boolean) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				return JSON.parse(storedUser);
			} catch {
				localStorage.removeItem('user');
				return null;
			}
		}
		return null;
	});
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
		return !!localStorage.getItem('user');
	});

	return (
		<SiteContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn }}>
			{children}
		</SiteContext.Provider>
	);
}

export function useSite() {
	const context = useContext(SiteContext);
	if (context === undefined) {
		throw new Error('useSite must be used within a SiteProvider');
	}
	return context;
}

export default SiteContext;