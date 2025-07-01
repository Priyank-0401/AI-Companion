import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AuthInput = ({
  type = 'text',
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  showPasswordToggle = false,
  onTogglePassword,
  ...props
}) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`relative rounded-lg transition-all duration-200 ${
          isFocused 
            ? 'ring-2 ring-indigo-500/50' 
            : isDark 
              ? 'ring-1 ring-gray-700' 
              : 'ring-1 ring-gray-300'
        } ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}
      >
        {Icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isFocused ? 'text-indigo-500' : isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-${showPasswordToggle ? '10' : '4'} 
            rounded-lg border-0 focus:ring-0 text-sm ${
              isDark 
                ? 'bg-transparent text-white placeholder-gray-500' 
                : 'text-gray-900 placeholder-gray-400'
            }`}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 focus:outline-none"
            tabIndex="-1"
          >
            {type === 'password' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
