import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { differenceInMinutes } from 'date-fns';

export const useReminder = () => {
    const { shifts, events, settings, notifiedEvents, addNotifiedEvent } = useStore();

    useEffect(() => {
        // Se notificações não estão ativas, não faz nada
        if (!settings.notificationsEnabled) return;

        const checkReminders = () => {
            const now = new Date();
            const reminderTime = settings.reminderMinutes || 15;

            // Verificar Plantões
            shifts.forEach(shift => {
                if (notifiedEvents.includes(shift.id)) return;

                const start = new Date(shift.start);
                const diff = differenceInMinutes(start, now);

                // Se faltar entre 0 e reminderTime minutos e ainda não começou
                if (diff >= 0 && diff <= reminderTime) {
                    sendNotification(`Plantão em ${diff} minutos!`, {
                        body: `Prepare-se! Seu plantão começa às ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
                        icon: '/vite.svg' // Placeholder icon
                    });
                    addNotifiedEvent(shift.id);
                }
            });

            // Verificar Eventos Pessoais
            events.forEach(event => {
                if (notifiedEvents.includes(event.id)) return;

                const start = new Date(event.date);
                // Se o evento tem hora específica (os eventos podem ser 'Dia todo')
                if (event.time) {
                    const [h, m] = event.time.split(':');
                    start.setHours(h, m);

                    const diff = differenceInMinutes(start, now);

                    if (diff >= 0 && diff <= reminderTime) {
                        sendNotification(`Evento: ${event.title}`, {
                            body: `Em ${diff} min: ${event.description || 'Sem descrição'}`,
                            icon: '/vite.svg'
                        });
                        addNotifiedEvent(event.id);
                    }
                }
            });
        };

        // Checar a cada 1 minuto
        const intervalId = setInterval(checkReminders, 60000);

        // Checar imediatamente ao montar
        checkReminders();

        return () => clearInterval(intervalId);
    }, [shifts, events, settings, notifiedEvents, addNotifiedEvent]);
};

const sendNotification = (title, options) => {
    if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações.');
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
};
