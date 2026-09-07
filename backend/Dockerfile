FROM python:3.12-slim
WORKDIR /app

# Install deps first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (.dockerignore keeps .env / *.db / *.bak out of the image)
COPY . .

# Run as an unprivileged user: a PDF-parser RCE then lands as 'app', not root
RUN useradd --create-home --uid 10001 app \
    && chown -R app:app /app
USER app

EXPOSE 8765
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8765"]
