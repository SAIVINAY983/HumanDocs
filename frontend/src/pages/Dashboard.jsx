import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, createDoc, deleteDoc } from '../api/api';
import Navbar from '../components/Navbar';
import { Plus, MoreVertical, FileText, Trash2, Clock, Users, Loader2, FilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    console.log('HumanDocs Dashboard v2.0 - documentContent sync');
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('Untitled Document');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await getDocs();
            setDocs(res.data);
        } catch (err) {
            console.error('Error fetching docs', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoc = () => {
        setNewDocTitle('Untitled Document');
        setIsCreateModalOpen(true);
    };

    const handleTemplateCreate = async (template) => {
        setIsCreating(true);
        try {
            const res = await createDoc({ 
                title: template.name, 
                documentContent: template.documentContent || {} 
            });
            if (res.data?._id) {
                navigate(`/doc/${res.data._id}`);
            }
        } catch (err) {
            console.error('Error creating template doc', err);
            alert('Template creation failed. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const confirmCreateDoc = async (e) => {
        if (e) e.preventDefault();
        if (!newDocTitle.trim()) return;

        setIsCreating(true);
        try {
            const res = await createDoc({ title: newDocTitle });
            if (res.data?._id) {
                navigate(`/doc/${res.data._id}`);
            } else {
                throw new Error('Failed to create document');
            }
        } catch (err) {
            console.error('Error creating doc', err);
            alert('Error creating document. Please try again.');
        } finally {
            setIsCreating(false);
            setIsCreateModalOpen(false);
        }
    };

    const handleDeleteDoc = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await deleteDoc(id);
                setDocs(docs.filter(doc => doc._id !== id));
            } catch (err) {
                console.error('Error deleting doc', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface text-brand-text">
            <Navbar />
            
            <section className="bg-white/40 backdrop-blur-md py-12 border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-brand-text font-black text-2xl tracking-tight">Create New</h2>
                            <p className="text-gray-400 text-sm font-medium">Choose a starting point for your next idea.</p>
                        </div>
                        <button className="text-sm text-brand-primary hover:text-indigo-700 font-bold px-4 py-2 rounded-full border-2 border-brand-primary/10 hover:border-brand-primary/20 transition-all">
                            Template Gallery
                        </button>
                    </div>
                    <div className="flex gap-10 overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex flex-col gap-4">
                            <motion.div 
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCreateDoc}
                                className="w-44 h-56 bg-white border-2 border-dashed border-brand-primary/20 rounded-[2rem] hover:border-brand-primary cursor-pointer flex flex-col items-center justify-center transition-all shadow-xl shadow-indigo-100/50 hover:shadow-indigo-200/50 group"
                            >
                                <div className="p-5 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                                    <Plus className="w-12 h-12 text-white" />
                                </div>
                            </motion.div>
                            <p className="text-sm font-black text-center text-gray-500">Blank Page</p>
                        </div>
                        
                        {/* Functional Templates */}
                        {[
                            { 
                                name: 'Creative Resume', 
                                color: 'from-brand-primary to-brand-secondary', 
                                icon: '📄',
                                documentContent: {
                                    ops: [
                                        { insert: 'YOUR NAME\n', attributes: { header: 1, align: 'center' } },
                                        { insert: 'Creative Professional | Human-Centric Designer\n', attributes: { italic: true, align: 'center' } },
                                        { insert: '\nCONTACT\n', attributes: { header: 2 } },
                                        { insert: 'Email: hello@human.docs\nLocation: The Future\n' },
                                        { insert: '\nEXPERIENCE\n', attributes: { header: 2 } },
                                        { insert: 'Lead Visionary | Antigravity Inc.\n', attributes: { bold: true } },
                                        { insert: 'Designing the next generation of collaborative workspaces with a focus on premium aesthetics and seamless UX.\n' }
                                    ]
                                }
                            },
                            { 
                                name: 'Project Roadmap', 
                                color: 'from-brand-accent to-emerald-600', 
                                icon: '🚀',
                                documentContent: {
                                    ops: [
                                        { insert: 'PROJECT ROADMAP\n', attributes: { header: 1 } },
                                        { insert: 'Phase 1: Research & Discovery\n', attributes: { list: 'bullet' } },
                                        { insert: 'Phase 2: Conceptual Design\n', attributes: { list: 'bullet' } },
                                        { insert: 'Phase 3: Development & Testing\n', attributes: { list: 'bullet' } }
                                    ]
                                }
                            },
                            { 
                                name: 'Meeting Notes', 
                                color: 'from-rose-400 to-brand-secondary', 
                                icon: '📝',
                                documentContent: {
                                    ops: [
                                        { insert: 'MEETING NOTES\n', attributes: { header: 1 } },
                                        { insert: 'Date: ' + new Date().toLocaleDateString() + '\n' },
                                        { insert: '\nATTENDEES:\n', attributes: { bold: true } },
                                        { insert: '\nAGENDA:\n', attributes: { bold: true } },
                                        { insert: '\nACTION ITEMS:\n', attributes: { bold: true } }
                                    ]
                                }
                            }
                        ].map(template => (
                            <div key={template.name} className="flex flex-col gap-4 group cursor-pointer hover:-translate-y-2 transition-all duration-500 ease-out" onClick={() => handleTemplateCreate(template)}>
                                <div className="w-44 h-56 bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-premium group-hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] transition-all relative">
                                    <div className={`h-full w-full bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}>
                                        <div className="text-5xl drop-shadow-2xl z-10">{template.icon}</div>
                                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                                <p className="text-sm font-black text-center text-gray-500 group-hover:text-brand-primary transition-colors">{template.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-brand-text tracking-tight">Recent Work</h2>
                        <p className="text-gray-400 text-sm font-medium">Your latest creative outputs.</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-bold text-gray-400 bg-white/50 p-2 rounded-2xl border border-gray-100 px-4">
                        <span className="cursor-pointer hover:text-brand-primary transition-colors">By Me</span>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <span className="cursor-pointer hover:text-brand-primary transition-colors flex items-center gap-2">
                             Last Opened <Clock className="w-4 h-4" />
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-72 bg-white rounded-[2rem] animate-pulse border-2 border-gray-50 shadow-sm"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <AnimatePresence>
                            {docs.map((doc) => (
                                <motion.div 
                                    key={doc._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => navigate(`/doc/${doc._id}`)}
                                    className="bg-white border-2 border-transparent rounded-[2.5rem] overflow-hidden shadow-premium hover:border-brand-primary/20 hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer group"
                                >
                                    <div className="h-48 bg-brand-surface flex items-center justify-center border-b border-gray-50 group-hover:bg-indigo-50/30 transition-colors relative">
                                        <div className="p-6 bg-white rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform">
                                            <FileText className="w-16 h-16 text-brand-primary group-hover:text-brand-secondary transition-colors" />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-black text-brand-text truncate pr-4 text-lg">{doc.title}</h3>
                                            <button 
                                                onClick={(e) => handleDeleteDoc(doc._id, e)}
                                                className="p-2 text-gray-300 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                            <div className="w-6 h-6 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                                                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                                            </div>
                                            <span className="flex items-center gap-1">
                                                Edited {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && docs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-300 bg-white/40 rounded-[3rem] border-2 border-dashed border-gray-100">
                        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8">
                            <FilePlus className="w-14 h-14 text-brand-primary/20" />
                        </div>
                        <p className="text-2xl font-black text-gray-500 mb-2 tracking-tight">The canvas is blank</p>
                        <p className="text-base font-bold text-gray-400">Time to write your first masterpiece.</p>
                        <button onClick={handleCreateDoc} className="mt-8 px-8 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            Start Writing
                        </button>
                    </div>
                )}
            </main>

            {/* Create Document Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-brand-text/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-lg bg-brand-surface rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-12 border border-white/20"
                        >
                            <div className="mb-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-xl flex items-center justify-center mb-6">
                                    <FilePlus className="text-white w-8 h-8" />
                                </div>
                                <h2 className="text-4xl font-black text-brand-text mb-3 tracking-tighter">New Masterpiece</h2>
                                <p className="text-gray-500 text-lg font-medium leading-relaxed">Every great story starts with a title. What's yours?</p>
                            </div>
                            
                            <form onSubmit={confirmCreateDoc}>
                                <div className="space-y-10">
                                    <div className="relative">
                                        <label className="block text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 ml-1">Document Title</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={newDocTitle}
                                            onChange={(e) => setNewDocTitle(e.target.value)}
                                            className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-[2rem] focus:border-brand-primary outline-none transition-all text-xl text-brand-text font-black placeholder:text-gray-200 shadow-sm shadow-indigo-100/30"
                                            placeholder="e.g. The Next Chapter"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            type="submit"
                                            disabled={isCreating || !newDocTitle.trim()}
                                            className="flex-1 py-6 bg-brand-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isCreating ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Create Project</span>
                                                    <Plus className="w-6 h-6" />
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="px-10 py-6 text-brand-text font-black bg-white rounded-[2rem] border-2 border-gray-100 hover:border-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
