import React from "react";
import type { DashboardData } from "../services/api";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Calendar, Sparkles, TrendingUp } from "lucide-react";

interface DashboardProps {
  data: DashboardData;
  goals: any[];
}

const COLORS = {
  transportation: "#10b981", // Emerald
  energy: "#f59e0b",         // Amber
  food: "#3b82f6",           // Blue
  waste: "#ec4899",           // Pink
};

export const Dashboard: React.FC<DashboardProps> = ({ data, goals }) => {
  // Format pie data
  const pieData = Object.entries(data.category_breakdown)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: Math.round(value * 10) / 10,
      color: COLORS[key as keyof typeof COLORS] || "#64748b",
    }))
    .filter((item) => item.value > 0);

  // Format trend data (group last 10 logged_at dates)
  const trendMap: Record<string, number> = {};
  data.recent_activities.forEach((act) => {
    trendMap[act.logged_at] = (trendMap[act.logged_at] || 0) + act.emissions;
  });
  const trendData = Object.entries(trendMap)
    .map(([date, val]) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      emissions: Math.round(val * 10) / 10,
      rawDate: date,
    }))
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Carbon Footprint
          </p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.total_emissions.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">kg CO2e</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">All-time logged emissions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Daily Footprint
          </p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.daily_footprint.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">kg CO2e</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Emissions logged today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Weekly Footprint
          </p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.weekly_footprint.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">kg CO2e</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Last 7 days cumulative</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Monthly Footprint
          </p>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {data.monthly_footprint.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">kg CO2e</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Last 30 days cumulative</p>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Emissions Breakdown</h3>
          <p className="text-xs text-slate-500 mb-6">Distribution by activity category</p>
          
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} kg CO2e`, "Emissions"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200">
                    {data.total_emissions.toFixed(0)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total kg</span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mt-6 w-full text-sm">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                    <span className="text-xs text-slate-400">({Math.round((item.value / data.total_emissions) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
              <AlertCircle className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No emissions logged yet.</p>
              <p className="text-xs text-slate-400 mt-1">Log your first activity in the Activities tab to see details.</p>
            </div>
          )}
        </div>

        {/* Trend Area chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Emissions Trend</h3>
            <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Carbon history
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Emissions per day</p>

          {trendData.length > 0 ? (
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value} kg CO2e`, "Emissions"]} />
                  <Area type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
              <Calendar className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No trend history available.</p>
              <p className="text-xs text-slate-400 mt-1">Start logging daily activities to view historical charts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals progress & Recent Logs summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Goals Status</h3>
          <p className="text-xs text-slate-500 mb-6">Tracking your allowed carbon budget progress</p>

          <div className="space-y-5">
            {goals.filter(g => g.status === "active").length > 0 ? (
              goals.filter(g => g.status === "active").map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {goal.period} Goal ({goal.start_date} to {goal.end_date})
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {goal.current_emissions.toFixed(0)} / {goal.target_emissions} kg CO2e
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.progress_percentage > 90 
                          ? "bg-red-500" 
                          : goal.progress_percentage > 70 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{goal.progress_percentage.toFixed(0)}% used</span>
                    <span>
                      {goal.progress_percentage > 100 
                        ? "Exceeded budget!" 
                        : `${(goal.target_emissions - goal.current_emissions).toFixed(0)} kg CO2e budget remaining`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">
                <Sparkles className="h-8 w-8 text-amber-500/40 mx-auto mb-2" />
                <p className="text-sm font-semibold">No active goals found.</p>
                <p className="text-xs text-slate-400 mt-1">Set a new reduction goal in the Goals tab to track progress.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Recent Activities</h3>
          <p className="text-xs text-slate-500 mb-6">Last few logged activities</p>

          <div className="space-y-4">
            {data.recent_activities.length > 0 ? (
              data.recent_activities.slice(0, 5).map((act, idx) => (
                <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  <div>
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full mr-2" style={{
                      backgroundColor: `${COLORS[act.category as keyof typeof COLORS]}15`,
                      color: COLORS[act.category as keyof typeof COLORS]
                    }}>
                      {act.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {act.activity_type} ({act.amount} units)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {act.emissions.toFixed(1)} kg
                    </span>
                    <p className="text-[10px] text-slate-400">{act.logged_at}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm font-semibold">No activity logs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
