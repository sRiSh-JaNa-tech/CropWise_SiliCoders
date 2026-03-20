/**
 * dataLoader.ts
 * 
 * Provides AI-chain data with a two-tier strategy:
 *   1. PRIMARY  → Fetch live from MongoDB (real-time, most accurate)
 *   2. FALLBACK → Load from temp_data.json (pre-fetched snapshot)
 * 
 * This ensures the AI prompts always have data even when MongoDB is unreachable.
 */

import mongoose from 'mongoose';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SchemeData {
  schemeName: string;
  description: string;
  benefitsDescription: string;
  eligibilityCriteria: string;
  requiredDocuments: string[];
  officialWebsite: string | null;
}

export interface MandiEntry {
  crop: string;
  price: string;
  trend: string;
  bestSellMonth: string;
  riskFactors: string[];
}

export interface DiseaseEntry {
  crop: string;
  disease: string;
  symptoms: string[];
  organic_treatment: string;
  chemical_treatment: string;
  prevention: string;
}

export interface CropSeasonEntry {
  season: string;
  crops: string[];
  soilType: string;
  rainfallRequired: string;
  advice: string;
}

export interface TempData {
  _meta: { generatedAt: string; description: string; source: string };
  schemes: SchemeData[];
  mandi: MandiEntry[];
  diseases: DiseaseEntry[];
  cropRecommendations: CropSeasonEntry[];
}

// ─── Load the JSON fallback once ─────────────────────────────────────────────
let _tempData: TempData | null = null;

function loadTempData(): TempData {
  if (_tempData) return _tempData;
  try {
    const require = createRequire(import.meta.url);
    _tempData = require(path.join(__dirname, 'temp_data.json')) as TempData;
    console.log(`📂 Loaded temp_data.json (${_tempData.schemes.length} schemes, generated ${_tempData._meta.generatedAt})`);
  } catch {
    console.warn('⚠️  temp_data.json not found — run: npx tsx scripts/fetch_mongodb_data.ts');
    _tempData = { _meta: { generatedAt: '', description: '', source: '' }, schemes: [], mandi: [], diseases: [], cropRecommendations: [] };
  }
  return _tempData!;
}

// ─── Scheme Fetching ─────────────────────────────────────────────────────────

/**
 * Fetch schemes matching a query from MongoDB.
 * Falls back to temp_data.json if MongoDB is unavailable / returns nothing.
 */
export async function fetchSchemes(query: string): Promise<SchemeData[]> {
  // ── Try MongoDB ──
  if (mongoose.connection.readyState === 1) {
    try {
      const { default: PMScheme } = await import('../../model/PMSchemes.js');
      const results = await PMScheme.find({
        $or: [
          { schemeName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { benefitsDescription: { $regex: query, $options: 'i' } },
          { eligibilityCriteria: { $regex: query, $options: 'i' } },
        ]
      }).limit(5).lean() as SchemeData[];

      if (results.length > 0) {
        console.log(`🗄️  Schemes from MongoDB: ${results.length} results for "${query}"`);
        return results;
      }

      // If no specific match, return all (for general scheme questions)
      const allSchemes = await PMScheme.find().lean() as SchemeData[];
      if (allSchemes.length > 0) {
        console.log(`🗄️  Schemes from MongoDB (all): ${allSchemes.length} results`);
        return allSchemes;
      }
    } catch (err: any) {
      console.warn('⚠️  MongoDB scheme fetch failed:', err.message);
    }
  }

  // ── Fallback to temp_data.json ──
  const tempData = loadTempData();
  const queryLower = query.toLowerCase();
  const filtered = tempData.schemes.filter(s =>
    s.schemeName.toLowerCase().includes(queryLower) ||
    s.description.toLowerCase().includes(queryLower) ||
    s.benefitsDescription.toLowerCase().includes(queryLower) ||
    s.eligibilityCriteria.toLowerCase().includes(queryLower)
  );

  const result = filtered.length > 0 ? filtered : tempData.schemes;
  console.log(`📂 Schemes from temp_data.json: ${result.length} results for "${query}"`);
  return result;
}

// ─── Mandi Data ─────────────────────────────────────────────────────────────

/**
 * Get mandi (market) price data.
 * Returns static curated data from temp_data.json.
 * Extend this to fetch from a live API or DB collection if you add one.
 */
export function getMandiData(query?: string): MandiEntry[] {
  const tempData = loadTempData();
  if (!query) return tempData.mandi;
  const queryLower = query.toLowerCase();
  const filtered = tempData.mandi.filter(m =>
    m.crop.toLowerCase().includes(queryLower)
  );
  return filtered.length > 0 ? filtered : tempData.mandi;
}

// ─── Disease / Crop Doctor Data ───────────────────────────────────────────────

/**
 * Get disease knowledge for Crop Doctor chain.
 * Uses temp_data.json; extend to fetch from a disease DB collection.
 */
export function getDiseaseData(query?: string): DiseaseEntry[] {
  const tempData = loadTempData();
  if (!query) return tempData.diseases;
  const queryLower = query.toLowerCase();
  const filtered = tempData.diseases.filter(d =>
    d.crop.toLowerCase().includes(queryLower) ||
    d.disease.toLowerCase().includes(queryLower) ||
    d.symptoms.some(s => s.toLowerCase().includes(queryLower))
  );
  return filtered.length > 0 ? filtered : tempData.diseases;
}

// ─── Crop Recommendation Data ─────────────────────────────────────────────────

/**
 * Get seasonal crop recommendation knowledge.
 */
export function getCropRecommendationData(query?: string): CropSeasonEntry[] {
  const tempData = loadTempData();
  if (!query) return tempData.cropRecommendations;
  const queryLower = query.toLowerCase();
  const filtered = tempData.cropRecommendations.filter(r =>
    r.season.toLowerCase().includes(queryLower) ||
    r.crops.some(c => c.toLowerCase().includes(queryLower))
  );
  return filtered.length > 0 ? filtered : tempData.cropRecommendations;
}

// ─── Preload on startup ───────────────────────────────────────────────────────
// Warm the cache so the first request is fast
loadTempData();
