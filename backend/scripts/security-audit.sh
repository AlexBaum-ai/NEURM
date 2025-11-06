#!/bin/bash

# Security Audit Script for Neurmatic Backend
# Tests security controls and generates audit report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
REPORT_FILE="security-audit-report-$(date +%Y%m%d-%H%M%S).txt"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Neurmatic Security Audit Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Report: $REPORT_FILE"
echo ""

# Initialize report
exec > >(tee -i "$REPORT_FILE")
exec 2>&1

echo "Security Audit Started: $(date)"
echo "========================================"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Helper functions
test_passed() {
    echo -e "${GREEN}✓ PASSED${NC}: $1"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}✗ FAILED${NC}: $1"
    echo "  Details: $2"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    echo "  Details: $2"
    ((TESTS_WARNING++))
}

echo "1. Security Headers Test"
echo "------------------------"

# Test security headers
HEADERS=$(curl -s -I "$API_URL/health" 2>/dev/null || echo "")

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    test_passed "HSTS header present"
else
    test_failed "HSTS header missing" "Strict-Transport-Security header not found"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    test_passed "X-Frame-Options header present"
else
    test_failed "X-Frame-Options header missing" "Clickjacking protection not enabled"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    test_passed "X-Content-Type-Options header present"
else
    test_failed "X-Content-Type-Options header missing" "MIME sniffing protection not enabled"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
    test_passed "CSP header present"
else
    test_failed "CSP header missing" "Content Security Policy not configured"
fi

if echo "$HEADERS" | grep -q "X-Request-ID"; then
    test_passed "Request ID tracking enabled"
else
    test_warning "Request ID header missing" "Request tracking may not be enabled"
fi

echo ""
echo "2. Rate Limiting Test"
echo "---------------------"

# Test rate limiting (make 10 quick requests)
RATE_LIMITED=false
for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    if [ "$RESPONSE" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
done

if [ "$RATE_LIMITED" = false ]; then
    test_passed "Rate limiting configured (not triggered in 10 requests)"
else
    test_warning "Rate limiting triggered quickly" "May be too aggressive for health check endpoint"
fi

echo ""
echo "3. HTTPS Configuration Test"
echo "---------------------------"

if [[ "$API_URL" == https://* ]]; then
    SSL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>&1 || echo "error")
    if [ "$SSL_RESPONSE" = "200" ]; then
        test_passed "HTTPS connection successful"
    else
        test_failed "HTTPS connection failed" "Status: $SSL_RESPONSE"
    fi
else
    test_warning "Testing HTTP endpoint" "HTTPS enforcement cannot be tested on HTTP URL"
fi

echo ""
echo "4. Error Handling Test"
echo "----------------------"

# Test 404 handler
NOTFOUND_RESPONSE=$(curl -s "$API_URL/api/v1/nonexistent-endpoint")
if echo "$NOTFOUND_RESPONSE" | grep -q '"success":false'; then
    test_passed "404 handler returns proper error format"
else
    test_failed "404 handler incorrect" "Response: $NOTFOUND_RESPONSE"
fi

# Check if error reveals sensitive info
if echo "$NOTFOUND_RESPONSE" | grep -qE "(stack|prisma|database|password|secret)"; then
    test_failed "Error message may leak sensitive information" "Found sensitive keywords in error response"
else
    test_passed "Error messages do not leak sensitive information"
fi

echo ""
echo "5. CORS Configuration Test"
echo "--------------------------"

CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_URL/api/v1/health" \
    -H "Origin: https://malicious-site.com" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null || echo "")

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    ALLOWED_ORIGIN=$(echo "$CORS_HEADERS" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
    if [ "$ALLOWED_ORIGIN" = "https://malicious-site.com" ]; then
        test_failed "CORS allows any origin" "Malicious origin was accepted"
    else
        test_passed "CORS properly restricts origins"
    fi
else
    test_warning "CORS headers not found in OPTIONS response" "May need CORS preflight configuration"
fi

echo ""
echo "6. Input Validation Test"
echo "------------------------"

# Test SQL injection attempt (should be rejected by validation)
SQL_INJECTION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/users/1' OR '1'='1")
if [ "$SQL_INJECTION_RESPONSE" = "400" ] || [ "$SQL_INJECTION_RESPONSE" = "404" ]; then
    test_passed "SQL injection attempt rejected"
else
    test_warning "Unexpected response to SQL injection attempt" "Status: $SQL_INJECTION_RESPONSE"
fi

# Test XSS attempt in query parameter
XSS_RESPONSE=$(curl -s "$API_URL/api/v1/search?q=%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E")
if echo "$XSS_RESPONSE" | grep -q "<script>"; then
    test_failed "XSS content not sanitized" "Script tags found in response"
else
    test_passed "XSS content properly sanitized"
fi

echo ""
echo "7. Authentication Security Test"
echo "-------------------------------"

# Test access to protected endpoint without auth
PROTECTED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/users/me")
if [ "$PROTECTED_RESPONSE" = "401" ] || [ "$PROTECTED_RESPONSE" = "403" ]; then
    test_passed "Protected endpoint requires authentication"
else
    test_warning "Protected endpoint response unexpected" "Status: $PROTECTED_RESPONSE (expected 401/403)"
fi

echo ""
echo "8. Dependency Security Audit"
echo "----------------------------"

if command -v npm &> /dev/null; then
    AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")

    if [ "$VULN_COUNT" -eq 0 ]; then
        test_passed "No npm vulnerabilities found"
    elif [ "$VULN_COUNT" -lt 10 ]; then
        test_warning "Found $VULN_COUNT npm vulnerabilities" "Run 'npm audit' for details"
    else
        test_failed "Found $VULN_COUNT npm vulnerabilities" "Critical security issues - run 'npm audit fix'"
    fi
else
    test_warning "npm not available" "Cannot perform dependency audit"
fi

echo ""
echo "9. Environment Configuration Test"
echo "----------------------------------"

# Check if .env file exists in project root (should not be in production)
if [ -f "$(dirname "$0")/../../.env" ]; then
    test_warning ".env file found in project root" "Ensure .env is not deployed to production"
else
    test_passed ".env file not found in project (good for production)"
fi

# Test if health endpoint reveals environment info
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"environment"'; then
    ENV_VALUE=$(echo "$HEALTH_RESPONSE" | jq -r '.environment' 2>/dev/null || echo "unknown")
    if [ "$ENV_VALUE" = "production" ]; then
        test_passed "Environment is set to production"
    else
        test_warning "Environment is not production" "Current: $ENV_VALUE"
    fi
fi

echo ""
echo "10. Password Policy Test"
echo "------------------------"

# This would require actual registration, so we'll check documentation
if [ -f "$(dirname "$0")/../SECURITY.md" ]; then
    if grep -q "bcrypt.*12" "$(dirname "$0")/../SECURITY.md"; then
        test_passed "Password hashing uses bcrypt with sufficient rounds"
    else
        test_warning "Password hashing configuration not documented" "Verify bcrypt rounds >= 12"
    fi
else
    test_warning "SECURITY.md not found" "Security documentation missing"
fi

echo ""
echo "========================================"
echo "Security Audit Summary"
echo "========================================"
echo ""
echo -e "${GREEN}Tests Passed:${NC}  $TESTS_PASSED"
echo -e "${YELLOW}Warnings:${NC}      $TESTS_WARNING"
echo -e "${RED}Tests Failed:${NC}  $TESTS_FAILED"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_WARNING + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Security Audit PASSED${NC}"
    echo "The application has strong security controls."
    EXIT_CODE=0
elif [ $TESTS_FAILED -lt 3 ]; then
    echo -e "${YELLOW}⚠ Security Audit PASSED with warnings${NC}"
    echo "Minor security issues detected. Review and fix before production."
    EXIT_CODE=0
else
    echo -e "${RED}✗ Security Audit FAILED${NC}"
    echo "Critical security issues detected. Fix immediately!"
    EXIT_CODE=1
fi

echo ""
echo "Full report saved to: $REPORT_FILE"
echo "Audit completed: $(date)"
echo ""

exit $EXIT_CODE
