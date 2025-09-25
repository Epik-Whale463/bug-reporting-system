#!/bin/bash

echo "Testing API endpoints..."

# Test health endpoint
echo "1. Testing health endpoint:"
curl -s http://localhost/health/
echo -e "\n"

# Test API health
echo "2. Testing API health:"
curl -s http://localhost/api/health/
echo -e "\n"

# Test register endpoint
echo "3. Testing register endpoint:"
curl -s -X POST http://localhost/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"testpass123"}' \
  | head -c 500
echo -e "\n"

# Test if nginx is proxying correctly
echo "4. Testing direct backend access:"
docker exec $(docker ps -q -f name=backend) curl -s http://localhost:8000/api/health/
echo -e "\n"

echo "Done."