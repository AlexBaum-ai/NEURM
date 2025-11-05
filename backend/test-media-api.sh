#!/bin/bash

# Media API Test Script
# Tests all media management endpoints

set -e

BASE_URL="http://vps-1a707765.vps.ovh.net:3000/api/v1"
MEDIA_URL="$BASE_URL/media"
FOLDER_URL="$BASE_URL/media/folders"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print test results
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS:${NC} $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL:${NC} $2"
        ((TESTS_FAILED++))
    fi
}

# Function to extract value from JSON using grep and sed
extract_json_value() {
    echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed "s/\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\"/\1/" | head -1
}

# Get JWT token (you need to login first)
echo -e "${YELLOW}Note: Make sure you have a valid JWT token${NC}"
echo -e "${YELLOW}Login first using: curl -X POST $BASE_URL/users/login${NC}\n"
read -p "Enter your JWT token: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}Error: JWT token is required${NC}"
    exit 1
fi

# Set auth header
AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"

# =============================================================================
# FOLDER TESTS
# =============================================================================

print_section "FOLDER MANAGEMENT TESTS"

# Test 1: Create root folder
echo "Test 1: Create root folder"
CREATE_FOLDER_RESPONSE=$(curl -s -X POST "$FOLDER_URL" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Images",
        "description": "Test folder for images"
    }')

FOLDER_ID=$(extract_json_value "$CREATE_FOLDER_RESPONSE" "id")
if [ -n "$FOLDER_ID" ]; then
    print_test 0 "Create root folder"
    echo "  Folder ID: $FOLDER_ID"
else
    print_test 1 "Create root folder"
    echo "  Response: $CREATE_FOLDER_RESPONSE"
fi

# Test 2: Create subfolder
if [ -n "$FOLDER_ID" ]; then
    echo -e "\nTest 2: Create subfolder"
    CREATE_SUBFOLDER_RESPONSE=$(curl -s -X POST "$FOLDER_URL" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Thumbnails\",
            \"description\": \"Test subfolder\",
            \"parentId\": \"$FOLDER_ID\"
        }")

    SUBFOLDER_ID=$(extract_json_value "$CREATE_SUBFOLDER_RESPONSE" "id")
    if [ -n "$SUBFOLDER_ID" ]; then
        print_test 0 "Create subfolder"
        echo "  Subfolder ID: $SUBFOLDER_ID"
    else
        print_test 1 "Create subfolder"
    fi
fi

# Test 3: Get folders list
echo -e "\nTest 3: Get folders list"
GET_FOLDERS_RESPONSE=$(curl -s -X GET "$FOLDER_URL" \
    -H "$AUTH_HEADER")

if echo "$GET_FOLDERS_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
    print_test 0 "Get folders list"
else
    print_test 1 "Get folders list"
fi

# Test 4: Get folder tree
echo -e "\nTest 4: Get folder tree"
GET_TREE_RESPONSE=$(curl -s -X GET "$FOLDER_URL/tree" \
    -H "$AUTH_HEADER")

if echo "$GET_TREE_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
    print_test 0 "Get folder tree"
else
    print_test 1 "Get folder tree"
fi

# Test 5: Update folder
if [ -n "$FOLDER_ID" ]; then
    echo -e "\nTest 5: Update folder"
    UPDATE_FOLDER_RESPONSE=$(curl -s -X PUT "$FOLDER_URL/$FOLDER_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Updated Test Images",
            "description": "Updated description"
        }')

    if echo "$UPDATE_FOLDER_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Update folder"
    else
        print_test 1 "Update folder"
    fi
fi

# =============================================================================
# MEDIA UPLOAD TESTS
# =============================================================================

print_section "MEDIA UPLOAD TESTS"

# Create a test image
TEST_IMAGE="test-image.jpg"
echo "Creating test image..."
convert -size 800x600 xc:blue -pointsize 40 -fill white -gravity center \
    -annotate +0+0 "Test Image" "$TEST_IMAGE" 2>/dev/null || {
    # If ImageMagick is not available, create a simple colored square
    echo "ImageMagick not found, creating simple test file..."
    dd if=/dev/urandom of="$TEST_IMAGE" bs=1024 count=100 2>/dev/null
}

# Test 6: Upload image
if [ -f "$TEST_IMAGE" ]; then
    echo -e "\nTest 6: Upload image"
    UPLOAD_RESPONSE=$(curl -s -X POST "$MEDIA_URL/upload" \
        -H "$AUTH_HEADER" \
        -F "file=@$TEST_IMAGE" \
        -F "altText=Test image" \
        -F "caption=This is a test image")

    MEDIA_ID=$(extract_json_value "$UPLOAD_RESPONSE" "id")
    if [ -n "$MEDIA_ID" ]; then
        print_test 0 "Upload image"
        echo "  Media ID: $MEDIA_ID"
    else
        print_test 1 "Upload image"
        echo "  Response: $UPLOAD_RESPONSE"
    fi
else
    echo -e "${YELLOW}Skipping upload test - test image not created${NC}"
fi

# Test 7: Upload image to folder
if [ -f "$TEST_IMAGE" ] && [ -n "$FOLDER_ID" ]; then
    echo -e "\nTest 7: Upload image to folder"
    UPLOAD_TO_FOLDER_RESPONSE=$(curl -s -X POST "$MEDIA_URL/upload" \
        -H "$AUTH_HEADER" \
        -F "file=@$TEST_IMAGE" \
        -F "folderId=$FOLDER_ID" \
        -F "altText=Test image in folder")

    MEDIA_IN_FOLDER_ID=$(extract_json_value "$UPLOAD_TO_FOLDER_RESPONSE" "id")
    if [ -n "$MEDIA_IN_FOLDER_ID" ]; then
        print_test 0 "Upload image to folder"
        echo "  Media ID: $MEDIA_IN_FOLDER_ID"
    else
        print_test 1 "Upload image to folder"
    fi
fi

# =============================================================================
# MEDIA RETRIEVAL TESTS
# =============================================================================

print_section "MEDIA RETRIEVAL TESTS"

# Test 8: Get media list
echo "Test 8: Get media list"
GET_MEDIA_RESPONSE=$(curl -s -X GET "$MEDIA_URL?page=1&limit=10" \
    -H "$AUTH_HEADER")

if echo "$GET_MEDIA_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
    print_test 0 "Get media list"
else
    print_test 1 "Get media list"
fi

# Test 9: Get media by ID
if [ -n "$MEDIA_ID" ]; then
    echo -e "\nTest 9: Get media by ID"
    GET_MEDIA_BY_ID_RESPONSE=$(curl -s -X GET "$MEDIA_URL/$MEDIA_ID" \
        -H "$AUTH_HEADER")

    if echo "$GET_MEDIA_BY_ID_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Get media by ID"
    else
        print_test 1 "Get media by ID"
    fi
fi

# Test 10: Search media
echo -e "\nTest 10: Search media"
SEARCH_MEDIA_RESPONSE=$(curl -s -X GET "$MEDIA_URL?search=test&fileType=image" \
    -H "$AUTH_HEADER")

if echo "$SEARCH_MEDIA_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
    print_test 0 "Search media"
else
    print_test 1 "Search media"
fi

# Test 11: Filter by folder
if [ -n "$FOLDER_ID" ]; then
    echo -e "\nTest 11: Filter media by folder"
    FILTER_BY_FOLDER_RESPONSE=$(curl -s -X GET "$MEDIA_URL?folderId=$FOLDER_ID" \
        -H "$AUTH_HEADER")

    if echo "$FILTER_BY_FOLDER_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Filter media by folder"
    else
        print_test 1 "Filter media by folder"
    fi
fi

# =============================================================================
# MEDIA UPDATE TESTS
# =============================================================================

print_section "MEDIA UPDATE TESTS"

# Test 12: Update media metadata
if [ -n "$MEDIA_ID" ]; then
    echo "Test 12: Update media metadata"
    UPDATE_MEDIA_RESPONSE=$(curl -s -X PUT "$MEDIA_URL/$MEDIA_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "altText": "Updated alt text",
            "caption": "Updated caption",
            "tags": ["test", "image", "demo"]
        }')

    if echo "$UPDATE_MEDIA_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Update media metadata"
    else
        print_test 1 "Update media metadata"
    fi
fi

# Test 13: Move media to folder
if [ -n "$MEDIA_ID" ] && [ -n "$FOLDER_ID" ]; then
    echo -e "\nTest 13: Move media to folder"
    MOVE_MEDIA_RESPONSE=$(curl -s -X PUT "$MEDIA_URL/$MEDIA_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"folderId\": \"$FOLDER_ID\"
        }")

    if echo "$MOVE_MEDIA_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Move media to folder"
    else
        print_test 1 "Move media to folder"
    fi
fi

# =============================================================================
# BULK OPERATIONS TESTS
# =============================================================================

print_section "BULK OPERATIONS TESTS"

# Test 14: Bulk move media
if [ -n "$MEDIA_ID" ] && [ -n "$MEDIA_IN_FOLDER_ID" ] && [ -n "$FOLDER_ID" ]; then
    echo "Test 14: Bulk move media"
    BULK_MOVE_RESPONSE=$(curl -s -X POST "$MEDIA_URL/bulk-move" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"ids\": [\"$MEDIA_ID\", \"$MEDIA_IN_FOLDER_ID\"],
            \"targetFolderId\": \"$FOLDER_ID\"
        }")

    if echo "$BULK_MOVE_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Bulk move media"
    else
        print_test 1 "Bulk move media"
    fi
fi

# =============================================================================
# USAGE TRACKING TESTS
# =============================================================================

print_section "USAGE TRACKING TESTS"

# Test 15: Track media usage
if [ -n "$MEDIA_ID" ]; then
    echo "Test 15: Track media usage"
    TRACK_USAGE_RESPONSE=$(curl -s -X POST "$MEDIA_URL/track-usage" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"mediaId\": \"$MEDIA_ID\",
            \"entityType\": \"article\",
            \"entityId\": \"$(uuidgen)\",
            \"fieldName\": \"featuredImage\"
        }")

    if echo "$TRACK_USAGE_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Track media usage"
    else
        print_test 1 "Track media usage"
    fi
fi

# Test 16: Get media usage
if [ -n "$MEDIA_ID" ]; then
    echo -e "\nTest 16: Get media usage"
    GET_USAGE_RESPONSE=$(curl -s -X GET "$MEDIA_URL/$MEDIA_ID/usage" \
        -H "$AUTH_HEADER")

    if echo "$GET_USAGE_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Get media usage"
    else
        print_test 1 "Get media usage"
    fi
fi

# =============================================================================
# CLEANUP AND DELETION TESTS
# =============================================================================

print_section "CLEANUP TESTS"

# Test 17: Delete media file
if [ -n "$MEDIA_ID" ]; then
    echo "Test 17: Delete media file"
    DELETE_MEDIA_RESPONSE=$(curl -s -X DELETE "$MEDIA_URL/$MEDIA_ID" \
        -H "$AUTH_HEADER")

    if echo "$DELETE_MEDIA_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Delete media file"
    else
        print_test 1 "Delete media file"
    fi
fi

# Test 18: Delete subfolder
if [ -n "$SUBFOLDER_ID" ]; then
    echo -e "\nTest 18: Delete subfolder"
    DELETE_SUBFOLDER_RESPONSE=$(curl -s -X DELETE "$FOLDER_URL/$SUBFOLDER_ID" \
        -H "$AUTH_HEADER")

    if echo "$DELETE_SUBFOLDER_RESPONSE" | grep -q "\"success\"[[:space:]]*:[[:space:]]*true"; then
        print_test 0 "Delete subfolder"
    else
        print_test 1 "Delete subfolder"
    fi
fi

# Clean up test image
if [ -f "$TEST_IMAGE" ]; then
    rm -f "$TEST_IMAGE"
    echo -e "\nTest image cleaned up"
fi

# =============================================================================
# SUMMARY
# =============================================================================

print_section "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed ✗${NC}"
    exit 1
fi
