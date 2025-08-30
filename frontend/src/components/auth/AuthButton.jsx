import { motion } from 'framer-motion';

const AuthButton = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md';
  
  const variants = {
    primary: {
      base: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      disabled: 'bg-blue-400 cursor-not-allowed',
    },
    secondary: {
      base: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 border border-gray-200',
      disabled: 'bg-gray-100 cursor-not-allowed opacity-50',
    },
    outline: {
      base: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    ghost: {
      base: 'text-blue-600 hover:bg-blue-50',
      disabled: 'opacity-50 cursor-not-allowed',
    },
  };

  const variantStyles = variants[variant] || variants.primary;
  const buttonStyles = `${baseStyles} ${variantStyles.base} ${disabled || isLoading ? variantStyles.disabled : ''} ${className}`;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonStyles}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AuthButton;
