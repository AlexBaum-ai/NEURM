#!/bin/bash

# Test Privacy Settings API

BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"

echo "=== Testing Privacy Settings API ==="
echo ""

# Test 1: Register a test user
echo "Test 1: Register test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "privacy-test@example.com",
    "password": "TestPass123!",
    "username": "privacytest"
  }')

echo "Register response: $REGISTER_RESPONSE"
echo ""

# Extract token (assuming JSON response with token field)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token, trying login..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "privacy-test@example.com",
      "password": "TestPass123!"
    }')
  echo "Login response: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not obtain authentication token"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# Test 2: Get default privacy settings
echo "Test 2: Get default privacy settings..."
curl -s -X GET "$BASE_URL/users/me/privacy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 3: Update privacy settings
echo "Test 3: Update privacy settings (make bio private, salary recruiters-only)..."
curl -s -X PATCH "$BASE_URL/users/me/privacy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "private",
    "salary": "recruiters",
    "contact": "community"
  }' | jq '.'
echo ""
echo ""

# Test 4: Get updated privacy settings
echo "Test 4: Get updated privacy settings..."
curl -s -X GET "$BASE_URL/users/me/privacy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 5: View own profile (should see all data)
echo "Test 5: View own profile (should see all data)..."
curl -s -X GET "$BASE_URL/users/privacytest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.data.profile.bio'
echo ""
echo ""

echo "=== Tests Complete ==="
