# ==============================================================================
# SWARAREKHE (Model SR-05) — Multi-Stage Production Dockerfile for Render
# Packages Vite + React Frontend and FastAPI + Librosa Backend into 1 container
# ==============================================================================

# Stage 1: Build React/Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Runtime
FROM python:3.11-slim
WORKDIR /app

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production

# Install system dependencies for audio DSP (libsndfile for soundfile/librosa)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize and verify database seed on build
RUN python -m backend.seed_data

# Expose HTTP port
EXPOSE 8000

# Render dynamically injects $PORT; bind to 0.0.0.0
CMD sh -c "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"

