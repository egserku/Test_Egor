
const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

const updated = inventoryData.map(item => {
  if (item.productType === 'CAP') {
    return { ...item, size: 'Universal' };
  }
  return item;
});

// Group by unique properties to avoid duplicates after renaming size to Universal
const uniqueInventory = [];
const seen = new Set();

updated.forEach(item => {
  const key = `${item.productType}|${item.color}|${item.size}|${item.sleeve || ''}|${item.fabric || ''}`;
  if (!seen.has(key)) {
    uniqueInventory.push(item);
    seen.add(key);
  } else {
    // Merge quantity if duplicate
    const existing = uniqueInventory.find(i => `${i.productType}|${i.color}|${i.size}|${i.sleeve || ''}|${i.fabric || ''}` === key);
    if (existing) {
      existing.quantity += item.quantity;
    }
  }
});

fs.writeFileSync(inventoryPath, JSON.stringify(uniqueInventory, null, 2));
console.log('Inventory updated: Caps set to Universal and merged duplicates.');
