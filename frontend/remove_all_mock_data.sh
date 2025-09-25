#!/bin/bash

echo "Removing all mock data from ShareWise AI..."

# Remove hardcoded portfolio values
sed -i 's/totalValue: 125000,/totalValue: 0,/' src/pages/Dashboard.tsx
sed -i 's/todayPnl: 2500,/todayPnl: 0,/' src/pages/Dashboard.tsx
sed -i 's/todayPnlPercent: 2.04,/todayPnlPercent: 0,/' src/pages/Dashboard.tsx
sed -i 's/totalPnl: 15000,/totalPnl: 0,/' src/pages/Dashboard.tsx
sed -i 's/totalPnlPercent: 13.64,/totalPnlPercent: 0,/' src/pages/Dashboard.tsx

# Remove hardcoded portfolio data from Portfolio.tsx
sed -i 's/dayChange: 2500,/dayChange: 0,/' src/pages/Portfolio.tsx
sed -i 's/dayChangePercent: 2.04,/dayChangePercent: 0,/' src/pages/Portfolio.tsx

# Remove mock authentication fallbacks
sed -i 's/console.log.*Backend not available.*mock/#&/' src/services/api.ts

# Replace hardcoded signal prices with zeros (to be replaced with live data)
sed -i 's/entry_price: [0-9.]*,/entry_price: 0,/g' src/pages/Dashboard.tsx
sed -i 's/target_price: [0-9.]*,/target_price: 0,/g' src/pages/Dashboard.tsx
sed -i 's/current_price: [0-9.]*,/current_price: 0,/g' src/pages/Dashboard.tsx

echo "Mock data removal complete. Now adding live data integration..."
