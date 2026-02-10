# dAisy's maps

This is a web application wrapper for the [maptoposter](https://github.com/originalankur/maptoposter) tool.

## Prerequisites

- Python 3.10+
- Node.js 18+

## Setup

1. **Backend Setup**:
   ```bash
   python -m venv backend/venv
   # Windows
   .\backend\venv\Scripts\activate
   # Linux/Mac
   source backend/venv/bin/activate
   
   pip install -r requirements.txt fastapi uvicorn python-multipart
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

## Running the App

1. **Start Backend**:
   From the project root:
   ```bash
   # Windows
   .\backend\venv\Scripts\python -m uvicorn backend.main:app --reload
   ```

2. **Start Frontend**:
   From the `frontend` directory:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser.

## Features

- Generate high-quality map posters for any city.
- Choose from various themes (Terracotta, Noir, Blueprint, etc.).
- Preview the generated poster.
- Download the high-resolution image.
