from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # "transportation", "energy", "food", "waste"
    activity_type = Column(String, nullable=False)  # e.g., "car", "bus", "electricity", "vegetarian"
    amount = Column(Float, nullable=False)  # e.g., km, kWh, meals, kg
    emissions = Column(Float, nullable=False)  # calculated kg CO2e
    logged_at = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    period = Column(String, nullable=False)  # "monthly", "quarterly"
    target_emissions = Column(Float, nullable=False)  # kg CO2e limit/target
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="active")  # "active", "achieved", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_type = Column(String, nullable=False)  # "first_log", "green_streak", "goal_crusher", "carbon_twin_pioneer"
    awarded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
