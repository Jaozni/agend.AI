import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

const RoutineModal = ({ isOpen, onClose }) => {
    const { weeklyRoutine, updateRoutine } = useStore();
    const [localRoutine, setLocalRoutine] = useState(weeklyRoutine);

    const handleChange = (key, value) => {
        setLocalRoutine(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        updateRoutine(localRoutine);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-200">

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Rotina Semanal Fixa
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Informe quantas horas de aula você dá em cada dia da semana. Isso ajudará a calcular sua carga mental.
                </p>

                <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                    {days.map((day) => (
                        <div key={day.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">{day.label}</span>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={localRoutine[day.key] || ''}
                                    onChange={(e) => handleChange(day.key, e.target.value)}
                                    className="w-16 p-2 text-center text-sm font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="0"
                                />
                                <span className="text-xs text-gray-400 ml-2">h</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    Salvar Rotina
                </button>

            </div>
        </div>
    );
};

export default RoutineModal;
