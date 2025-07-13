'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system theme';
      case 'system':
        return `System theme (${actualTheme}) - Switch to light mode`;
      default:
        return 'Toggle theme';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        ${actualTheme === 'dark' 
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-gray-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }
        group
      `}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      <div className="text-xl transition-transform duration-300 group-hover:rotate-12">
        {getIcon()}
      </div>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-2 py-1 text-xs rounded-md whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none z-50
        ${actualTheme === 'dark' 
          ? 'bg-gray-800 text-white border border-gray-700' 
          : 'bg-gray-900 text-white'
        }
      `}>
        {getTooltip()}
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2
          border-4 border-transparent
          ${actualTheme === 'dark' 
            ? 'border-t-gray-800' 
            : 'border-t-gray-900'
          }
        `} />
      </div>
    </button>
  );
}
