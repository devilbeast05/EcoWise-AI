from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import User, Activity, Badge
from app.schemas.schemas import ActivityCreate, ActivityResponse, DashboardSummary
from app.services.auth_service import get_current_user
from app.utils.carbon_calculator import calculate_emissions

router = APIRouter(prefix="/activities", tags=["Activities"])

@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate emissions
    emissions_val = calculate_emissions(
        activity_data.category,
        activity_data.activity_type,
        activity_data.amount
    )
    
    new_activity = Activity(
        user_id=current_user.id,
        category=activity_data.category,
        activity_type=activity_data.activity_type,
        amount=activity_data.amount,
        emissions=emissions_val,
        logged_at=activity_data.logged_at
    )
    
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    
    # Badge Checks
    # 1. First Log Badge
    badge_exists = db.query(Badge).filter(
        Badge.user_id == current_user.id,
        Badge.badge_type == "first_log"
    ).first()
    
    if not badge_exists:
        first_badge = Badge(user_id=current_user.id, badge_type="first_log")
        db.add(first_badge)
        db.commit()
        
    # 2. Check for Streak Badge (e.g. logging on 3 different days)
    unique_dates = db.query(Activity.logged_at).filter(
        Activity.user_id == current_user.id
    ).distinct().count()
    
    if unique_dates >= 3:
        streak_badge_exists = db.query(Badge).filter(
            Badge.user_id == current_user.id,
            Badge.badge_type == "green_streak"
        ).first()
        if not streak_badge_exists:
            streak_badge = Badge(user_id=current_user.id, badge_type="green_streak")
            db.add(streak_badge)
            db.commit()
            
    return new_activity

@router.get("/", response_model=list[ActivityResponse])
def get_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.logged_at.desc(), Activity.created_at.desc()).all()

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
        
    db.delete(activity)
    db.commit()
    return None

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)
    
    # Helper to sum emissions in a date range
    def get_sum_emissions(start_date=None):
        query = db.query(func.sum(Activity.emissions)).filter(Activity.user_id == current_user.id)
        if start_date:
            query = query.filter(Activity.logged_at >= start_date)
        res = query.scalar()
        return float(res) if res is not None else 0.0

    total_emissions = get_sum_emissions()
    daily_footprint = get_sum_emissions(today)
    weekly_footprint = get_sum_emissions(seven_days_ago)
    monthly_footprint = get_sum_emissions(thirty_days_ago)
    
    # Calculate category breakdown
    breakdown_query = db.query(
        Activity.category,
        func.sum(Activity.emissions)
    ).filter(
        Activity.user_id == current_user.id
    ).group_by(Activity.category).all()
    
    category_breakdown = {
        "transportation": 0.0,
        "energy": 0.0,
        "food": 0.0,
        "waste": 0.0
    }
    
    for category, val in breakdown_query:
        category_breakdown[category.lower()] = float(val) if val is not None else 0.0
        
    # Get last 10 activities
    recent_activities = db.query(Activity).filter(
        Activity.user_id == current_user.id
    ).order_by(Activity.logged_at.desc(), Activity.created_at.desc()).limit(10).all()
    
    return {
        "total_emissions": total_emissions,
        "daily_footprint": daily_footprint,
        "weekly_footprint": weekly_footprint,
        "monthly_footprint": monthly_footprint,
        "category_breakdown": category_breakdown,
        "recent_activities": recent_activities
    }
