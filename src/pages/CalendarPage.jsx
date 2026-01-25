import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import { useStore } from '../store/useStore';
import EventModal from '../components/EventModal';
import DayDetailsModal from '../components/DayDetailsModal';
import { getTerms } from '../utils/textAdapters';
import { translations } from '../utils/translations';

const CalendarPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Modal de Detalhes
    const [editingItem, setEditingItem] = useState(null);
    const { shifts, events, userName, userType, settings, weeklyRoutine, shiftRoutine } = useStore();

    const lang = settings?.language || 'pt';
    const terms = getTerms(userType, lang);
    const dateLocale = lang === 'en' ? enUS : ptBR;

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsDetailsOpen(true);
    };

    const handleOpenModal = (data = null) => {
        // Se estiver vindo do detalhes, fecha o detalhes temporariamente (ou mantém por baixo? melhor fechar para focar no form)
        // Mas o usuário pode querer voltar. Vamos fechar detalhes e abrir form.
        setIsDetailsOpen(false);
        setEditingItem(data);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        // Reabre detalhes após salvar/fechar? Pode ser útil.
        setIsDetailsOpen(true);
    };

    // Preparar dados do dia selecionado para passar pro Modal de Detalhes
    const dayShifts = shifts.filter(s =>
        new Date(s.start).toDateString() === selectedDate.toDateString() &&
        (s.userProfile || 'plantonista') === userType
    );

    const dayEvents = events.filter(e =>
        new Date(e.date).toDateString() === selectedDate.toDateString()
    );

    // Preparar dados de rotina fixa
    let routineData = null;
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[selectedDate.getDay()];

    if (settings?.routineEnabled) {
        if (userType === 'professor' && weeklyRoutine && weeklyRoutine[dayKey] > 0) {
            routineData = {
                details: `${weeklyRoutine[dayKey]}h ${lang === 'en' ? 'Reserved' : 'Reservadas'}`,
                value: 0
            };
        } else if (userType === 'plantonista' && shiftRoutine && shiftRoutine[dayKey]?.active) {
            const s = shiftRoutine[dayKey];
            routineData = {
                details: `${s.start} - ${s.end}`,
                value: s.value
            };
        }
    }

    const handleDeleteItem = (id, type) => {
        // Remover confirmação nativa que pode estar bloqueada/bugada no mobile
        // Vamos apagar direto e mostrar um Toast (feedback melhor)
        if (type === 'shift') {
            useStore.getState().removeShift(id);
            useStore.getState().showToast(lang === 'pt' ? 'Plantão removido' : 'Shift removed', 'success');
        } else {
            useStore.getState().removeEvent(id);
            useStore.getState().showToast(lang === 'pt' ? 'Evento removido' : 'Event removed', 'success');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <header className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 flex justify-between items-center transition-colors duration-300">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{lang === 'en' ? `Hello, ${userName || 'User'} 👋` : `Olá, ${userName || 'Usuário'} 👋`}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'en' ? `Organize your ${terms.mainItemPlural.toLowerCase()} and events` : `Organize ${terms.mainItemPlural.toLowerCase()} e eventos`}</p>
                </div>
            </header>

            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                <CalendarView
                    shifts={shifts.filter(s => (s.userProfile || 'plantonista') === userType)}
                    events={events}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                />

                <div className="mt-4 flex items-center justify-between px-2">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 capitalize">
                        {format(selectedDate, "EEEE, d 'of' MMMM", { locale: dateLocale }).replace('of', lang === 'pt' ? 'de' : 'of')}
                    </h3>
                    <button
                        onClick={() => handleOpenModal()}
                        className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 dark:border-blue-800/30"
                    >
                        <Plus size={16} className="mr-1" /> {terms.addMain}
                    </button>
                </div>

                <div className="mt-2 text-center text-gray-400 text-xs">
                    {lang === 'en' ? 'Tap a day (or the button above) to manage items' : 'Toque no dia (ou no botão acima) para gerenciar'}
                </div>
            </div>

            {/* Modal de Detalhes do Dia */}
            <DayDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                date={selectedDate}
                shifts={dayShifts}
                events={dayEvents}
                routineData={routineData}
                onDelete={handleDeleteItem}
            />

            {/* Modal de Criar/Editar Evento */}
            {isModalOpen && (
                <EventModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialDate={selectedDate}
                    initialData={editingItem}
                />
            )}
        </div>
    );
};

export default CalendarPage;
