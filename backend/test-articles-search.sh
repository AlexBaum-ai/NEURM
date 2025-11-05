#!/bin/bash

# Test script for article search and filtering (SPRINT-2-003)
# Tests comprehensive search functionality with multiple filters

BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"
ADMIN_EMAIL="admin@neurmatic.com"
ADMIN_PASSWORD="Admin123!@#"
USER_EMAIL="testuser@neurmatic.com"
USER_PASSWORD="Test123!@#"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Article Search & Filtering Test Suite (SPRINT-2-003)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    local message=$3

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name - $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to make authenticated request
auth_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4

    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "${BASE_URL}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}"
    fi
}

echo -e "${YELLOW}1. Setup - Admin Login${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Failed to login as admin${NC}"
    exit 1
fi

print_result "Admin login" "PASS" ""
echo ""

# Get category and tag IDs for testing
CATEGORIES=$(auth_request "GET" "/news/categories?limit=5" "$ADMIN_TOKEN")
CATEGORY_SLUG=$(echo "$CATEGORIES" | jq -r '.data.categories[0].slug // empty')
CATEGORY_ID=$(echo "$CATEGORIES" | jq -r '.data.categories[0].id // empty')

TAGS=$(auth_request "GET" "/news/tags?limit=5" "$ADMIN_TOKEN")
TAG_SLUGS=$(echo "$TAGS" | jq -r '.data.tags[0:2] | map(.slug) | join(",")' 2>/dev/null)

echo -e "${YELLOW}Test Data:${NC}"
echo "Category slug: $CATEGORY_SLUG"
echo "Tag slugs: $TAG_SLUGS"
echo ""

#----------------------------------------
# Test 1: Full-text search with query
#----------------------------------------
echo -e "${YELLOW}2. Test: Full-text search${NC}"

SEARCH_RESPONSE=$(auth_request "GET" "/news/articles?search=transformer&sortBy=relevance" "$ADMIN_TOKEN")
SEARCH_STATUS=$(echo "$SEARCH_RESPONSE" | jq -r '.status // empty')
SEARCH_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.data.total // 0')

if [ "$SEARCH_STATUS" = "success" ]; then
    print_result "Full-text search" "PASS" ""
    echo "  Found: $SEARCH_COUNT articles"
else
    ERROR_MSG=$(echo "$SEARCH_RESPONSE" | jq -r '.message // "Unknown error"')
    print_result "Full-text search" "FAIL" "$ERROR_MSG"
fi
echo ""

#----------------------------------------
# Test 2: Filter by category (slug)
#----------------------------------------
echo -e "${YELLOW}3. Test: Filter by category slug${NC}"

if [ -n "$CATEGORY_SLUG" ]; then
    CATEGORY_RESPONSE=$(auth_request "GET" "/news/articles?category=$CATEGORY_SLUG&limit=10" "$ADMIN_TOKEN")
    CATEGORY_STATUS=$(echo "$CATEGORY_RESPONSE" | jq -r '.status // empty')
    CATEGORY_COUNT=$(echo "$CATEGORY_RESPONSE" | jq -r '.data.total // 0')

    if [ "$CATEGORY_STATUS" = "success" ]; then
        # Verify all articles have the correct category
        WRONG_CATEGORY=$(echo "$CATEGORY_RESPONSE" | jq -r --arg slug "$CATEGORY_SLUG" \
            '.data.articles[] | select(.category.slug != $slug) | .id' | wc -l)

        if [ "$WRONG_CATEGORY" -eq 0 ]; then
            print_result "Filter by category slug" "PASS" ""
            echo "  Found: $CATEGORY_COUNT articles in category '$CATEGORY_SLUG'"
        else
            print_result "Filter by category slug" "FAIL" "Some articles don't match category filter"
        fi
    else
        ERROR_MSG=$(echo "$CATEGORY_RESPONSE" | jq -r '.message // "Unknown error"')
        print_result "Filter by category slug" "FAIL" "$ERROR_MSG"
    fi
else
    print_result "Filter by category slug" "FAIL" "No category available for testing"
fi
echo ""

#----------------------------------------
# Test 3: Filter by multiple tags
#----------------------------------------
echo -e "${YELLOW}4. Test: Filter by multiple tags${NC}"

if [ -n "$TAG_SLUGS" ] && [ "$TAG_SLUGS" != "null" ]; then
    TAGS_RESPONSE=$(auth_request "GET" "/news/articles?tags=$TAG_SLUGS&limit=10" "$ADMIN_TOKEN")
    TAGS_STATUS=$(echo "$TAGS_RESPONSE" | jq -r '.status // empty')
    TAGS_COUNT=$(echo "$TAGS_RESPONSE" | jq -r '.data.total // 0')

    if [ "$TAGS_STATUS" = "success" ]; then
        print_result "Filter by multiple tags" "PASS" ""
        echo "  Found: $TAGS_COUNT articles with tags '$TAG_SLUGS'"
    else
        ERROR_MSG=$(echo "$TAGS_RESPONSE" | jq -r '.message // "Unknown error"')
        print_result "Filter by multiple tags" "FAIL" "$ERROR_MSG"
    fi
else
    print_result "Filter by multiple tags" "FAIL" "No tags available for testing"
fi
echo ""

#----------------------------------------
# Test 4: Filter by difficulty level
#----------------------------------------
echo -e "${YELLOW}5. Test: Filter by difficulty level${NC}"

DIFFICULTY_RESPONSE=$(auth_request "GET" "/news/articles?difficulty=beginner&limit=10" "$ADMIN_TOKEN")
DIFFICULTY_STATUS=$(echo "$DIFFICULTY_RESPONSE" | jq -r '.status // empty')
DIFFICULTY_COUNT=$(echo "$DIFFICULTY_RESPONSE" | jq -r '.data.total // 0')

if [ "$DIFFICULTY_STATUS" = "success" ]; then
    # Verify all articles have beginner difficulty
    WRONG_DIFFICULTY=$(echo "$DIFFICULTY_RESPONSE" | jq -r \
        '.data.articles[] | select(.difficultyLevel != "beginner") | .id' | wc -l)

    if [ "$WRONG_DIFFICULTY" -eq 0 ]; then
        print_result "Filter by difficulty level" "PASS" ""
        echo "  Found: $DIFFICULTY_COUNT beginner articles"
    else
        print_result "Filter by difficulty level" "FAIL" "Some articles don't match difficulty filter"
    fi
else
    ERROR_MSG=$(echo "$DIFFICULTY_RESPONSE" | jq -r '.message // "Unknown error"')
    print_result "Filter by difficulty level" "FAIL" "$ERROR_MSG"
fi
echo ""

#----------------------------------------
# Test 5: Sort by view count
#----------------------------------------
echo -e "${YELLOW}6. Test: Sort by view count${NC}"

SORT_VIEW_RESPONSE=$(auth_request "GET" "/news/articles?sortBy=viewCount&sortOrder=desc&limit=10" "$ADMIN_TOKEN")
SORT_VIEW_STATUS=$(echo "$SORT_VIEW_RESPONSE" | jq -r '.status // empty')

if [ "$SORT_VIEW_STATUS" = "success" ]; then
    # Check if view counts are in descending order
    VIEW_COUNTS=$(echo "$SORT_VIEW_RESPONSE" | jq -r '.data.articles[].viewCount')
    IS_SORTED=true
    PREV_COUNT=999999

    for count in $VIEW_COUNTS; do
        if [ "$count" -gt "$PREV_COUNT" ]; then
            IS_SORTED=false
            break
        fi
        PREV_COUNT=$count
    done

    if [ "$IS_SORTED" = true ]; then
        print_result "Sort by view count" "PASS" ""
    else
        print_result "Sort by view count" "FAIL" "View counts not in descending order"
    fi
else
    ERROR_MSG=$(echo "$SORT_VIEW_RESPONSE" | jq -r '.message // "Unknown error"')
    print_result "Sort by view count" "FAIL" "$ERROR_MSG"
fi
echo ""

#----------------------------------------
# Test 6: Sort by bookmark count
#----------------------------------------
echo -e "${YELLOW}7. Test: Sort by bookmark count${NC}"

SORT_BOOKMARK_RESPONSE=$(auth_request "GET" "/news/articles?sortBy=bookmarkCount&sortOrder=desc&limit=10" "$ADMIN_TOKEN")
SORT_BOOKMARK_STATUS=$(echo "$SORT_BOOKMARK_RESPONSE" | jq -r '.status // empty')

if [ "$SORT_BOOKMARK_STATUS" = "success" ]; then
    print_result "Sort by bookmark count" "PASS" ""
else
    ERROR_MSG=$(echo "$SORT_BOOKMARK_RESPONSE" | jq -r '.message // "Unknown error"')
    print_result "Sort by bookmark count" "FAIL" "$ERROR_MSG"
fi
echo ""

#----------------------------------------
# Test 7: Cursor-based pagination
#----------------------------------------
echo -e "${YELLOW}8. Test: Cursor-based pagination${NC}"

# First page
PAGE1_RESPONSE=$(auth_request "GET" "/news/articles?limit=5" "$ADMIN_TOKEN")
PAGE1_STATUS=$(echo "$PAGE1_RESPONSE" | jq -r '.status // empty')
FIRST_CURSOR=$(echo "$PAGE1_RESPONSE" | jq -r '.data.articles[-1].id // empty')

if [ "$PAGE1_STATUS" = "success" ] && [ -n "$FIRST_CURSOR" ]; then
    # Second page using cursor
    PAGE2_RESPONSE=$(auth_request "GET" "/news/articles?limit=5&cursor=$FIRST_CURSOR" "$ADMIN_TOKEN")
    PAGE2_STATUS=$(echo "$PAGE2_RESPONSE" | jq -r '.status // empty')
    HAS_MORE=$(echo "$PAGE2_RESPONSE" | jq -r '.data.hasMore // false')
    NEXT_CURSOR=$(echo "$PAGE2_RESPONSE" | jq -r '.data.nextCursor // empty')

    if [ "$PAGE2_STATUS" = "success" ]; then
        # Check that pages don't overlap
        PAGE1_IDS=$(echo "$PAGE1_RESPONSE" | jq -r '.data.articles[].id' | sort)
        PAGE2_IDS=$(echo "$PAGE2_RESPONSE" | jq -r '.data.articles[].id' | sort)
        OVERLAP=$(comm -12 <(echo "$PAGE1_IDS") <(echo "$PAGE2_IDS") | wc -l)

        if [ "$OVERLAP" -eq 0 ]; then
            print_result "Cursor-based pagination" "PASS" ""
            echo "  hasMore: $HAS_MORE"
            echo "  nextCursor: ${NEXT_CURSOR:0:20}..."
        else
            print_result "Cursor-based pagination" "FAIL" "Pages have overlapping articles"
        fi
    else
        ERROR_MSG=$(echo "$PAGE2_RESPONSE" | jq -r '.message // "Unknown error"')
        print_result "Cursor-based pagination" "FAIL" "$ERROR_MSG"
    fi
else
    print_result "Cursor-based pagination" "FAIL" "Failed to get first page or cursor"
fi
echo ""

#----------------------------------------
# Test 8: Combined filters
#----------------------------------------
echo -e "${YELLOW}9. Test: Combined filters${NC}"

if [ -n "$CATEGORY_SLUG" ]; then
    COMBINED_RESPONSE=$(auth_request "GET" \
        "/news/articles?category=$CATEGORY_SLUG&difficulty=intermediate&sortBy=viewCount&sortOrder=desc&limit=10" \
        "$ADMIN_TOKEN")
    COMBINED_STATUS=$(echo "$COMBINED_RESPONSE" | jq -r '.status // empty')
    COMBINED_COUNT=$(echo "$COMBINED_RESPONSE" | jq -r '.data.total // 0')

    if [ "$COMBINED_STATUS" = "success" ]; then
        print_result "Combined filters" "PASS" ""
        echo "  Found: $COMBINED_COUNT articles matching all filters"
    else
        ERROR_MSG=$(echo "$COMBINED_RESPONSE" | jq -r '.message // "Unknown error"')
        print_result "Combined filters" "FAIL" "$ERROR_MSG"
    fi
else
    print_result "Combined filters" "FAIL" "No category available for testing"
fi
echo ""

#----------------------------------------
# Test 9: Search with filters
#----------------------------------------
echo -e "${YELLOW}10. Test: Search with filters${NC}"

SEARCH_FILTER_RESPONSE=$(auth_request "GET" \
    "/news/articles?search=model&difficulty=beginner&sortBy=relevance&limit=10" \
    "$ADMIN_TOKEN")
SEARCH_FILTER_STATUS=$(echo "$SEARCH_FILTER_RESPONSE" | jq -r '.status // empty')
SEARCH_FILTER_COUNT=$(echo "$SEARCH_FILTER_RESPONSE" | jq -r '.data.total // 0')

if [ "$SEARCH_FILTER_STATUS" = "success" ]; then
    print_result "Search with filters" "PASS" ""
    echo "  Found: $SEARCH_FILTER_COUNT articles"
else
    ERROR_MSG=$(echo "$SEARCH_FILTER_RESPONSE" | jq -r '.message // "Unknown error"')
    print_result "Search with filters" "FAIL" "$ERROR_MSG"
fi
echo ""

#----------------------------------------
# Test 10: Performance test (<300ms target)
#----------------------------------------
echo -e "${YELLOW}11. Test: Performance (<300ms target)${NC}"

START_TIME=$(date +%s%N)
PERF_RESPONSE=$(auth_request "GET" \
    "/news/articles?search=transformer&category=$CATEGORY_SLUG&sortBy=relevance&limit=20" \
    "$ADMIN_TOKEN")
END_TIME=$(date +%s%N)

RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
PERF_STATUS=$(echo "$PERF_RESPONSE" | jq -r '.status // empty')

if [ "$PERF_STATUS" = "success" ]; then
    echo "  Response time: ${RESPONSE_TIME}ms"

    if [ "$RESPONSE_TIME" -lt 300 ]; then
        print_result "Performance (<300ms)" "PASS" ""
    else
        print_result "Performance (<300ms)" "FAIL" "Response time ${RESPONSE_TIME}ms exceeds 300ms target"
    fi
else
    print_result "Performance (<300ms)" "FAIL" "Request failed"
fi
echo ""

#----------------------------------------
# Test 11: Invalid parameters
#----------------------------------------
echo -e "${YELLOW}12. Test: Invalid parameters handling${NC}"

# Invalid sort field
INVALID_SORT=$(auth_request "GET" "/news/articles?sortBy=invalid&limit=10" "$ADMIN_TOKEN")
INVALID_SORT_STATUS=$(echo "$INVALID_SORT" | jq -r '.status // empty')

if [ "$INVALID_SORT_STATUS" = "error" ]; then
    print_result "Invalid sort field handling" "PASS" ""
else
    print_result "Invalid sort field handling" "FAIL" "Should reject invalid sort field"
fi
echo ""

#----------------------------------------
# Test 12: Pagination limits
#----------------------------------------
echo -e "${YELLOW}13. Test: Pagination limits${NC}"

# Try to exceed max limit (100)
LIMIT_RESPONSE=$(auth_request "GET" "/news/articles?limit=150" "$ADMIN_TOKEN")
LIMIT_STATUS=$(echo "$LIMIT_RESPONSE" | jq -r '.status // empty')

if [ "$LIMIT_STATUS" = "error" ]; then
    print_result "Pagination limit enforcement" "PASS" ""
else
    print_result "Pagination limit enforcement" "FAIL" "Should reject limit > 100"
fi
echo ""

#----------------------------------------
# Test Summary
#----------------------------------------
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Total tests run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed ✗${NC}"
    exit 1
fi
