import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserPlus, User, Mail, Phone, Calendar, ShieldCheck, KeyRound } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    aadhaarCard: '',
    sixDigitPin: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^\d{6}$/.test(formData.sixDigitPin)) {
      setError('PIN must be exactly 6 digits.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-600 pl-11 text-sm";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0f1a] relative overflow-hidden py-12">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />

      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Kisan Registration</h2>
          <p className="text-gray-400 text-xs">Create your secure farmer profile in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Full Name (as per Aadhaar)</label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Enter full name"
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative group">
              <input
                type="email"
                placeholder="name@example.com"
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="relative group">
              <input
                type="tel"
                placeholder="+91 0000000000"
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <div className="relative group">
              <input
                type="date"
                className={`${inputClass} !pr-4`}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
              />
              <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Aadhaar Number</label>
            <div className="relative group">
              <input
                type="text"
                placeholder="12 digit number"
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, aadhaarCard: e.target.value })}
                required
              />
              <ShieldCheck className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Set 6-Digit Secure PIN</label>
            <div className="relative group">
              <input
                type="password"
                placeholder="Create a 6-digit PIN"
                maxLength={6}
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, sixDigitPin: e.target.value })}
                required
              />
              <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          {error && <div className="md:col-span-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 text-sm"
          >
            {loading ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Already have an account? {' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
