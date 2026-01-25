import { X, Plus, Clock, DollarSign, Calendar as CalendarIcon, Edit2, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getTerms } from '../utils/textAdapters';
import { translations } from '../utils/translations';

const DayDetailsModal = ({ isOpen, onClose, date, shifts = [], events = [], routineData, onDelete }) => {
    const { userType, settings } = useStore();
    const lang = settings?.language || 'pt';
    const t = translations[lang];
    const terms = getTerms(userType, lang);
    const dateLocale = lang === 'en' ? enUS : ptBR;

    if (!isOpen) return null;

    const currencyFormatter = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'BRL'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto transform transition-transform duration-300 max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                            {format(date, "EEEE, d 'of' MMMM", { locale: dateLocale }).replace('of', lang === 'pt' ? 'de' : 'of')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {shifts.length} {terms.mainItemPlural.toLowerCase()} • {events.length} {lang === 'en' ? 'events' : 'eventos'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors dark:hover:bg-gray-800 dark:text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">

                    {/* Rotina Fixa (Se houver) */}
                    {routineData && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                        {terms.fixedRoutine}
                                        <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                            {lang === 'en' ? 'Auto' : 'Fixo'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        {routineData.details}
                                    </p>
                                </div>
                                {routineData.value > 0 && (
                                    <span className="font-bold text-blue-700 dark:text-blue-300 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg text-sm">
                                        {currencyFormatter.format(routineData.value)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lista de Itens */}
                    <div className="space-y-3">
                        {/* Shifts */}
                        {shifts.map(shift => (
                            <div
                                key={shift.id}
                                className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{terms.mainItem}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{format(new Date(shift.start), 'HH:mm')} - {format(new Date(shift.end), 'HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(shift.value > 0 || userType !== 'professor') && (
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {currencyFormatter.format(shift.value || 0)}
                                            </span>
                                        )}
                                        {/* Botão de Exclusão */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(shift.id, 'shift'); }}
                                            className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                                            title={lang === 'en' ? 'Delete' : 'Excluir'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Events */}
                        {events.map(event => (
                            <div
                                key={event.id}
                                className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{event.title}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{event.time || (lang === 'en' ? 'All day' : 'Dia todo')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(event.id, 'event'); }}
                                        className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                                        title={lang === 'en' ? 'Delete' : 'Excluir'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {!routineData && shifts.length === 0 && events.length === 0 && (
                        <div className="text-center py-12 flex flex-col items-center text-gray-400 dark:text-gray-500">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
                                <CalendarIcon size={32} />
                            </div>
                            <p className="text-sm font-medium">{t.calendar.empty_day}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;
