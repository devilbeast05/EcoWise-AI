from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.services.auth_service import get_current_user
from app.models.models import User
from app.services.ocr_service import perform_ocr_scan

router = APIRouter(prefix="/scanner", tags=["Electricity Bill Scanner"])

@router.post("/scan")
async def scan_electricity_bill(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Ensure it's an image
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG, JPEG, PNG, and WEBP images are supported."
        )
        
    try:
        # Read file contents
        contents = await file.read()
        
        # Run OCR Scan
        extracted_data = perform_ocr_scan(contents, filename)
        return extracted_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )
