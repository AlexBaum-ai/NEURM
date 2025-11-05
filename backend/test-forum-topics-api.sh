#!/bin/bash

# Forum Topics API Test Script
# Tests all forum topic endpoints with various scenarios
# Usage: ./test-forum-topics-api.sh

set -e

# Configuration
BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

echo "======================================"
echo "  Forum Topics API Test Suite"
echo "======================================"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

# Function to make HTTP request
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4

    if [ -n "$auth" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" \
                -H "$CONTENT_TYPE" \
                -H "Authorization: Bearer $auth" \
                -d "$data" \
                "$BASE_URL$endpoint"
        else
            curl -s -X "$method" \
                -H "$CONTENT_TYPE" \
                -H "Authorization: Bearer $auth" \
                "$BASE_URL$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" \
                -H "$CONTENT_TYPE" \
                -d "$data" \
                "$BASE_URL$endpoint"
        else
            curl -s -X "$method" \
                -H "$CONTENT_TYPE" \
                "$BASE_URL$endpoint"
        fi
    fi
}

echo "Note: These tests require authentication tokens."
echo "Please set AUTH_TOKEN environment variable with a valid JWT token."
echo "Example: export AUTH_TOKEN='your-jwt-token-here'"
echo ""

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Warning: AUTH_TOKEN not set. Some tests will be skipped.${NC}"
    echo ""
fi

# ============================================================================
# TEST 1: List Topics (Public - No Auth)
# ============================================================================
echo "Test 1: List topics (public endpoint)"
RESPONSE=$(make_request "GET" "/forum/topics?page=1&limit=10")
if echo "$RESPONSE" | grep -q '"success":true\|"topics"'; then
    print_result 0 "List topics without authentication"
else
    print_result 1 "List topics without authentication"
fi
echo ""

# ============================================================================
# TEST 2: List Topics with Filters
# ============================================================================
echo "Test 2: List topics with filters"
RESPONSE=$(make_request "GET" "/forum/topics?type=question&sortBy=createdAt&sortOrder=desc")
if echo "$RESPONSE" | grep -q '"success":true\|"topics"'; then
    print_result 0 "List topics with type filter"
else
    print_result 1 "List topics with type filter"
fi
echo ""

# ============================================================================
# TEST 3: Create Topic (Requires Auth)
# ============================================================================
if [ -n "$AUTH_TOKEN" ]; then
    echo "Test 3: Create a new topic"

    # Get a category ID first
    CATEGORIES=$(make_request "GET" "/forum/categories")
    CATEGORY_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$CATEGORY_ID" ]; then
        echo -e "${YELLOW}⚠ Warning: No categories found. Skipping topic creation tests.${NC}"
    else
        TOPIC_DATA='{
            "title": "How to implement RAG with LangChain?",
            "content": "I am trying to implement a RAG system using LangChain. Has anyone done this before? I would appreciate any guidance on best practices and potential pitfalls to avoid.",
            "categoryId": "'$CATEGORY_ID'",
            "type": "question",
            "isDraft": false,
            "tags": ["langchain", "rag", "vector-db"]
        }'

        RESPONSE=$(make_request "POST" "/forum/topics" "$TOPIC_DATA" "$AUTH_TOKEN")
        if echo "$RESPONSE" | grep -q '"success":true\|"topic"'; then
            print_result 0 "Create topic with valid data"
            TOPIC_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "Created topic ID: $TOPIC_ID"
        else
            print_result 1 "Create topic with valid data"
        fi
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Test 3: AUTH_TOKEN not set${NC}"
    echo ""
fi

# ============================================================================
# TEST 4: Create Draft Topic
# ============================================================================
if [ -n "$AUTH_TOKEN" ] && [ -n "$CATEGORY_ID" ]; then
    echo "Test 4: Create draft topic"
    DRAFT_DATA='{
        "title": "My Draft Topic",
        "content": "This is a draft topic that I will publish later.",
        "categoryId": "'$CATEGORY_ID'",
        "type": "discussion",
        "isDraft": true
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$DRAFT_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"isDraft":true'; then
        print_result 0 "Create draft topic"
        DRAFT_TOPIC_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    else
        print_result 1 "Create draft topic"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Test 4: AUTH_TOKEN or CATEGORY_ID not set${NC}"
    echo ""
fi

# ============================================================================
# TEST 5: Get Topic by ID
# ============================================================================
if [ -n "$TOPIC_ID" ]; then
    echo "Test 5: Get topic by ID"
    RESPONSE=$(make_request "GET" "/forum/topics/$TOPIC_ID")
    if echo "$RESPONSE" | grep -q '"id":"'$TOPIC_ID'"'; then
        print_result 0 "Get topic by ID"
    else
        print_result 1 "Get topic by ID"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Test 5: No TOPIC_ID available${NC}"
    echo ""
fi

# ============================================================================
# TEST 6: Update Topic
# ============================================================================
if [ -n "$AUTH_TOKEN" ] && [ -n "$TOPIC_ID" ]; then
    echo "Test 6: Update topic"
    UPDATE_DATA='{
        "content": "Updated content with additional information about RAG implementation."
    }'

    RESPONSE=$(make_request "PUT" "/forum/topics/$TOPIC_ID" "$UPDATE_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"success":true\|Updated'; then
        print_result 0 "Update topic content"
    else
        print_result 1 "Update topic content"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Test 6: AUTH_TOKEN or TOPIC_ID not set${NC}"
    echo ""
fi

# ============================================================================
# TEST 7: Validation Tests
# ============================================================================
if [ -n "$AUTH_TOKEN" ] && [ -n "$CATEGORY_ID" ]; then
    echo "Test 7: Validation - title too short"
    INVALID_DATA='{
        "title": "Hi",
        "content": "This title is too short.",
        "categoryId": "'$CATEGORY_ID'",
        "type": "discussion"
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$INVALID_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"error"\|validation\|"errors"'; then
        print_result 0 "Reject topic with title too short"
    else
        print_result 1 "Reject topic with title too short"
    fi
    echo ""

    echo "Test 8: Validation - content too short"
    INVALID_DATA='{
        "title": "Valid Title Here",
        "content": "Too short",
        "categoryId": "'$CATEGORY_ID'",
        "type": "discussion"
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$INVALID_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"error"\|validation\|"errors"'; then
        print_result 0 "Reject topic with content too short"
    else
        print_result 1 "Reject topic with content too short"
    fi
    echo ""

    echo "Test 9: Validation - too many tags"
    INVALID_DATA='{
        "title": "Valid Title Here",
        "content": "This is valid content with sufficient length.",
        "categoryId": "'$CATEGORY_ID'",
        "type": "discussion",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$INVALID_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"error"\|validation\|"errors"'; then
        print_result 0 "Reject topic with too many tags"
    else
        print_result 1 "Reject topic with too many tags"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Tests 7-9: AUTH_TOKEN or CATEGORY_ID not set${NC}"
    echo ""
fi

# ============================================================================
# TEST 10: Create Topics of Different Types
# ============================================================================
if [ -n "$AUTH_TOKEN" ] && [ -n "$CATEGORY_ID" ]; then
    echo "Test 10: Create showcase topic"
    SHOWCASE_DATA='{
        "title": "My LLM-powered chatbot project",
        "content": "Check out my new chatbot built with GPT-4 and LangChain!",
        "categoryId": "'$CATEGORY_ID'",
        "type": "showcase",
        "tags": ["project", "chatbot"]
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$SHOWCASE_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"type":"showcase"'; then
        print_result 0 "Create showcase type topic"
    else
        print_result 1 "Create showcase type topic"
    fi
    echo ""

    echo "Test 11: Create tutorial topic"
    TUTORIAL_DATA='{
        "title": "How to fine-tune GPT-3.5 Turbo",
        "content": "Step-by-step guide to fine-tuning GPT-3.5 Turbo for your specific use case.",
        "categoryId": "'$CATEGORY_ID'",
        "type": "tutorial",
        "tags": ["tutorial", "fine-tuning"]
    }'

    RESPONSE=$(make_request "POST" "/forum/topics" "$TUTORIAL_DATA" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"type":"tutorial"'; then
        print_result 0 "Create tutorial type topic"
    else
        print_result 1 "Create tutorial type topic"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Tests 10-11: AUTH_TOKEN or CATEGORY_ID not set${NC}"
    echo ""
fi

# ============================================================================
# TEST 12: Delete Topic
# ============================================================================
if [ -n "$AUTH_TOKEN" ] && [ -n "$TOPIC_ID" ]; then
    echo "Test 12: Delete topic (soft delete)"
    RESPONSE=$(make_request "DELETE" "/forum/topics/$TOPIC_ID" "" "$AUTH_TOKEN")
    if echo "$RESPONSE" | grep -q '"success":true\|deleted'; then
        print_result 0 "Soft delete topic"
    else
        print_result 1 "Soft delete topic"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping Test 12: AUTH_TOKEN or TOPIC_ID not set${NC}"
    echo ""
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "======================================"
echo "  Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
