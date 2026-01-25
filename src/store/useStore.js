import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
    persist(
        (set) => ({
            shifts: [],
            events: [],
            userName: null,
            userPhoto: null, // Foto padrão/fallback
            profilePhotos: {}, // Fotos específicas por perfil: { plantonista: '...', professor: '...' }
            userEmail: null,
            userType: 'plantonista', // 'plantonista', 'professor', 'casual'
            lastUserProfile: null, // Persistência para "Bem-vindo de volta"
            notifiedEvents: [], // IDs de eventos já notificados
            toast: { message: '', type: 'info', isVisible: false }, // Estado inicial do Toast

            // Quadro de Notas (Post-its)
            notes: [], // Array de { id, text, color, x, y, width, height }

            addNote: (note) => set((state) => {
                const now = new Date();
                // Se o mês for fornecido na nota (ex: visualizando mês futuro), use-o.
                // Caso contrário, use o mês atual.
                const targetMonth = note.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                // Se for mes atual, usa 'now', se for outro mes, usa dia 1 daquele mes pra createdAt ficar coerente
                const createdDate = note.month ? new Date(note.month + '-01').toISOString() : now.toISOString();

                return {
                    notes: [...(Array.isArray(state.notes) ? state.notes : []), {
                        ...note,
                        id: Date.now().toString(),
                        createdAt: createdDate,
                        month: targetMonth
                    }]
                };
            }),

            updateNote: (id, updates) => set((state) => ({
                notes: (Array.isArray(state.notes) ? state.notes : []).map(n => n.id === id ? { ...n, ...updates } : n)
            })),

            deleteNote: (id) => set((state) => ({
                notes: (Array.isArray(state.notes) ? state.notes : []).filter(n => n.id !== id)
            })),

            // Retrocompatibilidade temporária (se notes for string no storage)
            setNotes: (content) => {
                // Depreciado, mas mantido pra não quebrar se chamado. 
                // Idealmente migraríamos no hydrate, mas vamos manter simples.
            },

            settings: {
                defaultHourlyRate: 0,
                monthlyGoal: 0,
                theme: 'light', // 'light' or 'dark'
                language: 'pt', // 'pt' or 'en'
                reminderMinutes: 15,
                notificationsEnabled: false,
                routineEnabled: true // Nova configuração
            },

            setUserName: (name) => set({ userName: name }),

            // Agora aceita um tipo opcional. Se não passado, define a global.
            setUserPhoto: (photo, type = null) => set((state) => {
                if (type) {
                    return {
                        profilePhotos: { ...state.profilePhotos, [type]: photo }
                    };
                }
                return { userPhoto: photo };
            }),
            setUserEmail: (email) => set({ userEmail: email }),
            setUserType: (type) => set({ userType: type }),

            logout: () => set((state) => {
                // Pega a foto do perfil atual ou a global
                const currentPhoto = state.profilePhotos?.[state.userType] || state.userPhoto;

                return {
                    lastUserProfile: {
                        name: state.userName,
                        photo: currentPhoto,
                        email: state.userEmail,
                        type: state.userType
                    },
                    // Limpa sessão atual
                    userName: null,
                    userPhoto: null,
                    profilePhotos: {}, // Opcional: Limpar ou manter as fotos? 
                    // Melhor manter profilePhotos vazio no logout completo para segurança,
                    // mas se o objetivo for "Sair" apenas da sessão ativa...
                    // Vamos limpar tudo pra forçar login limpo, mas persistindo no lastUserProfile.
                    userEmail: null
                };
            }),

            // Rotina Semanal (para Professores) - Horas por dia
            weeklyRoutine: {
                sunday: 0,
                monday: 0,
                tuesday: 0,
                wednesday: 0,
                thursday: 0,
                friday: 0,
                saturday: 0
            },

            updateRoutine: (newRoutine) => set((state) => ({
                weeklyRoutine: { ...state.weeklyRoutine, ...newRoutine }
            })),

            // Escala Fixa (para Plantonistas)
            shiftRoutine: {
                sunday: { active: false, start: '07:00', end: '19:00', value: 0 },
                monday: { active: false, start: '07:00', end: '19:00', value: 0 },
                tuesday: { active: false, start: '07:00', end: '19:00', value: 0 },
                wednesday: { active: false, start: '07:00', end: '19:00', value: 0 },
                thursday: { active: false, start: '07:00', end: '19:00', value: 0 },
                friday: { active: false, start: '07:00', end: '19:00', value: 0 },
                saturday: { active: false, start: '07:00', end: '19:00', value: 0 }
            },

            updateShiftRoutine: (newRoutine) => set((state) => ({
                shiftRoutine: { ...state.shiftRoutine, ...newRoutine }
            })),

            // Nova Escala Rotativa (12x36, etc)
            rotatingRoutine: {
                active: false,
                type: '12x36', // '12x36', '12x60', '24x48', '24x72'
                startDate: new Date().toISOString(),
                startTime: '07:00',
                endTime: '19:00',
                value: 0
            },

            updateRotatingRoutine: (newRoutine) => set((state) => ({
                rotatingRoutine: { ...state.rotatingRoutine, ...newRoutine }
            })),

            toggleTheme: () => set((state) => ({
                settings: {
                    ...state.settings,
                    theme: state.settings?.theme === 'default' ? 'dark' : (state.settings?.theme === 'dark' ? 'light' : 'dark')
                }
            })),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),

            addNotifiedEvent: (id) => set((state) => ({
                notifiedEvents: [...state.notifiedEvents, id]
            })),

            // Toast Actions
            showToast: (message, type = 'info') => set({
                toast: { message, type, isVisible: true }
            }),

            hideToast: () => set((state) => ({
                toast: { ...state.toast, isVisible: false }
            })),

            // Plantões
            addShift: (shift) => set((state) => ({
                shifts: [...state.shifts, { ...shift, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
            })),
            removeShift: (id) => set((state) => ({
                shifts: state.shifts.filter((s) => s.id !== id)
            })),
            updateShift: (id, updatedShift) => set((state) => ({
                shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...updatedShift } : s)),
            })),

            // Eventos Pessoais
            addEvent: (event) => set((state) => ({
                events: [...state.events, { ...event, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
            })),
            removeEvent: (id) => set((state) => ({
                events: state.events.filter((e) => e.id !== id)
            })),
            updateEvent: (id, updatedEvent) => set((state) => ({
                events: state.events.map((e) => (e.id === id ? { ...e, ...updatedEvent } : e)),
            })),
        }),
        {
            name: 'agendaiy-storage',
        }
    )
)
