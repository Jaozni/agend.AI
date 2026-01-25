import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';

const Toast = () => {
    const { toast, hideToast } = useStore();

    useEffect(() => {
        if (toast?.isVisible) {
            const timer = setTimeout(() => {
                hideToast();
            }, 4000); // 4 segundos
            return () => clearTimeout(timer);
        }
    }, [toast?.isVisible, hideToast]);

    if (!toast || !toast.isVisible) return null;

    const icons = {
        info: <Info size={20} className="text-blue-500" />,
        success: <CheckCircle size={20} className="text-green-500" />,
        warning: <AlertCircle size={20} className="text-yellow-500" />,
        error: <AlertCircle size={20} className="text-red-500" />
    };

    const bgColors = {
        info: 'bg-white border-blue-100',
        success: 'bg-white border-green-100',
        warning: 'bg-white border-yellow-100',
        error: 'bg-white border-red-100'
    };

    return (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-fade-in-down pointer-events-none">
            <div className={`
                ${bgColors[toast.type] || bgColors.info}
                pointer-events-auto
                flex items-center p-4 rounded-xl shadow-lg border-2 max-w-sm w-full
                transform transition-all duration-300 ease-in-out
                dark:bg-gray-800 dark:border-gray-700
            `}>
                <div className="mr-3">
                    {icons[toast.type] || icons.info}
                </div>
                <div className="flex-1 mr-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {toast.message}
                    </p>
                </div>
                <button
                    onClick={hideToast}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
