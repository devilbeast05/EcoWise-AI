import os
import re
import json
from datetime import datetime
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

# Try importing pytesseract
try:
    import pytesseract
except ImportError:
    pytesseract = None

# Configure Gemini
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def parse_bill_with_gemini(image_bytes: bytes, mime_type: str = "image/png") -> dict:
    """
    Use Gemini Multimodal API to parse the bill image and extract units and dates.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            "You are a utility bill OCR extractor. Extract the electricity bill details: "
            "units consumed (in kWh) and the billing period (start date and end date). "
            "Return ONLY a valid JSON object (no markdown block wrapper, no other text) with the keys: "
            "'units_consumed' (float/int), 'billing_period_start' (string, YYYY-MM-DD), "
            "and 'billing_period_end' (string, YYYY-MM-DD). "
            "If any value is missing, set it to null. "
            "Example format: {\"units_consumed\": 350.5, \"billing_period_start\": \"2026-05-01\", \"billing_period_end\": \"2026-05-31\"}"
        )
        
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_bytes}
        ])
        
        # Clean up response in case Gemini included markdown wrappers
        text_response = response.text.strip()
        if text_response.startswith("```"):
            # Remove opening/closing markdown fences
            text_response = re.sub(r"^```(?:json)?\n", "", text_response)
            text_response = re.sub(r"\n```$", "", text_response)
            text_response = text_response.strip()
            
        data = json.loads(text_response)
        return {
            "units_consumed": data.get("units_consumed"),
            "billing_period_start": data.get("billing_period_start"),
            "billing_period_end": data.get("billing_period_end")
        }
    except Exception as e:
        logger.error(f"Gemini OCR parsing failed: {e}")
        raise e

def parse_bill_text_regex(text: str) -> dict:
    """
    Fallback regex parser to extract details from raw OCR text.
    """
    result = {
        "units_consumed": None,
        "billing_period_start": None,
        "billing_period_end": None
    }
    
    # Try to find units consumed (kWh)
    # Match strings like "350 kWh", "Consumption: 350", "Usage: 350.5", "units: 350"
    units_patterns = [
        r"(\d+(?:\.\d+)?)\s*(?:kwh|kilo watt hours)",
        r"(?:consumption|usage|units)\s*(?:value|qty)?\s*[:\-]?\s*(\d+(?:\.\d+)?)"
    ]
    for pattern in units_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                result["units_consumed"] = float(match.group(1))
                break
            except ValueError:
                pass
                
    # Try to find dates (YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY)
    date_pattern = r"(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{2,4})"
    dates = re.findall(date_pattern, text)
    
    parsed_dates = []
    for d_str in dates:
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d.%m.%Y"):
            try:
                parsed_date = datetime.strptime(d_str, fmt).date()
                parsed_dates.append(parsed_date)
                break
            except ValueError:
                pass
                
    # Sort and take the oldest and newest dates as start and end
    if len(parsed_dates) >= 2:
        parsed_dates = sorted(parsed_dates)
        result["billing_period_start"] = parsed_dates[0].strftime("%Y-%m-%d")
        result["billing_period_end"] = parsed_dates[-1].strftime("%Y-%m-%d")
    elif len(parsed_dates) == 1:
        result["billing_period_start"] = parsed_dates[0].strftime("%Y-%m-%d")
        # Default end date to 30 days later
        # result["billing_period_end"] = ...
        
    return result

def perform_ocr_scan(image_bytes: bytes, filename: str) -> dict:
    """
    Main entry point for scanning utility bills.
    Tries Tesseract OCR first, then Gemini Multimodal, and finally falls back to mock values if both fail.
    """
    # Determine mime type from extension
    ext = filename.split(".")[-1].lower()
    mime_type = "image/png" if ext == "png" else "image/jpeg"
    
    # 1. Try Gemini Vision first if API key is present, as it is much more accurate for bills
    if GEMINI_API_KEY:
        try:
            logger.info("Attempting Gemini Vision OCR...")
            return parse_bill_with_gemini(image_bytes, mime_type)
        except Exception as e:
            logger.warning(f"Gemini Vision OCR failed: {e}. Falling back to Tesseract...")

    # 2. Try Tesseract OCR
    if pytesseract:
        try:
            logger.info("Attempting Tesseract OCR...")
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            parsed = parse_bill_text_regex(text)
            
            # If we found at least units consumed, return it
            if parsed["units_consumed"] is not None:
                return parsed
        except Exception as e:
            logger.warning(f"Tesseract OCR failed or binary missing: {e}")

    # 3. Fallback Mock Data (useful for local testing/demo if keys/binaries are missing)
    logger.info("Falling back to Mock OCR data...")
    # Generate realistic mock data
    return {
        "units_consumed": 320.0,
        "billing_period_start": "2026-05-01",
        "billing_period_end": "2026-05-31",
        "note": "Demonstration Mock: Tesseract or Gemini API Key was unavailable."
    }
