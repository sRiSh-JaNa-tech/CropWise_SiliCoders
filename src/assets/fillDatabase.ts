import mongoose from 'mongoose';
import PMScheme from '../model/PMSchemes.js'; 
import dotenv from 'dotenv'

dotenv.config();

const MONGO_URI = process.env.MONGO_URL; 

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URL is not defined in .env");
  process.exit(1);
}

const schemesData = [
  {
    schemeName: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    description: "A central sector scheme providing income support to all landholding farmers' families in the country to supplement their financial needs.",
    benefitsDescription: "Financial benefit of ₹6,000 per year, transferred directly into the bank accounts of beneficiaries in three equal installments.",
    eligibilityCriteria: "All landholding farmer families with cultivable landholding in their names, excluding institutional landholders and high-income earners.",
    requiredDocuments: ["aadhaarCard", "landRecords", "bankPassbook"],
    officialWebsite: "https://pmkisan.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "A crop insurance scheme that integrates multiple stakeholders on a single platform to protect farmers against crop failure due to natural calamities.",
    benefitsDescription: "Comprehensive insurance cover against failure of the crop, helping stabilize the income of farmers.",
    eligibilityCriteria: "All farmers growing notified crops in a notified area during the season who have insurable interest in the crop.",
    requiredDocuments: ["aadhaarCard", "landRecords", "bankPassbook", "kisanCreditCard"],
    officialWebsite: "https://pmfby.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
    description: "A national mission to improve farm productivity and ensure better utilization of the resources in the country.",
    benefitsDescription: "Subsidies for micro-irrigation systems (drip and sprinkler) and guaranteed water access for farms ('Har Khet Ko Pani').",
    eligibilityCriteria: "All farmers, including small and marginal farmers, with agricultural land.",
    requiredDocuments: ["aadhaarCard", "landRecords", "bankPassbook"],
    officialWebsite: "https://pmksy.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM)",
    description: "A scheme aiming to add solar and other renewable capacity to agriculture, ensuring energy security for farmers.",
    benefitsDescription: "Subsidies of up to 60% for installing standalone solar agriculture pumps and grid-connected solar power plants.",
    eligibilityCriteria: "Individual farmers, groups of farmers, cooperatives, panchayats, and Farmer Producer Organisations (FPOs).",
    requiredDocuments: ["aadhaarCard", "landRecords", "bankPassbook"],
    officialWebsite: "https://pmkusum.mnre.gov.in/"
  },
  {
    schemeName: "Paramparagat Krishi Vikas Yojana (PKVY)",
    description: "An initiative to promote organic farming in India and improve soil health.",
    benefitsDescription: "Financial assistance of ₹50,000 per hectare for 3 years, out of which ₹31,000 is given directly through DBT for inputs like bio-fertilizers.",
    eligibilityCriteria: "Farmers who are willing to form clusters of 50 acres or more for organic farming.",
    requiredDocuments: ["aadhaarCard", "landRecords", "bankPassbook"],
    officialWebsite: "https://pgsindia-ncof.gov.in/"
  },
  {
    schemeName: "National Agriculture Market (e-NAM)",
    description: "A pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.",
    benefitsDescription: "Better price discovery, transparent auction process, and access to a massive national buyer market.",
    eligibilityCriteria: "Any farmer with marketable surplus output can register.",
    requiredDocuments: ["aadhaarCard", "bankPassbook"],
    officialWebsite: "https://enam.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)",
    description: "A voluntary and contributory pension scheme for the small and marginal farmers in India.",
    benefitsDescription: "A fixed minimum pension of ₹3,000 per month after reaching the age of 60.",
    eligibilityCriteria: "Small and marginal farmers owning up to 2 hectares of cultivable land, aged between 18 and 40.",
    requiredDocuments: ["aadhaarCard", "bankPassbook"],
    officialWebsite: "https://pmkmy.gov.in/"
  },
  {
    schemeName: "Soil Health Card Scheme (SHC)",
    description: "A national scheme to assist state governments to issue soil health cards to all farmers, advising them on fertilizer use.",
    benefitsDescription: "Farmers receive a card detailing nutrient status of their soil and recommendations on correct dosage of fertilizers to improve yield.",
    eligibilityCriteria: "All farmers in India.",
    requiredDocuments: ["aadhaarCard", "landRecords"],
    officialWebsite: "https://soilhealth.dac.gov.in/"
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    console.log('Clearing existing scheme data...');
    await PMScheme.deleteMany({}); 
    
    console.log(`Inserting ${schemesData.length} schemes...`);
    await PMScheme.insertMany(schemesData);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedDatabase();