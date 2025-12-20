import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    signOut,
    signInAnonymously
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const appId = 'prepify-app';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Icon = ({ path, className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
    </svg>
);

const ProgressCircle = ({ progress, theme }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const progressColor = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500';

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className={theme === 'dark' ? "text-gray-700" : "text-slate-200"} strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                <circle
                    className={`${progressColor} transition-all duration-500 ease-out`}
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50"
                    cy="50"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                />
            </svg>
            <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold ${progressColor}`}>
                {Math.round(progress)}%
            </span>
        </div>
    );
};

const TopicBox = ({ topic, onToggle, onDelete, theme }) => {
    const bgColor = topic.completed 
        ? (theme === 'dark' ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-emerald-50 border-emerald-500/50') 
        : (theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200');
    
    const textColor = topic.completed 
        ? (theme === 'dark' ? 'text-gray-400' : 'text-slate-400') 
        : (theme === 'dark' ? 'text-gray-200' : 'text-slate-700');

    return (
        <div 
            className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${bgColor}`}
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${topic.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                    {topic.completed && <Icon path="M5 13l4 4L19 7" className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm md:text-base font-medium ${textColor} ${topic.completed ? 'line-through decoration-emerald-500/50' : ''}`}>
                    {topic.name}
                </span>
            </div>
            <button 
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
            </button>
        </div>
    );
};

const GoalCard = ({ goal, onUpdateGoal, onDeleteGoal, theme }) => {
    const [newTopic, setNewTopic] = useState('');
    const completedTopics = goal.topics.filter(t => t.completed).length;
    const totalTopics = goal.topics.length;
    const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    const handleAddTopic = (e) => {
        e.preventDefault();
        if (newTopic.trim()) {
            onUpdateGoal({ ...goal, topics: [...goal.topics, { name: newTopic.trim(), completed: false }] });
            setNewTopic('');
        }
    };

    const handleToggleTopic = (idx) => {
        const newTopics = goal.topics.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t);
        onUpdateGoal({ ...goal, topics: newTopics });
    };

    const handleDeleteTopic = (idx) => {
        onUpdateGoal({ ...goal, topics: goal.topics.filter((_, i) => i !== idx) });
    };

    return (
        <div className={`flex flex-col p-6 rounded-2xl shadow-lg border transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{goal.name}</h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        {completedTopics} of {totalTopics} topics completed
                    </p>
                </div>
                <button 
                    onClick={onDeleteGoal} 
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </button>
            </div>
            
            <div className="flex justify-center mb-8">
                <ProgressCircle progress={progress} theme={theme} />
            </div>

            <form onSubmit={handleAddTopic} className="mb-6">
                <div className="relative">
                    <input 
                        type="text" 
                        value={newTopic} 
                        onChange={(e) => setNewTopic(e.target.value)} 
                        placeholder="Add a study topic..." 
                        className={`w-full py-3 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                            theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-slate-100 border-slate-200 text-slate-900'
                        }`}
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold p-1">
                        <Icon path="M12 4v16m8-8H4" />
                    </button>
                </div>
            </form>

            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {goal.topics.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                        No topics yet. Start adding!
                    </div>
                ) : (
                    goal.topics.map((t, i) => (
                        <TopicBox key={i} topic={t} onToggle={() => handleToggleTopic(i)} onDelete={() => handleDeleteTopic(i)} theme={theme} />
                    ))
                )}
            </div>
        </div>
    );
};

const AuthPage = ({ theme, setTheme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
            else await signInWithEmailAndPassword(auth, email, password);
        } catch (err) { 
            setError(err.message.replace('Firebase: ', '')); 
        } finally {
            setLoading(false);
        }
    };

    const googleSignIn = async () => {
        setError('');
        try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { setError(err.message); }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#111827]' : 'bg-slate-50'}`}>
            <div className={`w-full max-w-md p-10 rounded-3xl shadow-2xl border transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black text-emerald-500 mb-2 tracking-tighter italic text-shadow-sm">Prepify</h1>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Track your preparation like a pro.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className={`w-full p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                            theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                        }`} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className={`w-full p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                            theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                        }`} 
                        required 
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Create Free Account' : 'Sign In Now')}
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <hr className="flex-1 border-slate-200 dark:border-gray-700" />
                    <span>or</span>
                    <hr className="flex-1 border-slate-200 dark:border-gray-700" />
                </div>

                <button 
                    onClick={googleSignIn} 
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 border transition-all hover:shadow-md ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>

                {error && <p className="text-red-500 text-xs mt-6 text-center font-medium">{error}</p>}

                <div className="mt-8 text-center text-sm font-medium">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>
                        {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
                    </span>
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)} 
                        className="ml-2 text-emerald-500 hover:underline font-bold"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
            
            <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`mt-10 p-3 rounded-full transition-colors ${theme === 'dark' ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-slate-200'}`}
            >
                {theme === 'dark' ? <Icon path="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> : <Icon path="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
            </button>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchGoals = async () => {
            try {
                const docRef = doc(db, "artifacts", appId, "users", user.uid, "goals", "userGoals");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setGoals(snap.data().goals || []);
                }
            } catch (err) {
                console.error("Error fetching goals:", err);
            }
        };
        fetchGoals();
    }, [user]);

    useEffect(() => {
        if (!user || loading) return;
        const saveGoals = async () => {
            try {
                const docRef = doc(db, "artifacts", appId, "users", user.uid, "goals", "userGoals");
                await setDoc(docRef, { goals });
            } catch (err) {
                console.error("Error saving goals:", err);
            }
        };
        saveGoals();
    }, [goals, user, loading]);

    const addGoal = (e) => {
        e.preventDefault();
        if (newGoal.trim()) {
            setGoals([{ id: Date.now(), name: newGoal.trim(), topics: [] }, ...goals]);
            setNewGoal('');
        }
    };

    if (loading) {
        return (
            <div className={`h-screen flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#111827]' : 'bg-slate-50'}`}>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="font-black text-emerald-500 text-2xl animate-pulse">Prepify</div>
            </div>
        );
    }

    if (!user) return <AuthPage theme={theme} setTheme={setTheme} />;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#111827] text-white' : 'bg-slate-50 text-slate-900'}`}>
            <header className={`sticky top-0 z-10 border-b backdrop-blur-md transition-all ${theme === 'dark' ? 'bg-[#111827]/80 border-gray-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-black text-emerald-500 tracking-tighter italic">Prepify</h1>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-slate-100 text-gray-500'}`}
                        >
                            {theme === 'dark' ? <Icon path="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> : <Icon path="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 hidden sm:block"></div>
                        <span className="text-sm font-bold opacity-70 hidden sm:block">{user.email}</span>
                        <button 
                            onClick={() => signOut(auth)} 
                            className={`text-sm font-bold py-2 px-4 rounded-lg transition-colors border ${theme === 'dark' ? 'border-gray-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-500'}`}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <section className="mb-16">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black mb-3">What are we crushing today?</h2>
                        <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Track progress across your study goals and stay consistent.</p>
                    </div>
                    
                    <form onSubmit={addGoal} className="max-w-2xl mx-auto flex gap-3">
                        <input 
                            type="text" 
                            value={newGoal} 
                            onChange={e => setNewGoal(e.target.value)} 
                            placeholder="Add a new goal (e.g. Master React in 30 Days)" 
                            className={`flex-1 p-5 rounded-2xl border text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm ${
                                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-slate-900 shadow-slate-100'
                            }`}
                        />
                        <button 
                            type="submit" 
                            className="px-8 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            Add
                        </button>
                    </form>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {goals.length === 0 ? (
                        <div className={`col-span-full text-center py-20 border-2 border-dashed rounded-3xl ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`}>
                            <Icon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" className="w-16 h-16 mx-auto mb-4 text-emerald-500/20" />
                            <h3 className="text-xl font-bold mb-1 opacity-50">Empty Road Map</h3>
                            <p className="opacity-40 max-w-xs mx-auto">Add your first goal above to start tracking your progress journey.</p>
                        </div>
                    ) : (
                        goals.map(g => (
                            <GoalCard 
                                key={g.id} goal={g} theme={theme}
                                onUpdateGoal={updated => setGoals(goals.map(x => x.id === updated.id ? updated : x))}
                                onDeleteGoal={() => {
                                    if (window.confirm(`Delete "${g.name}"?`)) {
                                        setGoals(goals.filter(x => x.id !== g.id));
                                    }
                                }}
                            />
                        ))
                    )}
                </div>
            </main>
            
            <footer className={`mt-20 py-10 border-t ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-slate-200 text-slate-400'} text-center text-sm font-medium`}>
                <p>&copy; 2025 Prepify. Built for focused learners.</p>
            </footer>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: ${theme === 'dark' ? '#374151' : '#E2E8F0'}; 
                    border-radius: 10px; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background: ${theme === 'dark' ? '#4B5563' : '#CBD5E1'}; 
                }
            `}</style>
        </div>
    );
}