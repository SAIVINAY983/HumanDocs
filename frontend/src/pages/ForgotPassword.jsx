import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import { FileText, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [debugToken, setDebugToken] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address format.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await forgotPassword({ email });
            setMessage(res.data.message);
            if (res.data.debugToken) {
                setDebugToken(res.data.debugToken);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please check your email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-surface font-['Inter']">
            <div className="w-full flex items-center justify-center p-8 lg:p-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-black text-gray-400 hover:text-brand-primary transition-colors mb-12 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Login</span>
                    </Link>

                    <div className="mb-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-brand-primary rounded-2xl shadow-xl flex items-center justify-center mb-8">
                            <Mail className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-black text-brand-text mb-4 tracking-tight">Forgot Keys?</h1>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed">No worries. Enter your email and we'll send you a recovery token.</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl text-sm font-bold flex items-center gap-4 shadow-sm"
                        >
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                            {error}
                        </motion.div>
                    )}

                    {message && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-6 bg-indigo-50 border border-indigo-100 text-brand-primary rounded-3xl text-sm font-bold shadow-sm"
                        >
                            <p className="mb-4">{message}</p>
                            {debugToken && (
                                <div className="p-4 bg-white rounded-2xl border border-indigo-100 mt-4">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Development Reset Token:</p>
                                    <code className="text-sm font-black break-all">{debugToken}</code>
                                    <button 
                                        onClick={() => navigate(`/reset-password?token=${debugToken}`)}
                                        className="w-full mt-4 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                    >
                                        Use Token Now
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!message && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">Email Address</label>
                                <div className="relative group">
                                    <input 
                                        type="email" 
                                        name="email"
                                        id="email"
                                        autoComplete="username"
                                        required
                                        className={`w-full px-6 py-5 rounded-3xl bg-white border-2 outline-none transition-all font-bold text-gray-700 shadow-sm placeholder:text-gray-300 ${
                                            email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) 
                                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' 
                                            : 'border-gray-100 focus:border-brand-primary focus:ring-brand-primary/5'
                                        }`}
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                        <p className="absolute -bottom-6 left-4 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                                            Invalid email format
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-brand-text text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-4 group"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>Send Recovery Token</span>
                                        <div className="p-1.5 bg-white/10 rounded-xl group-hover:bg-brand-primary group-hover:rotate-12 transition-all">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
