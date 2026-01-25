import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Battery, BatteryCharging, BatteryWarning } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, differenceInMinutes } from 'date-fns';
import { translations } from '../utils/translations';

const MentalLoadWidget = () => {
    const { shifts, weeklyRoutine, userType, settings } = useStore();
    const lang = settings?.language || 'pt';
    const t = translations[lang];

    const stats = useMemo(() => {
        // Intervalo da Semana Atual
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 0 }); // Domingo
        const end = endOfWeek(now, { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start, end });

        let manualMinutes = 0;
        let routineMinutes = 0;

        // Soma itens manuais da semana (Plantões/Aulas Extras) e filtra por perfil
        const weekShifts = shifts.filter(s => {
            const date = new Date(s.start);
            const isProfileMatch = (s.userProfile || 'plantonista') === userType;
            return isProfileMatch && date >= start && date <= end;
        });

        manualMinutes = weekShifts.reduce((acc, s) => {
            return acc + differenceInMinutes(new Date(s.end), new Date(s.start));
        }, 0);

        // Soma Rotina Fixa (apenas se for professor e tiver rotina ATIVADA)
        if (userType === 'professor' && weeklyRoutine && settings?.routineEnabled) {
            // Mapeia index do dia (0-6) para keys da rotina
            const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

            // Para cada dia da semana atual, soma as horas da rotina
            days.forEach(day => {
                const dayKey = dayKeys[day.getDay()];
                const hours = weeklyRoutine[dayKey] || 0;
                routineMinutes += hours * 60;
            });
        }

        const totalHours = (manualMinutes + routineMinutes) / 60;

        // Definição de Níveis
        let level = 'leve'; // < 20
        let color = 'text-green-600 bg-green-50 border-green-200';
        let barColor = 'bg-green-500';
        let icon = BatteryCharging;
        let message = t.mental.level_low;

        if (totalHours >= 20 && totalHours <= 40) {
            level = 'moderado';
            color = 'text-yellow-600 bg-yellow-50 border-yellow-200';
            barColor = 'bg-yellow-500';
            icon = Battery;
            message = t.mental.level_med;
        } else if (totalHours > 40) {
            level = 'pesado';
            color = 'text-red-600 bg-red-50 border-red-200';
            barColor = 'bg-red-500';
            icon = BatteryWarning;
            message = totalHours > 60 ? t.mental.level_over : t.mental.level_high;
        }

        return { totalHours, level, color, barColor, icon, message };
    }, [shifts, weeklyRoutine, userType, settings, t]);

    const Icon = stats.icon;

    return (
        <div className={`p-4 rounded-2xl border ${stats.color} transition-all duration-300`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold opacity-90">{t.mental.title}</h3>
                        <p className="text-xs opacity-75">{t.mental.week}</p>
                    </div>
                </div>
                <Icon size={24} className="opacity-80" />
            </div>

            <div className="flex items-end gap-1 my-3">
                <span className="text-3xl font-bold tracking-tight">
                    {Math.round(stats.totalHours * 10) / 10}
                </span>
                <span className="text-sm font-medium mb-1 opacity-75">{t.mental.hours}</span>
            </div>

            {/* Progress Bar Simplificada */}
            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${stats.barColor} transition-all duration-500`}
                    style={{ width: `${Math.min((stats.totalHours / 50) * 100, 100)}%` }} // Escala até 50h
                />
            </div>

            <p className="text-xs font-medium opacity-90">
                {stats.message}
            </p>
        </div>
    );
};

export default MentalLoadWidget;
