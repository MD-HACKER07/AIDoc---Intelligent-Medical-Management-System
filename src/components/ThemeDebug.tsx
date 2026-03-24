import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

export const ThemeDebug = () => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    console.log('ThemeDebug mounted, current theme:', theme);
  }, [theme]);

  return (
    <div className="fixed top-20 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
      <div className="space-y-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
          <p className="text-blue-900 dark:text-blue-100">Current Theme: {theme}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
}; 