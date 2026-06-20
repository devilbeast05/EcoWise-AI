import React, { useState, useEffect } from "react";
import { api, API_BASE_URL, type CoachRecommendations, type WeeklyReport, type ChatMessage } from "../services/api";
import { 
  Sparkles, FileText, Download, Send, 
  HelpCircle, MessageSquare, Loader2, Award, Zap, AlertCircle 
} from "lucide-react";

export const Coach: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("advice"); // advice, report, chat
  
  // Advice States
  const [advice, setAdvice] = useState<CoachRecommendations | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");

  // Report States
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError("");
    try {
      const data = await api.coach.getRecommendations();
      setAdvice(data);
    } catch (err: any) {
      setAdviceError(err.message || "Failed to fetch AI coach advice.");
    } finally {
      setAdviceLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    setReportError("");
    try {
      const data = await api.coach.getWeeklyReport();
      setReport(data);
    } catch (err: any) {
      setReportError(err.message || "Failed to generate weekly report.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "advice" && !advice) {
      fetchAdvice();
    } else if (activeSubTab === "report" && !report) {
      fetchReport();
    }
  }, [activeSubTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    // Add user message to history
    const updatedHistory: ChatMessage[] = [...chatHistory, { sender: "user", text: userMsg }];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const data = await api.coach.chat(userMsg, updatedHistory);
      setChatHistory([...updatedHistory, { sender: "model", text: data.reply }]);
    } catch (err) {
      setChatHistory([...updatedHistory, { sender: "model", text: "I had trouble responding. Please check your network connection." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("ecowise_token");
      const res = await fetch(`${API_BASE_URL}/coach/weekly-report/pdf`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Could not download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly_sustainability_report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to download PDF report. Make sure the backend is active.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-fade-in flex flex-col min-h-[550px]">
      {/* Sub Tabs Header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 px-6 pt-3 space-x-4">
        <button
          onClick={() => setActiveSubTab("advice")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeSubTab === "advice"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Coach Recommendations</span>
        </button>

        <button
          onClick={() => setActiveSubTab("report")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeSubTab === "report"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Weekly AI Report</span>
        </button>

        <button
          onClick={() => setActiveSubTab("chat")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeSubTab === "chat"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>EcoBuddy Chat Assistant</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Tab 1: AI Coach Recommendations */}
        {activeSubTab === "advice" && (
          <div className="space-y-6 flex-1">
            {adviceLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm">Gemini AI is analyzing your footprint...</p>
              </div>
            ) : adviceError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500 font-semibold">{adviceError}</p>
                <button 
                  onClick={fetchAdvice}
                  className="mt-3 text-xs bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg hover:bg-emerald-600"
                >
                  Retry Analysis
                </button>
              </div>
            ) : advice ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Insights */}
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-5 rounded-xl space-y-4">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4.5 w-4.5 text-blue-500" />
                    <span>Behavioral Insights</span>
                  </h4>
                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                    {advice.insights.map((item, idx) => (
                      <li key={idx} className="marker:text-blue-500">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-5 rounded-xl space-y-4">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-2">
                    <Zap className="h-4.5 w-4.5 text-amber-500" />
                    <span>Coach Recommendations</span>
                  </h4>
                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                    {advice.recommendations.map((item, idx) => (
                      <li key={idx} className="marker:text-amber-500">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* High impact Actions */}
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-5 rounded-xl space-y-4">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-2">
                    <Award className="h-4.5 w-4.5 text-emerald-500" />
                    <span>High-Impact Actions</span>
                  </h4>
                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                    {advice.high_impact_actions.map((item, idx) => (
                      <li key={idx} className="marker:text-emerald-500">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: Weekly Report */}
        {activeSubTab === "report" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm">Compiling weekly report summary...</p>
              </div>
            ) : reportError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500 font-semibold">{reportError}</p>
                <button 
                  onClick={fetchReport}
                  className="mt-3 text-xs bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg hover:bg-emerald-600"
                >
                  Regenerate Report
                </button>
              </div>
            ) : report ? (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mb-2">Weekly Summary</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    {report.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                      Positive Habits
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                      {report.positive_habits.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
                      Improvement Areas
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                      {report.improvement_areas.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export PDF Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 3: EcoBuddy Chat Assistant */}
        {activeSubTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 max-h-[350px]">
              {chatHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <HelpCircle className="h-10 w-10 text-emerald-500/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Talk to EcoBuddy AI</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ask questions like: "How can I reduce my carbon footprint?" or "Is cycling better than driving?"
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-emerald-500 text-white font-medium rounded-tr-none shadow-sm shadow-emerald-500/10"
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2 text-xs text-slate-400">
                    <Loader2 className="animate-spin h-4 w-4 text-emerald-500" />
                    <span>EcoBuddy is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask EcoBuddy anything..."
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
