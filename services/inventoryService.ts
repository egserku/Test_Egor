import fs from 'fs/promises';
import path from 'path';
import { InventoryItem, OrderItem } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

async function ensureDbExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring inventory db exists:', err);
  }
}

export async function getInventory(): Promise<InventoryItem[]> {
  await ensureDbExists();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as InventoryItem[];
  } catch (err) {
    console.error('Error reading inventory db:', err);
    return [];
  }
}

export async function saveInventory(inventory: InventoryItem[]): Promise<InventoryItem[]> {
  await ensureDbExists();
  await fs.writeFile(DB_FILE, JSON.stringify(inventory, null, 2), 'utf-8');
  return inventory;
}

export async function deductOrderItemsFromInventory(items: OrderItem[]): Promise<void> {
  const inventory = await getInventory();
  let changed = false;

  for (const item of items) {
    const matchItem = (i: InventoryItem) => {
      if (i.productType !== item.type || i.color !== item.color) return false;
      if (i.size && item.size && i.size !== item.size) return false;
      if (i.sleeve && item.sleeve && i.sleeve !== item.sleeve) return false;
      if (i.fabric && item.fabric && i.fabric !== item.fabric) return false;
      return true;
    };

    // If team order, deduct for each player individually
    if (item.players && item.players.length > 0) {
      for (const player of item.players) {
        const invItem = inventory.find(i => matchItem(i) && i.size === player.size);
        if (invItem) {
          invItem.quantity -= 1;
          changed = true;
        }
      }
    } else {
      const invItem = inventory.find(i => matchItem(i));
      if (invItem) {
        invItem.quantity -= (item.quantity || 1);
        changed = true;
      }
    }
  }

  if (changed) {
    await saveInventory(inventory);
  }
}

export async function returnOrderItemsToInventory(items: OrderItem[]): Promise<void> {
  const inventory = await getInventory();
  let changed = false;

  for (const item of items) {
    const matchItem = (i: InventoryItem) => {
      if (i.productType !== item.type || i.color !== item.color) return false;
      if (i.size && item.size && i.size !== item.size) return false;
      if (i.sleeve && item.sleeve && i.sleeve !== item.sleeve) return false;
      if (i.fabric && item.fabric && i.fabric !== item.fabric) return false;
      return true;
    };

    if (item.players && item.players.length > 0) {
      for (const player of item.players) {
        const invItem = inventory.find(i => matchItem(i) && i.size === player.size);
        if (invItem) {
          invItem.quantity += 1;
          changed = true;
        }
      }
    } else {
      const invItem = inventory.find(i => matchItem(i));
      if (invItem) {
        invItem.quantity += (item.quantity || 1);
        changed = true;
      }
    }
  }

  if (changed) {
    await saveInventory(inventory);
  }
}
