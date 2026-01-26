import { useStore } from '../store/useStore';
import { Moon, Sun, User, LogOut, Bell, CalendarDays, Globe, ChevronRight, GraduationCap, Stethoscope, MessageSquare, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { translations } from '../utils/translations';

const SettingsPage = () => {
    const { settings, toggleTheme, userName, setUserName, userPhoto, profilePhotos, setUserPhoto, updateSettings, showToast, userType, signOut } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const lang = settings?.language || 'pt';
    const t = translations[lang];

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    // Função auxiliar para redimensionar imagem (evita estourar LocalStorage)
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 300; // Avatar pequeno é suficiente

                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressão JPEG 70%
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const resizedBase64 = await resizeImage(file);
                try {
                    // Salva a foto ESPECÍFICA para o perfil atual
                    setUserPhoto(resizedBase64, userType);
                    showToast('Foto atualizada!', 'success');
                } catch (storeError) {
                    if (storeError.name === 'QuotaExceededError' || storeError.message.includes('quota')) {
                        showToast('Erro: Memória cheia. Foto não salva.', 'error');
                    } else {
                        throw storeError;
                    }
                }
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                showToast('Erro ao processar imagem.', 'error');
            }
        }
    };

    const handleToggleNotifications = async () => {
        if (settings?.notificationsEnabled) {
            updateSettings({ notificationsEnabled: false });
            showToast(t.toast?.reminders_disabled || 'Lembretes desativados', 'info');
            return;
        }

        if (!('Notification' in window)) {
            updateSettings({ notificationsEnabled: true });
            showToast(t.toast?.reminders_in_app || 'Lembretes no App ativados! (Navegador não suporta nativo)', 'success');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            updateSettings({ notificationsEnabled: true });
            showToast(t.toast?.reminders_enabled || 'Lembretes ativados com sucesso!', 'success');
            try {
                new Notification('agend.AI', { body: 'Teste de notificação nativa OK!' });
            } catch (e) {
                console.log("Erro ao testar notificação nativa", e);
            }
        } else {
            updateSettings({ notificationsEnabled: true });
            showToast(t.toast?.reminders_permission_denied || 'Lembretes ativados (Modo App apenas)', 'warning');
        }
    };

    // Componente de Item da Lista
    const ListItem = ({ icon: Icon, color, label, subLabel, action, onClick, isDanger }) => (
        <div
            onClick={onClick}
            className={`flex items-center p-4 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors cursor-pointer ${onClick ? '' : 'cursor-default'}`}
        >
            <div className={`p-2 rounded-xl mr-4 ${color}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <h3 className={`font-medium ${isDanger ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                    {label}
                </h3>
                {subLabel && <p className="text-xs text-gray-500 dark:text-gray-400">{subLabel}</p>}
            </div>
            <div>
                {action}
            </div>
        </div>
    );

    // Componente de Seção
    const Section = ({ title, children }) => (
        <div className="mb-6">
            <h2 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {title}
            </h2>
            <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 sm:rounded-2xl shadow-sm border-y sm:border border-gray-100 dark:border-gray-700 overflow-hidden">
                {children}
            </div>
        </div>
    );

    // Toggle Switch Component
    const Toggle = ({ active, onToggle }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
            <div
                className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">

            {/* Header com Perfil */}
            <div className="bg-white dark:bg-gray-800 pt-8 pb-6 px-4 mb-4 border-b border-gray-200 dark:border-gray-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />

                <div className="relative inline-block group">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center text-blue-600 dark:text-blue-300 mb-3 mx-auto shadow-inner cursor-pointer overflow-hidden border-4 border-white dark:border-gray-800 relative"
                    >
                        {(profilePhotos?.[userType] || userPhoto) ? (
                            <img src={profilePhotos?.[userType] || userPhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                {userType === 'professor' && <GraduationCap size={40} />}
                                {userType === 'plantonista' && <Stethoscope size={40} />}
                                {userType === 'casual' && <User size={40} />}
                            </>
                        )}

                        {/* Overlay de Edição */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>

                    {/* Botão Flutuante Mobile (Sempre visível se não tiver hover) */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-3 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-gray-800"
                    >
                        <Camera size={14} />
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="flex items-center justify-center gap-2 mb-1">
                    <input
                        value={userName || ''}
                        onChange={(e) => setUserName(e.target.value)}
                        className="text-xl font-bold text-gray-800 dark:text-white text-center bg-transparent focus:bg-gray-100 dark:focus:bg-gray-700 rounded px-2 py-0.5 outline-none tracking-tight w-2/3 truncate"
                        placeholder="Seu Nome"
                    />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full inline-block mb-4">
                    {userType === 'plantonista' && (t.settings?.profile_plantonista || 'Plantonista')}
                    {userType === 'professor' && (t.settings?.profile_professor || 'Professor')}
                    {userType === 'casual' && (t.settings?.profile_casual || 'Pessoal')}
                </p>

                {/* Seletor Rápido de Perfil (Restrito) */}
                <div className="flex justify-center gap-2 mb-2">
                    {(() => {
                        // Determina o tipo principal (quem criou a conta)
                        const mainType = settings?.primaryUserType || 'plantonista';

                        // Se o usuário se cadastrou como "Pessoal" (Casual), ele não quer ver Plantonista/Professor.
                        // Se ele for Plantonista/Professor, ele pode querer ver o Pessoal também.
                        let availableTypes = [];

                        if (mainType === 'casual') {
                            availableTypes = [
                                { id: 'casual', icon: User, label: t.settings?.profile_casual || 'Pessoal' }
                            ];
                        } else {
                            // Se for Plantonista ou Professor, mostra o principal + Pessoal
                            availableTypes = [
                                { id: mainType, icon: mainType === 'professor' ? GraduationCap : Stethoscope, label: mainType === 'professor' ? (t.settings?.profile_professor || 'Professor') : (t.settings?.profile_plantonista || 'Plantonista') },
                                { id: 'casual', icon: User, label: t.settings?.profile_casual || 'Pessoal' }
                            ];
                        }

                        return availableTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    if (userType !== type.id) {
                                        useStore.getState().setUserType(type.id);
                                        showToast(`Modo ${type.label} ativado!`, 'success');
                                    }
                                }}
                                className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 min-w-[80px]
                                ${userType === type.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                        : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400'
                                    }`}
                            >
                                <type.icon size={20} />
                                <span className="text-[10px] font-bold uppercase">{type.label}</span>
                            </button>
                        ));
                    })()}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                {/* Seção Geral */}
                <Section title={t.settings?.general || "Geral"}>
                    <ListItem
                        icon={Globe}
                        color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        label={t.settings.language}
                        subLabel={lang === 'pt' ? 'Português (Brasil)' : 'English'}
                        action={
                            <div className="flex gap-1">
                                <button
                                    onClick={() => updateSettings({ language: 'pt' })}
                                    className={`text-xs font-bold px-2 py-1 rounded ${lang === 'pt' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400'}`}
                                >PT</button>
                                <button
                                    onClick={() => updateSettings({ language: 'en' })}
                                    className={`text-xs font-bold px-2 py-1 rounded ${lang === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400'}`}
                                >EN</button>
                            </div>
                        }
                    />

                    <ListItem
                        icon={settings?.theme === 'dark' ? Moon : Sun}
                        color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        label={t.settings.dark_mode}
                        action={<Toggle active={settings?.theme === 'dark'} onToggle={toggleTheme} />}
                        onClick={toggleTheme}
                    />

                    <ListItem
                        icon={Bell}
                        color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        label={t.settings.notifications}
                        subLabel={settings?.notificationsEnabled ? `${settings?.reminderMinutes} min antes` : 'Desativado'}
                        action={<Toggle active={settings?.notificationsEnabled} onToggle={handleToggleNotifications} />}
                        onClick={handleToggleNotifications}
                    />

                    {settings?.notificationsEnabled && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t.settings.reminder_time}</span>
                                <select
                                    value={settings?.reminderMinutes || 15}
                                    onChange={(e) => updateSettings({ reminderMinutes: parseInt(e.target.value) })}
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="5">5 min</option>
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="60">1h</option>
                                    <option value="120">2h</option>
                                </select>
                            </div>
                            <button
                                onClick={() => showToast('Teste de Alerta! 🔔', 'success')}
                                className="text-xs text-blue-600 dark:text-blue-400 font-medium self-start hover:underline"
                            >
                                Testar Notificação
                            </button>
                        </div>
                    )}
                </Section>

                {/* Seção Trabalho / Rotina */}
                {(userType === 'professor' || userType === 'plantonista') && (
                    <Section title={t.settings?.routine || "Rotina"}>
                        <ListItem
                            icon={CalendarDays}
                            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            label={userType === 'professor' ? t.settings.routine_fixed : t.settings.shift_fixed}
                            subLabel={settings?.[`routineEnabled_${userType}`] !== false ? 'Ativado' : 'Desativado'}
                            action={
                                <Toggle
                                    active={settings?.[`routineEnabled_${userType}`] !== false}
                                    onToggle={() => {
                                        const key = `routineEnabled_${userType}`;
                                        const current = settings?.[key] !== false; // Default true
                                        updateSettings({ [key]: !current });
                                    }}
                                />
                            }
                            onClick={() => {
                                const key = `routineEnabled_${userType}`;
                                const current = settings?.[key] !== false;
                                updateSettings({ [key]: !current });
                            }}
                        />
                    </Section>
                )}

                {/* Seção Sobre / Ações */}
                <Section title={t.settings?.about || "Sobre"}>
                    <ListItem
                        icon={MessageSquare}
                        color="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        label="Versão"
                        subLabel="agend.AI v1.3.1 (PWA)"
                    />
                    <ListItem
                        icon={LogOut}
                        color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        label={t.settings.logout}
                        isDanger
                        onClick={handleLogout}
                    />
                </Section>

                <p className="text-center text-xs text-gray-400 mt-8 mb-4">
                    Desenvolvido com JPM
                </p>
            </div>
        </div>
    );
};

export default SettingsPage;
