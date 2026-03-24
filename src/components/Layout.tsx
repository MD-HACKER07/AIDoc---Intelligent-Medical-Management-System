import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { Stethoscope, Shield, Clock, Home, FileText, MessageSquare } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SessionExpiry from './SessionExpiry';

interface LayoutProps {
  children: ReactNode;
  withPadding?: boolean;
  withFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  withPadding = true,
  withFooter = true 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/form', label: 'Upload Report', icon: FileText },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  const handleSessionRenewal = () => {
    // Navigate to form page directly
    navigate('/form');
  };

  // Only show session expiry component for authenticated routes
  const showSessionExpiry = !['/login', '/signup', '/', '/about'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className={`flex-grow ${withPadding ? 'pt-6 pb-8 px-4 sm:px-6 lg:px-8' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Link to="/" className="flex items-center space-x-2">
                      <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AiDoc</h1>
                    </Link>
                  </div>
                  
                  {/* Navigation Menu */}
                  <nav className="flex items-center space-x-6">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                            isActive(item.path)
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                    <div className="flex items-center text-gray-600">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span>HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span>24/7 Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            <div className="flex-1 flex flex-col overflow-hidden">
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                {children}
                {showSessionExpiry && <SessionExpiry onRenew={handleSessionRenewal} />}
              </main>
            </div>
          </div>
        </motion.div>
      </main>
      
      {withFooter && <Footer />}
    </div>
  );
};

export default Layout;