from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from app.utils import llm_mgr, storage_mgr
from app.utils.payload import LoginRequired, FutureYieldInput, TasselData, InterpolationResult
from app.database.schema import TypeOfUser, Chat, Folder
from sqlalchemy.orm import Session
from app.database.utils import get_db
import numpy as np
import json
import hmac
from io import BytesIO
from scipy.interpolate import RBFInterpolator
from scipy.stats import gaussian_kde
import matplotlib.pyplot as plt
from config import Config
import hashlib

router = APIRouter(tags=["AI"], prefix="/ai")

@router.post("/chat-disease")
async def chat_disease(
    text: str = Form(...),
    image: UploadFile = File(None),
    chat_history: str = Form(None),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
    db: Session = Depends(get_db)
):
    # Check if quota already maxed out
    if user['role'] == TypeOfUser.REGULAR:
        chat = Chat.retrieve(db, user['email'])
        count = 0 if chat is None else chat.count
        if count >= 5:
            raise HTTPException(429, detail="Your quota for the day is full")
    
    Chat.add(db, user['email'])
    image_data = None
    image_mime_type = None
    if image:
        image_data = await image.read()
        image_mime_type = image.content_type
    async def generate():
        try:
            async for chunk in llm_mgr.chat_disease(text, image_data, image_mime_type, chat_history):
                yield f"{chunk}"
        except Exception as e:
            error_message = f"Error: {str(e)}"
            raise HTTPException(500, detail=error_message)

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/search-youtube")
def search_youtube(search: str):
    return {
        "youtube" : llm_mgr.search_youtube(keyword=search)
    }

@router.get("/get-quota")
def get_quota(db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    chat = Chat.retrieve(db, user['email'])
    return {
        "count": 0 if chat is None else chat.count
    }

@router.post("/future-yield")
async def future_yield(input: FutureYieldInput):
    result = await llm_mgr.future_yield(input.weather_forecast, input.historical_count)
    return result

@router.post("/interpolate", response_model=InterpolationResult)
async def interpolate_tassels(data: TasselData, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    fldr = Folder.retrieve(db, folder_id=data.folder_id)
    if fldr.user_email != user['email']:
        raise HTTPException(400, detail='Unauthorized')
    farm_width = data.farm_width
    farm_height = data.farm_height
    tassel_coordinates = np.array(data.tassel_coordinates)

    # Create a grid of points to interpolate
    x = np.linspace(0, farm_width, 100)
    y = np.linspace(0, farm_height, 80)
    xx, yy = np.meshgrid(x, y)
    grid_points = np.column_stack([xx.ravel(), yy.ravel()])

    # Compute tassel density using Gaussian KDE
    kde = gaussian_kde(tassel_coordinates.T)
    z = kde(tassel_coordinates.T)

    # Create RBF interpolator with thin plate spline kernel
    rbf_tps = RBFInterpolator(tassel_coordinates, z, kernel='thin_plate_spline', smoothing=20)

    # Interpolate tassel density
    interpolated_density_tps = rbf_tps(grid_points).reshape(yy.shape)

    # Ensure non-negative values for Thin Plate Spline
    interpolated_density_tps = np.maximum(interpolated_density_tps, 0)

    # Calculate total number of actual tassels
    total_actual_tassels = len(tassel_coordinates)

    # Calculate total number of interpolated tassels
    dx = x[1] - x[0]
    dy = y[1] - y[0]
    total_interpolated_tassels_tps = np.sum(interpolated_density_tps) * dx * dy * total_actual_tassels

    # Predict tassel density for the center of the farm
    new_point = np.array([[farm_width/2, farm_height/2]])

    # Calculate tassels per square meter
    farm_area = farm_width * farm_height
    tassels_per_sqm_tps = total_interpolated_tassels_tps / farm_area

    # Generate plot without labels and title
    fig, ax = plt.subplots(figsize=(12, 8))
    im = ax.imshow(interpolated_density_tps, extent=[0, farm_width, 0, farm_height], origin='lower', cmap='viridis', aspect='auto')
    ax.scatter(tassel_coordinates[:, 0], tassel_coordinates[:, 1], c='red', s=30, edgecolor='k')
    
    # Remove x and y labels
    ax.set_xticks([])
    ax.set_yticks([])
    
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Estimated Tassel Density', rotation=270, labelpad=15)
    plt.tight_layout()

    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    plt.close(fig)

    # Upload plot to Google Cloud Storage
    plot_path = f"{user['email']}/{data.folder_id}/interpolation.png"
    blob = storage_mgr.bucket.blob(plot_path)
    blob.upload_from_file(buf, content_type="image/png")

    # Generate signed URL for the plot
    plot_url = await storage_mgr.get_image(plot_path)
    result_data = {
        "total_actual_tassels": total_actual_tassels,
        "total_interpolated_tassels": float(round(max(total_actual_tassels, total_interpolated_tassels_tps))),
        "tassels_per_sqm": float(tassels_per_sqm_tps),
        "plot_url": plot_url[0]
    }

    data_string = json.dumps(result_data, sort_keys=True)

    signature = hmac.new(Config.SECRET_KEY.encode(), data_string.encode(), hashlib.sha256).hexdigest()
    return InterpolationResult(
        total_actual_tassels=total_actual_tassels,
        total_interpolated_tassels=float(round(max(total_actual_tassels, total_interpolated_tassels_tps))),
        tassels_per_sqm=float(tassels_per_sqm_tps),
        plot_url=plot_url[0],
        signature=signature
    )

@router.post("/save-interpolation")
def save_interpolation():
    pass