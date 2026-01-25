import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Stethoscope, GraduationCap, CalendarHeart, Camera, Mail, ArrowRight, Lock, User, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const { setUserName, setUserType, setUserEmail, setUserPhoto, lastUserProfile, signIn, signUp, initializeAuth, showToast } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Modes: 'welcome' (if lastUser), 'login', 'register'
    const [mode, setMode] = useState(lastUserProfile ? 'welcome' : 'login');
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [photo, setPhoto] = useState(null);
    const [selectedType, setSelectedType] = useState('plantonista');

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
        try {
            await signUp(email, password, name);
            // Local fallback UI update
            setUserName(name.trim());
            setUserEmail(email.trim());
            if (photo) setUserPhoto(photo, selectedType);
            setUserType(selectedType);

            showToast("Conta criada! Verifique seu email.", 'success');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            showToast("Erro ao criar conta: " + error.message, 'error');
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

                        <button onClick={handleWelcomeBack} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all mb-4 flex items-center justify-center gap-2">
                            Entrar <ArrowRight size={20} />
                        </button>
                        <button onClick={() => setMode('login')} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Usar outra conta</button>
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
