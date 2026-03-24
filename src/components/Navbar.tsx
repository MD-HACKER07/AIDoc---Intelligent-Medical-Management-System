import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useHospital } from '../context/HospitalContext';
import { 
  Sun, Moon, Menu, X, User, Settings, LogOut, Home, 
  MessageSquare, Users, FilePlus, Bell, ChevronDown, Shield, FileText,
  Search, HelpCircle, BookOpen, Sparkles, UserRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  // Hooks setup - moved to the top to ensure they're always called
  const { user, signOut } = useAuth();
  const { hospital } = useHospital();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State variables
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navbarLoaded, setNavbarLoaded] = useState(false);
  
  // Refs for click outside handlers
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Check if navbar should be hidden (for duplicate prevention)
  // But keep hooks execution consistent by NOT returning early
  const isDuplicateRoute = ['/'].includes(location.pathname);
  const shouldHideNavbar = isDuplicateRoute && document.querySelectorAll('nav').length > 1;
  
  // Theme
  const isLightMode = theme === 'light';
  
  // Toggle handlers
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  // Close all dropdowns/menus
  const closeMenus = () => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  // Example notification data
  const notifications = [
    {
      id: 1,
      title: 'New feature available',
      message: 'Try our new AI consultation tools',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'System update',
      message: 'We\'ve improved performance',
      time: '1 day ago',
      read: true
    }
  ];

  // Check for scroll position to add shadow/background to navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Wait for DOM to fully load before checking for duplicates
    setNavbarLoaded(true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check for clicks outside dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      closeMenus();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Active link styling
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Enhanced navigation items for pre-login
  const preLoginNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/features', label: 'Features', icon: Sparkles },
    { path: '/pricing', label: 'Pricing', icon: Shield },
    { path: '/about', label: 'About', icon: Users },
    { path: '/contact', label: 'Contact', icon: MessageSquare },
  ];

  // Enhanced navigation items for post-login
  const postLoginNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/patients', label: 'Patients', icon: Users },
    { path: '/reception', label: 'Reception', icon: UserRound },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Return null when duplicate, but AFTER all hooks have been called
  if (shouldHideNavbar && navbarLoaded) {
    return null;
  }

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 shadow-md' : 'bg-transparent dark:bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group" 
              onClick={closeMenus}
            >
              <motion.div 
                className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                AI<span className="text-blue-600 dark:text-blue-400">Doc</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 ml-8">
              {(user ? postLoginNavItems : preLoginNavItems).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3 py-2 rounded-md transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                    }`}
                    onClick={closeMenus}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </span>
                    {isActive(item.path) && (
                      <motion.span
                        className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                        layoutId="navbar-indicator"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right Side - Action Items */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Only show for logged-in users */}
            {user && (
              <div className="hidden md:block relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            )}
            
            {/* Theme Toggle */}
            <motion.button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isLightMode 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {isLightMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button>
            
            {/* Authenticated User Actions */}
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Help Center */}
                <Link
                  to="/help"
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  <HelpCircle className="h-5 w-5" />
                </Link>

                {/* Documentation */}
                <Link
                  to="/docs"
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <motion.button
                    onClick={toggleNotifications}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      showNotifications 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </motion.button>
                  
                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-20"
                      >
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                  notification.read ? 'opacity-70' : ''
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className={`flex-shrink-0 h-2 w-2 mt-1.5 rounded-full ${
                                    notification.read ? 'bg-gray-400 dark:bg-gray-600' : 'bg-blue-600 dark:bg-blue-400'
                                  }`}></div>
                                  <div className="ml-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                              <p>No notifications</p>
                            </div>
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                          <button 
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() => navigate('/settings?tab=notifications')}
                          >
                            Manage notifications
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* User Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <motion.button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-1 group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
                      <User className="h-5 w-5" />
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`} />
                  </motion.button>
                  
                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                      >
                        {/* User Info */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          {hospital && (
                            <>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {hospital.name || 'Your Hospital'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {hospital.email || user.email}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/hospital-profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={closeMenus}
                          >
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Hospital Profile
                            </span>
                          </Link>
                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={closeMenus}
                          >
                            <span className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Settings
                            </span>
                          </Link>
                        </div>
                        
                        {/* Sign Out Button */}
                        <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                          >
                            <span className="flex items-center gap-2">
                              <LogOut className="h-4 w-4" />
                              Sign out
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                onClick={toggleMenu}
                className={`p-2 rounded-md transition-colors ${
                  isMenuOpen 
                    ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              {/* ... existing mobile menu content ... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 