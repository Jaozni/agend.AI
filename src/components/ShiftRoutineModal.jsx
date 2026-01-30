import { useState, useEffect } from 'react';
import { X, Clock, CalendarCheck, DollarSign, RotateCw, CalendarDays, Pencil } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { parseLocalDate } from '../utils/calculations';

const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

const ShiftRoutineModal = ({ isOpen, onClose }) => {
    const { shiftRoutine, updateShiftRoutine, rotatingRoutine, updateRotatingRoutine, settings } = useStore();
    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'rotating'

    // Estado Semanal
    const [localRoutine, setLocalRoutine] = useState(shiftRoutine || {});

    // Estado Rotativo
    const [localRotating, setLocalRotating] = useState(rotatingRoutine || {
        active: false,
        type: '12x36',
        customCycle: 5, // Default para custom
        startDate: new Date().toISOString().split('T')[0],
        startTime: '07:00',
        endTime: '19:00',
        value: 0
    });

    // Sincronizar ao abrir
    useEffect(() => {
        if (isOpen) {
            setLocalRoutine(shiftRoutine || {});
            setLocalRotating(rotatingRoutine || {
                active: false,
                type: '12x36',
                startDate: new Date().toISOString().split('T')[0],
                startTime: '07:00',
                endTime: '19:00',
                value: 0
            });
            // Determinar aba ativa baseado em quem está ativo
            if (rotatingRoutine?.active) setActiveTab('rotating');
            else if (Object.values(shiftRoutine || {}).some(d => d.active)) setActiveTab('weekly');
        }
    }, [isOpen, shiftRoutine, rotatingRoutine]);


    // Handlers Semanal
    const getDayData = (key) => localRoutine[key] || { active: false, start: '07:00', end: '19:00', value: 0 };

    const handleToggleWeekly = (key) => {
        const current = getDayData(key);
        setLocalRoutine(prev => ({
            ...prev,
            [key]: { ...current, active: !current.active }
        }));
    };

    const handleChangeWeekly = (key, field, value) => {
        const current = getDayData(key);
        setLocalRoutine(prev => ({
            ...prev,
            [key]: {
                ...current,
                [field]: value // Armazena como string para permitir edição livre (ex: "10.", "")
            }
        }));
    };

    // Handlers Rotativo
    const handleChangeRotating = (field, value) => {
        let updatedValue = value;

        // Se for data, garantir que não volta o dia (seta meio dia)
        if (field === 'startDate' && value) {
            // value vem do input como "YYYY-MM-DD"
            // Força meio dia para evitar UTC timezone shift (-3h etc)
            // Se salvar apenas "YYYY-MM-DD", o new Date() assume UTC 00:00 (dia anterior de noite no Brasil)
            // Adicionar hora explícita
            updatedValue = value; // Mantém string original para o input
        }

        setLocalRotating(prev => ({
            ...prev,
            [field]: updatedValue // Armazena como string para permitir edição livre
        }));
    };

    const handleSave = () => {
        // Parsear valores para number antes de salvar
        const parseRoutineValues = (routine) => {
            const parsed = { ...routine };
            Object.keys(parsed).forEach(k => {
                if (parsed[k]) {
                    parsed[k].value = parseFloat(parsed[k].value) || 0;
                }
            });
            return parsed;
        };

        const parsedRotating = {
            ...localRotating,
            value: parseFloat(localRotating.value) || 0
        };

        if (activeTab === 'weekly') {
            // Salvar semanal e desativar rotativo
            const parsedWeekly = parseRoutineValues(localRoutine);
            updateShiftRoutine(parsedWeekly);
            updateRotatingRoutine({ ...parsedRotating, active: false });
        } else {
            // Salvar rotativo e desativar todos da semanal
            const disabledWeekly = { ...localRoutine };
            Object.keys(disabledWeekly).forEach(k => {
                if (disabledWeekly[k]) disabledWeekly[k].active = false;
            });
            // Também garante float aqui
            const parsedWeeklyDisabled = parseRoutineValues(disabledWeekly);

            updateShiftRoutine(parsedWeeklyDisabled);
            updateRotatingRoutine({ ...parsedRotating, active: true });
        }
        onClose();
    };



    // Estimativa de escalas no mês atual
    const calculateEstimatedShifts = () => {
        if (!localRotating.startDate) return 0;
        const start = parseLocalDate(localRotating.startDate);
        const today = new Date();
        const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        let count = 0;

        // Ciclo em dias
        let cycle = 2; // 12x36 default
        if (localRotating.type === '12x60') cycle = 3;
        if (localRotating.type === '24x48') cycle = 3;
        if (localRotating.type === '24x72') cycle = 4;
        if (localRotating.type === 'custom') cycle = parseInt(localRotating.customCycle) || 5;

        // Itera dia a dia do MÊS ATUAL para ser preciso
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        for (let d = startOfMonth; d <= endMonth; d.setDate(d.getDate() + 1)) {
            const diffDays = differenceInCalendarDays(d, start);
            if (diffDays >= 0 && diffDays % cycle === 0) {
                count++;
            }
        }
        return count;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-200 flex flex-col max-h-[90vh]">

                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <CalendarCheck size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            Configurar Escala
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex-shrink-0">
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                            ${activeTab === 'weekly' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('weekly')}
                    >
                        <CalendarDays size={16} />
                        Semanal (Fixa)
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                            ${activeTab === 'rotating' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('rotating')}
                    >
                        <RotateCw size={16} />
                        Por Escala (Ciclo)
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2 mb-4">

                    {/* Conteúdo Semanal */}
                    {activeTab === 'weekly' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Selecione os dias da semana que você trabalha fixo.
                            </p>
                            {days.map((day) => {
                                const data = getDayData(day.key);
                                return (
                                    <div
                                        key={day.key}
                                        className={`p-4 rounded-xl border transition-all duration-200 ${data.active
                                            ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-75'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`
                                                    w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300
                                                    ${data.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                                                `} onClick={() => handleToggleWeekly(day.key)}>
                                                    <div className={`
                                                        w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300
                                                        ${data.active ? 'translate-x-4' : 'translate-x-0'}
                                                    `} />
                                                </div>
                                                <span className={`text-sm font-semibold ${data.active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>
                                                    {day.label}
                                                </span>
                                            </div>
                                        </div>

                                        {data.active && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Início</label>
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                                        <input
                                                            type="time"
                                                            value={data.start}
                                                            onChange={(e) => handleChangeWeekly(day.key, 'start', e.target.value)}
                                                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Fim</label>
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                                        <input
                                                            type="time"
                                                            value={data.end}
                                                            onChange={(e) => handleChangeWeekly(day.key, 'end', e.target.value)}
                                                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Valor</label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={data.value || ''}
                                                            onChange={(e) => handleChangeWeekly(day.key, 'value', e.target.value)}
                                                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 dark:text-white"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Conteúdo Rotativo */}
                    {activeTab === 'rotating' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Configure sua escala rotativa. O sistema calculará automaticamente seus dias de trabalho.
                            </p>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 space-y-4">

                                {/* Tipo de Escala */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Escala</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['12x36', '12x60', '24x48', '24x72'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleChangeRotating('type', type)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all
                                                    ${localRotating.type === type
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                        {/* Botão Personalizado */}
                                        <button
                                            onClick={() => handleChangeRotating('type', 'custom')}
                                            className={`col-span-2 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
                                                ${localRotating.type === 'custom'
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-[1.02]'
                                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                                        >
                                            <Pencil size={14} /> Personalizada
                                        </button>
                                    </div>

                                    {/* Input de Ciclo Personalizado */}
                                    {localRotating.type === 'custom' && (
                                        <div className="mt-3 animate-in slide-in-from-top-2">
                                            <label className="block text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                                Repetir a cada quantos dias?
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={localRotating.customCycle || ''}
                                                    onChange={(e) => handleChangeRotating('customCycle', e.target.value)}
                                                    className="w-full p-2 border border-purple-200 dark:border-purple-800 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-white"
                                                    placeholder="Ex: 5"
                                                />
                                                <span className="text-sm text-gray-500">dias</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Ex: Se trabalha 1 e folga 4, o ciclo é de 5 dias.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Data de Início */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data de Referência (Início)</label>
                                    <input
                                        type="date"
                                        value={localRotating.startDate ? localRotating.startDate.split('T')[0] : ''}
                                        onChange={(e) => handleChangeRotating('startDate', e.target.value)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Escolha um dia que você trabalhou/trabalhará para servir de base.</p>
                                </div>

                                {/* Horários e Valor */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Início</label>
                                        <input
                                            type="time"
                                            value={localRotating.startTime}
                                            onChange={(e) => handleChangeRotating('startTime', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Fim</label>
                                        <input
                                            type="time"
                                            value={localRotating.endTime}
                                            onChange={(e) => handleChangeRotating('endTime', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Valor</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={localRotating.value || ''}
                                            onChange={(e) => handleChangeRotating('value', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* Resumo */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimativa neste mês</span>
                                    <div className="text-xs text-gray-400">Baseado na data de início</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-gray-800 dark:text-white block">~{calculateEstimatedShifts()} plantões</span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        className={`w-full py-3 font-semibold rounded-xl shadow-lg transition-all active:scale-95 text-white
                            ${activeTab === 'weekly'
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-green-900/20'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/20'}`}
                    >
                        Salvar Escala
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ShiftRoutineModal;
