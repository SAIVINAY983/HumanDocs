import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../api/api';
import { FileText, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get token from URL query params
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    useEffect(() => {
        if (!token) {
            setError('Missing reset token. Please request a new one.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await resetPassword({ token, newPassword: formData.password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
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
                    <div className="mb-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-brand-primary rounded-2xl shadow-xl flex items-center justify-center mb-8">
                            <KeyRound className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-black text-brand-text mb-4 tracking-tight">Set New Key</h1>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed">Choose a strong password to secure your workspace.</p>
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

                    {success ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-8 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[2.5rem] text-center shadow-xl shadow-emerald-100/20"
                        >
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                                <CheckCircle2 className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-emerald-900 mb-2">Success!</h2>
                            <p className="font-bold text-emerald-600/80 mb-6">Your password has been reset. Redirecting you to login...</p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                            >
                                Login Now
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">New Password</label>
                                <div className="relative group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        name="new-password"
                                        id="new-password"
                                        autoComplete="new-password"
                                        required
                                        className="w-full px-6 py-5 rounded-3xl bg-white border-2 border-gray-100 focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 shadow-sm placeholder:text-gray-300 pr-16"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-primary transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">Confirm Password</label>
                                <div className="relative group">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        name="confirm-password"
                                        id="confirm-password"
                                        autoComplete="new-password"
                                        required
                                        className="w-full px-6 py-5 rounded-3xl bg-white border-2 border-gray-100 focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 shadow-sm placeholder:text-gray-300 pr-16"
                                        placeholder="••••••••"
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-primary transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={loading || !token}
                                className="w-full py-6 bg-brand-text text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>Update Password</span>
                                        <div className="p-1.5 bg-white/10 rounded-xl group-hover:bg-brand-primary group-hover:rotate-12 transition-all">
                                            <KeyRound className="w-5 h-5" />
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

export default ResetPassword;
