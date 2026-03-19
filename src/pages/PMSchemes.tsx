import React, { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, ClipboardList, Info, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface Scheme {
  _id: string;
  schemeName: string;
  description: string;
  benefitsDescription: string;
  eligibilityCriteria: string;
  requiredDocuments: string[];
  officialWebsite: string;
}

const PMSchemes = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const { user, login } = useAuth();

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch('/api/schemes');
        if (!res.ok) throw new Error('Failed to fetch schemes');
        const data = await res.json();
        setSchemes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const handleEnroll = async (schemeId: string) => {
    if (!user) {
      alert("Please login to enroll in schemes.");
      return;
    }
    
    setEnrolling(schemeId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schemeId })
      });

      if (!res.ok) throw new Error('Enrollment failed');
      
      const data = await res.json();
      
      // Update local context
      login(token!, {
        ...user,
        enrolledSchemes: data.enrolledSchemes
      });

    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-12 text-center lg:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Government <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Schemes</span>
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">
          Access the latest central and state government agricultural initiatives designed to support your farming journey.
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 text-center">
          {error}. Please ensure you have run <code className="bg-black/20 px-2 py-1 rounded">npm run seed</code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => {
            const isEnrolled = user?.enrolledSchemes?.includes(scheme._id);
            
            return (
              <div key={scheme._id} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all hover:translate-y-[-4px] flex flex-col shadow-2xl">
                <div className="mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl inline-block mb-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                    {scheme.schemeName}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                    {scheme.description}
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      Key Benefits
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {scheme.benefitsDescription}
                    </p>
                  </div>

                  <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      Required Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {scheme.requiredDocuments.map((doc) => (
                        <span key={doc} className="px-2 py-1 bg-primary/5 border border-primary/20 rounded-md text-[10px] text-primary font-medium">
                          {doc.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => handleEnroll(scheme._id)}
                    disabled={isEnrolled || enrolling === scheme._id}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all border ${
                      isEnrolled 
                        ? 'bg-green-500/20 border-green-500/30 text-green-400 cursor-default' 
                        : 'bg-primary border-primary/20 text-white hover:bg-primary-light active:scale-95'
                    }`}
                  >
                    {isEnrolled ? (
                      <>Enrolled <CheckCircle className="w-4 h-4" /></>
                    ) : enrolling === scheme._id ? (
                      <>Enrolling... <Loader2 className="w-4 h-4 animate-spin" /></>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                  
                  <a
                    href={scheme.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-sm transition-all border border-white/10"
                  >
                    Official Website <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PMSchemes;
