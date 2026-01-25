import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTerms } from '../utils/textAdapters';

const CalendarView = ({ shifts = [], events = [], onDateSelect, selectedDate }) => {
    const { userType, weeklyRoutine, shiftRoutine, settings } = useStore();
    const lang = settings?.language || 'pt';
    const terms = getTerms(userType, lang);
    const dateLocale = lang === 'en' ? enUS : ptBR;
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Dias da semana dinâmicos
    const weekDays = lang === 'en'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const routineKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Função para verificar se tem itens no dia
    const getDayItems = (day) => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start), day));
        const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));

        let routineHours = 0;
        let routineShift = null;

        // Verifica se a rotina está ativada PARA O TIPO ATUAL (default true se não existir)
        const isRoutineEnabled = settings?.[`routineEnabled_${userType}`] !== false;

        if (isRoutineEnabled) {
            // Escala Semanal (Dias Fixos)
            const dayKey = routineKeys[day.getDay()];

            // Prioridade 1: Professor (Semanal)
            if (userType === 'professor' && weeklyRoutine) {
                routineHours = weeklyRoutine[dayKey] || 0;
            }
            // Prioridade 2: Plantonista
            else if (userType === 'plantonista') {
                const { shiftRoutine, rotatingRoutine } = useStore.getState();

                // 2a. Escala Rotativa (Se ativa)
                if (rotatingRoutine?.active && rotatingRoutine.startDate) {
                    const start = new Date(rotatingRoutine.startDate);
                    // Normalizar datas para evitar problemas de hora
                    start.setHours(0, 0, 0, 0);
                    const current = new Date(day);
                    current.setHours(0, 0, 0, 0);

                    const diffTime = current.getTime() - start.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0) {
                        let cycle = 2; // Default 12x36 (2 dias)
                        if (rotatingRoutine.type === '12x60') cycle = 3;
                        if (rotatingRoutine.type === '24x48') cycle = 3;
                        if (rotatingRoutine.type === '24x72') cycle = 4;
                        if (rotatingRoutine.type === 'custom') cycle = parseInt(rotatingRoutine.customCycle) || 5;

                        if (diffDays % cycle === 0) {
                            routineShift = {
                                start: rotatingRoutine.startTime,
                                end: rotatingRoutine.endTime,
                                value: rotatingRoutine.value,
                                isRotating: true
                            };
                        }
                    }
                }
                // 2b. Escala Semanal (Se rotativa não ativa)
                else if (shiftRoutine) {
                    const shift = shiftRoutine[dayKey];
                    if (shift && shift.active) {
                        routineShift = shift;
                    }
                }
            }
        }

        return { shifts: dayShifts, events: dayEvents, routineHours, routineShift };
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <button onClick={onPrevMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-600">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                </h2>
                <button onClick={onNextMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-600">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-gray-400 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grade de Dias */}
            <div className="grid grid-cols-7 divide-x divide-gray-100 divide-y">
                {calendarDays.map((day, idx) => {
                    const { shifts: dayShifts, events: dayEvents, routineHours, routineShift } = getDayItems(day);
                    const hasShifts = dayShifts.length > 0;
                    const hasEvents = dayEvents.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateSelect(day)}
                            className={`
                min-h-[80px] p-1 flex flex-col justify-between cursor-pointer transition-colors relative
                ${!isSameMonth(day, monthStart) ? 'bg-gray-50/30' : 'bg-white'}
                ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'}
              `}
                        >
                            <div className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-end
                ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                ${!isSameMonth(day, monthStart) && 'text-gray-400'}
              `}>
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1">
                                {hasShifts && (
                                    <div className="flex items-center space-x-1 text-[10px] text-green-700 bg-green-50 px-1 py-0.5 rounded truncate">
                                        <DollarSign size={10} strokeWidth={3} />
                                        <span className="font-medium truncate">{dayShifts.length > 1 ? `${dayShifts.length} ${terms.mainItemPlural}` : terms.mainItem}</span>
                                    </div>
                                )}
                                {dayEvents.slice(0, 2).map(event => (
                                    <div key={event.id} className="flex items-center space-x-1 text-[10px] text-purple-700 bg-purple-50 px-1 py-0.5 rounded truncate">
                                        <CalendarIcon size={10} strokeWidth={3} className="shrink-0" />
                                        <span className="font-medium truncate">{event.title}</span>
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[9px] text-gray-400 text-center">
                                        +{dayEvents.length - 2}
                                    </div>
                                )}
                                {routineShift && (
                                    <div className="flex items-center space-x-1 text-[10px] text-green-700 bg-green-50 px-1 py-0.5 rounded truncate">
                                        <span className="font-bold text-[9px] px-0.5 border border-green-200 rounded mx-0.5">P</span>
                                        <span className="font-medium truncate">{routineShift.start}-{routineShift.end}</span>
                                    </div>
                                )}
                                {routineHours > 0 && (
                                    <div className="flex items-center space-x-1 text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded truncate">
                                        <span className="font-bold text-[9px] px-0.5 border border-blue-200 rounded mx-0.5">R</span>
                                        <span className="font-medium truncate">{routineHours}h Fixas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
