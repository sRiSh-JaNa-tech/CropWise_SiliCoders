/**
 * fetch_mongodb_data.ts
 * Run this script to populate temp_data.json with:
 *   - All PM Schemes from MongoDB
 *   - Mandi / market price data (static, curated)
 *   - Crop doctor knowledge (diseases & treatments)
 *   - Crop recommendation knowledge
 * 
 * Usage:
 *   npx tsx scripts/fetch_mongodb_data.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// ──────────────────────────────────────────────────────────────────────────────
// Static knowledge that supplements MongoDB (market / doctor / recommend data)
// ──────────────────────────────────────────────────────────────────────────────
const static_mandi_data = [
  { crop: "Wheat",   price: "₹2,275/quintal", trend: "Market peaking for Wheat",       bestSellMonth: "April - May",       riskFactors: ["Monsoon delays", "Export policy changes"] },
  { crop: "Rice",    price: "₹2,183/quintal", trend: "Stable demand from FCI procurement", bestSellMonth: "October - November", riskFactors: ["Excess MSP stock", "Import duty changes"] },
  { crop: "Potato",  price: "₹1,540/quintal", trend: "Rising due to cold-storage shortage", bestSellMonth: "January - February", riskFactors: ["Cold-storage costs", "Transportation"] },
  { crop: "Onion",   price: "₹1,200/quintal", trend: "Volatile — depends on export restrictions", bestSellMonth: "December - January", riskFactors: ["Govt export bans", "Weather-induced surplus"] },
  { crop: "Tomato",  price: "₹800/quintal",  trend: "High in off-season (May-June)",   bestSellMonth: "May - June",        riskFactors: ["Very perishable", "Transportation costs"] },
  { crop: "Soybean", price: "₹4,600/quintal", trend: "Good demand from oil mills",     bestSellMonth: "November - December", riskFactors: ["Edible oil imports", "Monsoon failure"] },
  { crop: "Cotton",  price: "₹6,800/quintal", trend: "Stable; MSP support",            bestSellMonth: "December - January", riskFactors: ["Global cotton glut", "Pest issues"] },
  { crop: "Maize",   price: "₹2,010/quintal", trend: "Rising demand from poultry/ethanol industry", bestSellMonth: "October - November", riskFactors: ["Import competition"] },
];

const static_diseases_data = [
  {
    crop: "Wheat", disease: "Rust (Yellow/Brown/Black)",
    symptoms: ["Yellow/orange pustules on leaves", "Premature drying of leaves"],
    organic_treatment: "Neem oil spray (5 ml/litre), remove infected plant parts early.",
    chemical_treatment: "Propiconazole (Tilt 25 EC) @ 0.1%, Mancozeb @ 0.2%. Spray at first sign.",
    prevention: "Use resistant varieties (HD-2967, DBW-187), avoid late sowing."
  },
  {
    crop: "Rice", disease: "Blast (Pyricularia oryzae)",
    symptoms: ["Diamond-shaped grey lesions on leaves", "Neck rot at panicle emergence"],
    organic_treatment: "Trichobanafungicide spray, silicon-rich soil amendments.",
    chemical_treatment: "Tricyclazole (Beam 75 WP) @ 0.06%, Isoprothiolane @ 1.5 ml/litre.",
    prevention: "Balanced nitrogen, avoid water stress, use resistant varieties (Pusa Basmati 1121)."
  },
  {
    crop: "Tomato", disease: "Early Blight (Alternaria solani)",
    symptoms: ["Dark brown spots with concentric rings on older leaves", "Yellowing around spots"],
    organic_treatment: "Copper-based fungicide (Bordeaux mixture 1%), neem oil.",
    chemical_treatment: "Mancozeb @ 2g/litre or Chlorothalonil @ 2 g/litre every 7-10 days.",
    prevention: "Crop rotation, remove crop debris, avoid overhead irrigation."
  },
  {
    crop: "Cotton", disease: "Bollworm Infestation",
    symptoms: ["Entry holes in bolls", "Caterpillars inside bolls", "Premature boll drop"],
    organic_treatment: "Bacillus thuringiensis (Bt) spray, pheromone traps.",
    chemical_treatment: "Emamectin Benzoate @ 0.5 g/litre, Spinosad @ 0.3 ml/litre.",
    prevention: "Early sowing, destroy crop stubble, use Bt cotton varieties."
  },
  {
    crop: "Potato", disease: "Late Blight (Phytophthora infestans)",
    symptoms: ["Water-soaked dark lesions on leaves", "White fungal growth on undersides in humid conditions"],
    organic_treatment: "Copper oxychloride 50 WP @ 2.5 g/litre spray.",
    chemical_treatment: "Metalaxyl-M + Mancozeb (Ridomil Gold) @ 2 g/litre.",
    prevention: "Use certified seed, avoid waterlogging, hill up tubers properly."
  }
];

const static_crop_recommendations = [
  {
    season: "Kharif (June - October)",
    crops: ["Rice", "Cotton", "Soybean", "Maize", "Bajra", "Sugarcane"],
    soilType: "Black/Clayey loam preferred",
    rainfallRequired: "600-1200 mm",
    advice: "Start nursery preparation in May. Apply basal dose of fertiliser before transplanting."
  },
  {
    season: "Rabi (November - March)",
    crops: ["Wheat", "Mustard", "Gram (Chickpea)", "Lentil", "Peas", "Sunflower"],
    soilType: "Loamy/Sandy loam",
    rainfallRequired: "Irrigated (2-4 irrigations)",
    advice: "Sow Wheat by Nov 15 for best yield. Use HD-3086 or DBW-222 for higher productivity."
  },
  {
    season: "Zaid (March - June)",
    crops: ["Watermelon", "Muskmelon", "Cucumber", "Bitter Gourd", "Moong (Green Gram)"],
    soilType: "Sandy loam with good drainage",
    rainfallRequired: "Irrigation every 5-7 days",
    advice: "Cash crops with quick returns. Use drip irrigation to save water in summer."
  }
];

// ──────────────────────────────────────────────────────────────────────────────
// Main: Fetch Schemes from MongoDB + combine with static data
// ──────────────────────────────────────────────────────────────────────────────
async function run() {
  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) {
    console.error('❌ MONGO_URL not found in .env');
    process.exit(1);
  }

  let schemes: any[] = [];

  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db!;
    const raw = await db.collection('pmschemes').find().toArray();

    // Clean up Mongoose internal fields for JSON export
    schemes = raw.map(s => ({
      schemeName:          s.schemeName,
      description:         s.description,
      benefitsDescription: s.benefitsDescription,
      eligibilityCriteria: s.eligibilityCriteria,
      requiredDocuments:   s.requiredDocuments,
      officialWebsite:     s.officialWebsite ?? null,
    }));

    console.log(`✅ Fetched ${schemes.length} schemes from MongoDB`);
    await mongoose.disconnect();
  } catch (err: any) {
    console.warn('⚠️  Could not connect to MongoDB:', err.message);
    console.warn('    temp_data.json will be created with empty schemes array.');
  }

  const tempData = {
    _meta: {
      generatedAt:  new Date().toISOString(),
      description:  "Temporary fallback data for CropWise AI chains. Refresh with: npx tsx scripts/fetch_mongodb_data.ts",
      source:       "MongoDB (pmschemes) + static curated knowledge"
    },
    schemes,
    mandi: static_mandi_data,
    diseases: static_diseases_data,
    cropRecommendations: static_crop_recommendations,
  };

  const outPath = path.join(__dirname, '../src/services/ai/temp_data.json');
  fs.writeFileSync(outPath, JSON.stringify(tempData, null, 2), 'utf-8');
  console.log(`\n✅ temp_data.json written to: ${outPath}`);
  console.log(`   Schemes: ${schemes.length}`);
  console.log(`   Mandi entries: ${static_mandi_data.length}`);
  console.log(`   Disease entries: ${static_diseases_data.length}`);
  console.log(`   Crop recommendation seasons: ${static_crop_recommendations.length}`);
}

run();
