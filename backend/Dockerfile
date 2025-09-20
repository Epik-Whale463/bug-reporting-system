FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV DJANGO_SETTINGS_MODULE=backend.settings

# Run migrations and start server
CMD python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000
