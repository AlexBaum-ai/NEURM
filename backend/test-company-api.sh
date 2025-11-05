#!/bin/bash

# Company Profile API Test Script
# Tests all company endpoints

# Configuration
BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"
TOKEN=""  # Add authentication token if needed

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================="
echo "Company Profile API Tests"
echo "======================================="
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

# Test 1: List companies (public)
echo -e "${YELLOW}Test 1: List companies${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
[ "$HTTP_CODE" -eq 200 ] && print_result 0 "List companies" || print_result 1 "List companies (HTTP $HTTP_CODE)"
echo ""

# Test 2: List companies with filters
echo -e "${YELLOW}Test 2: List companies with filters${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies?industry=Technology&verified=true&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
[ "$HTTP_CODE" -eq 200 ] && print_result 0 "List filtered companies" || print_result 1 "List filtered companies (HTTP $HTTP_CODE)"
echo ""

# Test 3: Get company by ID (public - should work without auth)
echo -e "${YELLOW}Test 3: Get company by ID${NC}"
# First, get a company ID from the list
COMPANY_ID=$(echo "$BODY" | jq -r '.data[0].id' 2>/dev/null)

if [ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies/$COMPANY_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_result 0 "Get company by ID" || print_result 1 "Get company by ID (HTTP $HTTP_CODE)"
else
    echo "Skipping test - no company available"
fi
echo ""

# Test 4: Get company by slug (public)
echo -e "${YELLOW}Test 4: Get company by slug${NC}"
COMPANY_SLUG=$(echo "$BODY" | jq -r '.data.slug' 2>/dev/null)

if [ -n "$COMPANY_SLUG" ] && [ "$COMPANY_SLUG" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies/$COMPANY_SLUG")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_result 0 "Get company by slug" || print_result 1 "Get company by slug (HTTP $HTTP_CODE)"
else
    echo "Skipping test - no company slug available"
fi
echo ""

# Test 5: Get company jobs
echo -e "${YELLOW}Test 5: Get company jobs${NC}"
if [ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies/$COMPANY_ID/jobs")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_result 0 "Get company jobs" || print_result 1 "Get company jobs (HTTP $HTTP_CODE)"
else
    echo "Skipping test - no company available"
fi
echo ""

# Test 6: Follow company (requires authentication)
echo -e "${YELLOW}Test 6: Follow company (requires auth)${NC}"
if [ -z "$TOKEN" ]; then
    echo "Skipping test - no authentication token provided"
else
    if [ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/companies/$COMPANY_ID/follow" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
        [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 409 ] && print_result 0 "Follow company" || print_result 1 "Follow company (HTTP $HTTP_CODE)"
    else
        echo "Skipping test - no company available"
    fi
fi
echo ""

# Test 7: Unfollow company (requires authentication)
echo -e "${YELLOW}Test 7: Unfollow company (requires auth)${NC}"
if [ -z "$TOKEN" ]; then
    echo "Skipping test - no authentication token provided"
else
    if [ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/companies/$COMPANY_ID/follow" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
        [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 409 ] && print_result 0 "Unfollow company" || print_result 1 "Unfollow company (HTTP $HTTP_CODE)"
    else
        echo "Skipping test - no company available"
    fi
fi
echo ""

# Test 8: Update company (requires authentication and ownership)
echo -e "${YELLOW}Test 8: Update company profile (requires auth)${NC}"
if [ -z "$TOKEN" ]; then
    echo "Skipping test - no authentication token provided"
else
    if [ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/companies/$COMPANY_ID" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "description": "Updated company description via API test",
                "mission": "To revolutionize the AI industry"
            }')
        HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
        [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 403 ] && print_result 0 "Update company (expected: 200 if owner, 403 if not)" || print_result 1 "Update company (HTTP $HTTP_CODE)"
    else
        echo "Skipping test - no company available"
    fi
fi
echo ""

# Test 9: Search companies
echo -e "${YELLOW}Test 9: Search companies${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies?search=tech&page=1&limit=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
[ "$HTTP_CODE" -eq 200 ] && print_result 0 "Search companies" || print_result 1 "Search companies (HTTP $HTTP_CODE)"
echo ""

# Test 10: Get non-existent company (should return 404)
echo -e "${YELLOW}Test 10: Get non-existent company${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/companies/00000000-0000-0000-0000-000000000000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response: $BODY" | jq . 2>/dev/null || echo "$BODY"
[ "$HTTP_CODE" -eq 404 ] && print_result 0 "Get non-existent company (404 expected)" || print_result 1 "Get non-existent company (HTTP $HTTP_CODE)"
echo ""

echo "======================================="
echo "Company API Tests Complete"
echo "======================================="
echo ""
echo "Note: Tests requiring authentication were skipped or may have failed."
echo "To test authenticated endpoints, set the TOKEN variable with a valid JWT."
