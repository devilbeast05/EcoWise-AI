from datetime import date, datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# Activity Schemas
class ActivityCreate(BaseModel):
    category: str  # "transportation", "energy", "food", "waste"
    activity_type: str  # e.g., "car", "bus", "electricity", "vegetarian"
    amount: float
    logged_at: date

class ActivityResponse(BaseModel):
    id: int
    user_id: int
    category: str
    activity_type: str
    amount: float
    emissions: float
    logged_at: date
    created_at: datetime

    class Config:
        from_attributes = True

# Goal Schemas
class GoalCreate(BaseModel):
    period: str  # "monthly", "quarterly"
    target_emissions: float
    start_date: date
    end_date: date

class GoalResponse(BaseModel):
    id: int
    user_id: int
    period: str
    target_emissions: float
    start_date: date
    end_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Badge Schemas
class BadgeResponse(BaseModel):
    id: int
    user_id: int
    badge_type: str
    awarded_at: datetime

    class Config:
        from_attributes = True

# Dashboard Summary
class DashboardSummary(BaseModel):
    total_emissions: float
    daily_footprint: float
    weekly_footprint: float
    monthly_footprint: float
    category_breakdown: Dict[str, float]
    recent_activities: List[ActivityResponse]

# Twin Simulation Schemas
class SimulationScenario(BaseModel):
    # slashes or percentage modifications
    reduce_car_km: float = 0.0          # km reduced
    switch_car_to_bus_km: float = 0.0   # km transferred
    switch_car_to_bike_km: float = 0.0  # km transferred
    reduce_electricity_pct: float = 0.0 # e.g. 20.0 for 20%
    vegetarian_meals_added: int = 0     # number of vegetarian meals substituted per week
    vegan_meals_added: int = 0        # number of vegan meals substituted per week
    solar_panels_kwh: float = 0.0       # solar generation per month

class SimulationResponse(BaseModel):
    current_emissions: float           # monthly average
    projected_emissions: float         # projected monthly average
    estimated_savings: float           # monthly carbon saved
    percentage_reduction: float
    comparison_data: List[Dict[str, float]] # Chart comparison list

# Chat Schemas
class ChatMessage(BaseModel):
    sender: str  # "user" or "model"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str
