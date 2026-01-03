"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Play, StopCircle, Edit, Trash2, Settings, Monitor, Activity, Zap } from 'lucide-react';

export default function DashboardPage() {
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentScreen, setCurrentScreen] = useState({ name: '', slug: '', streamKey: '', description: '' });

    useEffect(() => {
        fetchScreens();
    }, []);

    const fetchScreens = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/screens');
            const data = await res.json();
            setScreens(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const method = currentScreen.id ? 'PUT' : 'POST';

        let finalData = { ...currentScreen };
        if (typeof finalData.uiConfig === 'string') {
            try {
                finalData.uiConfig = JSON.parse(finalData.uiConfig);
            } catch (err) {
                alert('Invalid JSON in UI Configuration');
                return;
            }
        }

        await fetch('/api/screens', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });
        setIsModalOpen(false);
        setCurrentScreen({ name: '', slug: '', streamKey: '', description: '', uiConfig: {} });
        fetchScreens();
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure?')) {
            await fetch(`/api/screens?id=${id}`, { method: 'DELETE' });
            fetchScreens();
        }
    };

    const toggleStream = async (screen) => {
        const action = screen.isActive ? 'stop' : 'start';
        // Note: The stop/start logic is handled by /api/stream
        // We update the local status and call the stream service
        if (!screen.isActive) {
            // Start
            await fetch('/api/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ screenId: screen.slug, streamKey: screen.streamKey })
            });
        } else {
            // Stop
            await fetch(`/api/stream?streamKey=${screen.streamKey}`, { method: 'DELETE' });
        }

        // Update DB status
        await fetch('/api/screens', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: screen.id, isActive: !screen.isActive })
        });
        fetchScreens();
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">
                        STREAM ORCHESTRATOR
                    </h1>
                    <p className="text-gray-400 mt-2">Manage your dynamic broadcast screens and AI workflows.</p>
                </div>
                <button
                    onClick={() => { setCurrentScreen({ name: '', slug: '', streamKey: '', description: '' }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={20} /> New Screen
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {screens.map(screen => (
                        <div key={screen.id} className="group relative bg-[#0f0f1f]/80 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all backdrop-blur-sm">
                            <div className={`absolute top-0 left-0 w-full h-1 ${screen.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Monitor size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setCurrentScreen(screen); setIsModalOpen(true); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(screen.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-1">{screen.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 font-mono">/screen/{screen.slug}</p>
                                <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem] mb-6">
                                    {screen.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center justify-between gap-4 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Stream Key</span>
                                        <span className="text-sm font-mono text-gray-300">{screen.streamKey}</span>
                                    </div>
                                    <button
                                        onClick={() => toggleStream(screen)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${screen.isActive
                                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                            }`}
                                    >
                                        {screen.isActive ? <><StopCircle size={18} /> Stop</> : <><Play size={18} /> Start</>}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 p-4 border-t border-white/5 flex gap-4 text-xs">
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Activity size={12} /> {screen.isActive ? 'Streaming' : 'Idle'}
                                </span>
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Zap size={12} /> AI Enabled
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSave} className="relative bg-[#0f0f1f] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Settings className="text-blue-500" /> {currentScreen.id ? 'Edit Screen' : 'Create New Screen'}
                            </h2>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Name</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                    value={currentScreen.name}
                                    onChange={e => setCurrentScreen({ ...currentScreen, name: e.target.value })}
                                    placeholder="e.g. Master Arena"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Slug (URL)</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                    value={currentScreen.slug}
                                    onChange={e => setCurrentScreen({ ...currentScreen, slug: e.target.value })}
                                    placeholder="e.g. arena-1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stream Key</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                    value={currentScreen.streamKey}
                                    onChange={e => setCurrentScreen({ ...currentScreen, streamKey: e.target.value })}
                                    placeholder="e.g. pantalla"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                                    value={currentScreen.description || ''}
                                    onChange={e => setCurrentScreen({ ...currentScreen, description: e.target.value })}
                                    placeholder="What is this screen for?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">UI Configuration (JSON)</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors min-h-[120px] font-mono text-sm"
                                    value={typeof currentScreen.uiConfig === 'object' ? JSON.stringify(currentScreen.uiConfig, null, 2) : currentScreen.uiConfig}
                                    onChange={e => setCurrentScreen({ ...currentScreen, uiConfig: e.target.value })}
                                    placeholder='{ "title": "CUSTOM ARENA", "primaryColorFrom": "from-blue-400" }'
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-black/20 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-lg font-bold hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg font-bold transition-colors"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
