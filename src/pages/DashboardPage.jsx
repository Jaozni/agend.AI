import { startOfMonth, endOfMonth, isWithinInterval, differenceInMinutes, format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { DollarSign, Clock, TrendingUp, CalendarDays, Settings } from 'lucide-react';
import { getTerms } from '../utils/textAdapters';
import { translations } from '../utils/translations';
import MentalLoadWidget from '../components/MentalLoadWidget';
import RoutineModal from '../components/RoutineModal';
import ShiftRoutineModal from '../components/ShiftRoutineModal';
import { useState } from 'react';

const DashboardPage = () => {
    const { shifts, userType, settings } = useStore();
    const lang = settings?.language || 'pt';
    const t = translations[lang];
    const terms = getTerms(userType, lang);
    const dateLocale = lang === 'en' ? enUS : ptBR;

    const [isRoutineOpen, setIsRoutineOpen] = useState(false);
    const [isShiftRoutineOpen, setIsShiftRoutineOpen] = useState(false);


    // Mês Atual (Poderia ser estado para navegação futura)
    const currentMonthDate = new Date();

    // Filtrar plantões do mês e do perfil atual
    const monthlyShifts = shifts.filter(s => {
        // Compatibilidade: Se não tiver userProfile, assume 'plantonista'
        const shiftProfile = s.userProfile || 'plantonista';
        const isProfileMatch = shiftProfile === userType;

        return isProfileMatch && isWithinInterval(new Date(s.start), {
            start: startOfMonth(currentMonthDate),
            end: endOfMonth(currentMonthDate)
        });
    });

    // Cálculos
    const totalEarnings = monthlyShifts.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);

    const totalMinutes = monthlyShifts.reduce((acc, s) => {
        return acc + differenceInMinutes(new Date(s.end), new Date(s.start));
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const currencyFormatter = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'BRL' // Mantendo BRL por enquanto como moeda base
    });

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <header className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 transition-colors duration-300">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t.dashboard.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.dashboard.summary} <span className="capitalize">{format(currentMonthDate, 'MMMM', { locale: dateLocale })}</span>
                </p>
            </header>

            <div className="flex-1 p-4 space-y-4 pb-20">

                {/* Card Principal - Ganhos */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                    <div className="flex items-center space-x-2 mb-2 opacity-90">
                        <DollarSign size={20} />
                        <span className="text-sm font-medium">{terms.earningsMain}</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">
                        {currencyFormatter.format(totalEarnings)}
                    </div>
                    <div className="text-xs bg-white/20 inline-block px-2 py-1 rounded-full">
                        {monthlyShifts.length} {terms.mainItemPlural.toLowerCase()} {lang === 'pt' ? 'este mês' : 'this month'}
                    </div>
                </div>

                {/* Ações Específicas de Professor */}
                {userType === 'professor' && settings?.routineEnabled && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsRoutineOpen(true)}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Settings size={14} />
                            {t.dashboard.configure_routine}
                        </button>
                    </div>
                )}

                {/* Ações Específicas de Plantonista */}
                {userType === 'plantonista' && settings?.routineEnabled && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsShiftRoutineOpen(true)}
                            className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <CalendarDays size={14} />
                            {t.dashboard.configure_shift}
                        </button>
                    </div>
                )}

                {/* Widget Carga Mental (Aparece para todos, mas brilha com rotina) */}
                <MentalLoadWidget />

                {/* Grid de Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                            <Clock size={16} />
                            <span className="text-xs font-medium">{t.dashboard.hours}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">
                            {totalHours}h {remainingMinutes > 0 && `${remainingMinutes}m`}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                            <TrendingUp size={16} />
                            <span className="text-xs font-medium">{t.dashboard.average}/{terms.mainItem}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">
                            {monthlyShifts.length > 0
                                ? currencyFormatter.format(totalEarnings / monthlyShifts.length)
                                : 'R$ 0'}
                        </div>
                    </div>
                </div>

                {/* Lista Recente (Resumo) */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 px-1">{terms.monthlyMain}</h3>
                    <div className="space-y-2">
                        {monthlyShifts.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm">
                                {terms.emptyState}
                            </div>
                        ) : (
                            monthlyShifts
                                .sort((a, b) => new Date(a.start) - new Date(b.start))
                                .map(shift => (
                                    <div key={shift.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                                <CalendarDays size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                    {format(new Date(shift.start), "dd/MM/yyyy")}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {format(new Date(shift.start), 'HH:mm')} - {format(new Date(shift.end), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Só mostra valor se tiver valor > 0 ou se não for professor (para não mostrar R$ 0,00 feio se for aula sem custo) */}
                                        {(shift.value > 0 || userType !== 'professor') && (
                                            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                                                R$ {shift.value}
                                            </span>
                                        )}
                                    </div>
                                ))
                        )}
                    </div>
                </div>


                <RoutineModal
                    isOpen={isRoutineOpen}
                    onClose={() => setIsRoutineOpen(false)}
                />
                <ShiftRoutineModal
                    isOpen={isShiftRoutineOpen}
                    onClose={() => setIsShiftRoutineOpen(false)}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
