import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from app.database import engine, Base
from app.routers import auth, activities, goals, coach, scanner

# Create database tables automatically
# For SQLite, this is extremely convenient; in production migrations can also be run.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoWise AI API",
    description="Backend services for EcoWise AI - Personal Carbon Footprint Assistant",
    version="1.0.0"
)

# CORS configuration
# Allow localhost ports for development and wildcards/custom domains in production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    if allowed_origins_env.strip() == "*":
        origins = ["*"]
    else:
        origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

# If origins is ["*"], we must set allow_credentials to False to prevent FastAPI startup error
allow_credentials = True
if "*" in origins:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(coach.router, prefix="/api")
app.include_router(scanner.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "EcoWise AI Backend API",
        "docs": "/docs"
    }
