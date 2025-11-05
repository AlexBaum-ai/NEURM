#!/bin/bash

# ============================================================================
# Articles API Test Script
# Tests all CRUD operations for news articles
# ============================================================================

# Configuration
BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"
ADMIN_TOKEN=""  # Set this with an admin user JWT token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Run a test
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local token=$6

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -e "\n${YELLOW}Test $TESTS_RUN: $test_name${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"

    if [ -n "$data" ]; then
        echo "Data: $data"
    fi

    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"

    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi

    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    curl_cmd="$curl_cmd $BASE_URL$endpoint"

    # Execute request
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "Response Code: $http_code"
    echo "Response Body: $body" | jq '.' 2>/dev/null || echo "$body"

    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        print_success "Status code matches expected: $expected_status"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        # Return body for further processing
        echo "$body"
        return 0
    else
        print_error "Expected status $expected_status but got $http_code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# ============================================================================
# TEST SUITE
# ============================================================================

print_header "ARTICLES API TEST SUITE"

# Check if admin token is set
if [ -z "$ADMIN_TOKEN" ]; then
    print_warning "ADMIN_TOKEN not set. Admin tests will be skipped."
    print_warning "Please set ADMIN_TOKEN environment variable with an admin JWT token."
fi

# ============================================================================
# 1. PUBLIC TESTS (No authentication required)
# ============================================================================

print_header "1. PUBLIC ARTICLE TESTS"

# Test 1.1: List articles (empty)
run_test \
    "List articles (should return empty or existing articles)" \
    "GET" \
    "/news/articles" \
    "" \
    "200"

# Test 1.2: List articles with pagination
run_test \
    "List articles with pagination (page 1, limit 10)" \
    "GET" \
    "/news/articles?page=1&limit=10" \
    "" \
    "200"

# Test 1.3: Get article by non-existent slug (should fail)
run_test \
    "Get article by non-existent slug" \
    "GET" \
    "/news/articles/non-existent-article" \
    "" \
    "404"

# Test 1.4: List articles with search
run_test \
    "Search articles with query" \
    "GET" \
    "/news/articles?search=llm" \
    "" \
    "200"

# Test 1.5: List articles sorted by view count
run_test \
    "List articles sorted by view count" \
    "GET" \
    "/news/articles?sortBy=viewCount&sortOrder=desc" \
    "" \
    "200"

# ============================================================================
# 2. ADMIN TESTS (Authentication required)
# ============================================================================

if [ -n "$ADMIN_TOKEN" ]; then
    print_header "2. ADMIN ARTICLE TESTS"

    # Get category and tag IDs (you'll need to create these first or use existing ones)
    # For now, we'll use placeholder UUIDs
    CATEGORY_ID="550e8400-e29b-41d4-a716-446655440000"  # Replace with actual category ID
    TAG_ID="550e8400-e29b-41d4-a716-446655440001"        # Replace with actual tag ID

    # Test 2.1: Create article
    ARTICLE_DATA='{
        "title": "Introduction to Large Language Models",
        "slug": "introduction-to-large-language-models",
        "summary": "Learn the fundamentals of Large Language Models (LLMs) and how they are transforming AI applications across industries.",
        "content": "# Introduction to LLMs\n\nLarge Language Models (LLMs) are a breakthrough in artificial intelligence...\n\nThis article covers:\n- What are LLMs?\n- How do they work?\n- Popular LLM models\n- Use cases and applications\n\n## What are LLMs?\n\nLLMs are neural networks trained on vast amounts of text data...",
        "contentFormat": "markdown",
        "categoryId": "'$CATEGORY_ID'",
        "status": "published",
        "publishedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "difficultyLevel": "beginner",
        "readingTimeMinutes": 10,
        "isFeatured": true,
        "tagIds": ["'$TAG_ID'"]
    }'

    response=$(run_test \
        "Create new article" \
        "POST" \
        "/admin/articles" \
        "$ARTICLE_DATA" \
        "201" \
        "$ADMIN_TOKEN")

    # Extract article ID and slug from response
    ARTICLE_ID=$(echo "$response" | jq -r '.data.id' 2>/dev/null)
    ARTICLE_SLUG=$(echo "$response" | jq -r '.data.slug' 2>/dev/null)

    if [ -n "$ARTICLE_ID" ] && [ "$ARTICLE_ID" != "null" ]; then
        print_success "Article created with ID: $ARTICLE_ID"

        # Test 2.2: Get article by ID (admin)
        run_test \
            "Get article by ID (admin)" \
            "GET" \
            "/admin/articles/$ARTICLE_ID" \
            "" \
            "200" \
            "$ADMIN_TOKEN"

        # Test 2.3: Update article
        UPDATE_DATA='{
            "title": "Introduction to Large Language Models - Updated",
            "isTrending": true,
            "readingTimeMinutes": 12
        }'

        run_test \
            "Update article" \
            "PATCH" \
            "/admin/articles/$ARTICLE_ID" \
            "$UPDATE_DATA" \
            "200" \
            "$ADMIN_TOKEN"

        # Test 2.4: Get article by slug (public)
        if [ -n "$ARTICLE_SLUG" ] && [ "$ARTICLE_SLUG" != "null" ]; then
            run_test \
                "Get article by slug (public)" \
                "GET" \
                "/news/articles/$ARTICLE_SLUG" \
                "" \
                "200"
        fi

        # Test 2.5: Delete article
        run_test \
            "Delete article" \
            "DELETE" \
            "/admin/articles/$ARTICLE_ID" \
            "" \
            "200" \
            "$ADMIN_TOKEN"

        # Test 2.6: Verify deletion (should return 404)
        run_test \
            "Verify article deletion" \
            "GET" \
            "/admin/articles/$ARTICLE_ID" \
            "" \
            "404" \
            "$ADMIN_TOKEN"
    else
        print_error "Failed to create article - skipping dependent tests"
    fi

    # Test 2.7: Try to create article with duplicate slug (should fail)
    run_test \
        "Create article with duplicate slug" \
        "POST" \
        "/admin/articles" \
        "$ARTICLE_DATA" \
        "409" \
        "$ADMIN_TOKEN"

    # Test 2.8: Try to create article with invalid data (should fail)
    INVALID_DATA='{
        "title": "Too Short",
        "slug": "invalid",
        "summary": "Too short",
        "content": "Not enough content",
        "categoryId": "invalid-uuid"
    }'

    run_test \
        "Create article with invalid data" \
        "POST" \
        "/admin/articles" \
        "$INVALID_DATA" \
        "400" \
        "$ADMIN_TOKEN"

else
    print_warning "Skipping admin tests - no admin token provided"
fi

# ============================================================================
# TEST SUMMARY
# ============================================================================

print_header "TEST SUMMARY"

echo "Total Tests Run: $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}\n"
    exit 1
fi
