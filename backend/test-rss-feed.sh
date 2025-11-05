#!/bin/bash

# RSS Feed Testing Script
# Tests the RSS feed generation endpoint

BASE_URL="${API_URL:-http://localhost:3000}"
API_PREFIX="/api/feed"

echo "==================================="
echo "RSS Feed Testing Script"
echo "==================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  local data=$5

  echo -e "${YELLOW}Testing:${NC} $description"
  echo "  Method: $method"
  echo "  Endpoint: $endpoint"
  echo "  Expected Status: $expected_status"

  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      "$BASE_URL$endpoint")
  fi

  # Extract status code (last line)
  status_code=$(echo "$response" | tail -n 1)

  # Extract body (all but last line)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓ PASSED${NC} (Status: $status_code)"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
    FAILED=$((FAILED + 1))
  fi

  # Show response body (first 500 chars for RSS XML)
  if [ -n "$body" ]; then
    echo "  Response (first 500 chars):"
    echo "$body" | head -c 500
    echo ""
  fi
  echo ""
}

# Test 1: Get RSS feed (all articles)
test_endpoint \
  "GET" \
  "$API_PREFIX/rss" \
  "200" \
  "Get RSS feed for all articles"

# Test 2: Get RSS feed filtered by category
test_endpoint \
  "GET" \
  "$API_PREFIX/rss?category=news" \
  "200" \
  "Get RSS feed filtered by 'news' category"

# Test 3: Get RSS feed filtered by another category
test_endpoint \
  "GET" \
  "$API_PREFIX/rss?category=tutorials" \
  "200" \
  "Get RSS feed filtered by 'tutorials' category"

# Test 4: Test rate limiting (make multiple rapid requests)
echo -e "${YELLOW}Testing:${NC} Rate limiting for RSS feed"
echo "  Making 5 rapid requests..."
for i in {1..5}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$API_PREFIX/rss")
  echo "  Request $i: $status"
done
echo ""

# Test 5: Verify RSS XML structure
echo -e "${YELLOW}Testing:${NC} RSS XML structure validation"
rss_xml=$(curl -s "$BASE_URL$API_PREFIX/rss")

# Check for required RSS elements
if echo "$rss_xml" | grep -q "<rss"; then
  echo -e "  ${GREEN}✓${NC} RSS root element found"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} RSS root element not found"
  FAILED=$((FAILED + 1))
fi

if echo "$rss_xml" | grep -q "<channel>"; then
  echo -e "  ${GREEN}✓${NC} Channel element found"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} Channel element not found"
  FAILED=$((FAILED + 1))
fi

if echo "$rss_xml" | grep -q "<title>"; then
  echo -e "  ${GREEN}✓${NC} Title element found"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} Title element not found"
  FAILED=$((FAILED + 1))
fi

if echo "$rss_xml" | grep -q "<link>"; then
  echo -e "  ${GREEN}✓${NC} Link element found"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} Link element not found"
  FAILED=$((FAILED + 1))
fi

if echo "$rss_xml" | grep -q "<description>"; then
  echo -e "  ${GREEN}✓${NC} Description element found"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} Description element not found"
  FAILED=$((FAILED + 1))
fi

# Check Content-Type header
echo -e "\n${YELLOW}Testing:${NC} Content-Type header"
content_type=$(curl -s -I "$BASE_URL$API_PREFIX/rss" | grep -i "content-type" | cut -d' ' -f2-)
if echo "$content_type" | grep -iq "application/rss+xml"; then
  echo -e "  ${GREEN}✓${NC} Content-Type is application/rss+xml"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} Content-Type is not application/rss+xml (got: $content_type)"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
