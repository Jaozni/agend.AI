export const getTerms = (userType, language = 'pt') => {
    const isEn = language === 'en';

    switch (userType) {
        case 'professor':
            return {
                mainItem: isEn ? 'Private Class' : 'Aula Particular',
                mainItemPlural: isEn ? 'Classes' : 'Aulas',
                valueLabel: isEn ? 'Value (Optional)' : 'Valor (Opcional)',
                addMain: isEn ? 'New Class' : 'Nova Aula',
                monthlyMain: isEn ? 'Monthly Classes' : 'Aulas no Mês',
                earningsMain: isEn ? 'Extra Earnings' : 'Ganhos Extras',
                emptyState: isEn ? 'No classes registered.' : 'Nenhuma aula registrada.',
                fixedRoutine: isEn ? 'Fixed Routine' : 'Rotina Fixa'
            };
        case 'casual':
            return {
                mainItem: isEn ? 'Event' : 'Evento',
                mainItemPlural: isEn ? 'Events' : 'Eventos',
                valueLabel: isEn ? 'Cost/Value (Optional)' : 'Custo/Valor (Opcional)',
                addMain: isEn ? 'New Event' : 'Novo Evento',
                monthlyMain: isEn ? 'Monthly Events' : 'Eventos no Mês',
                earningsMain: isEn ? 'Expenses/Earnings' : 'Gastos/Ganhos',
                emptyState: isEn ? 'No events registered.' : 'Nenhum evento registrado.',
                fixedRoutine: null
            };
        case 'plantonista':
        default:
            return {
                mainItem: isEn ? 'Shift' : 'Plantão',
                mainItemPlural: isEn ? 'Shifts' : 'Plantões',
                valueLabel: isEn ? 'Shift Value' : 'Valor do Plantão',
                addMain: isEn ? 'New Shift' : 'Novo Plantão',
                monthlyMain: isEn ? 'Monthly Shifts' : 'Plantões no Mês',
                earningsMain: isEn ? 'Shift Earnings' : 'Ganhos com Plantões',
                emptyState: isEn ? 'No shifts registered.' : 'Nenhum plantão registrado.',
                fixedRoutine: isEn ? 'Schedule' : 'Escala'
            };
    }
};
