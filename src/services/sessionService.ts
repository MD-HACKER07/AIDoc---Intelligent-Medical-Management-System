import { auth } from '../config/firebase';

interface SessionInfo {
  startTime: number;
  expiryTime: number;
  isActive: boolean;
}

class SessionService {
  private static SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private static SESSION_KEY = 'user_session';

  static initSession(): void {
    const currentTime = Date.now();
    const sessionInfo: SessionInfo = {
      startTime: currentTime,
      expiryTime: currentTime + this.SESSION_DURATION,
      isActive: true
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionInfo));
  }

  static getSessionInfo(): SessionInfo | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  }

  static isSessionValid(): boolean {
    const sessionInfo = this.getSessionInfo();
    if (!sessionInfo) return false;
    return sessionInfo.isActive && Date.now() < sessionInfo.expiryTime;
  }

  static getTimeRemaining(): number {
    const sessionInfo = this.getSessionInfo();
    if (!sessionInfo) return 0;
    return Math.max(0, sessionInfo.expiryTime - Date.now());
  }

  static endSession(): void {
    const sessionInfo = this.getSessionInfo();
    if (sessionInfo) {
      sessionInfo.isActive = false;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionInfo));
    }
  }

  static formatTimeRemaining(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default SessionService;
