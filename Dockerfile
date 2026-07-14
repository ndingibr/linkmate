# -----------------------------
# 1️⃣ Build React frontend
# -----------------------------
FROM node:20 AS frontend-build
WORKDIR /frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend ./
RUN npm run build   

# -----------------------------
# 2️⃣ Build FastAPI backend + earnings script
# -----------------------------
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/main.py ./  
COPY backend/app ./app  

# Copy React build into FastAPI static directory
COPY --from=frontend-build /backend/app/static ./app/static

# Set environment variables
ENV PORT=8080
ENV WEB_CONCURRENCY=2

# Expose port
EXPOSE 8080

# Start Gunicorn server
CMD ["sh", "-c", "echo Starting server on 0.0.0.0:${PORT} && gunicorn -w ${WEB_CONCURRENCY} -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT} --timeout 240"]