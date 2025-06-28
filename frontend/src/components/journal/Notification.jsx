import { CheckCircle, X, XCircle } from 'lucide-react';

export const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  const { message, type } = notification;
  const isSuccess = type === 'success';

  return (
    <div 
      className={`fixed top-6 right-6 z-50 p-4 pr-10 rounded-lg shadow-lg max-w-sm transition-all transform ${
        isSuccess 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-white hover:text-white/80 focus:outline-none"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
