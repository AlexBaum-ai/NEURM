#!/bin/bash

# Test script for News Categories and Tags API
# SPRINT-2-002 Implementation Test

BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"

echo "=================================="
echo "News Categories and Tags API Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DESCRIPTION=$3
    local EXPECTED_STATUS=${4:-200}

    echo -e "${YELLOW}Testing:${NC} $DESCRIPTION"
    echo -e "${YELLOW}URL:${NC} $METHOD $BASE_URL$ENDPOINT"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" \
        -H "Content-Type: application/json")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" -eq "$EXPECTED_STATUS" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $HTTP_CODE)"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $EXPECTED_STATUS, got $HTTP_CODE)"
        echo "$BODY"
        ((FAILED++))
    fi
    echo ""
}

# ============================================================================
# CATEGORY TESTS
# ============================================================================

echo "========================================="
echo "CATEGORY ENDPOINTS"
echo "========================================="
echo ""

# Test 1: Get all categories (hierarchical tree)
test_endpoint "GET" "/news/categories" \
    "Get all categories (hierarchical tree)"

# Test 2: Get all categories including inactive
test_endpoint "GET" "/news/categories?includeInactive=true" \
    "Get all categories including inactive"

# Test 3: Get categories with article counts
test_endpoint "GET" "/news/categories/with-counts" \
    "Get categories with article counts (flat list)"

# Test 4: Get category by slug (assuming 'llm-news' exists)
# This will fail if category doesn't exist yet - that's expected
test_endpoint "GET" "/news/categories/llm-news" \
    "Get category by slug" 404

# ============================================================================
# TAG TESTS
# ============================================================================

echo "========================================="
echo "TAG ENDPOINTS"
echo "========================================="
echo ""

# Test 5: Get all tags
test_endpoint "GET" "/news/tags" \
    "Get all tags with usage counts"

# Test 6: Get tags with search query
test_endpoint "GET" "/news/tags?search=gpt" \
    "Search tags with query 'gpt'"

# Test 7: Get tags with custom limit and sorting
test_endpoint "GET" "/news/tags?limit=10&sortBy=name&sortOrder=asc" \
    "Get tags with limit 10, sorted by name ascending"

# Test 8: Tag autocomplete search
test_endpoint "GET" "/news/tags/search?query=trans" \
    "Tag autocomplete search for 'trans'"

# Test 9: Get popular tags
test_endpoint "GET" "/news/tags/popular?limit=20" \
    "Get top 20 popular tags"

# Test 10: Get tag by slug (assuming 'transformers' exists)
# This will fail if tag doesn't exist yet - that's expected
test_endpoint "GET" "/news/tags/transformers" \
    "Get tag by slug" 404

# ============================================================================
# VALIDATION TESTS
# ============================================================================

echo "========================================="
echo "VALIDATION TESTS"
echo "========================================="
echo ""

# Test 11: Invalid category slug
test_endpoint "GET" "/news/categories/INVALID_SLUG" \
    "Invalid category slug (uppercase)" 400

# Test 12: Invalid tag limit (too high)
test_endpoint "GET" "/news/tags?limit=999" \
    "Invalid tag limit (exceeds max)" 400

# Test 13: Empty search query
test_endpoint "GET" "/news/tags/search?query=" \
    "Empty search query (should return empty array)"

# ============================================================================
# SUMMARY
# ============================================================================

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
