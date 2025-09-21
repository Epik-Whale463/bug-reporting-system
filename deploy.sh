#!/bin/bash

# Deployment script for Bug Reporting System
echo "🚀 Starting deployment..."

# Get the droplet IP (you need to replace this with your actual IP)
DROPLET_IP="139.59.26.29"

if [ "$DROPLET_IP" = "139.59.26.29" ]; then
    echo "❌ Please update DROPLET_IP in deploy.sh with your actual Digital Ocean droplet IP"
    exit 1
fi

echo "📝 Updating configuration files with IP: $DROPLET_IP"

# Update docker-compose.yml
sed -i "s/139.59.26.29/$DROPLET_IP/g" docker-compose.yml

# Update .env.local
sed -i "s/139.59.26.29/$DROPLET_IP/g" frontend/.env.local

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🧹 Cleaning up old images..."
docker-compose build --no-cache

echo "🔧 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "📊 Checking service status..."
docker-compose ps

echo "📋 Checking logs..."
echo "Backend logs:"
docker-compose logs --tail=10 backend

echo "Frontend logs:"
docker-compose logs --tail=10 frontend

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at:"
echo "   Frontend: http://$DROPLET_IP"
echo "   Backend API: http://$DROPLET_IP:8000/api"

echo "🔍 To check logs later, use:"
echo "   docker-compose logs frontend"
echo "   docker-compose logs backend"