import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionService from '../services/sessionService';

interface SessionExpiryProps {
  onRenew: () => void;
}

const SessionExpiry = ({ onRenew }: SessionExpiryProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      if (!SessionService.isSessionValid()) {
        setShowPopup(true);
        return;
      }

      const remaining = SessionService.getTimeRemaining();
      setTimeRemaining(SessionService.formatTimeRemaining(remaining));

      // Show popup when 2 minutes remaining
      if (remaining <= 120000 && remaining > 0) {
        setShowPopup(true);
      }
    };

    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    SessionService.endSession();
    navigate('/login');
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {SessionService.isSessionValid() 
            ? 'Session Expiring Soon!'
            : 'Session Expired'}
        </h2>
        
        {SessionService.isSessionValid() ? (
          <>
            <p className="text-gray-600 mb-6">
              Your session will expire in {timeRemaining}. Would you like to extend your session?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
              <button
                onClick={onRenew}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Renew Session
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Your session has expired. Please renew your session to continue using our services.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
              <button
                onClick={onRenew}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Renew Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionExpiry;
