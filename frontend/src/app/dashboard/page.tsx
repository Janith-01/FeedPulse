"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, FormEvent } from "react";
import { format } from "date-fns";
import { 
  LogOut, 
  Filter, 
  ChevronDown, 
  AlertCircle,
  Activity,
  BrainCircuit,
  LayoutDashboard,
  MessageSquare,
  Clock,
  Zap,
  Sparkles,
  X,
  RefreshCw
} from "lucide-react";

export default function AdminDashboardPage() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token) {
    return <LoginView />;
  }

  return <DashboardView token={token} />;
}

// ==========================================
// LOGIN VIEW
// ==========================================
function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (result.success && result.data?.token) {
        login(result.data.token);
      } else {
        setError(result.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-md p-8 bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/20">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-neutral-400 mt-2">Sign in to manage FeedPulse insights</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2 ml-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-neutral-600"
              placeholder="admin@feedpulse.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-neutral-600"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Sign In"}
            {/* Subtle gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD VIEW
// ==========================================
interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  ai_sentiment?: string;
  ai_priority?: number;
  ai_summary?: string;
  createdAt: string;
}

function DashboardView({ token }: { token: string }) {
  const { logout } = useAuth();
  
  const [data, setData] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Theme summary
  interface Theme {
    title: string;
    description: string;
  }
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themesOpen, setThemesOpen] = useState(false);
  const [themesLoading, setThemesLoading] = useState(false);
  const [themesError, setThemesError] = useState("");

  // Dead Letter Queue
  const [deadCount, setDeadCount] = useState(0);
  const [retryingDead, setRetryingDead] = useState(false);

  const fetchDeadQueue = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/admin/dead-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDeadCount(result.data.count);
      }
    } catch (err) {
      console.error("Failed to fetch dead queue count", err);
    }
  };

  const triggerDeadRetry = async () => {
    setRetryingDead(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/admin/dead-queue/retry-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        // Refresh everything
        fetchDeadQueue();
        fetchFeedback();
      }
    } catch (err) {
      console.error("Failed to retry dead items", err);
    } finally {
      setRetryingDead(false);
    }
  };

  const fetchThemes = async () => {
    setThemesLoading(true);
    setThemesError("");
    setThemesOpen(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/feedback/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success && result.data?.themes) {
        setThemes(result.data.themes);
      } else {
        setThemesError(result.message || "Failed to generate themes");
      }
    } catch (err) {
      setThemesError("Network error. Please try again.");
    } finally {
      setThemesLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const query = new URLSearchParams();
      if (statusFilter) query.append("status", statusFilter);
      if (categoryFilter) query.append("category", categoryFilter);

      const res = await fetch(`${apiUrl}/api/feedback?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data.items);
      }
    } catch (err) {
      console.error("Failed to fetch feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchDeadQueue();
  }, [statusFilter, categoryFilter, token]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic local update
        setData((prev) => 
          prev.map((item) => item._id === id ? { ...item, status: newStatus } : item)
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch(sentiment?.toLowerCase()) {
      case 'positive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'neutral': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const getPriorityBadge = (score?: number) => {
    if (!score) return <span className="text-neutral-500 text-xs">Unscored</span>;
    let color = "bg-neutral-800 text-neutral-300 border-neutral-700";
    if (score >= 8) color = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    else if (score >= 5) color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    else color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 w-max ${color}`}>
        <Zap className="w-3 h-3" />
        {score}/10
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      'New': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'In Review': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      'Resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    return map[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700';
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FeedPulse Admin</span>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-neutral-800/80 text-sm font-medium transition-colors text-neutral-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Dead Queue Banner */}
        {deadCount > 0 && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{deadCount} items failed AI analysis</p>
                <p className="text-xs text-neutral-400">Analysis stopped after 3+ attempts. You can trigger a manual retry.</p>
              </div>
            </div>
            <button
              onClick={triggerDeadRetry}
              disabled={retryingDead}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingDead ? 'animate-spin' : ''}`} />
              {retryingDead ? 'Retrying...' : 'Retry All'}
            </button>
          </div>
        )}

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Feedback Hub</h2>
            <p className="text-neutral-400 mt-2 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              AI-analyzed insights prioritized for your action
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {/* AI Themes Button */}
            <button
              onClick={fetchThemes}
              disabled={themesLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <Sparkles className={`w-4 h-4 ${themesLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
              {themesLoading ? 'Analyzing...' : 'AI Themes'}
            </button>
            {/* Category Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-neutral-500" />
              </div>
              <select
                className="pl-9 pr-10 py-2.5 bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none w-40 transition-shadow hover:bg-neutral-800/50 cursor-pointer"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Bug">Bug</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Improvement">Improvement</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Activity className="w-4 h-4 text-neutral-500" />
              </div>
              <select
                className="pl-9 pr-10 py-2.5 bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none w-40 transition-shadow hover:bg-neutral-800/50 cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Themes Panel */}
        {themesOpen && (
          <div className="mb-8 bg-neutral-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Theme Analysis</h3>
                  <p className="text-xs text-neutral-500">Top themes from the last 7 days of feedback</p>
                </div>
              </div>
              <button
                onClick={() => setThemesOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {themesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-neutral-800/50 rounded-xl border border-neutral-700/50" />
                ))}
              </div>
            ) : themesError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {themesError}
              </div>
            ) : themes.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-6">No themes found. Submit more feedback to generate insights.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes.map((theme, i) => (
                  <div
                    key={i}
                    className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        #{i + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white">{theme.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{theme.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Loop */}
        {loading ? (
          <div className="grid gap-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-neutral-900 rounded-2xl border border-neutral-800/50" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-24 bg-neutral-900/30 rounded-3xl border border-neutral-800/50 border-dashed">
            <MessageSquare className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-xl font-semibold text-neutral-400">No feedback found</p>
            <p className="text-neutral-500 mt-2">Adjust your filters or wait for new insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.map((item) => (
              <div 
                key={item._id} 
                className="bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 p-6 rounded-2xl transition-all shadow-sm hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden"
              >
                {/* Subtle side glow for high priority */}
                {(item.ai_priority && item.ai_priority >= 8) && (
                   <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-rose-900" />
                )}

                <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-start ml-2">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-800 text-neutral-300 rounded-md border border-neutral-700 uppercase tracking-wide">
                        {item.category}
                      </span>
                      {/* Sentiment Badge */}
                      {item.ai_sentiment ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.ai_sentiment === 'Positive'
                            ? 'bg-green-100 text-green-800'
                            : item.ai_sentiment === 'Negative'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.ai_sentiment}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-700 text-neutral-400 animate-pulse">
                          Analyzing…
                        </span>
                      )}
                      <div className="flex items-center text-xs text-neutral-500 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>
                      {item.ai_summary && (
                        <p className="text-sm text-neutral-400 leading-relaxed mt-2 border-l-2 border-indigo-500/30 pl-3">
                          <span className="font-semibold text-indigo-400 mr-1">AI Summary:</span>
                          {item.ai_summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end gap-4 shrink-0 mt-4 lg:mt-0">
                    <div className="flex items-center gap-3 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                      <div className="flex items-center justify-between min-w-[140px] gap-4">
                        <span className="text-xs text-neutral-500 font-medium">Sentiment</span>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getSentimentColor(item.ai_sentiment)}`}>
                          {item.ai_sentiment || 'Pending'}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-neutral-800" />
                      <div className="flex items-center justify-between min-w-[110px] gap-4">
                        <span className="text-xs text-neutral-500 font-medium">Priority</span>
                        {getPriorityBadge(item.ai_priority)}
                      </div>
                    </div>

                    <div className="relative mt-2 lg:mt-4 self-start lg:self-end">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item._id, e.target.value)}
                        className={`appearance-none bg-neutral-900 border text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer w-[150px] ${getStatusBadge(item.status)}`}
                      >
                        <option value="New" className="bg-neutral-900 text-white">New</option>
                        <option value="In Review" className="bg-neutral-900 text-white">In Review</option>
                        <option value="Resolved" className="bg-neutral-900 text-white">Resolved</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-60 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
