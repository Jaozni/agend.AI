import { Calendar, LayoutDashboard, Settings, StickyNote } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Toast from './Toast';
import { useStore } from '../store/useStore';
import { translations } from '../utils/translations';

const Layout = ({ children }) => {
    const { settings } = useStore();
    const lang = settings?.language || 'pt';
    const t = translations[lang];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Toast />
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom transition-colors duration-300">
                <div className="flex justify-around items-center h-16">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <Calendar size={24} />
                        <span className="text-xs font-medium">{t.nav.agenda}</span>
                    </NavLink>

                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <LayoutDashboard size={24} />
                        <span className="text-xs font-medium">{t.nav.dashboard}</span>
                    </NavLink>

                    <NavLink
                        to="/notes"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <StickyNote size={24} />
                        <span className="text-xs font-medium">{t.nav.notes}</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <Settings size={24} />
                        <span className="text-xs font-medium">{t.nav.settings}</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default Layout;
