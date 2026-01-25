import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useStore = create(
    persist(
        (set, get) => ({
            session: null,
            user: null, // User do Supabase

            // Dados (Sincronizados)
            shifts: [],
            events: [],
            notes: [],

            // Perfis e Configs
            userName: null,
            userPhoto: null,
            profilePhotos: {},
            userEmail: null,
            userEmail: null,
            userType: 'plantonista',
            primaryUserType: 'plantonista', // Default fallback

            settings: {
                defaultHourlyRate: 0,
                monthlyGoal: 0,
                theme: 'light',
                language: 'pt',
                reminderMinutes: 15,
                notificationsEnabled: false,
                routineEnabled: true
            },

            // Rotinas
            weeklyRoutine: { sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0 },
            shiftRoutine: {
                sunday: { active: false, start: '07:00', end: '19:00', value: 0 },
                monday: { active: false, start: '07:00', end: '19:00', value: 0 },
                tuesday: { active: false, start: '07:00', end: '19:00', value: 0 },
                wednesday: { active: false, start: '07:00', end: '19:00', value: 0 },
                thursday: { active: false, start: '07:00', end: '19:00', value: 0 },
                friday: { active: false, start: '07:00', end: '19:00', value: 0 },
                saturday: { active: false, start: '07:00', end: '19:00', value: 0 }
            },
            rotatingRoutine: {
                active: false,
                type: '12x36',
                startDate: new Date().toISOString(),
                startTime: '07:00',
                endTime: '19:00',
                value: 0
            },

            lastUserProfile: null,
            notifiedEvents: [],
            toast: { message: '', type: 'info', isVisible: false },

            // Auth Actions
            initializeAuth: async () => {
                // Checa sessão atual
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    set({ session, user: session.user });
                    get().fetchData();
                }

                // Listener de mudanças
                supabase.auth.onAuthStateChange(async (_event, session) => {
                    set({ session, user: session?.user || null });
                    if (session) {
                        get().fetchData();
                    } else {
                        // Limpar dados sensiveis ao sair?
                        // set({ shifts: [], events: [], notes: [] }); 
                    }
                });
            },

            signIn: async (email, password) => {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                return data;
            },

            signUp: async (email, password, name) => {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } }
                });
                if (error) throw error;

                // Cria profile inicial se trigger falhar ou demorar (opcional, trigger cuida disso)
                return data;
            },

            signOut: async () => {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                // Mantém lastUserProfile
                const state = get();
                const currentPhoto = state.profilePhotos?.[state.userType] || state.userPhoto;

                set({
                    session: null,
                    user: null,
                    shifts: [], events: [], notes: [], // Limpa dados da UI
                    lastUserProfile: {
                        name: state.userName,
                        photo: currentPhoto,
                        email: state.userEmail,
                        type: state.userType
                    },
                    userName: null, userPhoto: null, userEmail: null
                });
            },

            // Data Actions (Supabase Integrado)
            fetchData: async () => {
                const user = get().user;
                if (!user) return;

                // Carregar Profile
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) {
                    set({
                        userName: profile.username,
                        userType: profile.user_type || 'plantonista',
                        primaryUserType: profile.settings?.primaryUserType || profile.user_type || 'plantonista', // Novo campo
                        userPhoto: profile.user_photo, // Legacy
                        profilePhotos: profile.profile_photos || {}, // New
                        settings: { ...get().settings, ...profile.settings },
                        weeklyRoutine: profile.weekly_routine || get().weeklyRoutine,
                        shiftRoutine: profile.shift_routine || get().shiftRoutine,
                        rotatingRoutine: profile.rotating_routine || get().rotatingRoutine,
                    });
                }

                // Carregar Shifts
                const { data: shifts } = await supabase.from('shifts').select('*');
                if (shifts) set({ shifts: shifts.map(s => ({ ...s, start: s.start_time, end: s.end_time })) }); // Adapter

                // Carregar Events
                const { data: events } = await supabase.from('events').select('*');
                if (events) set({ events });

                // Carregar Notes
                const { data: notes } = await supabase.from('notes').select('*').order('created_at', { ascending: true });
                if (notes) set({ notes });
            },

            // --- SHIFTS ---
            addShift: async (shift) => {
                const user = get().user;
                // Otimista
                const tempId = Date.now().toString();
                const newShift = { ...shift, id: tempId, user_id: user?.id };
                set(s => ({ shifts: [...s.shifts, newShift] }));

                if (user) {
                    const { data, error } = await supabase.from('shifts').insert({
                        user_id: user.id,
                        start_time: shift.start,
                        end_time: shift.end,
                        value: shift.value,
                        location: shift.location,
                        is_rotating: shift.isRotating
                    }).select().single();

                    if (!error && data) {
                        // Atualiza ID real
                        set(s => ({
                            shifts: s.shifts.map(curr => curr.id === tempId ? { ...curr, id: data.id } : curr)
                        }));
                    }
                }
            },
            removeShift: async (id) => {
                const user = get().user;
                set(s => ({ shifts: s.shifts.filter(i => i.id !== id) }));
                if (user) await supabase.from('shifts').delete().eq('id', id);
            },
            updateShift: async (id, updates) => {
                const user = get().user;
                set(s => ({ shifts: s.shifts.map(i => i.id === id ? { ...i, ...updates } : i) }));
                if (user) {
                    const dbUpdates = {};
                    if (updates.start) dbUpdates.start_time = updates.start;
                    if (updates.end) dbUpdates.end_time = updates.end;
                    if (updates.value !== undefined) dbUpdates.value = updates.value;
                    if (updates.location !== undefined) dbUpdates.location = updates.location;
                    await supabase.from('shifts').update(dbUpdates).eq('id', id);
                }
            },

            // --- EVENTS ---
            addEvent: async (event) => {
                const user = get().user;
                const tempId = Date.now().toString();
                const newEvent = { ...event, id: tempId };
                set(s => ({ events: [...s.events, newEvent] }));

                if (user) {
                    const { data, error } = await supabase.from('events').insert({
                        user_id: user.id,
                        title: event.title,
                        date: event.date,
                        start_time: event.startTime,
                        end_time: event.endTime,
                        color: event.color,
                        description: event.description
                    }).select().single();

                    if (!error && data) {
                        set(s => ({
                            events: s.events.map(curr => curr.id === tempId ? { ...curr, id: data.id } : curr)
                        }));
                    }
                }
            },
            removeEvent: async (id) => {
                const user = get().user;
                set(s => ({ events: s.events.filter(i => i.id !== id) }));
                if (user) await supabase.from('events').delete().eq('id', id);
            },
            updateEvent: async (id, updates) => {
                const user = get().user;
                set(s => ({ events: s.events.map(i => i.id === id ? { ...i, ...updates } : i) }));

                if (user) {
                    const dbUpdates = {};
                    if (updates.title) dbUpdates.title = updates.title;
                    if (updates.date) dbUpdates.date = updates.date;
                    if (updates.startTime) dbUpdates.start_time = updates.startTime;
                    if (updates.endTime) dbUpdates.end_time = updates.endTime;
                    if (updates.color) dbUpdates.color = updates.color;
                    if (updates.description) dbUpdates.description = updates.description;
                    await supabase.from('events').update(dbUpdates).eq('id', id);
                }
            },

            // --- NOTES ---
            addNote: async (note) => {
                const user = get().user;
                const now = new Date();
                const targetMonth = note.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const createdDate = note.month ? new Date(note.month + '-01').toISOString() : now.toISOString();

                const tempId = Date.now().toString();
                const newNote = { ...note, id: tempId, createdAt: createdDate, month: targetMonth };

                set(s => ({ notes: [...(s.notes || []), newNote] }));

                if (user) {
                    const { data, error } = await supabase.from('notes').insert({
                        user_id: user.id,
                        text: note.text,
                        color: note.color,
                        x: note.x,
                        y: note.y,
                        width: note.width,
                        height: note.height,
                        month: targetMonth
                    }).select().single();
                    if (!error && data) {
                        set(s => ({
                            notes: (s.notes || []).map(curr => curr.id === tempId ? { ...curr, id: data.id } : curr)
                        }));
                    }
                }
            },
            updateNote: async (id, updates) => {
                const user = get().user;
                set(s => ({ notes: (s.notes || []).map(n => n.id === id ? { ...n, ...updates } : n) }));
                if (user) await supabase.from('notes').update(updates).eq('id', id);
            },
            deleteNote: async (id) => {
                const user = get().user;
                set(s => ({ notes: (s.notes || []).filter(n => n.id !== id) }));
                if (user) await supabase.from('notes').delete().eq('id', id);
            },

            // --- GENERIC SETTERS (Persist to Profiles) ---
            saveProfile: async (updates) => {
                const user = get().user;
                // Atualiza local
                // ...
                // Atualiza remoto
                if (user) {
                    await supabase.from('profiles').update(updates).eq('id', user.id);
                }
            },

            setUserName: (name) => {
                set({ userName: name });
                get().saveProfile({ username: name });
            },

            setUserPhoto: (photo, type = null) => {
                // Atualiza local
                set((state) => {
                    const newState = type
                        ? { profilePhotos: { ...state.profilePhotos, [type]: photo } }
                        : { userPhoto: photo };

                    // Sincroniza
                    const user = state.user;
                    if (user) {
                        // Atenção: Salvar Base64 pesado no banco pode não ser ideal, mas vamos manter simples
                        if (type) {
                            // Atualiza JSONB
                            supabase.from('profiles').update({
                                profile_photos: { ...state.profilePhotos, [type]: photo }
                            }).eq('id', user.id).then();
                        } else {
                            supabase.from('profiles').update({ user_photo: photo }).eq('id', user.id).then();
                        }
                    }
                    return newState;
                });
            },

            setUserEmail: (email) => set({ userEmail: email }), // Apenas local UI, email real é do auth

            setUserType: (type) => {
                set({ userType: type });
                get().saveProfile({ user_type: type });
            },

            updateSettings: (newSettings) => {
                set(s => {
                    const final = { ...s.settings, ...newSettings };
                    get().saveProfile({ settings: final });
                    return { settings: final };
                });
            },

            updateRoutine: (newRoutine) => {
                set(s => {
                    const final = { ...s.weeklyRoutine, ...newRoutine };
                    get().saveProfile({ weekly_routine: final });
                    return { weeklyRoutine: final };
                });
            },

            updateShiftRoutine: (newRoutine) => {
                set(s => {
                    const final = { ...s.shiftRoutine, ...newRoutine };
                    get().saveProfile({ shift_routine: final });
                    return { shiftRoutine: final };
                });
            },

            updateRotatingRoutine: (newRoutine) => {
                set(s => {
                    const final = { ...s.rotatingRoutine, ...newRoutine };
                    get().saveProfile({ rotating_routine: final });
                    return { rotatingRoutine: final };
                });
            },

            toggleTheme: () => set((state) => ({
                settings: {
                    ...state.settings,
                    theme: state.settings?.theme === 'default' ? 'dark' : (state.settings?.theme === 'dark' ? 'light' : 'dark')
                }
            })), // Toggle local, updateSettings acima persistiria

            // --- UI HELPERS ---
            addNotifiedEvent: (id) => set((s) => ({ notifiedEvents: [...s.notifiedEvents, id] })),
            showToast: (message, type = 'info') => set({ toast: { message, type, isVisible: true } }),
            hideToast: () => set((s) => ({ toast: { ...s.toast, isVisible: false } })),
            setNotes: () => { },
        }),
        {
            name: 'agendaiy-storage',
            partialize: (state) => ({
                // Persistir apenas o essencial localmente para 'Lembrar de mim e settings básicas e fallback offline'
                // Mas idealmente se tem login, o Auth cuida.
                // Vamos persistir Settings e LastUser
                settings: state.settings,
                lastUserProfile: state.lastUserProfile,
                theme: state.theme
            })
        }
    )
)
