import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Stethoscope, GraduationCap, CalendarHeart, Camera, Mail, ArrowRight, Lock, User, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

const AlertModal = ({ isOpen, type, title, message, onClose, onConfirm, confirmText }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
                <div className="flex gap-2">
                    {onClose && (
                        <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
                            Fechar
                        </button>
                    )}
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-colors">
                        {confirmText || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const { setUserName, setUserType, setUserEmail, setUserPhoto, lastUserProfile, signIn, signUp, initializeAuth, showToast, user } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Modes: 'welcome' (if lastUser), 'login', 'register'
    const [mode, setMode] = useState(lastUserProfile ? 'welcome' : 'login');
    const [loading, setLoading] = useState(false);

    // Alert Modal State
    const [alertState, setAlertState] = useState({ isOpen: false, type: 'success', title: '', message: '', action: null });

    // Form States (Restored)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [photo, setPhoto] = useState(null);
    const [selectedType, setSelectedType] = useState('plantonista');

    // Redirect se já logado
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        initializeAuth();
    }, []);

    // Resize Image Logic
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 300;
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
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
                setPhoto(resizedBase64);
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                showToast("Erro ao processar imagem.", 'error');
            }
        }
    };

    // Actions
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            setTimeout(() => navigate('/'), 100);
        } catch (error) {
            showToast("Erro ao entrar: " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        const currentEmail = email;
        const currentPassword = password;
        const currentName = name;
        const currentType = selectedType;
        const currentPhoto = photo;

        try {
            // 1. Cria conta
            const { data } = await signUp(currentEmail, currentPassword, currentName);

            // 2. Tenta logar automaticamente para garantir sessão (e verificar se precisa confirmar email)
            // Se o signUp já logou (confirmation off), o signIn é redundante mas seguro.
            // Se o signUp não logou (confirmation on), o signIn vai lançar erro "Email not confirmed".
            try {
                await signIn(currentEmail, currentPassword);
            } catch (loginError) {
                // Se o erro for de email não confirmado, avisar user
                if (loginError.message.includes('confirm') || loginError.message.includes('verified')) {
                    alert('Conta criada! Por favor, verifique seu email para ativar a conta antes de entrar.');
                    setMode('login');
                    setLoading(false);
                    return;
                }
                // Se for outro erro de login, apenas ignora e deixa o fluxo seguir (pode já estar logado)
                console.warn("Auto-login falhou, mas cadastro ok:", loginError);
            }

            // 3. Atualiza store local se tivermos sessão ou apenas para feedback
            setUserName(currentName.trim());
            setUserEmail(currentEmail.trim());
            if (currentPhoto) setUserPhoto(currentPhoto, currentType);
            setUserType(currentType);

            // Persiste settings
            useStore.getState().updateSettings({ primaryUserType: currentType });

            showToast("Bem-vindo(a)!", 'success');
            // Pequeno delay e redirect
            setTimeout(() => navigate('/'), 1000);

        } catch (error) {
            console.error("Erro cadastro:", error);
            const msg = error.message || "Erro desconhecido";
            // Alert nativo para garantir que o user veja no celular
            if (msg.includes("already registered") || msg.includes("unique constraint")) {
                alert("Este email já possui conta! Redirecionando para o login...");
                setMode('login');
            } else {
                alert("Erro ao criar conta: " + msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleWelcomeBack = () => {
        try {
            // Tenta logar apenas restaurando sessão se possível, 
            // mas como mudamos pra supabase, ideal é pedir senha ou assumir sessão ativa.
            // Se chegou aqui, talvez sessão expirou. Vamos mandar pro login preenchido.
            if (lastUserProfile?.email) {
                setEmail(lastUserProfile.email);
                setMode('login');
            } else {
                navigate('/');
            }
        } catch (e) {
            navigate('/');
        }
    };

    const renderProfileIcon = (type) => {
        switch (type) {
            case 'professor': return <GraduationCap size={48} />;
            case 'casual': return <CalendarHeart size={48} />;
            default: return <Stethoscope size={48} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <AlertModal
                isOpen={alertState.isOpen}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                confirmText={alertState.confirmText}
                onConfirm={alertState.action}
                onClose={alertState.onClose}
            />

            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300 relative overflow-hidden">

                {mode === 'welcome' && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-500">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-lg">
                            {lastUserProfile?.photo ? (
                                <img src={lastUserProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-blue-600">{renderProfileIcon(lastUserProfile?.type)}</div>
                            )}
                        </div>
                        <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Bem-vindo de volta</h2>
                        <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">{lastUserProfile?.name}</h1>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWelcomeBack();
                            }}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all mb-4 flex items-center justify-center relative overflow-hidden z-10"
                        >
                            <span className="mr-2">Entrar</span>
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMode('login');
                            }}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium relative z-10"
                        >
                            Usar outra conta
                        </button>
                    </div>
                )}

                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                            <p className="text-gray-500 text-sm">Entre para acessar seus plantões</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 pl-12 bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 rounded-xl outline-none" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 pl-12 bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-500 rounded-xl outline-none" required />
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                        </button>

                        <div className="text-center">
                            <button type="button" onClick={() => setMode('register')} className="text-blue-600 text-sm font-medium hover:underline">Criar nova conta</button>
                        </div>
                    </form>
                )}

                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
                        </div>

                        {/* Foto */}
                        <div className="flex flex-col items-center">
                            <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative group overflow-hidden border-2 border-dashed border-gray-300">
                                {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400" />}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm">
                                    <option value="plantonista">Plantonista</option>
                                    <option value="professor">Professor</option>
                                    <option value="casual">Pessoal</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm" required />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none text-sm" required />
                        </div>

                        <button disabled={loading} type="submit" className="w-full py-3 bg-gray-900 hover:bg-black disabled:bg-gray-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
                        </button>

                        <div className="text-center">
                            <button type="button" onClick={() => setMode('login')} className="text-gray-500 text-sm font-medium hover:underline">Já tenho conta</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
