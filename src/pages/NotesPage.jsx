import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Plus, GripHorizontal, X } from 'lucide-react';
import { translations } from '../utils/translations';

const COLORS = [
    { id: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300', text: 'text-yellow-900' },
    { id: 'blue', bg: 'bg-blue-200', border: 'border-blue-300', text: 'text-blue-900' },
    { id: 'green', bg: 'bg-green-200', border: 'border-green-300', text: 'text-green-900' },
    { id: 'pink', bg: 'bg-pink-200', border: 'border-pink-300', text: 'text-pink-900' },
    { id: 'purple', bg: 'bg-purple-200', border: 'border-purple-300', text: 'text-purple-900' },
];

const NotesPage = () => {
    const { notes, addNote, updateNote, deleteNote, settings } = useStore();
    const lang = settings?.language || 'pt';
    const t = translations[lang];

    // Estados de Visualização
    const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'list'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Detectar mobile para forçar lista inicialmente
    useEffect(() => {
        if (window.innerWidth < 768) {
            setViewMode('list');
        }
    }, []);

    // Filtragem
    const filteredNotes = (notes || []).filter(note => {
        // Se nota não tem data (antiga), assume que é do mês atual ou exibe sempre? 
        // Vamos exibir as sem data no mês atual padrão ou todas se não tiver month setado.
        const noteMonth = note.month || note.createdAt?.slice(0, 7);
        if (!noteMonth) return true; // Notas legadas aparecem sempre? Ou melhor, atribuir mês atual na migração.
        // Por enquanto, mostramos se bater o mês ou se não tiver mês (pra não sumir)
        return noteMonth === selectedMonth || !noteMonth;
    });

    const [draggingId, setDraggingId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // Função para criar nota
    const handleCreateNote = (colorId) => {
        const noteData = {
            text: '',
            color: colorId,
            width: 200,
            height: 200,
            month: selectedMonth // Passar mês selecionado
        };

        if (viewMode === 'canvas') {
            const x = 50 + Math.random() * 50;
            const y = 50 + Math.random() * 50;
            addNote({ ...noteData, x, y });
        } else {
            // Em modo lista, adiciona sem posição (x,y irrelevantes)
            addNote({ ...noteData, x: 0, y: 0 });
        }
    };

    // --- Lógica de Canvas (Drag n Drop) ---
    const handlePointerDown = (e, noteId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setDraggingId(noteId);
    };

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!draggingId || !canvasRef.current) return;
            const canvasRect = canvasRef.current.getBoundingClientRect();
            let newX = e.clientX - canvasRect.left - dragOffset.current.x;
            let newY = e.clientY - canvasRect.top - dragOffset.current.y;
            updateNote(draggingId, { x: newX, y: newY });
        };
        const handlePointerUp = () => setDraggingId(null);

        if (draggingId) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingId, updateNote]);


    return (
        <div className="flex flex-col h-full bg-stone-100 dark:bg-gray-900 overflow-hidden relative">

            {/* Header / Controles */}
            <div className="bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm font-medium dark:text-white"
                    />
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                    <span className="text-xs text-gray-400 hidden sm:block">
                        {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
                    </span>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('canvas')}
                        className={`p-1.5 rounded ${viewMode === 'canvas' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400'}`}
                        title="Canvas View"
                    >
                        <GripHorizontal size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400'}`}
                        title="List View"
                    >
                        <div className="flex flex-col gap-0.5 justify-center h-4 w-4">
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Ferramentas (Cores) */}
                <div className="w-14 sm:w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-3 z-20">
                    <div className="mb-1">
                        <Plus size={20} className="text-gray-400" />
                    </div>
                    {COLORS.map(color => (
                        <button
                            key={color.id}
                            onClick={() => handleCreateNote(color.id)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm border-2 ${color.bg} ${color.border} hover:scale-110 transition-transform active:scale-90`}
                            title={`Add note ${color.id}`}
                        />
                    ))}
                </div>

                {/* Área Principal */}
                {viewMode === 'canvas' ? (
                    // --- MODO CANVAS ---
                    <div
                        ref={canvasRef}
                        className="flex-1 relative overflow-hidden touch-none"
                        style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    >
                        {filteredNotes.map((note) => {
                            const colorStyle = COLORS.find(c => c.id === note.color) || COLORS[0];
                            const isDragging = draggingId === note.id;
                            return (
                                <div
                                    key={note.id}
                                    className={`absolute flex flex-col rounded-lg shadow-md transition-shadow ${colorStyle.bg} ${isDragging ? 'z-50 shadow-xl scale-[1.02] cursor-grabbing' : 'z-10 cursor-grab'} `}
                                    style={{
                                        left: note.x, top: note.y, width: 220, minHeight: 180,
                                        touchAction: 'none'
                                    }}
                                >
                                    <div
                                        className={`h-8 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b ${colorStyle.border} bg-black/5`}
                                        onPointerDown={(e) => handlePointerDown(e, note.id)}
                                    >
                                        <GripHorizontal size={14} className={`opacity-40 ${colorStyle.text}`} />
                                        <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="p-1 hover:bg-black/10 rounded text-red-900/40 hover:text-red-900">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <textarea
                                        value={note.text}
                                        onChange={(e) => updateNote(note.id, { text: e.target.value })}
                                        className={`flex-1 w-full bg-transparent resize-y p-3 outline-none text-sm font-medium ${colorStyle.text} placeholder-black/30`}
                                        style={{ minHeight: '140px' }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // --- MODO LISTA (Mobile Friendly) ---
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {filteredNotes.length === 0 && (
                            <div className="text-center text-gray-400 mt-12">
                                <p className="text-sm">Nenhuma nota neste mês.</p>
                                <p className="text-xs mt-2">Escolha uma cor ao lado para criar.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNotes.map((note) => {
                                const colorStyle = COLORS.find(c => c.id === note.color) || COLORS[0];
                                return (
                                    <div key={note.id} className={`rounded-xl shadow-sm border ${colorStyle.bg} ${colorStyle.border} p-3 flex flex-col min-h-[160px]`}>
                                        <div className="flex justify-between items-start mb-2 opacity-50">
                                            <span className="text-[10px] uppercase font-bold tracking-wider">{note.month || 'Geral'}</span>
                                            <button onClick={() => deleteNote(note.id)} className="p-1 hover:bg-black/10 rounded">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={note.text}
                                            onChange={(e) => updateNote(note.id, { text: e.target.value })}
                                            className={`flex-1 w-full bg-transparent resize-none outline-none text-base font-medium ${colorStyle.text} placeholder-black/30`}
                                            placeholder="..."
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesPage;
