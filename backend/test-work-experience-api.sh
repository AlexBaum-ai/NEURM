#!/bin/bash

# Test script for Work Experience API
# Usage: ./test-work-experience-api.sh <AUTH_TOKEN>

API_BASE="http://vps-1a707765.vps.ovh.net:3000/api/v1"
AUTH_TOKEN="${1:-your_token_here}"

echo "========================================="
echo "Work Experience API Test Script"
echo "========================================="
echo ""

# Test 1: Create work experience
echo "Test 1: POST /users/me/work-experience - Create work experience"
CREATE_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/users/me/work-experience" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "title": "Senior ML Engineer",
    "company": "AI Labs Inc",
    "location": "San Francisco, CA",
    "employmentType": "full_time",
    "startDate": "2020-01-15",
    "endDate": null,
    "description": "Leading LLM integration projects and RAG implementations",
    "techStack": ["Python", "PyTorch", "LangChain", "GPT-4", "Vector DBs"],
    "displayOrder": 0
  }')

echo "$CREATE_RESPONSE" | jq '.'
WORK_EXP_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "Created work experience ID: $WORK_EXP_ID"
echo ""

# Test 2: Get all work experiences
echo "Test 2: GET /users/me/work-experience - List work experiences"
curl -s -X GET \
  "${API_BASE}/users/me/work-experience" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
echo ""

# Test 3: Update work experience
echo "Test 3: PUT /users/me/work-experience/:id - Update work experience"
curl -s -X PUT \
  "${API_BASE}/users/me/work-experience/${WORK_EXP_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "title": "Lead ML Engineer",
    "description": "Leading LLM integration projects, RAG implementations, and model fine-tuning"
  }' | jq '.'
echo ""

# Test 4: Get all work experiences again
echo "Test 4: GET /users/me/work-experience - Verify update"
curl -s -X GET \
  "${API_BASE}/users/me/work-experience" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
echo ""

# Test 5: Delete work experience (optional - uncomment to test)
# echo "Test 5: DELETE /users/me/work-experience/:id - Delete work experience"
# curl -s -X DELETE \
#   "${API_BASE}/users/me/work-experience/${WORK_EXP_ID}" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
# echo ""

echo "========================================="
echo "Tests completed!"
echo "========================================="
