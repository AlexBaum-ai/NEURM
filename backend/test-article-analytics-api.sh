#!/bin/bash

# Article Analytics API Test Script
# Tests all endpoints for article view tracking and analytics
#
# Usage: ./test-article-analytics-api.sh [BASE_URL]
# Example: ./test-article-analytics-api.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_test() {
    local test_name=$1
    local status=$2
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Helper function to make HTTP requests
http_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_token=$4

    if [ -n "$auth_token" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_token" \
                -d "$data"
        else
            curl -s -X "$method" "$API_URL$endpoint" \
                -H "Authorization: Bearer $auth_token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X "$method" "$API_URL$endpoint"
        fi
    fi
}

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Article Analytics API Test Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# ============================================================================
# SETUP: Get a test article ID
# ============================================================================

echo -e "${YELLOW}[SETUP]${NC} Getting test article..."

ARTICLES_RESPONSE=$(http_request GET "/news/articles?limit=1&status=published")
ARTICLE_ID=$(echo "$ARTICLES_RESPONSE" | jq -r '.data[0].id // empty')

if [ -z "$ARTICLE_ID" ]; then
    echo -e "${RED}Error: No published articles found. Please create an article first.${NC}"
    exit 1
fi

echo -e "Using Article ID: ${GREEN}$ARTICLE_ID${NC}"
echo ""

# ============================================================================
# TEST 1: Track Article View (Anonymous User)
# ============================================================================

echo -e "${YELLOW}[TEST 1]${NC} Track article view (anonymous user)"

VIEW_RESPONSE=$(http_request POST "/analytics/articles/$ARTICLE_ID/view" '{"timeOnPage": 45, "scrollDepth": 75}')
VIEW_SUCCESS=$(echo "$VIEW_RESPONSE" | jq -r '.success // false')

if [ "$VIEW_SUCCESS" = "true" ]; then
    print_test "Track article view (anonymous)" 0
    echo "$VIEW_RESPONSE" | jq '.'
else
    print_test "Track article view (anonymous)" 1
    echo "$VIEW_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 2: Track Duplicate View (Should be deduplicated)
# ============================================================================

echo -e "${YELLOW}[TEST 2]${NC} Track duplicate view (should be rejected)"

DUPLICATE_RESPONSE=$(http_request POST "/analytics/articles/$ARTICLE_ID/view" '{"timeOnPage": 30, "scrollDepth": 50}')
DUPLICATE_TRACKED=$(echo "$DUPLICATE_RESPONSE" | jq -r '.data.tracked // false')

if [ "$DUPLICATE_TRACKED" = "false" ]; then
    print_test "Duplicate view deduplicated" 0
    echo "$DUPLICATE_RESPONSE" | jq '.'
else
    print_test "Duplicate view deduplicated" 1
    echo "ERROR: Duplicate view was not deduplicated"
    echo "$DUPLICATE_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 3: Track Article Read Completion
# ============================================================================

echo -e "${YELLOW}[TEST 3]${NC} Track article read completion"

READ_RESPONSE=$(http_request POST "/analytics/articles/$ARTICLE_ID/read" '{"readTimeSeconds": 180, "scrollDepth": 95}')
READ_SUCCESS=$(echo "$READ_RESPONSE" | jq -r '.success // false')

if [ "$READ_SUCCESS" = "true" ]; then
    print_test "Track article read" 0
    echo "$READ_RESPONSE" | jq '.'
else
    print_test "Track article read" 1
    echo "$READ_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 4: Track Article Share
# ============================================================================

echo -e "${YELLOW}[TEST 4]${NC} Track article share"

SHARE_RESPONSE=$(http_request POST "/analytics/articles/$ARTICLE_ID/share" '{"platform": "twitter"}')
SHARE_SUCCESS=$(echo "$SHARE_RESPONSE" | jq -r '.success // false')

if [ "$SHARE_SUCCESS" = "true" ]; then
    print_test "Track article share" 0
    echo "$SHARE_RESPONSE" | jq '.'
else
    print_test "Track article share" 1
    echo "$SHARE_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 5: Get Article Analytics
# ============================================================================

echo -e "${YELLOW}[TEST 5]${NC} Get article analytics"

ANALYTICS_RESPONSE=$(http_request GET "/analytics/articles/$ARTICLE_ID")
ANALYTICS_SUCCESS=$(echo "$ANALYTICS_RESPONSE" | jq -r '.success // false')

if [ "$ANALYTICS_SUCCESS" = "true" ]; then
    print_test "Get article analytics" 0
    echo "$ANALYTICS_RESPONSE" | jq '.'
else
    print_test "Get article analytics" 1
    echo "$ANALYTICS_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 6: Get Article Analytics (Last 7 Days)
# ============================================================================

echo -e "${YELLOW}[TEST 6]${NC} Get article analytics (last 7 days)"

ANALYTICS_7D_RESPONSE=$(http_request GET "/analytics/articles/$ARTICLE_ID?days=7")
ANALYTICS_7D_SUCCESS=$(echo "$ANALYTICS_7D_RESPONSE" | jq -r '.success // false')

if [ "$ANALYTICS_7D_SUCCESS" = "true" ]; then
    print_test "Get article analytics (7 days)" 0
    echo "$ANALYTICS_7D_RESPONSE" | jq '.'
else
    print_test "Get article analytics (7 days)" 1
    echo "$ANALYTICS_7D_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 7: Get Popular Articles
# ============================================================================

echo -e "${YELLOW}[TEST 7]${NC} Get popular articles"

POPULAR_RESPONSE=$(http_request GET "/analytics/articles/popular?limit=5")
POPULAR_SUCCESS=$(echo "$POPULAR_RESPONSE" | jq -r '.success // false')

if [ "$POPULAR_SUCCESS" = "true" ]; then
    print_test "Get popular articles" 0
    POPULAR_COUNT=$(echo "$POPULAR_RESPONSE" | jq -r '.data.count')
    echo "Found $POPULAR_COUNT popular articles"
    echo "$POPULAR_RESPONSE" | jq '.data.articles[] | {title, viewCount, uniqueViewCount}'
else
    print_test "Get popular articles" 1
    echo "$POPULAR_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 8: Get Popular Articles (Last 30 Days)
# ============================================================================

echo -e "${YELLOW}[TEST 8]${NC} Get popular articles (last 30 days)"

POPULAR_30D_RESPONSE=$(http_request GET "/analytics/articles/popular?limit=3&days=30")
POPULAR_30D_SUCCESS=$(echo "$POPULAR_30D_RESPONSE" | jq -r '.success // false')

if [ "$POPULAR_30D_SUCCESS" = "true" ]; then
    print_test "Get popular articles (30 days)" 0
    echo "$POPULAR_30D_RESPONSE" | jq '.data.articles[] | {title, viewCount}'
else
    print_test "Get popular articles (30 days)" 1
    echo "$POPULAR_30D_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 9: Get Trending Articles
# ============================================================================

echo -e "${YELLOW}[TEST 9]${NC} Get trending articles"

TRENDING_RESPONSE=$(http_request GET "/analytics/articles/trending?limit=5")
TRENDING_SUCCESS=$(echo "$TRENDING_RESPONSE" | jq -r '.success // false')

if [ "$TRENDING_SUCCESS" = "true" ]; then
    print_test "Get trending articles" 0
    TRENDING_COUNT=$(echo "$TRENDING_RESPONSE" | jq -r '.data.count')
    echo "Found $TRENDING_COUNT trending articles"
    echo "$TRENDING_RESPONSE" | jq '.data.articles[] | {title, trendingScore, recentViews, avgTimeOnPage}'
else
    print_test "Get trending articles" 1
    echo "$TRENDING_RESPONSE"
fi
echo ""

# ============================================================================
# TEST 10: Check Recent View (Debugging Endpoint)
# ============================================================================

echo -e "${YELLOW}[TEST 10]${NC} Check if IP has recent view"

HAS_VIEWED_RESPONSE=$(http_request GET "/analytics/articles/$ARTICLE_ID/has-viewed")
HAS_VIEWED_SUCCESS=$(echo "$HAS_VIEWED_RESPONSE" | jq -r '.success // false')

if [ "$HAS_VIEWED_SUCCESS" = "true" ]; then
    print_test "Check recent view" 0
    echo "$HAS_VIEWED_RESPONSE" | jq '.'
else
    print_test "Check recent view" 1
    echo "$HAS_VIEWED_RESPONSE"
fi
echo ""

# ============================================================================
# TEST SUMMARY
# ============================================================================

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
