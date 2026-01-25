import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { getTerms } from '../utils/textAdapters';
import { translations } from '../utils/translations';

const EventModal = ({ isOpen, onClose, initialDate, initialData }) => {
    const [activeTab, setActiveTab] = useState('shift'); // 'shift' or 'event'
    const { addShift, updateShift, removeShift, addEvent, updateEvent, removeEvent, userType, settings } = useStore();

    const lang = settings?.language || 'pt';
    const terms = getTerms(userType || 'plantonista', lang);
    const t = translations[lang];

    // Estados do Formulário
    const [startTime, setStartTime] = useState('07:00');
    const [endTime, setEndTime] = useState('19:00');
    const [value, setValue] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Preencher dados se for edição
    useEffect(() => {
        if (initialData) {
            if (initialData.value !== undefined) {
                // É um Item Principal (Plantão/Aula)
                setActiveTab('shift');
                setStartTime(format(new Date(initialData.start), 'HH:mm'));
                setEndTime(format(new Date(initialData.end), 'HH:mm'));
                setValue(initialData.value);
            } else {
                // É um Evento Pessoal
                setActiveTab('event');
                setTitle(initialData.title);
                setDescription(initialData.description || '');
                if (initialData.time) setStartTime(initialData.time);
            }
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validação Manual
        if (activeTab === 'shift') {
            if (!startTime || !endTime) {
                alert(lang === 'pt' ? 'Preencha os horários.' : 'Please fill in the times.');
                return;
            }
            // Valor pode ser opcional dependendo do caso, mas mantendo a lógica original por enquanto
            // Para 'professor' às vezes valor é opcional, mas vamos deixar validação leve
            if (value === '' && userType === 'plantonista') {
                // Plantonista geralmente precisa de valor, mas vamos permitir 0
            }
        } else {
            if (!title) {
                alert(lang === 'pt' ? 'Preencha o título.' : 'Please fill in the title.');
                return;
            }
        }

        try {
            // Data Base (InitialDate ou data do item existente)
            const baseDate = initialData
                ? new Date(initialData.start || initialData.date)
                : new Date(initialDate);

            if (activeTab === 'shift') {
                const startDateTime = new Date(baseDate);
                const [startH, startM] = startTime.split(':');
                startDateTime.setHours(startH, startM);

                const endDateTime = new Date(baseDate);
                const [endH, endM] = endTime.split(':');
                endDateTime.setHours(endH, endM);

                // Se terminar no dia seguinte (ex: 22h as 06h)? Lógica simples por enquanto
                if (endDateTime < startDateTime) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }

                const shiftData = {
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString(),
                    value: parseFloat(value) || 0,
                    type: 'regular',
                    userProfile: userType // Salva em qual perfil foi criado
                };

                if (initialData) {
                    updateShift(initialData.id, shiftData);
                } else {
                    addShift(shiftData);
                }
            } else {
                const eventDate = new Date(baseDate); // Mantém a data original

                const eventData = {
                    date: eventDate.toISOString(),
                    title,
                    description,
                    time: startTime
                };

                if (initialData) {
                    updateEvent(initialData.id, eventData);
                } else {
                    addEvent(eventData);
                }
            }

            onClose();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert((lang === 'pt' ? 'Ocorreu um erro ao salvar: ' : 'Error saving: ') + error.message);
        }
    };

    const handleDelete = () => {
        if (!initialData) return;
        const confirmMsg = lang === 'pt' ? 'Tem certeza que deseja excluir?' : 'Are you sure you want to delete?';
        if (confirm(confirmMsg)) {
            if (activeTab === 'shift') {
                removeShift(initialData.id);
            } else {
                removeEvent(initialData.id);
            }
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-y-auto transform scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            {initialData
                                ? (lang === 'pt' ? 'Editar Item' : 'Edit Item')
                                : (lang === 'pt' ? 'Novo Item' : 'New Item')}
                        </h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs (Apenas se criando novo) */}
                    {!initialData && (
                        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'shift' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setActiveTab('shift')}
                            >
                                {terms.mainItem}
                            </button>
                            <button
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'event' ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => setActiveTab('event')}
                            >
                                {lang === 'en' ? 'Personal Event' : 'Evento Pessoal'}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {format(initialData ? new Date(initialData.start || initialData.date) : initialDate, 'dd/MM/yyyy')}
                        </div>

                        {activeTab === 'shift' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'pt' ? 'Início' : 'Start'}</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white dark:[color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'pt' ? 'Fim' : 'End'}</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white dark:[color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{terms.valueLabel}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="Ex: 1200.00"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'pt' ? 'Título' : 'Title'}</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={lang === 'pt' ? 'Ex: Aniversário, Jantar...' : 'Ex: Birthday, Dinner...'}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-transparent dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'pt' ? 'Horário (Opcional)' : 'Time (Optional)'}</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-transparent dark:text-white dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{lang === 'pt' ? 'Descrição' : 'Description'}</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-transparent dark:text-white"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-2 pt-2">
                            {initialData && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex-none p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    title={lang === 'pt' ? 'Excluir' : 'Delete'}
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}

                            <button
                                type="submit"
                                className={`flex-1 py-3 rounded-xl font-semibold text-white shadow-lg transition-transform active:opacity-90
                ${activeTab === 'shift'
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/20'
                                        : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-purple-900/20'}`}
                            >
                                {initialData ? (lang === 'pt' ? 'Atualizar' : 'Update') : (lang === 'pt' ? 'Salvar' : 'Save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
