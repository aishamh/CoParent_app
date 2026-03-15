#!/bin/bash
# CoParent Connect - Production Health Check
# Polls API and web endpoints to verify deployment is healthy
# Usage: Run manually or via cron/loop

API_URL="https://co-parent-app-mu.vercel.app"
WEB_URL="https://coparent-app.netlify.app"
LOG_FILE="/tmp/coparent-health.log"

timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

check_endpoint() {
  local name="$1"
  local url="$2"
  local expected_code="$3"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" "$url" 2>/dev/null)
  local code=$(echo "$response" | awk '{print $1}')
  local time=$(echo "$response" | awk '{print $2}')

  if [ "$code" = "$expected_code" ]; then
    echo "[$(timestamp)] OK   $name -> $code (${time}s)" | tee -a "$LOG_FILE"
  else
    echo "[$(timestamp)] FAIL $name -> $code (expected $expected_code, ${time}s)" | tee -a "$LOG_FILE"
  fi
}

echo "--- Health Check $(timestamp) ---" | tee -a "$LOG_FILE"
check_endpoint "API /auth/me"      "$API_URL/api/auth/me"       "401"
check_endpoint "API /children"     "$API_URL/api/children"      "401"
check_endpoint "API /events"       "$API_URL/api/events"        "401"
check_endpoint "API /messages"     "$API_URL/api/messages"      "401"
check_endpoint "API /expenses"     "$API_URL/api/expenses"      "401"
check_endpoint "Web frontend"     "$WEB_URL"                    "200"
echo "--- End ---" | tee -a "$LOG_FILE"
echo ""
