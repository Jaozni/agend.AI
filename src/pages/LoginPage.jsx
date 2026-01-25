import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { UserCircle, Stethoscope, GraduationCap, CalendarHeart, Camera, Mail, ArrowRight, User } from 'lucide-react';

const LoginPage = () => {
    const { setUserName, setUserType, setUserEmail, setUserPhoto, lastUserProfile, logout } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Se tiver perfil salvo, começa na etapa 0 (Welcome Back), senão etapa 1 (Cadastro)
    const [step, setStep] = useState(lastUserProfile ? 0 : 1);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [photo, setPhoto] = useState(null);
    const [selectedType, setSelectedType] = useState('plantonista');

    // Preencher dados se escolheu "Trocar de Conta" mas quer usar dados antigos? 
    // Melhor manter limpo para novo cadastro.

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
                setPhoto(resizedBase64);
            } catch (err) {
                console.error("Erro ao processar imagem", err);
                alert("Erro ao processar imagem. Tente uma menor.");
            }
        }
    };

    const handleWelcomeBack = (e) => {
        e?.preventDefault();
        if (lastUserProfile) {
            try {
                setUserName(lastUserProfile.name);
                setUserEmail(lastUserProfile.email);
                setUserPhoto(lastUserProfile.photo);
                setUserType(lastUserProfile.type);
                setTimeout(() => navigate('/'), 50);
            } catch (error) {
                // Fallback: Se der erro de cota, tenta entrar sem a foto
                if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                    try {
                        setUserPhoto(null); // Remove a foto da sessão atual
                        setUserName(lastUserProfile.name);
                        setUserEmail(lastUserProfile.email);
                        setUserType(lastUserProfile.type);
                        alert("Aviso: Memória do navegador cheia. Entrando sem carregar a foto.");
                        setTimeout(() => navigate('/'), 50);
                    } catch (retryError) {
                        alert("Erro crítico de memória. Tente limpar dados do navegador.");
                    }
                } else {
                    alert("Erro ao entrar: " + error.message);
                }
            }
        }
    };

    const handleSwitchAccount = (e) => {
        e?.preventDefault();
        setStep(1);
        setName('');
        setEmail('');
        setPhoto(null);
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) setStep(2);
    };

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handleFinalSubmit = (e) => {
        e?.preventDefault();
        try {
            setUserName(name.trim());
            setUserEmail(email.trim());
            setUserPhoto(photo);
            setUserType(selectedType);
            setTimeout(() => navigate('/'), 50);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                // Tenta salvar sem a foto
                try {
                    setUserPhoto(null);
                    setUserName(name.trim());
                    setUserEmail(email.trim());
                    setUserType(selectedType);
                    alert("Memória cheia: Sua conta foi criada, mas a foto não pode ser salva.");
                    setTimeout(() => navigate('/'), 50);
                } catch (retryError) {
                    alert("Erro: O armazenamento do seu navegador está completamente cheio.");
                }
            } else {
                alert("Erro ao salvar dados: " + error.message);
            }
        }
    };

    // Render Assets
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

                {/* Etapa 0: Bem-vindo de volta */}
                {step === 0 && lastUserProfile && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-500">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-lg">
                            {lastUserProfile.photo ? (
                                <img src={lastUserProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-blue-600">
                                    {renderProfileIcon(lastUserProfile.type)}
                                </div>
                            )}
                        </div>
                        <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">Bem-vindo de volta</h2>
                        <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">
                            {lastUserProfile.name}
                        </h1>

                        <button
                            type="button"
                            onClick={handleWelcomeBack}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all mb-4 flex items-center justify-center gap-2"
                        >
                            Entrar <ArrowRight size={20} />
                        </button>

                        <button
                            onClick={handleSwitchAccount}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                        >
                            Usar outra conta
                        </button>
                    </div>
                )}

                {/* Header Comum para Cadastro */}
                {step > 0 && (
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-blue-50 p-3 rounded-2xl mb-4">
                            <h1 className="text-xl font-bold text-blue-900 tracking-tight">agend.AI</h1>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex gap-2 mb-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-blue-500' : 'w-2 bg-gray-200'}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Passo 1: Nome e Foto */}
                {step === 1 && (
                    <form onSubmit={handleNameSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col items-center">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative group overflow-hidden"
                            >
                                {photo ? (
                                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={28} className="text-gray-400" />
                                )}
                                <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-500 mt-2 font-medium">
                                Adicionar foto
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Como você quer ser chamado?
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                className="w-full p-4 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-2xl transition-all outline-none font-medium text-lg"
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            Continuar <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {/* Passo 2: Email */}
                {step === 2 && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Qual seu e-mail?
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@email.com"
                                    className="w-full p-4 pl-12 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-2xl transition-all outline-none font-medium text-lg"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 ml-1">Usado apenas para recuperar sua conta se precisar.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                Continuar <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                )}

                {/* Passo 3: Tipo de Usuário */}
                {step === 3 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Como você vai usar o app?</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'plantonista', icon: Stethoscope, label: 'Plantonista', desc: 'Controle plantões e valor/hora', color: 'blue' },
                                { id: 'professor', icon: GraduationCap, label: 'Professor', desc: 'Organize aulas e turmas', color: 'purple' },
                                { id: 'casual', icon: CalendarHeart, label: 'Uso Pessoal', desc: 'Eventos e compromissos', color: 'green' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left group ${selectedType === type.id
                                        ? `border-${type.color}-500 bg-${type.color}-50`
                                        : `border-gray-50 bg-gray-50 hover:bg-white hover:border-${type.color}-200`
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl mr-4 transition-colors ${selectedType === type.id ? `bg-${type.color}-200 text-${type.color}-700` : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                                        <type.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${selectedType === type.id ? `text-${type.color}-900` : 'text-gray-700'}`}>{type.label}</h3>
                                        <p className="text-xs text-gray-500">{type.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:-translate-y-1 transition-all"
                            >
                                Começar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LoginPage;
