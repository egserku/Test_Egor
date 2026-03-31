import fs from 'fs/promises';
import path from 'path';
import { SCHOOL_LIST as initialSchools, School } from '../constants'; // Fallback to initial list

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'schools.json');

// Ensure database file exists
async function ensureDbExists() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // Create with default schools if doesn't exist
      await fs.writeFile(DB_FILE, JSON.stringify(initialSchools, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring schools db exists:', err);
  }
}

export async function getSchools(): Promise<School[]> {
  await ensureDbExists();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as School[];
  } catch (err) {
    console.error('Error reading schools db:', err);
    return [];
  }
}

export async function addSchool(school: School): Promise<School> {
  const schools = await getSchools();
  schools.push(school);
  await fs.writeFile(DB_FILE, JSON.stringify(schools, null, 2), 'utf-8');
  return school;
}

export async function updateSchool(id: string, updatedSchool: Partial<School>): Promise<School | null> {
  const schools = await getSchools();
  const index = schools.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  schools[index] = { ...schools[index], ...updatedSchool };
  await fs.writeFile(DB_FILE, JSON.stringify(schools, null, 2), 'utf-8');
  return schools[index];
}

export async function deleteSchool(id: string): Promise<boolean> {
  const schools = await getSchools();
  const index = schools.findIndex(s => s.id === id);
  if (index === -1) return false;
  
  schools.splice(index, 1);
  await fs.writeFile(DB_FILE, JSON.stringify(schools, null, 2), 'utf-8');
  return true;
}
