import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import logging
from pathlib import Path
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add root directory to sys.path to import maptoposter modules
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(ROOT_DIR)

# Import maptoposter functions
try:
    from create_map_poster import create_poster, get_coordinates, get_available_themes
except ImportError as e:
    logger.error(f"Failed to import maptoposter modules: {e}")
    sys.exit(1)

app = FastAPI(title="MapToPoster API")

# CORS Setup
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Output directory for posters
OUTPUT_DIR = os.path.join(ROOT_DIR, "backend", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class PosterRequest(BaseModel):
    city: str
    country: str
    theme: str = "terracotta"
    scale: int = 12000 # Distance/Radius in meters (default from CLI examples usually 12000 for large cities)
    width: float = 12.0
    height: float = 16.0

@app.get("/themes")
def get_themes():
    """Return list of available themes."""
    return {"themes": get_available_themes()}

@app.post("/generate")
def generate_poster(request: PosterRequest):
    """Generate a map poster."""
    try:
        # 1. Geocode
        logger.info(f"Geocoding {request.city}, {request.country}")
        lat_lon = get_coordinates(request.city, request.country)
        
        # 2. Generate Filename
        filename = f"{request.city.lower()}_{request.country.lower()}_{uuid.uuid4().hex[:8]}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        # 3. Create Poster
        logger.info(f"Generating poster to {output_path}")
        create_poster(
            city=request.city,
            country=request.country,
            point=lat_lon,
            dist=request.scale,
            output_file=output_path,
            output_format="png",
            width=request.width,
            height=request.height,
        )
        
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Poster generation failed to create output file.")
            
        return {"filename": filename, "url": f"/posters/{filename}"}

    except Exception as e:
        logger.error(f"Error producing poster: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/posters/{filename}")
def get_poster_image(filename: str):
    """Serve the generated poster image."""
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
