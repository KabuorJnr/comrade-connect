import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Plus, 
  User, 
  Users, 
  Briefcase, 
  Calendar, 
  Megaphone, 
  X,
  CheckCircle,
  Smartphone,
  MessageCircle,
  Menu,
  Loader2,
  ChevronRight,
  Zap,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Filter,
  AlertCircle,
  LogOut,
  ChevronsUpDown,
  Info
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { getApp, getApps, initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
const manualConfig = {
  apiKey: "AIzaSyA1FJZC0NtFoIbcCIXVFuU1PPrr-d3FWR8",
  authDomain: "comrade-connect-184cb.firebaseapp.com",
  projectId: "comrade-connect-184cb",
  storageBucket: "comrade-connect-184cb.firebasestorage.app",
  messagingSenderId: "910700491278",
  appId: "1:910700491278:web:db134716aa726302c3425f",
  measurementId: "G-J52ZHC57WM"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : manualConfig;
const appId = typeof __app_id !== 'undefined' ? __app_id : (firebaseConfig.projectId || 'comrade-connect-jkuat-v2');

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- CONSTANTS ---

const CATEGORIES = [
  "All",
  "Salon",
  "Laundry",
  "Electronics",
  "Photography",
  "Graphics",
  "Academic",
  "Transport",
  "Food"
];

// --- UI COMPONENTS (SHADCN-LIKE REIMPLEMENTATION) ---

const Avatar = ({ src, fallback, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 ${className}`}>
    {src ? (
      <img className="aspect-square h-full w-full object-cover" src={src} alt="Avatar" />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#2c2c2e] text-xs font-medium text-white">
        {fallback}
      </div>
    )}
  </div>
);

const AvatarGroup = ({ avatars, limit = 3 }) => (
  <div className="flex -space-x-3 overflow-hidden">
    {avatars.slice(0, limit).map((avatar, i) => (
      <Avatar key={i} src={avatar.src} fallback={avatar.fallback} className="ring-2 ring-black" />
    ))}
    {avatars.length > limit && (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#2c2c2e] ring-2 ring-black text-[10px] font-medium text-white">
        +{avatars.length - limit}
      </div>
    )}
  </div>
);

const AccordionItem = ({ title, content, isOpen, onClick }) => (
  <div className="border-b border-white/5 last:border-0">
    <button 
      onClick={onClick}
      className="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:text-white text-left w-full text-gray-200"
    >
      {title}
      <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down ${isOpen ? 'block' : 'hidden'}`}>
      <div className="pb-4 pt-0 text-gray-400 leading-relaxed">
        {content}
      </div>
    </div>
  </div>
);

const Accordion = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="w-full">
      {items.map((item, index) => (
        <AccordionItem 
          key={index}
          title={item.title} 
          content={item.content} 
          isOpen={openIndex === index} 
          onClick={() => setOpenIndex(openIndex === index ? null : index)} 
        />
      ))}
    </div>
  );
};

const CustomTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="w-full">
    <div className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1d1d1f] p-1 text-gray-400 w-full mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full ${
            activeTab === tab.value 
              ? "bg-[#636366] text-white shadow-sm" 
              : "hover:bg-[#2c2c2e] hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

const Alert = ({ title, description, variant = "default" }) => {
  const styles = variant === "success" 
    ? "border-green-500/50 text-green-500 [&>svg]:text-green-500 bg-green-500/10" 
    : "border-white/10 bg-[#1d1d1f] text-white";

  return (
    <div className={`relative w-full rounded-xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-white ${styles}`}>
      {variant === "success" ? <CheckCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>
      <div className="text-sm opacity-90">{description}</div>
    </div>
  );
};

const Popover = ({ trigger, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-[#1d1d1f]/95 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

const Collapsible = ({ title, subtitle, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1d1d1f] px-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
        >
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          <span className="sr-only">Toggle</span>
        </button>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {content}
        </div>
      </div>
    </div>
  );
};

const CustomAlertDialog = ({ isOpen, onClose, onConfirm, title, description, actionText = "Continue" }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#1d1d1f] border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6">
          <button 
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/5 focus:outline-none"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP HEADER & NAV ---

const AppleHeader = ({ activeTab }) => (
  <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/80 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)]">
    <div className="max-w-md mx-auto px-6 h-14 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Briefcase className="w-5 h-5 text-white" />
        <span className="font-semibold text-sm tracking-wide text-white/90">ComradeConnect</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-xs font-medium text-white/70 hover:text-white transition-colors">
            Store
        </button>
        <button className="text-white/70 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

const FloatingDock = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
    <nav className="bg-[#1d1d1f]/90 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-full shadow-2xl shadow-black/50 pointer-events-auto flex gap-8 items-center">
      <NavIcon 
        icon={<Briefcase />} 
        isActive={activeTab === 'services'} 
        onClick={() => setActiveTab('services')} 
      />
      <div className="w-px h-6 bg-white/10"></div>
      <NavIcon 
        icon={<Users />} 
        isActive={activeTab === 'community'} 
        onClick={() => setActiveTab('community')} 
      />
      <div className="w-px h-6 bg-white/10"></div>
      <NavIcon 
        icon={<User />} 
        isActive={activeTab === 'profile'} 
        onClick={() => setActiveTab('profile')} 
      />
    </nav>
  </div>
);

const NavIcon = ({ icon, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`relative group transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
  >
    {React.cloneElement(icon, { 
      size: 22, 
      strokeWidth: isActive ? 2.5 : 2,
    })}
    {isActive && (
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full box-shadow-glow"></span>
    )}
  </button>
);

const ServiceCard = ({ service, onContact }) => (
  <div className="bg-[#1d1d1f] rounded-3xl p-6 mb-4 hover:scale-[1.02] transition-transform duration-500 ease-out border border-white/5 group relative overflow-hidden">
    {/* Subtle highlight effect */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {service.category}
      </span>
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        <span className="text-xs font-medium text-white">{service.rating || 5.0}</span>
      </div>
    </div>
    
    <h3 className="font-bold text-xl text-white mb-2 tracking-tight leading-tight">{service.title}</h3>
    <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-2 font-medium">
      {service.description || "Professional service tailored for the modern student."}
    </p>
    
    <div className="flex items-end justify-between">
      <div>
        <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Price</div>
        <div className="text-white font-semibold text-lg">
          Ksh {service.price}
          <span className="text-xs text-gray-500 font-normal ml-1 lowercase">/ {service.priceType === 'Fixed' ? 'fix' : 'est'}</span>
        </div>
      </div>
      
      <button 
        onClick={() => onContact(service)}
        className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center"
      >
        Contact
      </button>
    </div>
  </div>
);

const CommunityPost = ({ post }) => {
  const isEvent = post.type === 'Event';
  
  return (
    <div className={`rounded-3xl p-6 mb-4 border border-white/5 relative overflow-hidden ${
        isEvent ? 'bg-gradient-to-br from-[#1d1d1f] to-[#2d1b2d]' : 'bg-[#1d1d1f]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <Avatar src={null} fallback={post.author ? post.author.charAt(0) : "U"} />
            <div>
                <div className="text-xs font-bold text-white">{post.author}</div>
                <div className="text-[10px] text-gray-500">{post.time}</div>
            </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-1 rounded-md">
            {post.type}
        </span>
      </div>
      
      <p className="text-gray-300 text-sm leading-relaxed mb-4 font-medium">
        {post.content}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex -space-x-2">
            {[1,2,3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full bg-gray-700 border border-[#1d1d1f]"></div>
            ))}
        </div>
        <button className="text-blue-400 text-xs font-medium hover:text-blue-300 flex items-center gap-1">
            Read more <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [communityTab, setCommunityTab] = useState('feed');
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  // Data State
  const [services, setServices] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  
  // Form State
  const [paymentStep, setPaymentStep] = useState(0); 
  const [newService, setNewService] = useState({
    title: '', category: 'Salon', price: '', location: '', phone: ''
  });
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CUSTOM STYLES INJECTION ---
  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :root {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color-scheme: dark;
    }
    
    html {
      scroll-behavior: smooth;
    }

    body {
      background:
        radial-gradient(circle at top, rgba(14, 165, 233, 0.14), transparent 34%),
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.12), transparent 28%),
        linear-gradient(180deg, #050505 0%, #09090b 45%, #000000 100%);
      color: #f5f5f7;
      min-height: 100dvh;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    ::selection {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-slide-up {
        animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .mask-fade-r {
        mask-image: linear-gradient(to right, black 85%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    .text-gradient {
        background: linear-gradient(90deg, #fff, #86868b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .surface-glow {
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    }
  `;

  // --- AUTHENTICATION & INITIALIZATION ---
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setUser({ uid: 'demo-user-id' });
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING (REALTIME) ---

  useEffect(() => {
    if (!user) return;

    // Fetch Services
    const servicesQuery = collection(db, 'artifacts', appId, 'public', 'data', 'services');
    const unsubServices = onSnapshot(servicesQuery, 
      (snapshot) => {
        const fetchedServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedServices.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setServices(fetchedServices);
        setIsLoading(false);
      },
      (error) => {
          console.error("Error fetching services:", error);
          setIsLoading(false);
      }
    );

    // Fetch Community Posts
    const communityQuery = collection(db, 'artifacts', appId, 'public', 'data', 'community_posts');
    const unsubCommunity = onSnapshot(communityQuery,
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedPosts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        if (fetchedPosts.length === 0) {
            setCommunityPosts([
                { id: '1', type: 'Event', author: 'Dean of Students', time: '2 hrs ago', content: 'Culture Week starts this Friday at the Graduation Square. Experience talent like never before.', likes: 45 },
                { id: '2', type: 'Announcement', author: 'HELB Rep', time: '5 hrs ago', content: 'Disbursement initiated. Check portals.', likes: 120 },
                { id: '3', type: 'General', author: 'Comrade 001', time: '1 day ago', content: 'Found: Student ID near Hall 4. Dropped at Security.', likes: 8 }
            ]);
        } else {
            setCommunityPosts(fetchedPosts);
        }
      },
      (error) => console.error("Error fetching posts:", error)
    );

    return () => {
      unsubServices();
      unsubCommunity();
    };
  }, [user]);

  // --- HANDLERS ---

  const handleContact = (service) => {
    setSelectedService(service);
    setShowContactModal(true);
  };

  const handleMpesaPayment = async () => {
    if (mpesaNumber.length < 9) return;
    setIsProcessingPayment(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mpesaNumber,
          amount: 250 // Subscription amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      console.log('STK Push Success:', data);
      alert('STK Push prompt sent! Please check your phone to enter your M-Pesa PIN.');
      
      // Proceed to the next step once STK is pushed
      setPaymentStep(2); 
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to send STK Push: ' + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serviceData = {
        ...newService,
        priceType: 'Negotiable',
        seller: 'Student Seller',
        rating: 5.0,
        reviews: 0,
        createdAt: serverTimestamp(),
        userId: user ? user.uid : 'demo-user-id'
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), serviceData);
      setPaymentStep(3);
    } catch (error) {
      console.error("Error listing service:", error);
      // Still proceed to success screen for the demo
      setPaymentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTERING ---

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = service.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredPosts = communityPosts.filter(post => {
    if (communityTab === 'feed') return true;
    if (communityTab === 'events') return post.type === 'Event';
    if (communityTab === 'announcements') return post.type === 'Announcement';
    return true;
  });

  // --- FAQ DATA ---
  const faqItems = [
    { title: "How do I pay for services?", content: "Most sellers accept M-PESA or Cash. Payments are handled directly with the seller." },
    { title: "Is there a verification process?", content: "Yes! Pro Sellers (marked with a badge) have verified their student ID and phone number." },
    { title: "How do I list my own service?", content: "Go to your profile or click 'Start Selling' on the home page. There is a small monthly fee to maintain quality." },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-[#f5f5f7] pb-32">
      <style>{customStyles}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-[-4rem] top-[18rem] h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <AppleHeader activeTab={activeTab} />

      <main className="relative z-10 max-w-md mx-auto pt-20 px-4">
        <div className="mb-5 rounded-[2rem] border border-white/8 bg-white/5 p-4 backdrop-blur-xl surface-glow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">Campus marketplace</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">ComradeConnect is live</h2>
              <p className="mt-1 text-sm text-gray-400">Buy, sell, and discover trusted student services in one place.</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Now online</p>
              <p className="text-sm font-semibold text-white">500+ sellers</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-300">
            <div className="rounded-2xl bg-black/25 px-3 py-3 border border-white/5">
              <p className="text-white font-semibold">24/7</p>
              <p className="mt-1 text-gray-500">Access</p>
            </div>
            <div className="rounded-2xl bg-black/25 px-3 py-3 border border-white/5">
              <p className="text-white font-semibold">Verified</p>
              <p className="mt-1 text-gray-500">Profiles</p>
            </div>
            <div className="rounded-2xl bg-black/25 px-3 py-3 border border-white/5">
              <p className="text-white font-semibold">Fast</p>
              <p className="mt-1 text-gray-500">Replies</p>
            </div>
          </div>
        </div>
        
        {/* === SERVICES TAB === */}
        {activeTab === 'services' && (
          <div className="animate-fade-in">
            {/* Hero Text */}
            <div className="mb-8 pt-4">
                <h1 className="text-4xl font-semibold tracking-tighter mb-2 text-gradient">
                    ComradeConnect.
                </h1>
                
                {/* AVATAR GROUP COMPONENT */}
                <div className="flex items-center gap-3 mb-3">
                   <AvatarGroup 
                     avatars={[
                       { src: null, fallback: "A" },
                       { src: null, fallback: "B" },
                       { src: null, fallback: "C" },
                       { src: null, fallback: "D" }
                     ]} 
                     limit={3}
                   />
                   <span className="text-sm text-gray-500 font-medium">500+ Active Sellers</span>
                </div>

                <div className="mt-6 flex gap-4">
                   <button 
                     onClick={() => setShowSellModal(true)}
                     className="bg-[#0071e3] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors"
                   >
                     Start Selling
                   </button>
                   <button className="text-[#2997ff] text-sm font-medium hover:underline flex items-center">
                     Learn more <ChevronRight className="w-3 h-3 ml-1" />
                   </button>
                </div>
            </div>

            {/* Search & Filter - Apple Style with POPOVER */}
            <div className="sticky top-14 z-30 pt-4 pb-4 -mx-4 px-4 bg-black/80 backdrop-blur-xl border-b border-white/5">
              <div className="flex gap-2 mb-4">
                <div className="relative group flex-1">
                  <Search className="absolute left-3 top-3.5 text-gray-500 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search services" 
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#1d1d1f] border border-transparent focus:border-[#424245] focus:bg-[#252528] text-white placeholder-gray-500 outline-none transition-all text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* POPOVER COMPONENT for Filter */}
                <Popover 
                  trigger={
                    <button className="bg-[#1d1d1f] h-full px-3 rounded-xl border border-transparent hover:bg-[#2c2c2e] text-gray-400 hover:text-white transition-colors">
                      <Filter className="w-5 h-5" />
                    </button>
                  }
                  content={
                    <div className="space-y-4">
                      <h4 className="font-medium text-white text-sm">Sort By</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-400">
                          <input type="radio" name="sort" className="accent-blue-500" defaultChecked /> <span>Newest First</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-400">
                          <input type="radio" name="sort" className="accent-blue-500" /> <span>Price: Low to High</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-400">
                          <input type="radio" name="sort" className="accent-blue-500" /> <span>Highest Rated</span>
                        </label>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <button className="w-full bg-[#2c2c2e] text-white text-xs py-2 rounded-lg">Apply Filters</button>
                      </div>
                    </div>
                  }
                />
              </div>
              
              <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar mask-fade-r">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                      selectedCategory === cat 
                        ? 'bg-[#f5f5f7] text-black' 
                        : 'bg-[#1d1d1f] text-[#86868b] hover:bg-[#2c2c2e]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="mt-4 min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredServices.map(service => (
                    <ServiceCard key={service.id} service={service} onContact={handleContact} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-24 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold text-gray-400">No results found</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === COMMUNITY TAB === */}
        {activeTab === 'community' && (
          <div className="animate-fade-in space-y-4 pt-4">
             {/* TABS COMPONENT */}
             <CustomTabs 
               tabs={[
                 { value: 'feed', label: 'All Feed' },
                 { value: 'events', label: 'Events' },
                 { value: 'announcements', label: 'Notices' },
               ]}
               activeTab={communityTab}
               onTabChange={setCommunityTab}
             />

            <div className="bg-[#1d1d1f] p-8 rounded-3xl text-center mb-8 border border-white/5 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                
                <h2 className="text-3xl font-semibold tracking-tighter text-white mb-2 relative z-10">Campus Feed</h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto relative z-10">Stay updated with the pulse of JKUAT. Events, news, and connections.</p>
            </div>
            
            {filteredPosts.map(post => (
                <CommunityPost key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in pt-4 pb-20">
            <div className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/5 text-center mb-6 relative overflow-hidden">
              <div className="w-24 h-24 bg-[#2c2c2e] p-1 rounded-full mx-auto mb-4 flex items-center justify-center relative z-10">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="font-semibold text-2xl text-white tracking-tight mb-1">Student User</h2>
              <p className="text-gray-500 text-sm font-mono tracking-widest uppercase">{user?.uid?.substring(0,8) || "..."}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-[#2c2c2e] p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Services</p>
                      <p className="text-2xl font-semibold text-white">0</p>
                  </div>
                  <div className="bg-[#2c2c2e] p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Rating</p>
                      <p className="text-2xl font-semibold text-white">5.0</p>
                  </div>
              </div>
            </div>

            {/* COLLAPSIBLE COMPONENT - Recent Activity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 px-2">Recent Activity</h3>
              <Collapsible 
                title="Pro Subscription Payment" 
                subtitle="Feb 24, 2024 • M-PESA"
                content={
                  <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-white font-medium">Ksh 250.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-500 font-medium">Completed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ref ID</span>
                      <span className="text-gray-400 font-mono text-xs">RMX9923KLA</span>
                    </div>
                  </div>
                }
              />
            </div>

            <div className="bg-gradient-to-r from-[#1c1c1e] to-[#2c2c2e] border border-white/5 rounded-3xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="font-semibold text-white text-lg tracking-tight">Pro Seller</h3>
                    <p className="text-xs text-gray-400 mt-1">Unlock verified badges & priority listing.</p>
                </div>
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              
              <button 
                 onClick={() => setShowSellModal(true)}
                 className="w-full bg-white text-black py-3 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors relative z-10"
              >
                Upgrade (Ksh 250/mo)
              </button>
            </div>

            {/* ACCORDION COMPONENT - Help & Support */}
            <div className="mb-8">
               <h3 className="text-lg font-semibold text-white mb-2 px-2">Help & Support</h3>
               <Accordion items={faqItems} />
            </div>

            {/* ALERT DIALOG TRIGGER - Log Out */}
            <div className="px-2">
                <button 
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-red-500 py-4 hover:bg-white/5 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
            </div>
          </div>
        )}
      </main>

      {/* ALERT DIALOG COMPONENT */}
      <CustomAlertDialog 
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => {
          // In a real app, auth.signOut() would go here
          setIsLogoutDialogOpen(false);
          alert("Logged out (Demo)");
        }}
        title="Sign out of ComradeConnect?"
        description="You will need to sign back in to access your seller dashboard and saved items."
        actionText="Sign Out"
      />

      <FloatingDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* === MODALS === */}

      {/* Contact Modal (Apple Card Style) */}
      {showContactModal && selectedService && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1d1d1f] w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl border border-white/10 animate-slide-up">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-6 right-6 bg-[#2c2c2e] p-2 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-bold text-2xl">
                    {selectedService.seller.charAt(0)}
                </div>
                <h3 className="text-2xl font-semibold text-white tracking-tight">{selectedService.seller}</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedService.title}</p>
            </div>
            
            <div className="space-y-3">
              <a href={`tel:${selectedService.phone}`} className="flex items-center justify-center w-full bg-[#0071e3] text-white py-3.5 rounded-xl font-medium hover:bg-[#0077ed] transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </a>
              <a href="#" className="flex items-center justify-center w-full bg-[#2c2c2e] text-green-500 py-3.5 rounded-xl font-medium hover:bg-[#3a3a3c] transition-colors">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sell / Subscription Modal (Full Screen with Blur) */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#000000] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 relative max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-slide-up">
             <button 
              onClick={() => {setShowSellModal(false); setPaymentStep(0);}}
              className="absolute top-6 right-6 bg-[#1d1d1f] p-2 rounded-full text-gray-400 hover:text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 0: INFO */}
            {paymentStep === 0 && (
              <div className="text-center pt-6">
                <Shield className="w-16 h-16 text-[#0071e3] mx-auto mb-6" />
                <h3 className="text-3xl font-semibold mb-3 text-white tracking-tight">Seller Pro.</h3>
                <p className="text-gray-400 mb-10 px-4 text-sm leading-relaxed font-medium">
                  Professional tools for the serious student entrepreneur. Verified badges. Unlimited listings.
                </p>
                
                <div className="bg-[#1d1d1f] rounded-3xl p-6 mb-8 text-left border border-white/5">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                    <span className="font-medium text-gray-300">Monthly Plan</span>
                    <span className="font-semibold text-xl text-white">Ksh 250</span>
                  </div>
                  <ul className="text-sm space-y-4 text-gray-400 font-medium">
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-[#0071e3] mr-3" /> Unlimited Listings</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-[#0071e3] mr-3" /> Pro Seller Badge</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 text-[#0071e3] mr-3" /> Priority Search</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setPaymentStep(1)}
                  className="w-full bg-[#0071e3] text-white py-4 rounded-full font-semibold hover:bg-[#0077ed] transition-transform active:scale-95"
                >
                  Subscribe
                </button>
              </div>
            )}

            {/* STEP 1: M-PESA */}
            {paymentStep === 1 && (
              <div className="pt-4">
                <div className="flex items-center mb-8">
                    <div className="w-10 h-10 bg-[#1d1d1f] rounded-full flex items-center justify-center text-green-500 mr-4">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">M-PESA Secure</h3>
                      <p className="text-xs text-gray-500">Safe, encrypted transaction.</p>
                    </div>
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 ml-1">Phone Number</label>
                  <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-medium">+254</span>
                      <input 
                        type="tel" 
                        placeholder="712 345 678" 
                        className="w-full pl-16 pr-4 py-4 bg-[#1d1d1f] border border-transparent focus:border-[#424245] rounded-2xl outline-none font-mono text-lg text-white transition-all placeholder-gray-600"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                      />
                  </div>
                </div>

                <button 
                  onClick={handleMpesaPayment}
                  disabled={isProcessingPayment}
                  className={`w-full py-4 rounded-full font-semibold text-white flex items-center justify-center transition-all ${
                    isProcessingPayment ? 'bg-[#1d1d1f] cursor-not-allowed text-gray-500' : 'bg-green-600 hover:bg-green-500'
                  }`}
                >
                  {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay Ksh 250"}
                </button>
              </div>
            )}

            {/* STEP 2: CREATE LISTING */}
            {paymentStep === 2 && (
              <form onSubmit={handleSubmitService} className="pt-2">
                <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white">New Service</h3>
                    <p className="text-xs text-gray-500 mt-1">Details matter. Make it shine.</p>
                </div>
                
                <div className="space-y-4">
                  <input 
                    required
                    type="text" 
                    placeholder="Service Title" 
                    className="w-full p-4 bg-[#1d1d1f] rounded-2xl border-none text-white placeholder-gray-600 focus:bg-[#2c2c2e] transition-colors outline-none font-medium"
                    value={newService.title}
                    onChange={e => setNewService({...newService, title: e.target.value})}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      className="w-full p-4 bg-[#1d1d1f] rounded-2xl border-none text-white focus:bg-[#2c2c2e] transition-colors outline-none appearance-none font-medium"
                      value={newService.category}
                      onChange={e => setNewService({...newService, category: e.target.value})}
                    >
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input 
                      required
                      type="number" 
                      placeholder="Price (Ksh)" 
                      className="w-full p-4 bg-[#1d1d1f] rounded-2xl border-none text-white placeholder-gray-600 focus:bg-[#2c2c2e] transition-colors outline-none font-medium"
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: e.target.value})}
                    />
                  </div>

                  <input 
                    required
                    type="text" 
                    placeholder="Location (e.g. Hall 6)" 
                    className="w-full p-4 bg-[#1d1d1f] rounded-2xl border-none text-white placeholder-gray-600 focus:bg-[#2c2c2e] transition-colors outline-none font-medium"
                    value={newService.location}
                    onChange={e => setNewService({...newService, location: e.target.value})}
                  />
                  
                  <input 
                    required
                    type="tel" 
                    placeholder="Contact Phone" 
                    className="w-full p-4 bg-[#1d1d1f] rounded-2xl border-none text-white placeholder-gray-600 focus:bg-[#2c2c2e] transition-colors outline-none font-medium"
                    value={newService.phone}
                    onChange={e => setNewService({...newService, phone: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-8 bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Publish"}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS (REPLACED WITH ALERT COMPONENT) */}
            {paymentStep === 3 && (
              <div className="text-center py-10">
                <div className="w-24 h-24 bg-[#1d1d1f] text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                {/* ALERT COMPONENT USAGE */}
                <div className="mb-8 text-left">
                  <Alert 
                    variant="success" 
                    title="Published Successfully" 
                    description="Your service is now live on the marketplace and visible to all students." 
                  />
                </div>

                <button 
                  onClick={() => {setShowSellModal(false); setPaymentStep(0); setNewService({title: '', category: 'Salon', price: '', location: '', phone: ''})}}
                  className="bg-[#2c2c2e] text-white px-10 py-3 rounded-full font-medium hover:bg-[#3a3a3c] transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}