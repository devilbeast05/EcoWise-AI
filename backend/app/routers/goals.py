from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import User, Goal, Badge, Activity
from app.schemas.schemas import GoalCreate, GoalResponse, BadgeResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals & Milestones"])

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure start date is before end date
    if goal_data.start_date >= goal_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
        
    new_goal = Goal(
        user_id=current_user.id,
        period=goal_data.period,
        target_emissions=goal_data.target_emissions,
        start_date=goal_data.start_date,
        end_date=goal_data.end_date,
        status="active"
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.get("/", response_model=list[dict])
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    today = date.today()
    
    goals_with_progress = []
    
    for goal in goals:
        # Calculate emissions during the goal period
        emissions_sum = db.query(func.sum(Activity.emissions)).filter(
            Activity.user_id == current_user.id,
            Activity.logged_at >= goal.start_date,
            Activity.logged_at <= goal.end_date
        ).scalar()
        
        current_emissions = float(emissions_sum) if emissions_sum is not None else 0.0
        
        # Determine status update if active and period has passed
        updated_status = goal.status
        if goal.status == "active":
            if today > goal.end_date:
                if current_emissions <= goal.target_emissions:
                    updated_status = "achieved"
                    # Award Goal Crusher Badge if not already awarded
                    badge_exists = db.query(Badge).filter(
                        Badge.user_id == current_user.id,
                        Badge.badge_type == "goal_crusher"
                    ).first()
                    if not badge_exists:
                        crusher_badge = Badge(user_id=current_user.id, badge_type="goal_crusher")
                        db.add(crusher_badge)
                else:
                    updated_status = "failed"
                
                # Commit status change
                goal.status = updated_status
                db.commit()
                db.refresh(goal)
                
        # Progress percent: what percentage of their allowed budget they have used
        progress_pct = 0.0
        if goal.target_emissions > 0:
            progress_pct = min(100.0, (current_emissions / goal.target_emissions) * 100)
            
        goals_with_progress.append({
            "id": goal.id,
            "period": goal.period,
            "target_emissions": goal.target_emissions,
            "start_date": goal.start_date,
            "end_date": goal.end_date,
            "status": goal.status,
            "current_emissions": current_emissions,
            "progress_percentage": progress_pct,
            "created_at": goal.created_at
        })
        
    return goals_with_progress

@router.get("/badges", response_model=list[BadgeResponse])
def get_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Badge).filter(Badge.user_id == current_user.id).all()
