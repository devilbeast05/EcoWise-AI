from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors

from app.database import get_db
from app.models.models import User, Activity, Goal, Badge
from app.schemas.schemas import SimulationScenario, SimulationResponse, ChatRequest, ChatResponse
from app.services.auth_service import get_current_user
from app.services.gemini_service import generate_coach_advice, generate_weekly_report, chat_eco_buddy

router = APIRouter(prefix="/coach", tags=["AI Coach & Simulator"])

def get_user_emissions_context(user_id: int, db: Session) -> dict:
    """
    Helper to calculate current totals and categories for AI prompts.
    """
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    
    # 30 day emissions
    emissions_sum = db.query(func.sum(Activity.emissions)).filter(
        Activity.user_id == user_id,
        Activity.logged_at >= thirty_days_ago
    ).scalar()
    total_emissions = float(emissions_sum) if emissions_sum is not None else 0.0
    
    # Category breakdown
    breakdown_query = db.query(
        Activity.category,
        func.sum(Activity.emissions)
    ).filter(
        Activity.user_id == user_id,
        Activity.logged_at >= thirty_days_ago
    ).group_by(Activity.category).all()
    
    category_breakdown = {
        "transportation": 0.0,
        "energy": 0.0,
        "food": 0.0,
        "waste": 0.0
    }
    
    for category, val in breakdown_query:
        category_breakdown[category.lower()] = float(val) if val is not None else 0.0
        
    # Active goals
    goals = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.status == "active"
    ).all()
    
    active_goals_list = [
        {"target_emissions": g.target_emissions, "end_date": g.end_date.strftime("%Y-%m-%d")}
        for g in goals
    ]
    
    return {
        "total_emissions": total_emissions,
        "category_breakdown": category_breakdown,
        "active_goals": active_goals_list
    }

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    context = get_user_emissions_context(current_user.id, db)
    # If they have no logs, set standard baseline defaults so the advisor has data to work with
    if context["total_emissions"] == 0:
        context["total_emissions"] = 500.0
        context["category_breakdown"] = {
            "transportation": 240.0,
            "energy": 160.0,
            "food": 80.0,
            "waste": 20.0
        }
    
    advice = generate_coach_advice(context)
    return advice

@router.post("/simulate", response_model=SimulationResponse)
def simulate_lifestyle_changes(
    scenario: SimulationScenario,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    context = get_user_emissions_context(current_user.id, db)
    
    # Establish base monthly emissions per category
    # If the user has logged data, we use their 30-day stats. If not, use standard baseline.
    t_base = context["category_breakdown"]["transportation"]
    e_base = context["category_breakdown"]["energy"]
    f_base = context["category_breakdown"]["food"]
    w_base = context["category_breakdown"]["waste"]
    
    # If user has no logs, use defaults
    has_no_logs = context["total_emissions"] == 0.0
    if has_no_logs:
        t_base = 240.0
        e_base = 160.0
        f_base = 80.0
        w_base = 20.0
        
    current_total = t_base + e_base + f_base + w_base
    
    # Calculate savings
    # 1. Travel savings
    # Reduce car km: saves 0.20 kg CO2e/km
    t_savings_1 = scenario.reduce_car_km * 0.20
    # Switch car to bus: saves (0.20 - 0.05) = 0.15 kg CO2e/km
    t_savings_2 = scenario.switch_car_to_bus_km * 0.15
    # Switch car to bike: saves 0.20 kg CO2e/km
    t_savings_3 = scenario.switch_car_to_bike_km * 0.20
    t_savings = t_savings_1 + t_savings_2 + t_savings_3
    
    # 2. Energy savings
    # Reduce electricity usage pct: electricity is ~70% of energy category (LPG is rest)
    # If base is 0 (or default is used), we save based on energy base
    e_savings_1 = e_base * (scenario.reduce_electricity_pct / 100.0)
    # Solar panels: saves 0.5 kg CO2e per kWh generated
    e_savings_2 = scenario.solar_panels_kwh * 0.5
    e_savings = e_savings_1 + e_savings_2
    
    # 3. Diet savings
    # Replacing non-veg (3.0) with vegetarian (1.0): saves 2.0 kg per meal
    # Added meals are per week, convert to monthly (x 4.33 weeks)
    f_savings_1 = scenario.vegetarian_meals_added * 2.0 * 4.33
    # Replacing non-veg (3.0) with vegan (0.5): saves 2.5 kg per meal
    f_savings_2 = scenario.vegan_meals_added * 2.5 * 4.33
    f_savings = f_savings_1 + f_savings_2
    
    # Calculate projected values (cannot be negative)
    t_projected = max(0.0, t_base - t_savings)
    e_projected = max(0.0, e_base - e_savings)
    f_projected = max(0.0, f_base - f_savings)
    w_projected = w_base # No waste savings in this model
    
    projected_total = t_projected + e_projected + f_projected + w_projected
    estimated_savings = max(0.0, current_total - projected_total)
    
    pct_reduction = 0.0
    if current_total > 0:
        pct_reduction = (estimated_savings / current_total) * 100.0
        
    # Recharts data format
    comparison_data = [
        {"category": "Transportation", "Current": round(t_base, 1), "Projected": round(t_projected, 1)},
        {"category": "Home Energy", "Current": round(e_base, 1), "Projected": round(e_projected, 1)},
        {"category": "Food/Diet", "Current": round(f_base, 1), "Projected": round(f_projected, 1)},
        {"category": "Waste", "Current": round(w_base, 1), "Projected": round(w_projected, 1)},
        {"category": "Total", "Current": round(current_total, 1), "Projected": round(projected_total, 1)},
    ]
    
    # Award Carbon Twin Pioneer Badge if not already awarded
    badge_exists = db.query(Badge).filter(
        Badge.user_id == current_user.id,
        Badge.badge_type == "carbon_twin_pioneer"
    ).first()
    if not badge_exists:
        pioneer_badge = Badge(user_id=current_user.id, badge_type="carbon_twin_pioneer")
        db.add(pioneer_badge)
        db.commit()
        
    return {
        "current_emissions": round(current_total, 1),
        "projected_emissions": round(projected_total, 1),
        "estimated_savings": round(estimated_savings, 1),
        "percentage_reduction": round(pct_reduction, 1),
        "comparison_data": comparison_data
    }

@router.get("/weekly-report")
def get_weekly_sustainability_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user's data for the last 7 days
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    
    # 7 day activities
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id,
        Activity.logged_at >= seven_days_ago
    ).all()
    
    total = sum([a.emissions for a in activities])
    
    breakdown = {"transportation": 0.0, "energy": 0.0, "food": 0.0, "waste": 0.0}
    for a in activities:
        cat = a.category.lower()
        if cat in breakdown:
            breakdown[cat] += a.emissions
            
    history_summary = [
        {"category": a.category, "type": a.activity_type, "emissions": a.emissions}
        for a in activities
    ]
    
    context = {
        "total_emissions": total,
        "category_breakdown": breakdown,
        "history_summary": history_summary
    }
    
    # If no logs in last 7 days, provide a baseline to Gemini
    if total == 0:
        context["total_emissions"] = 125.0
        context["category_breakdown"] = {
            "transportation": 60.0,
            "energy": 40.0,
            "food": 20.0,
            "waste": 5.0
        }
        
    report = generate_weekly_report(context)
    return report

@router.get("/weekly-report/pdf")
def get_weekly_report_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user's data for the last 7 days
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    
    # 7 day activities
    activities = db.query(Activity).filter(
        Activity.user_id == current_user.id,
        Activity.logged_at >= seven_days_ago
    ).all()
    
    total = sum([a.emissions for a in activities])
    
    breakdown = {"transportation": 0.0, "energy": 0.0, "food": 0.0, "waste": 0.0}
    for a in activities:
        cat = a.category.lower()
        if cat in breakdown:
            breakdown[cat] += a.emissions
            
    history_summary = [
        {"category": a.category, "type": a.activity_type, "emissions": a.emissions}
        for a in activities
    ]
    
    context = {
        "total_emissions": total,
        "category_breakdown": breakdown,
        "history_summary": history_summary
    }
    
    # If no logs in last 7 days, provide a baseline to Gemini
    if total == 0:
        context["total_emissions"] = 125.0
        context["category_breakdown"] = {
            "transportation": 60.0,
            "energy": 40.0,
            "food": 20.0,
            "waste": 5.0
        }
        
    report = generate_weekly_report(context)

    # Compile PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title / Header Banner
    p.setFillColor(colors.HexColor("#10b981"))
    p.rect(0, height - 120, width, 120, fill=True, stroke=False)
    
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 24)
    p.drawString(40, height - 60, "EcoWise AI — Weekly Report")
    p.setFont("Helvetica", 12)
    p.drawString(40, height - 85, "Personal Sustainability & Carbon Footprint Summary")
    
    # Metadata Block
    p.setFillColor(colors.HexColor("#1e293b"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, height - 160, f"Member Name: {current_user.full_name or 'EcoWise Member'}")
    p.drawString(40, height - 180, f"Account Email: {current_user.email}")
    p.drawString(40, height - 200, f"Report Generated: {today.strftime('%B %d, %Y')}")
    
    # Carbon Metrics
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, height - 240, "Weekly Summary Metrics")
    p.setStrokeColor(colors.HexColor("#e2e8f0"))
    p.setLineWidth(1)
    p.line(40, height - 245, width - 40, height - 245)
    
    p.setFont("Helvetica", 10)
    p.drawString(40, height - 265, f"Total Carbon Emitted: {total:.1f} kg CO2e")
    p.drawString(40, height - 285, f"Transportation: {breakdown['transportation']:.1f} kg CO2e")
    p.drawString(40, height - 305, f"Home Energy: {breakdown['energy']:.1f} kg CO2e")
    p.drawString(40, height - 325, f"Food & Diet: {breakdown['food']:.1f} kg CO2e")
    p.drawString(40, height - 345, f"Waste: {breakdown['waste']:.1f} kg CO2e")
    
    # Weekly Summary Narrative
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, height - 390, "AI Coach Summary")
    p.line(40, height - 395, width - 40, height - 395)
    
    p.setFont("Helvetica", 9)
    # Wrap text cleanly
    text_object = p.beginText(40, height - 415)
    text_object.setFillColor(colors.HexColor("#334155"))
    text_object.setLeading(14)
    summary_text = report.get("summary", "")
    # Simple wrap
    words = summary_text.split()
    lines = []
    current_line = []
    for word in words:
        if len(" ".join(current_line + [word])) * 5 < (width - 80):
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
        
    for line in lines[:10]: # limit lines
        text_object.textLine(line)
    p.drawText(text_object)
    
    # Action Plan
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, height - 560, "Your Sustainability Action Plan")
    p.line(40, height - 565, width - 40, height - 565)
    
    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, height - 585, "Suggested Actions:")
    p.setFont("Helvetica", 9)
    y_pos = height - 605
    for act_item in report.get("suggested_actions", [])[:3]:
        p.drawString(55, y_pos, f"• {act_item}")
        y_pos -= 20
        
    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, y_pos - 10, "Improvement Areas:")
    p.setFont("Helvetica", 9)
    y_pos -= 30
    for imp_item in report.get("improvement_areas", [])[:3]:
        p.drawString(55, y_pos, f"• {imp_item}")
        y_pos -= 20
        
    # Footer
    p.setFillColor(colors.HexColor("#64748b"))
    p.setFont("Helvetica-Oblique", 8)
    p.drawCentredString(width / 2.0, 30, "Generated by EcoWise AI — Live Sustainably")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=weekly_report.pdf"}
    )

@router.post("/chat", response_model=ChatResponse)
def chat_with_ecobuddy(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch current user's monthly context to personalize chat responses
    context = get_user_emissions_context(current_user.id, db)
    history_dicts = [{"sender": h.sender, "text": h.text} for h in request.history]
    
    reply = chat_eco_buddy(request.message, history_dicts, context)
    return {"reply": reply}
