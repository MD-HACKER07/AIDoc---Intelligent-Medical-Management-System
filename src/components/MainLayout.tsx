import React, { ReactNode, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Database, AlertTriangle } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  withPadding?: boolean;
  withFooter?: boolean;
  withNavbar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  withPadding = true,
  withFooter = true,
  withNavbar = true
}) => {
  const location = useLocation();
  const { databaseType, quotaExceeded } = useDatabase();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {withNavbar && <Navbar />}
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.3 }}
          className={`flex-grow ${withPadding ? 'pt-6 pb-8 px-4 sm:px-6 lg:px-8' : ''}`}
        >
          <div className="max-w-7xl mx-auto w-full">
            {/* Database Indicator - Only show when quota exceeded */}
            {quotaExceeded && (
              <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>
                  Firebase quota exceeded. Currently using <span className="font-medium">{databaseType === 'mysql' ? 'MySQL Database' : 'Firebase with limitations'}</span>.
                </span>
              </div>
            )}
            
            {children}
          </div>
        </motion.main>
      </AnimatePresence>
      
      {withFooter && (
        <Footer>
          {/* Database indicator */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-4">
            <Database className="h-3 w-3" />
            <span>DB: {databaseType === 'auto' 
              ? 'Auto' 
              : databaseType === 'firebase' 
                ? 'Firebase' 
                : 'MySQL'}
            </span>
            {quotaExceeded && (
              <span className="text-amber-500 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                Quota Exceeded
              </span>
            )}
          </div>
        </Footer>
      )}
    </div>
  );
};

export default MainLayout; 