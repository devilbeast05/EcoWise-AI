import React, { useState, useEffect } from "react";
import { api, type User, type DashboardData, type Activity, type Goal, type Badge, type ChatMessage } from "./services/api";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { Tracker } from "./components/Tracker";
import { Simulator } from "./components/Simulator";
import { Goals } from "./components/Goals";
import { Coach } from "./components/Coach";
import { 
  Leaf, Sun, Moon, LogOut, LayoutDashboard, 
  PlusCircle, ShieldAlert, CheckCircle2, MessageSquare, X, Send, Loader2 
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core App Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  // Global Chat Widget States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // 1. Initial Checks (Auth + Theme)
  useEffect(() => {
    // Auth Check
    const savedUser = localStorage.getItem("ecowise_user");
    const token = localStorage.getItem("ecowise_token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    // Theme Check
    const savedTheme = localStorage.getItem("ecowise_theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // 2. Fetch data when user logs in
  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dash, listAct, listGoals, listBadges] = await Promise.all([
        api.activities.getDashboard(),
        api.activities.list(),
        api.goals.list(),
        api.goals.badges()
      ]);
      setDashboardData(dash);
      setActivities(listAct);
      setGoals(listGoals);
      setBadges(listBadges);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setDashboardData(null);
      setActivities([]);
      setGoals([]);
      setBadges([]);
    }
  }, [user]);

  // 3. Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("ecowise_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 4. Logout handler
  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setActiveTab("dashboard");
    setChatHistory([]);
    setIsChatOpen(false);
  };

  // 5. Chat Widget message sending
  const handleSendWidgetMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    const updatedHistory = [...chatHistory, { sender: "user" as const, text: userMsg }];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const data = await api.coach.chat(userMsg, updatedHistory);
      setChatHistory([...updatedHistory, { sender: "model" as const, text: data.reply }]);
    } catch (err) {
      setChatHistory([...updatedHistory, { sender: "model" as const, text: "EcoBuddy is offline. Check backend services." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!user) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 pb-12">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-md shadow-emerald-500/10">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              EcoWise AI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {user.full_name || user.email}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Active Member
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Links Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto py-1 scrollbar-hide space-x-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "dashboard"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("tracker")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "tracker"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Activities Logger</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "simulator"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                 : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            <Leaf className="h-4 w-4" />
            <span>Twin Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab("goals")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "goals"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Goals & Milestones</span>
          </button>

          <button
            onClick={() => setActiveTab("coach")}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "coach"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>AI Coach & Reports</span>
          </button>
        </div>
      </div>

      {/* Main View Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8 flex-1">
        {loading && !dashboardData && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-sm">Fetching carbon calculations...</p>
          </div>
        )}

        {dashboardData && (
          <>
            {activeTab === "dashboard" && (
              <Dashboard data={dashboardData} goals={goals} />
            )}
            {activeTab === "tracker" && (
              <Tracker 
                activities={activities} 
                onActivityAdded={refreshData} 
                onActivityDeleted={async (id) => {
                  if (confirm("Are you sure you want to delete this activity log?")) {
                    await api.activities.delete(id);
                    refreshData();
                  }
                }} 
              />
            )}
            {activeTab === "simulator" && (
              <Simulator />
            )}
            {activeTab === "goals" && (
              <Goals goals={goals} badges={badges} onGoalAdded={refreshData} />
            )}
            {activeTab === "coach" && (
              <Coach />
            )}
          </>
        )}
      </main>

      {/* Global Floating Chatbot Widget Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center"
          title="EcoBuddy Chat"
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>

        {/* Floating Chat Panel Drawer */}
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]">
            {/* Widget Header */}
            <div className="p-4 bg-emerald-500 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Leaf className="h-4.5 w-4.5" />
                <span className="font-extrabold text-sm">EcoBuddy Chat Widget</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-slate-100">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Widget Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
              {chatHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <Leaf className="h-8 w-8 text-emerald-500/30 mx-auto mb-2" />
                  <p className="font-semibold">Chat with EcoBuddy AI</p>
                  <p className="text-slate-400 mt-1">
                    Ask me any questions about saving energy or reducing carbon.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[80%] rounded-xl px-3.5 py-1.5 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-emerald-500 text-white font-medium rounded-tr-none"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.text.split("\n").map((line, lIdx) => (
                        <p key={lIdx} className={line.startsWith("-") ? "pl-2 -indent-2" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-tl-none px-3.5 py-2 flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <Loader2 className="animate-spin h-3.5 w-3.5 text-emerald-500" />
                    <span>EcoBuddy is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Widget Input */}
            <form onSubmit={handleSendWidgetMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex space-x-2 bg-white dark:bg-slate-900">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask EcoBuddy..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
