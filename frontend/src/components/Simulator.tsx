import React, { useState, useEffect } from "react";
import { api, type SimulationResponse } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Info, Loader2, RefreshCw, TrendingDown } from "lucide-react";

export const Simulator: React.FC = () => {
  const [reduceCarKm, setReduceCarKm] = useState(0);
  const [switchCarToBusKm, setSwitchCarToBusKm] = useState(0);
  const [switchCarToBikeKm, setSwitchCarToBikeKm] = useState(0);
  const [reduceElectricityPct, setReduceElectricityPct] = useState(0);
  const [vegMeals, setVegMeals] = useState(0);
  const [veganMeals, setVeganMeals] = useState(0);
  const [solarPanelsKwh, setSolarPanelsKwh] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState("");

  const runSimulation = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.coach.simulate({
        reduce_car_km: reduceCarKm,
        switch_car_to_bus_km: switchCarToBusKm,
        switch_car_to_bike_km: switchCarToBikeKm,
        reduce_electricity_pct: reduceElectricityPct,
        vegetarian_meals_added: vegMeals,
        vegan_meals_added: veganMeals,
        solar_panels_kwh: solarPanelsKwh,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to calculate simulation.");
    } finally {
      setLoading(false);
    }
  };

  // Run simulation whenever values change (debounced or simple trigger)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      runSimulation();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [reduceCarKm, switchCarToBusKm, switchCarToBikeKm, reduceElectricityPct, vegMeals, veganMeals, solarPanelsKwh]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Simulation Controllers (Sliders) */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg mb-1">Simulate Changes</h3>
          <p className="text-xs text-slate-500">Adjust the sliders to see how your lifestyle changes affect your footprint</p>
        </div>

        {/* Transportation Scenarios */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            Transportation
          </h4>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Reduce Car Usage</span>
              <span className="text-emerald-500 font-bold">{reduceCarKm} km/month</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={reduceCarKm}
              onChange={(e) => setReduceCarKm(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Switch Car to Bus</span>
              <span className="text-emerald-500 font-bold">{switchCarToBusKm} km/month</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="20"
              value={switchCarToBusKm}
              onChange={(e) => setSwitchCarToBusKm(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Switch Car to Bicycle</span>
              <span className="text-emerald-500 font-bold">{switchCarToBikeKm} km/month</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={switchCarToBikeKm}
              onChange={(e) => setSwitchCarToBikeKm(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Energy Scenarios */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            Home Energy
          </h4>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Reduce Electricity Usage</span>
              <span className="text-amber-500 font-bold">{reduceElectricityPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={reduceElectricityPct}
              onChange={(e) => setReduceElectricityPct(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Solar Panels Output</span>
              <span className="text-amber-500 font-bold">{solarPanelsKwh} kWh/month</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="20"
              value={solarPanelsKwh}
              onChange={(e) => setSolarPanelsKwh(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Food Scenarios */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            Diet / Food
          </h4>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Add Vegetarian Meals</span>
              <span className="text-blue-500 font-bold">{vegMeals} meals/week</span>
            </div>
            <input
              type="range"
              min="0"
              max="21"
              step="1"
              value={vegMeals}
              onChange={(e) => setVegMeals(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Add Vegan Meals</span>
              <span className="text-blue-500 font-bold">{veganMeals} meals/week</span>
            </div>
            <input
              type="range"
              min="0"
              max="21"
              step="1"
              value={veganMeals}
              onChange={(e) => setVeganMeals(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setReduceCarKm(0);
            setSwitchCarToBusKm(0);
            setSwitchCarToBikeKm(0);
            setReduceElectricityPct(0);
            setVegMeals(0);
            setVeganMeals(0);
            setSolarPanelsKwh(0);
          }}
          className="w-full py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all flex items-center justify-center space-x-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Simulation Results (Dashboard Visualization) */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error}</p>
          </div>
        )}
        {result ? (
          <>
            {/* Impact Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Projected Footprint
                </p>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {result.projected_emissions.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">kg CO2e</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Est. new monthly average</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 rounded-xl p-5 shadow-sm text-emerald-950 dark:text-emerald-50">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Carbon Savings
                </p>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {result.estimated_savings.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">kg CO2e</span>
                </div>
                <p className="text-xs text-emerald-500/80 dark:text-emerald-400 mt-2">Saved carbon per month</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Reduction Percentage
                </p>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {result.percentage_reduction.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Reduction from current level</p>
              </div>
            </div>

            {/* Visual Bar Comparison Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-0.5">Carbon Comparison</h3>
                  <p className="text-xs text-slate-500">Current vs Projected monthly emissions</p>
                </div>
                <span className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full">
                  <TrendingDown className="h-3.5 w-3.5 mr-1" />
                  Twin Model active
                </span>
              </div>

              {loading && (
                <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs py-3">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Updating simulator...</span>
                </div>
              )}

              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.comparison_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [`${value} kg CO2e`]} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="Current" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Projected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Informative Note */}
              <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg flex items-start space-x-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  This Carbon Twin simulation uses verified math calculations calibrated to global carbon intensities.
                  By lowering transportation distances, adding vegetarian habits, or reducing power draw, you are directly mitigating
                  landfill greenhouse impacts. Click around and see your potential badge milestone unlocks!
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex-1 flex flex-col justify-center items-center text-center">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">Loading Carbon Twin Simulator model...</p>
          </div>
        )}
      </div>
    </div>
  );
};
