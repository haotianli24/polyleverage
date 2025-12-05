#!/bin/bash

BASE_URL="http://localhost:3000"
TEST_ADDRESS="9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT"
POLYGON_ADDRESS="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

echo "========================================="
echo "Testing Solana Deposits & Polymarket Positions"
echo "========================================="
echo ""

echo "Test 1: Get Solana balance (Devnet)"
curl -s "$BASE_URL/api/deposits/balance?address=$TEST_ADDRESS" | python3 -m json.tool
echo ""
echo ""

echo "Test 2: Verify deposit signature (mock test)"
echo "Note: Use a real Devnet transaction signature to test"
MOCK_SIG="5Kn8WHZhEqGqxCEjWyVCTQPFv1F1pHLqX4GjJnPBZR3k2VrGJ8Y5mN4HqGxCEjWyVCTQPFv1F1pHLqX4GjJn"
curl -s -X POST "$BASE_URL/api/deposits/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "'$MOCK_SIG'",
    "userAddress": "'$TEST_ADDRESS'"
  }' | python3 -m json.tool
echo ""
echo ""

echo "Test 3: Open a YES position on Polymarket (1x leverage)"
echo "Market: Will Trump win 2024?"
curl -s -X POST "$BASE_URL/api/polymarket/open-position" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "'$POLYGON_ADDRESS'",
    "marketId": "0x1234567890abcdef",
    "tokenId": "11273149",
    "side": "YES",
    "amount": 10,
    "price": 0.52
  }' | python3 -m json.tool
echo ""
echo ""

echo "Test 4: Open a NO position on Polymarket (1x leverage)"
curl -s -X POST "$BASE_URL/api/polymarket/open-position" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "'$POLYGON_ADDRESS'",
    "marketId": "0x1234567890abcdef",
    "tokenId": "31574572",
    "side": "NO",
    "amount": 5,
    "price": 0.48
  }' | python3 -m json.tool
echo ""
echo ""

echo "Test 5: Test validation - missing fields"
curl -s -X POST "$BASE_URL/api/polymarket/open-position" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "'$POLYGON_ADDRESS'",
    "marketId": "0x1234567890abcdef"
  }' | python3 -m json.tool
echo ""
echo ""

echo "Test 6: Test validation - invalid side"
curl -s -X POST "$BASE_URL/api/polymarket/open-position" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "'$POLYGON_ADDRESS'",
    "marketId": "0x1234567890abcdef",
    "tokenId": "11273149",
    "side": "MAYBE",
    "amount": 10
  }' | python3 -m json.tool
echo ""
echo ""

echo "Test 7: Test validation - negative amount"
curl -s -X POST "$BASE_URL/api/polymarket/open-position" \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "'$POLYGON_ADDRESS'",
    "marketId": "0x1234567890abcdef",
    "tokenId": "11273149",
    "side": "YES",
    "amount": -5
  }' | python3 -m json.tool
echo ""
echo ""

echo "========================================="
echo "All tests completed!"
echo ""
echo "Next steps for production:"
echo "1. Get testnet SOL from https://faucet.solana.com"
echo "2. Make a real deposit to your address"
echo "3. Use the transaction signature to verify"
echo "4. Connect to Polymarket CLOB API with valid credentials"
echo "5. Place real orders on Polymarket markets"
echo "========================================="
