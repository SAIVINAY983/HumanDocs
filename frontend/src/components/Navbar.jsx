import { useNavigate, Link } from 'react-router-dom';
import { FileText, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const navigate = useNavigate();
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-3 group">
                    <div className="p-2 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
                        <FileText className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-brand-text tracking-tighter group-hover:text-brand-primary transition-colors">HumanDocs</span>
                </Link>
            </div>
            
            <div className="flex-1 max-w-2xl mx-12">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Find your ideas..." 
                        className="w-full bg-brand-surface px-6 py-3.5 rounded-2xl focus:bg-white focus:shadow-2xl focus:shadow-indigo-100 outline-none transition-all border-2 border-transparent focus:border-brand-primary/20 font-bold text-brand-text placeholder:text-gray-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 border-2 border-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-widest hidden lg:block">
                        Search
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-brand-surface cursor-pointer transition-all border border-transparent hover:border-gray-100 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-xl flex items-center justify-center font-black shadow-lg group-hover:scale-110 transition-transform">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="hidden md:block">
                        <span className="text-sm font-black text-brand-text block leading-none">{user?.name || 'User'}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Writter</span>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-3 text-gray-300 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all hover:rotate-12"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>
        </nav>
    );
}
