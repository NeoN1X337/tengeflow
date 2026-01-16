import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 5000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
            icon: CheckCircle,
            border: 'border-green-700'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500 to-rose-600',
            icon: XCircle,
            border: 'border-red-700'
        },
        warning: {
            bg: 'bg-gradient-to-r from-yellow-500 to-amber-600',
            icon: AlertCircle,
            border: 'border-yellow-700'
        }
    };

    const config = styles[type] || styles.success;
    const Icon = config.icon;

    return (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-md md:w-auto w-auto animate-slide-in-right">
            <div className={`${config.bg} ${config.border} border-2 md:border-4 rounded-lg shadow-2xl p-3 md:p-4`}>
                <div className="flex items-start gap-2 md:gap-3">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0 mt-0.5 drop-shadow-lg" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm md:text-base leading-snug drop-shadow-sm break-words">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-1"
                        aria-label="Закрыть"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
