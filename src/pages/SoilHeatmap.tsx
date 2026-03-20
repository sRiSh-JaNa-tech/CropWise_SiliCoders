import React, { useState } from 'react';
import { Leaf, MapPin, Search } from 'lucide-react';

const soilData = [
  {
    soilType: "Alluvial Soil",
    locations: ["Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal", "Assam"],
    description: "Highly fertile, rich in potash, poor in phosphorus.",
    crops: ["Wheat", "Rice", "Maize", "Sugarcane", "Cotton", "Jute"],
    color: "bg-green-700"
  },
  {
    soilType: "Black Soil (Regur)",
    locations: ["Maharashtra", "Gujarat", "Madhya Pradesh", "Karnataka", "Andhra Pradesh"],
    description: "Rich in clay, excellent for moisture retention.",
    crops: ["Cotton", "Soyabean", "Jowar", "Wheat", "Linseed"],
    color: "bg-stone-800"
  },
  {
    soilType: "Red & Yellow Soil",
    locations: ["Tamil Nadu", "Karnataka", "Odisha", "Chhattisgarh", "Jharkhand"],
    description: "Rich in iron, requires fertilizers for good yield.",
    crops: ["Groundnut", "Potato", "Rice", "Ragi", "Tobacco", "Millets"],
    color: "bg-red-700"
  },
  {
    soilType: "Laterite Soil",
    locations: ["Kerala", "Karnataka", "Tamil Nadu", "Meghalaya"],
    description: "Acidic, rich in iron, poor in organic matter.",
    crops: ["Tea", "Coffee", "Rubber", "Cashew", "Coconut"],
    color: "bg-orange-700"
  },
  {
    soilType: "Arid/Desert Soil",
    locations: ["Rajasthan", "Gujarat", "Punjab (South)"],
    description: "Sandy and saline, requires irrigation.",
    crops: ["Bajra", "Pulses", "Guar", "Fodder crops"],
    color: "bg-yellow-600"
  },
  {
    soilType: "Mountain/Forest Soil",
    locations: ["Jammu & Kashmir", "Himachal Pradesh", "Uttarakhand", "Sikkim"],
    description: "Rich in humus but deficient in potash, phosphorus, and lime.",
    crops: ["Apple", "Peach", "Plum", "Tea", "Spices"],
    color: "bg-emerald-900"
  }
];

const allLocations = Array.from(new Set(soilData.map(s => s.locations).flat()));

export default function SoilHeatmap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSoil, setSelectedSoil] = useState<string | null>(null);
  
  const filteredData = soilData.filter(soil => 
    soil.soilType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soil.locations.some(loc => loc.toLowerCase().includes(searchTerm.toLowerCase())) ||
    soil.crops.some(crop => crop.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold text-green-800">Soil-Location Heatmap</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover which soil types are dominant in various locations and which crops thrive best in them.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search by soil, state, or crop..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Matrix / Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((soil, idx) => (
          <div 
            key={idx} 
            className={`border rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 cursor-pointer ${selectedSoil === soil.soilType ? 'ring-4 ring-green-500' : ''}`}
            onClick={() => setSelectedSoil(soil.soilType === selectedSoil ? null : soil.soilType)}
          >
            <div className={`${soil.color} h-24 flex items-center justify-center`}>
              <h2 className="text-2xl font-bold text-white drop-shadow-md">{soil.soilType}</h2>
            </div>
            
            <div className="p-6 bg-white space-y-4">
               <div>
                 <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-2">
                   <MapPin className="h-4 w-4 text-red-500" /> Regions
                 </h3>
                 <div className="flex flex-wrap gap-2 text-sm">
                   {soil.locations.map(loc => (
                     <span key={loc} className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">{loc}</span>
                   ))}
                 </div>
               </div>

               <div>
                 <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-2">
                   <Leaf className="h-4 w-4 text-green-500" /> Suitable Crops
                 </h3>
                 <div className="flex flex-wrap gap-2 text-sm">
                   {soil.crops.map(crop => (
                     <span key={crop} className="bg-green-50 text-green-700 px-2 py-1 rounded-md">{crop}</span>
                   ))}
                 </div>
               </div>

               <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                 {soil.description}
               </p>
            </div>
          </div>
        ))}
      </div>
      
      {filteredData.length === 0 && (
         <div className="text-center text-gray-500 py-10">
           No matching soils, locations, or crops found.
         </div>
      )}
    </div>
  );
}
