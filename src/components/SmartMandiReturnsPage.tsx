import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2, 
  BadgeIndianRupee, 
  Truck,
  Star,
  Check,
  Plus,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- MOCK DATA ---
type Bid = {
  id: string;
  buyerName: string;
  pricePerQuintal: number;
  distanceKm: number;
  rating: number;
  timeMsg: string;
};

type Auction = {
  id: string;
  cropName: string;
  quantity: string;
  basePrice: number;
  image: string;
  endTime: string;
  bids: Bid[];
};

const MOCK_AUCTIONS: Auction[] = [
  {
    id: 'A1001',
    cropName: 'Premium Sharbati Wheat',
    quantity: '50 Quintals',
    basePrice: 2200,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400',
    endTime: '02:15:45',
    bids: [
      { id: 'b1', buyerName: 'Ramesh Traders', pricePerQuintal: 2250, distanceKm: 45, rating: 4.2, timeMsg: '2 mins ago' },
      { id: 'b2', buyerName: 'Suresh Mills', pricePerQuintal: 2310, distanceKm: 120, rating: 4.8, timeMsg: '1 min ago' },
      { id: 'b3', buyerName: 'Kisan Agro', pricePerQuintal: 2280, distanceKm: 15, rating: 4.9, timeMsg: 'Just now' },
      { id: 'b4', buyerName: 'Nesta Foods Ltd.', pricePerQuintal: 2400, distanceKm: 300, rating: 4.5, timeMsg: '5 mins ago' },
      { id: 'b5', buyerName: 'Local Mandi Co.', pricePerQuintal: 2300, distanceKm: 8, rating: 4.1, timeMsg: '10 secs ago' },
    ]
  },
  {
    id: 'A1002',
    cropName: 'Organic Red Tomatoes',
    quantity: '20 Quintals',
    basePrice: 1500,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400',
    endTime: '00:45:12',
    bids: [
      { id: 'b6', buyerName: 'Fresh Farms Del.', pricePerQuintal: 1550, distanceKm: 25, rating: 4.3, timeMsg: '12 mins ago' },
      { id: 'b7', buyerName: 'City Supermarket', pricePerQuintal: 1800, distanceKm: 200, rating: 4.7, timeMsg: '5 mins ago' },
      { id: 'b8', buyerName: 'Reliance Fresh', pricePerQuintal: 1720, distanceKm: 50, rating: 4.9, timeMsg: '1 min ago' },
    ]
  },
  {
    id: 'A1003',
    cropName: 'Basmati Rice (Export Grade)',
    quantity: '100 Quintals',
    basePrice: 3500,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    endTime: '05:30:00',
    bids: [
      { id: 'b9', buyerName: 'Global Exports', pricePerQuintal: 3800, distanceKm: 800, rating: 4.9, timeMsg: '1 hr ago' },
      { id: 'b10', buyerName: 'Punjab Rice Mills', pricePerQuintal: 3750, distanceKm: 120, rating: 4.6, timeMsg: '30 mins ago' },
      { id: 'b11', buyerName: 'Nearby Aggregator', pricePerQuintal: 3600, distanceKm: 12, rating: 4.0, timeMsg: '10 mins ago' },
    ]
  }
];

const TRANSPORT_COST_PER_KM = 2;

const TREND_DATA = [
  { day: 'Mon', price: 2100 },
  { day: 'Tue', price: 2150 },
  { day: 'Wed', price: 2220 },
  { day: 'Thu', price: 2180 },
  { day: 'Fri', price: 2300 },
  { day: 'Sat', price: 2280 },
  { day: 'Sun', price: 2350 },
];

const SmartMandiReturnsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>(MOCK_AUCTIONS);
  const [selectedAuction, setSelectedAuction] = useState<Auction>(MOCK_AUCTIONS[0]!);
  const [bids, setBids] = useState<Bid[]>([]);
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [acceptedBid, setAcceptedBid] = useState<string | null>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newCropName, setNewCropName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');

  useEffect(() => {
    const initialTimers: Record<string, string> = {};
    auctions.forEach(a => { initialTimers[a.id] = a.endTime; });
    setTimers(initialTimers);

    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          let [h = 0, m = 0, s = 0] = (next[id] || '00:00:00').split(':').map(Number);
          if (s > 0) s--;
          else if (m > 0) { m--; s = 59; }
          else if (h > 0) { h--; m = 59; s = 59; }
          next[id] = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [auctions]);

  // Simulate Live Bidding
  useEffect(() => {
    const bidInterval = setInterval(() => {
      const activeAuction = auctions.find(a => a.id === selectedAuction.id);
      if (!activeAuction || acceptedBid) return;

      if (Math.random() > 0.7) { // 30% chance for a new bid
        const newBid: Bid = {
          id: `b${Date.now()}`,
          buyerName: ['Jain Exports', 'AgriConnect', 'Reliance Retail', 'BigBasket', 'Zomato Hyperpure'][Math.floor(Math.random() * 5)],
          pricePerQuintal: selectedAuction.basePrice + Math.floor(Math.random() * 1000),
          distanceKm: Math.floor(Math.random() * 500) + 1,
          rating: Number((Math.random() * 1 + 4).toFixed(1)),
          timeMsg: 'Just now'
        };

        setAuctions(prev => prev.map(a => 
          a.id === selectedAuction.id 
            ? { ...a, bids: [newBid, ...a.bids.slice(0, 5)] } 
            : a
        ));
      }
    }, 4000);

    return () => clearInterval(bidInterval);
  }, [selectedAuction, auctions, acceptedBid]);

  useEffect(() => {
    const currentAuction = auctions.find(a => a.id === selectedAuction.id) || auctions[0]!;
    setBids([...currentAuction.bids].sort((a, b) => b.pricePerQuintal - a.pricePerQuintal));
    setAcceptedBid(null);
  }, [selectedAuction, auctions]);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newAuction: Auction = {
      id: `A${Date.now()}`,
      cropName: newCropName,
      quantity: `${newQuantity} Quintals`,
      basePrice: Number(newBasePrice),
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400', // Default image
      endTime: '02:00:00',
      bids: []
    };
    setAuctions([newAuction, ...auctions]);
    setSelectedAuction(newAuction);
    setIsListingModalOpen(false);
    setNewCropName('');
    setNewQuantity('');
    setNewBasePrice('');
  };

  const filteredAuctions = auctions.filter(a => 
    a.cropName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highestBid = [...bids].sort((a, b) => b.pricePerQuintal - a.pricePerQuintal)[0]!;
  const nearestBid = [...bids].sort((a, b) => a.distanceKm - b.distanceKm)[0]!;
  
  const optimalBid = [...bids].sort((a, b) => {
    const netA = a.pricePerQuintal - (a.distanceKm * TRANSPORT_COST_PER_KM);
    const netB = b.pricePerQuintal - (b.distanceKm * TRANSPORT_COST_PER_KM);
    return netB - netA;
  })[0]!;

  return (
    <section className="min-h-[calc(100vh-80px)] p-3 md:p-5 lg:p-6 text-white font-outfit" style={{ background: 'radial-gradient(circle at top right, #0A2219, #050A08)' }}>
      <div className="max-w-[1280px] mx-auto">
        
        {/* Header */}
        <div className="mb-6 border-b border-[#1FAF5A]/20 pb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1FAF5A]/10 border border-[#1FAF5A]/30 text-[#1FAF5A] text-xs font-semibold tracking-wider uppercase mb-3 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1FAF5A]"></span>
            Live Smart Auction Terminal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-tight">
            Market Bidding War
          </h1>
          <p className="text-gray-400 max-w-2xl text-sm">
            Watch buyers safely compete for your harvest in real-time. Our algorithm strictly filters and highlights the most optimal net-profit buyer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Auction List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold flex items-center gap-1.5 text-gray-200">
                <Gavel className="w-4 h-4 text-[#1FAF5A]" /> Active Auctions
              </h3>
              <button 
                onClick={() => setIsListingModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1FAF5A] text-black rounded-lg text-xs font-bold hover:bg-[#1FAF5A]/90 transition-all shadow-lg shadow-[#1FAF5A]/20"
              >
                <Plus className="w-3.5 h-3.5" /> List Crop
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-[#1FAF5A]/50 focus:ring-1 focus:ring-[#1FAF5A]/30 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredAuctions.map(auction => (
                <div 
                  key={auction.id}
                  onClick={() => setSelectedAuction(auction)}
                  className={`group cursor-pointer rounded-xl border transition-all duration-300 overflow-hidden transform active:scale-[0.98] ${
                    selectedAuction.id === auction.id 
                      ? 'bg-[#1FAF5A]/10 border-[#1FAF5A] shadow-[0_0_15px_rgba(31,175,90,0.15)] ring-1 ring-[#1FAF5A]/50' 
                      : 'bg-black/40 border-white/5 hover:border-[#1FAF5A]/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="h-28 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                    <img src={auction.image} alt={auction.cropName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute bottom-2 left-3 z-20">
                      <h4 className="font-bold text-sm leading-tight text-white mb-0.5">{auction.cropName}</h4>
                      <p className="text-xs font-medium text-[#1FAF5A]/90">{auction.quantity}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 flex justify-between items-center bg-black/60 backdrop-blur-md">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-0">Base Price</p>
                      <p className="font-bold text-gray-200 text-sm">₹{auction.basePrice}<span className="text-[10px] font-normal text-gray-400">/qtl</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-0 flex items-center gap-1 justify-end">
                        <Clock className="w-2.5 h-2.5 text-red-500" /> Ends In
                      </p>
                      <p className="font-bold font-mono text-red-400 text-sm animate-pulse">{timers[auction.id] || auction.endTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Live Bids */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-[#0B1511]/80 border border-[#1FAF5A]/20 rounded-2xl p-5 lg:p-6 shadow-2xl backdrop-blur-2xl flex-1 relative overflow-hidden flex flex-col">
              
              {/* Glow */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1FAF5A]/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold mb-1.5 text-white">{selectedAuction.cropName}</h2>
                  <div className="inline-flex items-baseline gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#1FAF5A]" />
                    <span className="text-gray-300 text-sm font-medium">Bidding War:</span>
                    <span className="text-[#1FAF5A] font-bold text-sm">{bids.length} Active Buyers</span>
                  </div>
                </div>
                <div className="bg-[#0A1A14] border border-[#1FAF5A]/30 rounded-xl p-3 text-center min-w-[120px] shadow-inner">
                  <p className="text-[10px] text-[#1FAF5A] uppercase tracking-widest font-bold mb-0.5">Highest Bid</p>
                  <p className="text-2xl font-extrabold text-white leading-none">₹{highestBid?.pricePerQuintal || 0}</p>
                </div>
              </div>

              {/* Bids Table */}
              <div className="relative z-10 overflow-x-auto rounded-xl border border-white/5 bg-black/40 shadow-inner">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-black/60 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="p-3.5 font-semibold whitespace-nowrap">Buyer Details</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap">Bid Price</th>
                      <th className="p-3.5 font-semibold whitespace-nowrap">Distance</th>
                      <th className="p-3.5 font-semibold text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bids.map((bid) => {
                      const isOptimal = optimalBid && bid.id === optimalBid.id;
                      const isHighest = highestBid && bid.id === highestBid.id;
                      const isNearest = nearestBid && bid.id === nearestBid.id;
                      const netScore = bid.pricePerQuintal - (bid.distanceKm * TRANSPORT_COST_PER_KM);
                      const isAccepted = acceptedBid === bid.id;

                      return (
                        <tr 
                          key={bid.id} 
                          onClick={() => setAcceptedBid(bid.id)}
                          className={`group cursor-pointer transition-all duration-200 transform relative ${
                            isAccepted
                              ? 'bg-[#1FAF5A]/20 border-l-4 border-l-[#1FAF5A] hover:bg-[#1FAF5A]/25'
                              : isOptimal 
                                ? 'bg-[#1FAF5A]/5 hover:bg-[#1FAF5A]/10 border-l-4 border-l-transparent hover:border-l-[#1FAF5A]/50' 
                                : 'hover:bg-white/5 border-l-4 border-l-transparent hover:border-l-white/20'
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0 transition-transform group-hover:scale-110 ${
                                isOptimal ? 'bg-[#1FAF5A] text-black shadow-[#1FAF5A]/50 ring-1 ring-[#1FAF5A]/40' : 'bg-gradient-to-br from-gray-800 to-black border border-white/10 text-white'
                              }`}>
                                {bid.buyerName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                                  {bid.buyerName}
                                  {isAccepted && <span className="bg-[#1FAF5A] text-black text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Accepted</span>}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium text-gray-300">{bid.rating}</span>
                                  <span className="text-gray-600 px-0.5">•</span>
                                  <span>{bid.timeMsg}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {isOptimal && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#1FAF5A] text-black shadow-[0_0_10px_rgba(31,175,90,0.5)] animate-pulse">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Winner
                                    </span>
                                  )}
                                  {isHighest && !isOptimal && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                      <Award className="w-2.5 h-2.5" /> Highest Price
                                    </span>
                                  )}
                                  {isNearest && !isOptimal && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      <Truck className="w-2.5 h-2.5" /> Nearest
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 align-top pt-4 border-l border-white/5">
                            <div className="flex flex-col">
                              <span className={`font-bold text-sm ${isOptimal ? 'text-[#1FAF5A]' : isHighest ? 'text-yellow-400' : 'text-gray-200'}`}>
                                ₹{bid.pricePerQuintal}
                              </span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                <TrendingUp className="w-3 h-3 text-green-500/70" /> +₹{bid.pricePerQuintal - selectedAuction.basePrice} 
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 align-top pt-4 border-l border-white/5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className={`w-3.5 h-3.5 ${isNearest ? 'text-blue-400' : 'text-gray-500'}`} />
                              <span className={`font-medium text-xs ${isNearest ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>
                                {bid.distanceKm} km
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 align-top pt-4 border-l border-white/5 text-right bg-white/[0.01] transition-colors group-hover:bg-[#1FAF5A]/5">
                            <div className="flex flex-col items-end group-hover:scale-105 transition-transform duration-200 origin-right">
                              <span className={`font-black text-lg ${isOptimal ? 'text-[#1FAF5A] drop-shadow-[0_0_10px_rgba(31,175,90,0.5)]' : 'text-gray-300'}`}>
                                {netScore}
                              </span>
                              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1 sm:group-hover:text-[#1FAF5A]/70 transition-colors">
                                Net Score
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Bottom Insight Box */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {optimalBid && highestBid && (
                  <div className="transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1FAF5A]/10 to-transparent rounded-xl pointer-events-none" />
                    <div className="border border-[#1FAF5A]/30 bg-black/40 backdrop-blur-md rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-lg cursor-default h-full">
                      <div className="w-10 h-10 rounded-full bg-[#1FAF5A] flex items-center justify-center shrink-0 shadow-lg shadow-[#1FAF5A]/40 ring-2 ring-[#1FAF5A]/20">
                        <BadgeIndianRupee className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1.5 text-sm">Why <span className="text-[#1FAF5A]">{optimalBid.buyerName}</span>?</h4>
                        <p className="text-[10px] text-gray-300 leading-relaxed opacity-90">
                          Although <span className="text-yellow-400 font-semibold">{highestBid.buyerName}</span> offers the highest price (<span className="text-white font-medium">₹{highestBid.pricePerQuintal}/qtl</span>), their distance of {highestBid.distanceKm} km incurs heavy transport costs. 
                          Our Smart Algorithm selects <span className="text-[#1FAF5A] font-bold">{optimalBid.buyerName}</span> due to an optimal balance: an excellent price combined with very low transport overhead.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Trend Chart */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 h-full relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-[#1FAF5A]/5 blur-2xl rounded-full" />
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                     <TrendingUp className="w-3 h-3 text-[#1FAF5A]" /> 7-Day Price Trend
                   </h4>
                   <div className="h-[120px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={TREND_DATA}>
                         <defs>
                           <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#1FAF5A" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#1FAF5A" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                         <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#666' }} />
                         <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#0B1511', borderRadius: '8px', border: '1px solid #1FAF5A30', fontSize: '10px' }}
                            itemStyle={{ color: '#1FAF5A' }}
                         />
                         <Area type="monotone" dataKey="price" stroke="#1FAF5A" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Listing Modal */}
      <AnimatePresence>
        {isListingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsListingModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0B1511] border border-[#1FAF5A]/30 rounded-2xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setIsListingModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-1 text-white">Sell Your Harvest</h2>
              <p className="text-xs text-gray-400 mb-6">List your crop to start receiving live bids from verified buyers.</p>

              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Crop Name</label>
                  <input 
                    required
                    type="text" 
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    placeholder="e.g. Sona Masuri Rice" 
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#1FAF5A]/50 outline-none transition-all text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quantity (Quintals)</label>
                    <input 
                      required
                      type="number" 
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="e.g. 50" 
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#1FAF5A]/50 outline-none transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Base Price (₹/qtl)</label>
                    <input 
                      required
                      type="number" 
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(e.target.value)}
                      placeholder="e.g. 2100" 
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#1FAF5A]/50 outline-none transition-all text-white"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#1FAF5A] text-black font-bold py-3.5 rounded-xl mt-4 hover:bg-[#1FAF5A]/90 transition-all shadow-lg shadow-[#1FAF5A]/20"
                >
                  Create Live Auction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default SmartMandiReturnsPage;
