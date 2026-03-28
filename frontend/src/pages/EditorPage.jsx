import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { Loader2, Share2, Save, Users, ChevronLeft, FilePlus, Download, Printer, Undo2, Redo2, Copy, Clipboard, Monitor, ZoomIn, Link as LinkIcon, Image as ImageIcon, History, RotateCcw, X, Sparkles, Wand2, Type, CheckCheck, FileText, Lock } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getDoc, updateDoc, shareDoc, getVersions, saveVersion, aiSummarize, aiImprove, aiFix } from '../api/api';

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const EditorPage = () => {
    const { id: docId } = useParams();
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const [doc, setDoc] = useState(null);
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState('viewer');
    const [userRole, setUserRole] = useState('editor');
    const [publicAccess, setPublicAccess] = useState('none');
    const [activeMenu, setActiveMenu] = useState(null); // 'file', 'edit', 'view', 'insert', 'ai'
    const [aiLoading, setAiLoading] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [versions, setVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const initialLoadDone = useRef(false);
    const navigate = useNavigate();

    // Fetch initial document
    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await getDoc(docId);
                if (res?.data) {
                    setDoc(res.data);
                    setPublicAccess(res.data.publicAccess || 'none');
                    setUserRole(res.data.userRole || 'viewer');
                } else {
                    throw new Error('Invalid document data');
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    navigate('/dashboard');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [docId, navigate]);
    
    // Fetch versions when sidebar opens
    useEffect(() => {
        if (showVersions) {
            const fetchVersions = async () => {
                setLoadingVersions(true);
                try {
                    const res = await getVersions(docId);
                    setVersions(res.data.reverse());
                } catch (err) {
                    console.error('Failed to fetch versions', err);
                } finally {
                    setLoadingVersions(false);
                }
            };
            fetchVersions();
        }
    }, [showVersions, docId]);

    // Role enforcement on Quill
    useEffect(() => {
        if (quill == null) return;
        if (userRole === 'viewer') {
            quill.disable();
        } else {
            quill.enable();
        }
    }, [quill, userRole]);

    // Setup Socket & Join Room
    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001';
        const s = io(SOCKET_URL);
        setSocket(s);

        if (docId) {
            s.emit('join-document', docId);
        }

        return () => {
            s.disconnect();
        };
    }, [docId]);

    // Initial content load
    useEffect(() => {
        if (quill == null || doc == null || initialLoadDone.current) return;
        
        if (doc.documentContent) {
            try {
                const content = typeof doc.documentContent === 'string' ? JSON.parse(doc.documentContent) : doc.documentContent;
                if (content && content.ops) {
                    quill.setContents(content);
                } else if (typeof doc.documentContent === 'string') {
                    quill.setText(doc.documentContent);
                }
            } catch (e) {
                console.error('Content parse error', e);
                quill.setText(doc.documentContent);
            }
        }
        
        initialLoadDone.current = true;
        setTimeout(() => setIsLoaded(true), 100);
    }, [quill, doc]);

    // Handle remote changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta) => {
            // Delta from socket should be an object
            quill.updateContents(delta);
        };
        socket.on('receive-changes', handler);

        return () => {
            socket.off('receive-changes', handler);
        };
    }, [socket, quill]);

    // Send local changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;
            socket.emit('send-changes', { docId, content: delta });
        };
        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        };
    }, [socket, quill, docId]);

    // Auto-save
    useEffect(() => {
        if (socket == null || quill == null || !isLoaded) return;

        const interval = setInterval(() => {
            saveDocument();
        }, SAVE_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        };
    }, [socket, quill, isLoaded]);

    const handleVerifyPassword = async () => {
        setVerifying(true);
        try {
            await axios.post(`/api/docs/${docId}/verify-password`, { password: passwordInput });
            setIsPasswordVerified(true);
            // Re-fetch document to get content if it was restricted (optional, depends on backend logic)
            // For now, assume getDocumentById already returned the content if publicAccess was 'viewer'/'editor'
            // BUT if it's 'none', it was blocked. 
            // Better: After verification, we just set the flag.
        } catch (err) {
            alert('Incorrect password. Access denied.');
        } finally {
            setVerifying(false);
        }
    };

    const saveDocument = async () => {
        if (!quill || userRole === 'viewer') return;
        setSaving(true);
        try {
            await updateDoc(docId, { documentContent: quill.getContents() });
        } catch (err) {
            console.error('Save failed', err);
        } finally {
            setTimeout(() => setSaving(false), 1000);
        }
    };

    const [cursors, setCursors] = useState({});

    // Cursor Movement
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handleCursorChange = (range, oldRange, source) => {
            if (source !== 'user') return;
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            socket.emit('cursor-move', { 
                docId, 
                cursor: range, 
                userName: user.name,
                userId: user.id
            });
        };

        quill.on('selection-change', handleCursorChange);

        const updateCursor = (data) => {
            setCursors(prev => ({
                ...prev,
                [data.userId]: {
                    cursor: data.cursor,
                    userName: data.userName,
                    color: `hsl(${Math.abs(data.userId.split('').reduce((a,b)=>a+b.charCodeAt(0),0)%360)}, 70%, 50%)`
                }
            }));
        };

        socket.on('cursor-update', updateCursor);

        return () => {
            quill.off('selection-change', handleCursorChange);
            socket.off('cursor-update', updateCursor);
        };
    }, [socket, quill, docId]);

    const handleAIAction = async (type) => {
        if (!quill) return;
        const selection = quill.getSelection();
        const text = selection?.length > 0 ? quill.getText(selection.index, selection.length) : quill.getText();
        
        setAiLoading(true);
        try {
            let res;
            if (type === 'summarize') res = await aiSummarize({ text });
            else if (type === 'improve') res = await aiImprove({ text });
            else if (type === 'fix') res = await aiFix({ text });

            if (res.data?.result) {
                if (selection?.length > 0) {
                    quill.deleteText(selection.index, selection.length);
                    quill.insertText(selection.index, res.data.result);
                } else {
                    // If no selection, insert at cursor position or append
                    const range = quill.getSelection() || { index: quill.getLength() };
                    if (type === 'summarize') {
                        quill.insertText(quill.getLength(), `\n\n--- AI Summary ---\n${res.data.result}`);
                    } else {
                        // For improve/fix, if no selection, we just insert at cursor
                        quill.insertText(range.index, res.data.result);
                    }
                }
                socket.emit('send-changes', { docId, content: quill.getContents() });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'AI Assistant is currently unavailable. Please check your Gemini API key.');
        } finally {
            setAiLoading(false);
        }
    };

    const downloadDoc = (type) => {
        if (!quill) return;
        
        if (type === 'pdf') {
            const element = document.querySelector('.ql-editor');
            const opt = {
                margin: 1,
                filename: `${doc?.title || 'document'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().from(element).set(opt).save();
        } else {
            const text = quill.getText();
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc?.title || 'document'}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const renderCursors = () => {
        if (!quill) return null;
        return Object.entries(cursors).map(([userId, info]) => {
            if (!info.cursor) return null;
            const bounds = quill.getBounds(info.cursor.index);
            if (!bounds) return null;

            return (
                <div 
                    key={userId}
                    className="absolute z-20 pointer-events-none transition-all duration-100"
                    style={{ 
                        top: bounds.top, 
                        left: bounds.left, 
                    }}
                >
                    <div 
                        className="w-0.5 h-6 relative"
                        style={{ backgroundColor: info.color }}
                    >
                        <div 
                            className="absolute bottom-full left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap mb-1"
                            style={{ backgroundColor: info.color }}
                        >
                            {info.userName}
                        </div>
                    </div>
                </div>
            );
        });
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-brand-surface">
            <div className="flex flex-col items-center gap-6">
                <div className="p-5 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[2rem] shadow-2xl animate-bounce">
                    <FileText className="w-12 h-12 text-white" />
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-black text-brand-text tracking-tighter">HumanDocs</h2>
                    <p className="text-gray-400 font-bold animate-pulse mt-2">Opening your workspace...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col font-['Inter']">
            {/* Password Lock Screen */}
            {doc?.isPasswordProtected && !isPasswordVerified && userRole !== 'owner' && (
                <div className="fixed inset-0 z-[200] bg-brand-surface/90 backdrop-blur-2xl flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md bg-white rounded-[3rem] shadow-premium p-12 border border-white text-center"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-8">
                            <Lock className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-brand-text tracking-tighter mb-4">Protected Document</h2>
                        <p className="text-gray-400 font-bold mb-10 leading-relaxed">
                            This document is sensitive. Please enter the password to gain entry.
                        </p>
                        
                        <div className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Enter secret password..."
                                className="w-full px-8 py-5 rounded-[1.5rem] bg-brand-surface border-2 border-transparent focus:border-brand-primary/20 outline-none text-brand-text font-bold shadow-inner placeholder:text-gray-300 transition-all text-center tracking-[0.3em]"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                            />
                            <button 
                                onClick={handleVerifyPassword}
                                disabled={verifying}
                                className="w-full py-5 bg-brand-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {verifying ? 'Unlocking...' : 'Unlock Masterpiece'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-brand-surface rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-brand-primary transition-colors" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl shadow-md">
                            <FileText className="text-white w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    defaultValue={doc?.title} 
                                    onBlur={(e) => updateDoc(docId, { title: e.target.value })}
                                    className="text-xl font-black text-brand-text outline-none bg-transparent hover:bg-brand-surface px-3 py-1 rounded-xl transition-all focus:bg-white focus:ring-4 focus:ring-brand-primary/5 border-2 border-transparent focus:border-brand-primary/10"
                                />
                                <div className={`w-2 h-2 rounded-full ${saving ? 'bg-amber-400 animate-pulse' : 'bg-brand-accent'}`} title={saving ? 'Saving...' : 'Changes Saved'} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] px-3 mt-1 relative">
                            {[
                                { id: 'file', label: 'File', items: [
                                    { label: 'New', icon: <FilePlus className="w-4 h-4" />, action: () => navigate('/dashboard') },
                                    { label: 'Save Snapshot', icon: <Save className="w-4 h-4" />, action: async () => {
                                        await saveVersion(docId);
                                        alert('Version snapshot saved!');
                                    }},
                                    { label: 'Version History', icon: <History className="w-4 h-4" />, action: () => setShowVersions(true) },
                                    { label: 'Download (.txt)', icon: <Download className="w-4 h-4" />, action: () => downloadDoc('text') },
                                    { label: 'Download (.pdf)', icon: <Download className="w-4 h-4" />, action: () => downloadDoc('pdf') },
                                    { label: 'Print', icon: <Printer className="w-4 h-4" />, action: () => window.print() }
                                ]},
                                { id: 'edit', label: 'Edit', items: [
                                    { label: 'Undo', icon: <Undo2 className="w-4 h-4" />, action: () => quill?.history.undo() },
                                    { label: 'Redo', icon: <Redo2 className="w-4 h-4" />, action: () => quill?.history.redo() },
                                    { label: 'Copy', icon: <Copy className="w-4 h-4" />, action: () => document.execCommand('copy') },
                                    { label: 'Paste', icon: <Clipboard className="w-4 h-4" />, action: () => navigator.clipboard.readText().then(text => quill?.insertText(quill.getSelection()?.index || 0, text)) }
                                ]},
                                { id: 'view', label: 'View', items: [
                                    { label: 'Full Screen', icon: <Monitor className="w-4 h-4" />, action: () => document.documentElement.requestFullscreen() },
                                    { label: 'Zoom 100%', icon: <ZoomIn className="w-4 h-4" />, action: () => {} }
                                ]},
                                { id: 'insert', label: 'Insert', items: [
                                    { label: 'Link', icon: <LinkIcon className="w-4 h-4" />, action: () => {
                                        const url = prompt('Enter URL:');
                                        if (url) quill?.format('link', url);
                                    }},
                                    { label: 'Image', icon: <ImageIcon className="w-4 h-4" />, action: () => {
                                        const url = prompt('Enter Image URL:');
                                        if (url) quill?.insertEmbed(quill.getSelection()?.index || 0, 'image', url);
                                    }}
                                ]},
                                { id: 'ai', label: 'AI Assistant', items: [
                                    { label: 'Summarize', icon: <Sparkles className="w-4 h-4" />, action: () => handleAIAction('summarize') },
                                    { label: 'Improve Writing', icon: <Wand2 className="w-4 h-4" />, action: () => handleAIAction('improve') },
                                    { label: 'Fix Grammar', icon: <CheckCheck className="w-4 h-4" />, action: () => handleAIAction('fix') }
                                ]}
                            ].map((menu) => (
                                <div key={menu.id} className="relative">
                                    <button 
                                        onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                                        className={`px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium ${activeMenu === menu.id ? 'bg-gray-100 text-blue-600' : 'text-gray-600'}`}
                                    >
                                        {menu.label}
                                    </button>
                                    <AnimatePresence>
                                        {activeMenu === menu.id && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-[60]" 
                                                    onClick={() => setActiveMenu(null)}
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 min-w-[200px] z-[70] overflow-hidden"
                                                >
                                                    {menu.items.map((item, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => {
                                                                item.action();
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm transition-colors flex items-center gap-3 group"
                                                        >
                                                            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                                                {item.icon}
                                                            </span>
                                                            <span className="flex-1 font-medium">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            <div className="flex items-center gap-1 text-gray-400 ml-4 border-l pl-4">
                                {saving ? 'Saving...' : 'Saved to Drive'}
                            </div>
                            {aiLoading && (
                                <div className="flex items-center gap-1 text-blue-500 ml-4 animate-pulse font-medium">
                                    <Sparkles className="w-3 h-3 animate-spin" />
                                    AI is thinking...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-6 py-3 bg-brand-surface/50 text-indigo-900 border border-gray-100 rounded-2xl font-black hover:bg-indigo-50 transition-all">
                        <Users className="w-5 h-5 text-brand-primary" />
                        <span className="text-sm">Collaborators ({doc?.collaborators?.length + 1})</span>
                    </button>
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-3 px-8 py-3 bg-brand-primary text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">Share</span>
                    </button>
                    <div className="w-11 h-11 bg-gradient-to-br from-rose-400 to-brand-secondary rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg cursor-pointer ml-2 border-2 border-white">
                        {(() => {
                            try {
                                return JSON.parse(localStorage.getItem('user'))?.name?.[0] || 'U';
                            } catch (e) {
                                return 'U';
                            }
                        })()}
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-brand-text/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-xl bg-brand-surface rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-12 border border-white/20"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-xl flex items-center justify-center mb-6">
                                        <Share2 className="text-white w-7 h-7" />
                                    </div>
                                    <h3 className="text-3xl font-black text-brand-text tracking-tighter">Collaborate</h3>
                                    <p className="text-gray-400 font-bold mt-1">Invite others to your masterpiece</p>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-gray-300" />
                                </button>
                            </div>

                            <div className="mb-10 space-y-6">
                                <div className="p-8 bg-white rounded-[2rem] border-2 border-gray-50 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div>
                                            <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Global Access</h4>
                                            <p className="text-sm font-black text-brand-text mt-1">
                                                {publicAccess === 'none' ? 'Invite Only' : 'Public Access'}
                                            </p>
                                        </div>
                                        {userRole === 'owner' && (
                                            <select 
                                                className="text-xs font-black bg-brand-surface border-2 border-transparent focus:border-brand-primary/10 rounded-xl px-4 py-2 outline-none appearance-none cursor-pointer"
                                                value={publicAccess}
                                                onChange={async (e) => {
                                                    const newAccess = e.target.value;
                                                    setPublicAccess(newAccess);
                                                    await updateDoc(docId, { publicAccess: newAccess });
                                                }}
                                            >
                                                <option value="none">Restricted</option>
                                                <option value="viewer">Anyone (View)</option>
                                                <option value="editor">Anyone (Edit)</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center border-2 border-gray-50">
                                            <LinkIcon className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 leading-tight">
                                                {publicAccess === 'none' ? 'Shared privately with selected accounts' : 'Anyone with the link can access this document'}
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    alert('Link copied with style!');
                                                }}
                                                className="text-[10px] text-brand-primary font-black mt-2 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                            >
                                                Copy Magic Link
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
                                </div>

                                {userRole === 'owner' && (
                                    <div className="p-8 bg-brand-surface rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Lock className="w-4 h-4 text-brand-primary" />
                                                <h4 className="text-[10px] font-black text-brand-text uppercase tracking-widest">Vault Security</h4>
                                            </div>
                                            <button 
                                                onClick={async () => {
                                                    const pwd = prompt("Enter new password (leave blank to remove):");
                                                    if (pwd !== null) {
                                                        await updateDoc(docId, { password: pwd });
                                                        alert(pwd === "" ? "Security disabled." : "Vault locked successfully!");
                                                        window.location.reload(); // Quick refresh to update state
                                                    }
                                                }}
                                                className="text-[10px] font-black text-brand-primary hover:text-indigo-700 transition-colors uppercase tracking-widest"
                                            >
                                                {doc?.isPasswordProtected ? 'Change Key' : 'Lock Vault'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400">
                                            {doc?.isPasswordProtected ? 'This document is encrypted and secure.' : 'Documents in the vault are protected by state-of-the-art encryption.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="relative mb-10 group">
                                <div className="flex gap-4">
                                    <input 
                                        type="email" 
                                        placeholder="Enter email to invite..."
                                        className="flex-1 px-8 py-5 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-brand-primary/20 outline-none text-brand-text font-bold shadow-sm placeholder:text-gray-200 transition-all"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                    />
                                    <select 
                                        className="px-6 py-5 rounded-[1.5rem] bg-white border-2 border-transparent outline-none font-bold text-gray-400 appearance-none cursor-pointer shadow-sm hover:border-gray-100 transition-all"
                                        value={shareRole}
                                        onChange={(e) => setShareRole(e.target.value)}
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-10">
                                <h4 className="text-[10px] font-black text-gray-300 mb-6 uppercase tracking-[0.3em] ml-1">Inner Circle</h4>
                                <div className="space-y-6 max-h-[200px] overflow-y-auto pr-4 scrollbar-hide">
                                    <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                                                {doc?.owner?.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-text leading-tight">{doc?.owner?.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{doc?.owner?.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-brand-surface rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">Master</span>
                                    </div>
                                    {doc?.collaborators?.map(c => (
                                        <div key={c.user._id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white border-2 border-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black">
                                                    {c.user.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-brand-text leading-tight">{c.user.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.user.email}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-brand-primary uppercase tracking-widest">{c.role}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-10 border-t border-gray-100">
                                <button onClick={() => setShowShareModal(false)} className="px-10 py-5 text-gray-400 font-black hover:text-brand-text transition-colors">Dismiss</button>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await shareDoc(docId, { email: shareEmail, role: shareRole });
                                            setShowShareModal(false);
                                            window.location.reload();
                                        } catch (err) {
                                            alert(err.response?.data?.message || 'Summoning failed');
                                        }
                                    }}
                                    className="px-12 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95"
                                >
                                    Send Invitations
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showVersions && (
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 bottom-0 w-96 bg-white/95 backdrop-blur-2xl border-l border-gray-100 shadow-[-20px_0_50px_rgba(0,0,0,0.05)] z-[150] flex flex-col"
                    >
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50">
                            <div>
                                <h3 className="text-xl font-black text-brand-text flex items-center gap-3">
                                    <History className="w-6 h-6 text-brand-primary" />
                                    Timeline
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Version History</p>
                            </div>
                            <button onClick={() => setShowVersions(false)} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 space-y-6">
                            {loadingVersions ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-brand-primary w-8 h-8" />
                                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Loading Records</p>
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-300 font-bold">No snapshots found.</p>
                                </div>
                            ) : (
                                versions.map((v, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ x: -4 }}
                                        className="p-5 bg-brand-surface border-2 border-transparent hover:border-brand-primary/20 rounded-[2rem] transition-all cursor-pointer group relative"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-3 py-1 bg-white rounded-lg text-[10px] font-black text-brand-primary uppercase tracking-widest shadow-sm">
                                                Snapshot {versions.length - idx}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    quill.setContents(v.documentContent);
                                                    socket.emit('send-changes', { docId, content: v.documentContent });
                                                    setShowVersions(false);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2.5 bg-brand-primary text-white rounded-xl transition-all shadow-xl shadow-indigo-200"
                                                title="Restore this version"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-lg font-black text-brand-text">{new Date(v.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs font-bold text-gray-400">{new Date(v.createdAt).toLocaleTimeString()}</p>
                                        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                                            <div className="w-6 h-6 bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-md flex items-center justify-center text-[8px] font-black">
                                                {v.user?.name?.[0]}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{v.user?.name}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-auto bg-gray-100/50 pb-20 relative">
                {renderCursors()}
                <ReactQuill 
                    theme="snow"
                    ref={(el) => {
                        if (el) {
                            setQuill(el.getEditor());
                        }
                    }}
                    modules={{ toolbar: TOOLBAR_OPTIONS }}
                    className="max-w-[850px] mx-auto mt-4"
                />
            </div>
        </div>
    );
};

export default EditorPage;
