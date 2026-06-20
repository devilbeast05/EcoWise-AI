export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem("ecowise_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Generic request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    ...getHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  // If Body is FormData, let browser set the content-type (e.g. boundary for uploads)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as unknown as T;
  }

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Interfaces
export interface User {
  id: number;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Activity {
  id: number;
  user_id: number;
  category: string;
  activity_type: string;
  amount: number;
  emissions: number;
  logged_at: string;
  created_at: string;
}

export interface Goal {
  id: number;
  period: string;
  target_emissions: number;
  start_date: string;
  end_date: string;
  status: string;
  current_emissions: number;
  progress_percentage: number;
}

export interface Badge {
  id: number;
  badge_type: string;
  awarded_at: string;
}

export interface DashboardData {
  total_emissions: number;
  daily_footprint: number;
  weekly_footprint: number;
  monthly_footprint: number;
  category_breakdown: Record<string, number>;
  recent_activities: Activity[];
}

export interface SimulationScenario {
  reduce_car_km: number;
  switch_car_to_bus_km: number;
  switch_car_to_bike_km: number;
  reduce_electricity_pct: number;
  vegetarian_meals_added: number;
  vegan_meals_added: number;
  solar_panels_kwh: number;
}

export interface SimulationResponse {
  current_emissions: number;
  projected_emissions: number;
  estimated_savings: number;
  percentage_reduction: number;
  comparison_data: { category: string; Current: number; Projected: number }[];
}

export interface WeeklyReport {
  summary: string;
  top_sources: string[];
  improvement_areas: string[];
  positive_habits: string[];
  suggested_actions: string[];
}

export interface CoachRecommendations {
  insights: string[];
  recommendations: string[];
  high_impact_actions: string[];
}

export interface ChatMessage {
  sender: "user" | "model";
  text: string;
}

export interface OCRResult {
  units_consumed: number | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  note?: string;
}

// API Services
export const api = {
  // Authentication
  auth: {
    signup: async (email: string, password: string, fullName?: string) => {
      const res = await request<User>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      return res;
    },
    login: async (email: string, password: string) => {
      const res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("ecowise_token", res.access_token);
      localStorage.setItem("ecowise_user", JSON.stringify(res.user));
      return res;
    },
    getProfile: async () => {
      return request<User>("/auth/profile");
    },
    logout: () => {
      localStorage.removeItem("ecowise_token");
      localStorage.removeItem("ecowise_user");
    },
  },

  // Activities
  activities: {
    list: async () => {
      return request<Activity[]>("/activities/");
    },
    create: async (activity: Omit<Activity, "id" | "user_id" | "emissions" | "created_at">) => {
      return request<Activity>("/activities/", {
        method: "POST",
        body: JSON.stringify(activity),
      });
    },
    delete: async (id: number) => {
      return request<void>(`/activities/${id}`, {
        method: "DELETE",
      });
    },
    getDashboard: async () => {
      return request<DashboardData>("/activities/dashboard");
    },
  },

  // Goals
  goals: {
    list: async () => {
      return request<Goal[]>("/goals/");
    },
    create: async (goal: { period: string; target_emissions: number; start_date: string; end_date: string }) => {
      return request<Goal>("/goals/", {
        method: "POST",
        body: JSON.stringify(goal),
      });
    },
    badges: async () => {
      return request<Badge[]>("/goals/badges");
    },
  },

  // Coach & Simulator
  coach: {
    getRecommendations: async () => {
      return request<CoachRecommendations>("/coach/recommendations");
    },
    simulate: async (scenario: SimulationScenario) => {
      return request<SimulationResponse>("/coach/simulate", {
        method: "POST",
        body: JSON.stringify(scenario),
      });
    },
    getWeeklyReport: async () => {
      return request<WeeklyReport>("/coach/weekly-report");
    },
    chat: async (message: string, history: ChatMessage[]) => {
      return request<{ reply: string }>("/coach/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      });
    },
  },

  // Bill Scanner
  scanner: {
    scan: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<OCRResult>("/scanner/scan", {
        method: "POST",
        body: formData,
      });
    },
  },
};
