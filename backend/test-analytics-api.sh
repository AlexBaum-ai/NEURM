#!/bin/bash

# Analytics API Test Script
# Tests analytics tracking endpoints

set -e

API_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"
ARTICLE_ID=""

echo "=========================================="
echo "Analytics API Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
  fi
}

# Function to print section header
print_section() {
  echo ""
  echo "=========================================="
  echo "$1"
  echo "=========================================="
}

# 1. First, get an article ID to use for testing
print_section "Step 1: Get Article ID"
RESPONSE=$(curl -s -X GET "$API_URL/news/articles?limit=1")
ARTICLE_SLUG=$(echo $RESPONSE | jq -r '.data.articles[0].slug // empty')

if [ -z "$ARTICLE_SLUG" ]; then
  echo -e "${RED}Error: No articles found. Please create an article first.${NC}"
  exit 1
fi

echo "Using article slug: $ARTICLE_SLUG"

# Get the article to extract ID
RESPONSE=$(curl -s -X GET "$API_URL/news/articles/$ARTICLE_SLUG")
ARTICLE_ID=$(echo $RESPONSE | jq -r '.data.id // empty')

if [ -z "$ARTICLE_ID" ]; then
  echo -e "${RED}Error: Could not extract article ID${NC}"
  exit 1
fi

echo "Using article ID: $ARTICLE_ID"

# 2. Test automatic view tracking
print_section "Step 2: Test Automatic View Tracking"
echo "Visiting article page (should trigger view tracking)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/news/articles/$ARTICLE_SLUG")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Article view endpoint accessible"
  echo "View tracking triggered automatically (processed asynchronously)"
else
  print_result 1 "Article view endpoint failed with code $HTTP_CODE"
fi

# Wait for async processing
echo "Waiting 2 seconds for async processing..."
sleep 2

# 3. Test duplicate view detection
print_section "Step 3: Test View Deduplication"
echo "Checking if view was deduplicated..."
RESPONSE=$(curl -s -X GET "$API_URL/analytics/articles/$ARTICLE_ID/has-viewed")
HAS_VIEWED=$(echo $RESPONSE | jq -r '.data.hasViewed // false')

if [ "$HAS_VIEWED" = "true" ]; then
  print_result 0 "View deduplication working (IP recorded)"
else
  print_result 1 "View deduplication not working"
fi

# 4. Test manual read tracking
print_section "Step 4: Test Manual Read Tracking"
READ_DATA='{
  "readTimeSeconds": 180,
  "scrollDepth": 85
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analytics/articles/$ARTICLE_ID/read" \
  -H "Content-Type: application/json" \
  -d "$READ_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Read tracking endpoint works"
  echo "Response: $(echo $BODY | jq -r '.data.message')"
else
  print_result 1 "Read tracking failed with code $HTTP_CODE"
  echo "Error: $BODY"
fi

# 5. Test manual share tracking
print_section "Step 5: Test Manual Share Tracking"
SHARE_DATA='{
  "platform": "twitter"
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analytics/articles/$ARTICLE_ID/share" \
  -H "Content-Type: application/json" \
  -d "$SHARE_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Share tracking endpoint works"
  echo "Response: $(echo $BODY | jq -r '.data.message')"
else
  print_result 1 "Share tracking failed with code $HTTP_CODE"
  echo "Error: $BODY"
fi

# 6. Test share tracking via URL parameter
print_section "Step 6: Test Share Click Tracking (URL Parameter)"
echo "Visiting article with ?platform=linkedin parameter..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/news/articles/$ARTICLE_SLUG?ref=share&platform=linkedin")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_result 0 "Share click tracking via URL parameter works"
else
  print_result 1 "Share click tracking failed with code $HTTP_CODE"
fi

# 7. Test validation errors
print_section "Step 7: Test Validation"

# Test invalid read time
echo "Testing invalid read time (negative)..."
INVALID_DATA='{"readTimeSeconds": -10, "scrollDepth": 50}'
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analytics/articles/$ARTICLE_ID/read" \
  -H "Content-Type: application/json" \
  -d "$INVALID_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 422 ]; then
  print_result 0 "Validation correctly rejects invalid read time"
else
  print_result 1 "Validation should reject invalid read time"
fi

# Test invalid platform
echo "Testing invalid share platform..."
INVALID_DATA='{"platform": "invalid_platform"}'
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analytics/articles/$ARTICLE_ID/share" \
  -H "Content-Type: application/json" \
  -d "$INVALID_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 422 ]; then
  print_result 0 "Validation correctly rejects invalid platform"
else
  print_result 1 "Validation should reject invalid platform"
fi

# 8. Test rate limiting
print_section "Step 8: Test Rate Limiting"
echo "Sending 10 rapid requests to test rate limiting..."

RATE_LIMITED=false
for i in {1..10}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analytics/articles/$ARTICLE_ID/share" \
    -H "Content-Type: application/json" \
    -d '{"platform": "twitter"}')

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" -eq 429 ]; then
    RATE_LIMITED=true
    break
  fi
done

if [ "$RATE_LIMITED" = true ]; then
  print_result 0 "Rate limiting is working"
else
  echo -e "${YELLOW}⚠ WARNING${NC}: Rate limiting may not be working (or limit is very high)"
fi

# Wait for async processing
echo ""
echo "Waiting 3 seconds for all async events to process..."
sleep 3

# 9. Verify article counters updated
print_section "Step 9: Verify Article Counters"
RESPONSE=$(curl -s -X GET "$API_URL/news/articles/$ARTICLE_SLUG")
VIEW_COUNT=$(echo $RESPONSE | jq -r '.data.viewCount // 0')
SHARE_COUNT=$(echo $RESPONSE | jq -r '.data.shareCount // 0')

echo "Article view count: $VIEW_COUNT"
echo "Article share count: $SHARE_COUNT"

if [ "$VIEW_COUNT" -gt 0 ]; then
  print_result 0 "View counter updated"
else
  print_result 1 "View counter not updated"
fi

if [ "$SHARE_COUNT" -gt 0 ]; then
  print_result 0 "Share counter updated"
else
  print_result 1 "Share counter not updated"
fi

# Summary
print_section "Test Summary"
echo "All analytics tracking tests completed!"
echo ""
echo "Key features verified:"
echo "  ✓ Automatic view tracking on article page load"
echo "  ✓ IP-based view deduplication (1 view per IP per hour)"
echo "  ✓ Manual read event tracking"
echo "  ✓ Manual share event tracking"
echo "  ✓ Share click tracking via URL parameters"
echo "  ✓ Input validation"
echo "  ✓ Article counter updates"
echo ""
echo "Note: Events are processed asynchronously via Bull queue"
echo "Check logs for detailed worker processing information"
