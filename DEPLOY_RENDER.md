# SWARAREKHE (Model SR-05) — Render Deployment Guide

This guide provides step-by-step instructions to deploy **SWARAREKHE (ಸ್ವರರೇಖೆ)** on [Render](https://render.com).

There are two deployment methods available:
- **Method A (Recommended — Single Unified Web Service via Docker)**: Deploys both the FastAPI backend and React frontend together on a single Render service. Zero CORS issues, zero URL coordination, 100% free within Render's free tier.
- **Method B (Split Architecture — Static Site + Web Service)**: Deploys the frontend as a Render Static Site (unlimited free bandwidth, never sleeps) and the backend as a Render Web Service.

---

## Method A: Unified Docker Deployment (Fastest & Recommended)

This method uses the included multi-stage [`Dockerfile`](file:///Users/sunil/Documents/My%20Projects/SWARAREKHE/Dockerfile) to build the Vite/React frontend and package it directly into FastAPI, serving both the API and the tactile UI from a single URL.

### Step 1: Push Code to GitHub
Ensure all your changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "chore(deploy): add Render Dockerfile and deployment blueprint"
git push origin main
```

### Step 2: Create a New Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right, then select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `swararekhe-ai` repository.
4. Fill in the service configuration:
   - **Name**: `swararekhe` (or your preferred name)
   - **Region**: Choose the closest region (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: **Docker** (Render will automatically detect the root `Dockerfile`)
   - **Instance Type**: **Free** (0.5 CPU, 512 MB RAM)

### Step 3: Configure Environment Variables
Under the **Environment Variables** section, add the following (optional):
| Key | Value | Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Enables production caching |
| `PORT` | `8000` | Render dynamically binds `$PORT` |
| `GEMINI_API_KEY` | *(Your Gemini API Key)* | *(Optional)* For neural morphing fallback |

### Step 4: Health Check Path
In the **Advanced** settings:
- **Health Check Path**: `/health`

### Step 5: Deploy
Click **Create Web Service**.
- Render will build the React bundle with Node 20, package the Python 3.11 environment with `libsndfile1`, seed the initial corpus, and boot Uvicorn on `$PORT`.
- Once deployment completes, your site will be live at `https://swararekhe.onrender.com`!

---

## Method B: Split Architecture (Static Site + Web Service)

If you prefer separating the frontend and backend, Render allows hosting the frontend as a **Static Site** (which is 100% free forever and never sleeps) and the backend as a **Web Service**.

### Step 1: Deploy the Backend Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your repository and configure:
   - **Name**: `swararekhe-api`
   - **Runtime**: **Python 3**
   - **Build Command**: `pip install -r backend/requirements.txt && python -m backend.seed_data`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
   - **Advanced -> Health Check Path**: `/health`
3. Add Environment Variables:
   - `ENVIRONMENT`: `production`
   - `GEMINI_API_KEY`: *(Optional)*
4. Click **Create Web Service**. Note the backend URL (e.g., `https://swararekhe-api.onrender.com`).

### Step 2: Deploy the Frontend Static Site
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same repository and configure:
   - **Name**: `swararekhe-ui`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://swararekhe-api.onrender.com` *(Paste your backend URL from Step 1)*
4. Under **Redirects/Rewrites**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Click **Create Static Site**.

---

## Method C: Using Render Blueprints (`render.yaml`)

Render supports Infrastructure-as-Code via [`render.yaml`](file:///Users/sunil/Documents/My%20Projects/SWARAREKHE/render.yaml):
1. In Render Dashboard, click **Blueprints** on the left navigation bar.
2. Click **New Blueprint Instance**.
3. Select your repository. Render will automatically read `render.yaml` and configure the unified Web Service with the correct build steps and health check.
4. Click **Apply**.

---

## Important Operational Notes

1. **Render Free Tier Spin-Down**:
   - Web services on Render's free tier sleep after 15 minutes of inactivity.
   - The first request after a cold start may take 30–50 seconds while the container initializes. Subsequent requests respond in `< 50ms`.
2. **Database Persistence**:
   - The SQLite database (`namma_kannada.db`) is automatically initialized and seeded on boot via `lifespan` in `backend/main.py`.
   - All 5 regions, 14 canonical concepts, 70 dialect variants, and 4 authentic field records are guaranteed to be present on every cold start.
3. **Web Audio & Oscilloscope**:
   - Audio synthesis and microphone analysis run entirely in the browser using the Web Audio API. Synthesized WAV files are served from `/static/audio_samples/`.

