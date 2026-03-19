import mongoose from 'mongoose';
import PMScheme from '../model/PMSchemes'; // Ensure this path points to your compiled model
import dotenv from 'dotenv'

dotenv.config();


// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/taskdb'; 

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
    schemeName: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    description: "The world's largest health insurance scheme fully financed by the government, providing a health cover for secondary and tertiary care hospitalization.",
    benefitsDescription: "Health cover of ₹5 lakhs per family per year for medical treatment in empaneled public and private hospitals.",
    eligibilityCriteria: "Vulnerable families identified based on the deprivation and occupational criteria of the Socio-Economic Caste Census (SECC) 2011.",
    requiredDocuments: ["aadhaarCard", "rationCard"],
    officialWebsite: "https://pmjay.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    description: "A flagship housing scheme aimed at providing a pucca house with basic amenities to all houseless households living in kutcha and dilapidated houses in rural areas.",
    benefitsDescription: "Financial assistance of ₹1.20 lakh in plains and ₹1.30 lakh in hilly states for house construction.",
    eligibilityCriteria: "Households without shelter, destitute, living on alms, manual scavengers, and primitive tribal groups.",
    requiredDocuments: ["aadhaarCard", "bankPassbook", "voterId"],
    officialWebsite: "https://pmayg.nic.in/"
  },
  {
    schemeName: "Pradhan Mantri Ujjwala Yojana (PMUY)",
    description: "A scheme aiming to safeguard the health of women and children by providing them with a clean cooking fuel (LPG).",
    benefitsDescription: "Deposit-free LPG connection along with financial assistance of ₹1,600 per connection.",
    eligibilityCriteria: "Adult women belonging to BPL households, SC/ST households, PMAY beneficiaries, or Antyodaya Anna Yojana (AAY) beneficiaries.",
    requiredDocuments: ["aadhaarCard", "rationCard", "bankPassbook"],
    officialWebsite: "https://www.pmuy.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
    description: "A National Mission for Financial Inclusion to ensure access to financial services, namely, banking, savings, remittance, credit, insurance, and pension.",
    benefitsDescription: "No minimum balance required, free RuPay debit card, and an inbuilt accident insurance cover of ₹2 lakh.",
    eligibilityCriteria: "Any Indian citizen aged 10 years and above who does not have an existing bank account.",
    requiredDocuments: ["aadhaarCard", "panCard"],
    officialWebsite: "https://pmjdy.gov.in/"
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
    schemeName: "Pradhan Mantri Shram Yogi Maandhan (PM-SYM)",
    description: "A voluntary and contributory pension scheme meant for old age protection and social security of Unorganized Workers.",
    benefitsDescription: "Assured monthly pension of ₹3,000 after attaining the age of 60 years.",
    eligibilityCriteria: "Unorganized workers aged between 18 to 40 years with a monthly income of ₹15,000 or less.",
    requiredDocuments: ["aadhaarCard", "bankPassbook"],
    officialWebsite: "https://maandhan.in/"
  },
  {
    schemeName: "Pradhan Mantri Mudra Yojana (PMMY)",
    description: "A scheme to provide loans up to ₹10 lakh to the non-corporate, non-farm small/micro enterprises.",
    benefitsDescription: "Collateral-free loans categorized into Shishu (up to ₹50K), Kishore (₹50K-₹5L), and Tarun (₹5L-₹10L) for income-generating activities.",
    eligibilityCriteria: "Any Indian citizen who has a business plan for a non-farm sector income-generating activity.",
    requiredDocuments: ["aadhaarCard", "panCard", "bankPassbook"],
    officialWebsite: "https://www.mudra.org.in/"
  },
  {
    schemeName: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
    description: "A one-year life insurance scheme renewable from year to year offering coverage for death due to any reason.",
    benefitsDescription: "Life cover of ₹2 lakh payable to the nominee in case of the subscriber's death for a premium of ₹436 per annum.",
    eligibilityCriteria: "People in the age group of 18 to 50 years having a bank account who give their consent to join / enable auto-debit.",
    requiredDocuments: ["aadhaarCard", "bankPassbook"],
    officialWebsite: "https://jansuraksha.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    description: "An accident insurance scheme offering accidental death and disability cover for death or disability on account of an accident.",
    benefitsDescription: "Accidental death/full disability cover of ₹2 lakh and partial disability cover of ₹1 lakh for a premium of ₹20 per annum.",
    eligibilityCriteria: "People in the age group 18 to 70 years with a bank account who give their consent to join / enable auto-debit.",
    requiredDocuments: ["aadhaarCard", "bankPassbook"],
    officialWebsite: "https://jansuraksha.gov.in/"
  },
  {
    schemeName: "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
    description: "A special micro-credit facility to provide affordable loans to street vendors to resume their livelihoods.",
    benefitsDescription: "Initial working capital loan of up to ₹10,000, with an interest subsidy of 7% per annum on regular repayment.",
    eligibilityCriteria: "Street vendors engaged in vending in urban areas as of or prior to March 24, 2020.",
    requiredDocuments: ["aadhaarCard", "voterId", "bankPassbook"],
    officialWebsite: "https://pmsvanidhi.mohua.gov.in/"
  },
  {
    schemeName: "Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY)",
    description: "A food security welfare scheme designed to provide free food grains to the poorest citizens of India.",
    benefitsDescription: "5 kg of free wheat or rice per person per month, in addition to the regular subsidized quota.",
    eligibilityCriteria: "Families belonging to the Antyodaya Anna Yojana (AAY) and Priority Households (PHH) under the National Food Security Act.",
    requiredDocuments: ["aadhaarCard", "rationCard"],
    officialWebsite: "https://dfpd.gov.in/"
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    console.log('Clearing existing scheme data...');
    await PMScheme.deleteMany({}); // Clears the collection so you don't get 'unique' constraint errors on multiple runs

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