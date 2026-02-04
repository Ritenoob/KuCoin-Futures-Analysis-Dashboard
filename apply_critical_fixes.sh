#!/bin/bash
# ============================================================================
# CRITICAL BUGFIX PATCH for KuCoin Dashboard v3.5.0
# ============================================================================
# This script applies all three critical bug fixes:
# 1. Adds indicator recalculation loop
# 2. Fixes order execution feedback
# 3. Improves position size display
# ============================================================================

echo "========================================"
echo "KuCoin Dashboard v3.5.0 - CRITICAL FIXES"
echo "========================================"
echo ""

# Backup original files
echo "[1/5] Creating backups..."
cp server.js server.js.backup
cp index.html index.html.backup
echo "✅ Backups created: server.js.backup, index.html.backup"
echo ""

# Fix #1: Add indicator recalculation loop
echo "[2/5] Fixing Bug #1: Adding indicator update loop..."

# Find the line number for order book update interval
LINE_NUM=$(grep -n "// Update order books every 2 seconds" server.js | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
    echo "❌ Could not find insertion point for indicator loop"
    exit 1
fi

# Calculate insertion point (after order book interval block)
INSERT_LINE=$((LINE_NUM + 6))

# Create the indicator update code
cat > /tmp/indicator_fix.txt << 'EOF'

// ============================================================================
// FIX #1: INDICATOR RECALCULATION LOOP (MISSING IN ORIGINAL)
// ============================================================================
// Update indicators every 10 seconds
setInterval(async () => {
  for (const symbol of Object.keys(marketManagers)) {
    const manager = marketManagers[symbol];
    if (manager && manager.candles && manager.candles.length >= 50) {
      // Recalculate all indicators
      manager.calculateIndicators();
      
      // Broadcast updated data to all clients
      broadcastMarketData(symbol);
    }
  }
  broadcastLog('debug', `Indicators updated for ${Object.keys(marketManagers).length} symbols`);
}, 10000);

EOF

# Insert the code
head -n $INSERT_LINE server.js > /tmp/server_part1.js
cat /tmp/indicator_fix.txt >> /tmp/server_part1.js
tail -n +$((INSERT_LINE + 1)) server.js >> /tmp/server_part1.js
mv /tmp/server_part1.js server.js

echo "✅ Indicator update loop added"
echo ""

# Fix #2: Add order execution feedback
echo "[3/5] Fixing Bug #2: Adding order execution feedback..."

# Find the executeEntry function's error handling
sed -i.tmp '/broadcastLog.*error.*Position size too small/a\    broadcast({ type: "order_error", error: "Position size too small", details: { margin: marginUsed, leverage } });' server.js

# Add success broadcast after position creation
sed -i.tmp '/broadcastLog.*success.*Position opened/a\    broadcast({ type: "order_success", symbol, side, size: actualSize, entryPrice: roundedEntry });' server.js

echo "✅ Order feedback broadcasting added"
echo ""

# Fix #3: Improve frontend order handling
echo "[4/5] Fixing Bug #3: Improving frontend order handling..."

# Find the WebSocket message handler section
LINE_NUM=$(grep -n "case 'log':" index.html | head -1 | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
    echo "⚠️  Could not find message handler - manual update required"
else
    # Add order success/error handlers
    INSERT_LINE=$((LINE_NUM - 5))
    
    cat > /tmp/ws_handlers.txt << 'EOF'
        
        case 'order_success':
          this.log(`✅ Order placed: ${data.symbol} ${data.side} ${data.size} lots @ ${data.entryPrice}`, 'success');
          this.playSound('entry');
          break;
        
        case 'order_error':
          this.log(`❌ Order failed: ${data.error}`, 'error');
          this.playSound('error');
          if (data.details) {
            console.error('Order error details:', data.details);
          }
          break;

EOF

    head -n $INSERT_LINE index.html > /tmp/html_part1.html
    cat /tmp/ws_handlers.txt >> /tmp/html_part1.html
    tail -n +$((INSERT_LINE + 1)) index.html >> /tmp/html_part1.html
    mv /tmp/html_part1.html index.html
    
    echo "✅ Frontend order handling improved"
fi
echo ""

# Verify the changes
echo "[5/5] Verifying changes..."
echo ""

# Check indicator loop was added
if grep -q "Update indicators every 10 seconds" server.js; then
    echo "✅ Indicator update loop: ADDED"
else
    echo "❌ Indicator update loop: MISSING"
fi

# Check order feedback was added
if grep -q "order_error" server.js; then
    echo "✅ Order error feedback: ADDED"
else
    echo "⚠️  Order error feedback: PARTIAL"
fi

# Check frontend handlers
if grep -q "order_success" index.html; then
    echo "✅ Frontend handlers: ADDED"
else
    echo "⚠️  Frontend handlers: MANUAL UPDATE NEEDED"
fi

echo ""
echo "========================================"
echo "✅ PATCH COMPLETE"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review changes: diff server.js.backup server.js"
echo "2. Test the server: npm start"
echo "3. Verify indicators update every 10 seconds"
echo "4. Test order placement"
echo ""
echo "If issues occur:"
echo "- Restore: mv server.js.backup server.js"
echo "- Restore: mv index.html.backup index.html"
echo ""
