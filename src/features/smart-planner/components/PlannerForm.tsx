import React, { useState } from 'react';
import { Sprout, MapPin, Droplets, Calendar as CalIcon } from 'lucide-react';
import { AutoTranslate } from './AutoTranslate';

interface PlannerFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    cropType: 'Wheat',
    soilType: 'Loamy',
    location: '',
    farmSize: '',
    sowingDate: new Date().toISOString().split('T')[0],
    irrigationType: 'Canal'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
      <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <Sprout className="w-6 h-6 text-green-600" />
        <AutoTranslate text="New Farming Plan" />
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"><AutoTranslate text="Crop Type" /></label>
          <select name="cropType" value={formData.cropType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none">
            <option value="Wheat"><AutoTranslate text="Wheat" /></option>
            <option value="Rice"><AutoTranslate text="Rice" /></option>
            <option value="Corn"><AutoTranslate text="Corn" /></option>
            <option value="Tomato"><AutoTranslate text="Tomato" /></option>
            <option value="Potato"><AutoTranslate text="Potato" /></option>
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
             <MapPin className="w-4 h-4 text-gray-400" /> <AutoTranslate text="Location (Village/City)" />
           </label>
           <input required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Uttar Pradesh" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"><AutoTranslate text="Soil Type" /></label>
          <select name="soilType" value={formData.soilType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none">
            <option value="Loamy"><AutoTranslate text="Loamy" /></option>
            <option value="Sandy"><AutoTranslate text="Sandy" /></option>
            <option value="Clay"><AutoTranslate text="Clay" /></option>
            <option value="Silt"><AutoTranslate text="Silt" /></option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"><AutoTranslate text="Farm Size (Acres)" /></label>
          <input required type="text" name="farmSize" value={formData.farmSize} onChange={handleChange} placeholder="e.g. 2 acres" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
             <Droplets className="w-4 h-4 text-gray-400" /> <AutoTranslate text="Water Availability" />
          </label>
          <select name="irrigationType" value={formData.irrigationType} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none">
            <option value="Canal"><AutoTranslate text="Canal" /></option>
            <option value="Tube Well"><AutoTranslate text="Tube Well" /></option>
            <option value="Rainfed"><AutoTranslate text="Rainfed" /></option>
            <option value="Drip"><AutoTranslate text="Drip" /></option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
             <CalIcon className="w-4 h-4 text-gray-400" /> <AutoTranslate text="Sowing Date" />
          </label>
          <input required type="date" name="sowingDate" value={formData.sowingDate} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>

      <button disabled={isLoading} type="submit" className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50">
        <AutoTranslate text={isLoading ? 'Generating Plan...' : 'Generate Smart Plan'} />
      </button>
    </form>
  );
};
