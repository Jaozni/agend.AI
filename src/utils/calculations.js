import { differenceInMinutes } from 'date-fns';

export const calculateShiftEarnings = (start, end, hourlyRate) => {
    const settings = { hourlyRate: hourlyRate || 0 }; // Fallback
    if (!start || !end || !settings.hourlyRate) return 0;

    const minutes = differenceInMinutes(new Date(end), new Date(start));
    const hours = minutes / 60;
    return hours * settings.hourlyRate;
};

export const calculateMonthlyEarnings = (shifts, currentMonth) => {
    // Filtra shifts do mês atual
    // Soma os ganhos
    // Retorna total
    // TODO: Implementar lógica de data completa
    return shifts.reduce((acc, shift) => acc + (shift.earnings || 0), 0);
};

export const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    // Force NOON (12:00) to avoid midnight timezone cliff
    return new Date(year, month - 1, day, 12, 0, 0);
};
