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

import matplotlib
matplotlib.use('Agg') # Force non-interactive backend
import matplotlib.pyplot as plt

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend_debug.log"),
        logging.StreamHandler()
    ]
)
logging.getLogger('matplotlib').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Add root directory to sys.path to import maptoposter modules
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(ROOT_DIR)

# Import maptoposter functions
try:
    import create_map_poster
    from create_map_poster import create_poster, get_coordinates, get_available_themes, load_theme
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
        
        # 3. Load Theme
        logger.info(f"Loading theme: {request.theme}")
        theme_data = load_theme(request.theme)
        logger.debug(f"Loaded theme data keys: {theme_data.keys()}")
        if 'bg' not in theme_data:
            logger.error(f"Theme data is missing 'bg' key! Data: {theme_data}")
        create_map_poster.THEME = theme_data

        # 4. Create Poster
        logger.info(f"Generating poster to {output_path} with params: {request}")
        
        # Verify output dir exists
        if not os.path.exists(OUTPUT_DIR):
            logger.error(f"Output directory does not exist: {OUTPUT_DIR}")
            os.makedirs(OUTPUT_DIR, exist_ok=True)

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
            logger.error(f"File was not created at {output_path}")
            raise HTTPException(status_code=500, detail="Poster generation failed to create output file.")
            
        file_size = os.path.getsize(output_path)
        logger.info(f"Poster generated successfully. Size: {file_size} bytes")
        
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
