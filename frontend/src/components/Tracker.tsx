import React, { useState } from "react";
import { api, type Activity } from "../services/api";
import { 
  Car, Flame, Apple, Trash2, Plus, 
  Upload, FileText, Check, AlertTriangle, Loader2 
} from "lucide-react";

interface TrackerProps {
  activities: Activity[];
  onActivityAdded: () => void;
  onActivityDeleted: (id: number) => void;
}

const CATEGORIES = [
  { id: "transportation", name: "Transportation", icon: Car, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
  { id: "energy", name: "Home Energy", icon: Flame, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
  { id: "food", name: "Diet/Food", icon: Apple, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
  { id: "waste", name: "Waste Management", icon: Trash2, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20" },
];

const ACTIVITY_TYPES = {
  transportation: [
    { value: "car", label: "Car (Petrol/Diesel)", unit: "km" },
    { value: "bus", label: "Bus ride", unit: "km" },
    { value: "train", label: "Train travel", unit: "km" },
    { value: "metro", label: "Metro/Subway", unit: "km" },
    { value: "flight", label: "Flight", unit: "km" },
    { value: "bicycle", label: "Bicycle", unit: "km" },
  ],
  energy: [
    { value: "electricity", label: "Electricity usage", unit: "kWh" },
    { value: "lpg", label: "LPG gas consumption", unit: "kg" },
    { value: "solar", label: "Solar contribution", unit: "kWh (Generates offsets)" },
  ],
  food: [
    { value: "vegan", label: "Vegan meal", unit: "meals" },
    { value: "vegetarian", label: "Vegetarian meal", unit: "meals" },
    { value: "non-vegetarian", label: "Meat/Non-vegetarian meal", unit: "meals" },
  ],
  waste: [
    { value: "recycled", label: "Recycled waste", unit: "kg" },
    { value: "non-recycled", label: "Non-recycled/General waste", unit: "kg" },
  ],
};

export const Tracker: React.FC<TrackerProps> = ({ activities, onActivityAdded, onActivityDeleted }) => {
  const [activeTab, setActiveTab] = useState("transportation");
  const [type, setType] = useState("car");
  const [amount, setAmount] = useState("");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const [verifiedUnits, setVerifiedUnits] = useState("");
  const [verifiedStart, setVerifiedStart] = useState("");
  const [verifiedEnd, setVerifiedEnd] = useState("");

  const handleCategoryChange = (catId: string) => {
    setActiveTab(catId);
    const firstType = ACTIVITY_TYPES[catId as keyof typeof ACTIVITY_TYPES][0].value;
    setType(firstType);
    setAmount("");
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!amount || parseFloat(amount) <= 0) {
      // Allow solar energy to be logged if positive
      setError("Please enter a valid amount greater than zero.");
      setLoading(false);
      return;
    }

    try {
      await api.activities.create({
        category: activeTab,
        activity_type: type,
        amount: parseFloat(amount),
        logged_at: loggedAt,
      });
      setAmount("");
      onActivityAdded();
    } catch (err: any) {
      setError(err.message || "Failed to log activity.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError("");
    setScanResult(null);

    try {
      const result = await api.scanner.scan(file);
      setScanResult(result);
      setVerifiedUnits(result.units_consumed?.toString() || "");
      setVerifiedStart(result.billing_period_start || "");
      setVerifiedEnd(result.billing_period_end || "");
    } catch (err: any) {
      setScanError(err.message || "Failed to process bill image.");
    } finally {
      setScanning(false);
    }
  };

  const handleSaveScannedBill = async () => {
    if (!verifiedUnits || parseFloat(verifiedUnits) <= 0) {
      setScanError("Please enter valid electricity units.");
      return;
    }
    setScanning(true);
    setScanError("");

    try {
      // Log as electricity usage
      await api.activities.create({
        category: "energy",
        activity_type: "electricity",
        amount: parseFloat(verifiedUnits),
        logged_at: verifiedEnd || new Date().toISOString().split("T")[0],
      });
      setScanResult(null);
      onActivityAdded();
    } catch (err: any) {
      setScanError(err.message || "Failed to save scanned bill.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Logger Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bill Scanner Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 shadow-md text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-extrabold text-xl">Electricity Bill Scanner</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Upload a bill photo. Our AI OCR will scan and log the carbon footprint automatically!
              </p>
            </div>
            <FileText className="h-10 w-10 text-emerald-100 opacity-60" />
          </div>

          <div className="mt-5">
            <label className="inline-flex justify-center items-center py-2.5 px-5 bg-white text-emerald-600 rounded-lg shadow-sm text-sm font-bold hover:bg-emerald-50 transition-colors cursor-pointer w-full md:w-auto">
              <Upload className="h-4.5 w-4.5 mr-2" />
              Upload Bill Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Scanner Loading State */}
          {scanning && (
            <div className="mt-4 flex items-center space-x-2 text-sm bg-white/10 p-3 rounded-lg">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Scanning bill with AI OCR services...</span>
            </div>
          )}

          {/* Scanner Errors */}
          {scanError && (
            <div className="mt-4 bg-red-600/30 border border-red-500 p-3 rounded-lg flex items-center space-x-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-red-200" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Scanner Result / Verification Panel */}
          {scanResult && (
            <div className="mt-5 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl text-white space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="font-bold text-sm">Verify Scanned Bill Details</h4>
                {scanResult.note && (
                  <span className="text-[10px] bg-amber-500/80 text-white font-bold px-2 py-0.5 rounded-full">
                    Demo Mode Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-emerald-100 font-bold mb-1">Units (kWh)</label>
                  <input
                    type="number"
                    value={verifiedUnits}
                    onChange={(e) => setVerifiedUnits(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-emerald-100 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={verifiedStart}
                    onChange={(e) => setVerifiedStart(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-emerald-100 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={verifiedEnd}
                    onChange={(e) => setVerifiedEnd(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setScanResult(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold hover:bg-white/10 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScannedBill}
                  className="px-4 py-1.5 bg-white text-emerald-600 text-xs font-bold rounded-md hover:bg-emerald-50 transition-colors flex items-center"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Approve & Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Regular Log Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">Log Daily Activity</h3>
          <p className="text-xs text-slate-500 mb-6">Select a category and input details to record emissions</p>

          {/* Categories Tab Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${cat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 mb-5 rounded-r-lg">
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Activity Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  {ACTIVITY_TYPES[activeTab as keyof typeof ACTIVITY_TYPES].map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Logged Date
                </label>
                <input
                  type="date"
                  required
                  value={loggedAt}
                  onChange={(e) => setLoggedAt(e.target.value)}
                  className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Amount ({ACTIVITY_TYPES[activeTab as keyof typeof ACTIVITY_TYPES].find(i => i.value === type)?.unit})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50"
                className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Logging Activity...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Activity Log
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col h-[600px]">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">Activity History</h3>
        <p className="text-xs text-slate-500 mb-6">List of recorded carbon footprint entries</p>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div 
                key={act.id} 
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/60 rounded-xl hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full" style={{
                      backgroundColor: activeTab === act.category ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
                      color: activeTab === act.category ? "#10b981" : "#64748b"
                    }}>
                      {act.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.logged_at}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize mt-1">
                    {act.activity_type}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Amount: {act.amount} units
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${act.emissions < 0 ? "text-emerald-500" : "text-slate-800 dark:text-slate-200"}`}>
                      {act.emissions.toFixed(1)} kg
                    </span>
                    <p className="text-[9px] uppercase font-bold text-slate-400">CO2e</p>
                  </div>

                  <button
                    onClick={() => onActivityDeleted(act.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center text-slate-500">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-800 mb-2" />
              <p className="text-sm font-semibold">No entries recorded.</p>
              <p className="text-xs text-slate-400">Log activities to see them in this history list.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
