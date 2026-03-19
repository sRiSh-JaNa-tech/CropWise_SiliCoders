import React, { useState } from 'react';
import { Shield, FileText, MapPin, Save, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const Account = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state initialized from user data
    const [formData, setFormData] = useState({
        panCard: user?.panCard || '',
        voterId: user?.voterId || '',
        rationCard: user?.rationCard || '',
        kisanCreditCard: user?.kisanCreditCard || '',
        bankPassbook: user?.bankPassbook || '',
        landRecords: user?.landRecords || '',
        landSizeAcres: user?.landSizeAcres || 0,
        state: user?.state || '',
        district: user?.district || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'landSizeAcres' ? parseFloat(value) || 0 : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');

            // Update local auth context
            login(token!, data.user);
            setMessage({ type: 'success', text: 'Profile and documents updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const documentFields = [
        { name: 'panCard', label: 'PAN Card Number', placeholder: 'ABCDE1234F' },
        { name: 'voterId', label: 'Voter ID Number', placeholder: 'XYZ1234567' },
        { name: 'rationCard', label: 'Ration Card Number', placeholder: '1234567890' },
        { name: 'kisanCreditCard', label: 'KCC Number', placeholder: 'KCC-987654' },
        { name: 'bankPassbook', label: 'Bank Account Number', placeholder: '32145678901' },
        { name: 'landRecords', label: 'Land Record (Khata/Khasra)', placeholder: 'Khatoni No. 123' },
    ];

    if (!user) {
        return (
            <div className="p-12 text-center text-gray-400">
                Please login to view your account details.
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-12 max-w-4xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Farmer Profile</h1>
                <p className="text-gray-400">Manage your essential documents and land details for PM scheme eligibility.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                    message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section: Identity & Documents */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-white">Essential Documents</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Aadhaar Card (Verified)</p>
                                <p className="text-sm text-white font-mono">{user.aadhaarCard}</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-primary" />
                        </div>

                        {documentFields.map((field) => (
                            <div key={field.name}>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        name={field.name}
                                        value={(formData as any)[field.name]}
                                        onChange={handleChange}
                                        placeholder={field.placeholder}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all transition-colors"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Agricultural Data */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-400" />
                        <h2 className="font-bold text-white">Land & Location Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                Land Size (Acres)
                            </label>
                            <input
                                type="number"
                                name="landSizeAcres"
                                step="0.01"
                                value={formData.landSizeAcres}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                State
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="e.g. Uttar Pradesh"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                District
                            </label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="e.g. Ghaziabad"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Account Details
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Account;
