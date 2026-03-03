import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: Props) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-secondary-900 text-white px-4 py-3 rounded-xl shadow-xl animate-fade-in max-w-sm">
      <div className="flex-shrink-0 w-7 h-7 bg-success-500 rounded-full flex items-center justify-center">
        <CheckCircle2 className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 text-secondary-400 hover:text-white transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
