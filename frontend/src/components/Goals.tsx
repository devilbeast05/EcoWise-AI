import React, { useState } from "react";
import { api, type Goal, type Badge } from "../services/api";
import { Award, CheckCircle2, Flag, Loader2, Plus, Sparkles, Target, Trophy } from "lucide-react";

interface GoalsProps {
  goals: Goal[];
  badges: Badge[];
  onGoalAdded: () => void;
}

// Badge styling mapping
const BADGE_INFO = {
  first_log: {
    title: "Eco Starter",
    desc: "Logged your first activity to start tracking.",
    icon: Target,
    color: "from-emerald-400 to-teal-500 shadow-teal-500/20 text-white",
  },
  green_streak: {
    title: "Green Streak",
    desc: "Logged activities on 3 different days.",
    icon: Trophy,
    color: "from-blue-400 to-indigo-500 shadow-indigo-500/20 text-white",
  },
  goal_crusher: {
    title: "Goal Crusher",
    desc: "Successfully achieved a carbon reduction goal.",
    icon: Award,
    color: "from-amber-400 to-orange-500 shadow-orange-500/20 text-white",
  },
  carbon_twin_pioneer: {
    title: "Twin Pioneer",
    desc: "Adjusted lifestyle parameters in the simulator.",
    icon: Sparkles,
    color: "from-pink-400 to-rose-500 shadow-rose-500/20 text-white",
  },
};

export const Goals: React.FC<GoalsProps> = ({ goals, badges, onGoalAdded }) => {
  const [period, setPeriod] = useState("monthly");
  const [target, setTarget] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Default end date is 30 days from now
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 30);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split("T")[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    const newEnd = new Date();
    if (val === "monthly") {
      newEnd.setDate(newEnd.getDate() + 30);
    } else {
      newEnd.setDate(newEnd.getDate() + 90);
    }
    setEndDate(newEnd.toISOString().split("T")[0]);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!target || parseFloat(target) <= 0) {
      setError("Please set a valid target carbon budget.");
      setLoading(false);
      return;
    }

    try {
      await api.goals.create({
        period,
        target_emissions: parseFloat(target),
        start_date: startDate,
        end_date: endDate,
      });
      setTarget("");
      onGoalAdded();
    } catch (err: any) {
      setError(err.message || "Failed to create carbon goal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Create Goal Form */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm h-fit space-y-6">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg mb-1">Set Carbon Goal</h3>
          <p className="text-xs text-slate-500">Create a carbon limit budget to keep your emissions low</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 mb-4 rounded-r-lg">
            <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Goal Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePeriodChange("monthly")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  period === "monthly"
                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("quarterly")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  period === "quarterly"
                    ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Target Carbon Limit (kg CO2e)
            </label>
            <input
              type="number"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 400"
              className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            Set Carbon Budget
          </button>
        </form>
      </div>

      {/* Goals List & Milestone Badges */}
      <div className="lg:col-span-2 space-y-6">
        {/* Goals Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">Your Carbon Goals</h3>
          <p className="text-xs text-slate-500 mb-6">Active and past reduction targets</p>

          <div className="space-y-6">
            {goals.length > 0 ? (
              goals.map((goal) => {
                const isExceeded = goal.current_emissions > goal.target_emissions;
                return (
                  <div key={goal.id} className="border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                            goal.status === "active" 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" 
                              : goal.status === "achieved"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                              : "bg-red-50 text-red-600 dark:bg-red-950/20"
                          }`}>
                            {goal.status}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">{goal.start_date} to {goal.end_date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize mt-1">
                          {goal.period} Carbon Target
                        </h4>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                          {Math.round(goal.current_emissions)} / {goal.target_emissions} kg
                        </span>
                        <p className="text-[10px] text-slate-400">emitted / budget</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded 
                            ? "bg-red-500" 
                            : goal.progress_percentage > 75 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{goal.progress_percentage.toFixed(0)}% budget consumed</span>
                      <span>
                        {isExceeded 
                          ? "Budget Limit Exceeded!" 
                          : `${(goal.target_emissions - goal.current_emissions).toFixed(0)} kg CO2e remaining`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 flex flex-col justify-center items-center">
                <Flag className="h-8 w-8 text-slate-300 dark:text-slate-800 mb-2" />
                <p className="text-sm font-semibold">No carbon targets configured.</p>
                <p className="text-xs text-slate-400 mt-1">Set a budget limit on the left to monitor progress.</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">Earned Badges</h3>
          <p className="text-xs text-slate-500 mb-6">Milestones unlocked along your green journey</p>

          {badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => {
                const info = BADGE_INFO[badge.badge_type as keyof typeof BADGE_INFO];
                if (!info) return null;
                const Icon = info.icon;
                return (
                  <div 
                    key={badge.id} 
                    className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20"
                  >
                    <div className={`p-3.5 rounded-full bg-gradient-to-br shadow-md ${info.color} mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{info.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                      {info.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 flex flex-col justify-center items-center">
              <CheckCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-800 mb-2" />
              <p className="text-sm font-semibold">No badges unlocked yet.</p>
              <p className="text-xs text-slate-400 mt-1">Log activities and set goals to unlock sustainability achievements!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
