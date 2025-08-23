/**
 * FILE LOCATION: frontend/src/components/Home.jsx
 * 
 * Landing page component that serves as the public entry point to the application.
 * Displays information about the financial platform and provides navigation to
 * login and signup pages for new users.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  BarChart3, 
  Users, 
  Brain,
  FileText,
  Target,
  ArrowRight,
  CheckCircle,
  Play,
  Star,
  Menu,
  X,
  Zap,
  TrendingUp,
  Shield,
  Globe,
  Award,
  Sparkles,
  Infinity
} from 'lucide-react';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    setIsLoaded(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Client Onboarding Without Friction",
      description: "Collect client information, verify identity (eKYC), and get documents signed digitally all in one flow.",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI That Works Like a Real Assistant", 
      description: "Every client meeting is automatically transcribed and summarized with key action items flagged.",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Smarter Financial Planning Tools",
      description: "Build interactive plans in minutes using goal-based, cash flow-based, or hybrid methodologies.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Advisor Command Center",
      description: "Track every client's progress, monitor KPIs, and export compliance-ready reports in seconds.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Based Automation",
      description: "Automate scheduling, transcription, and client communication with intelligent workflows.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "SEBI Compliance Ready",
      description: "Built-in compliance workflows and audit-ready reporting for SEBI-registered advisors.",
    }
  ];

  const stats = [
    { value: "10,000+", label: "Active Advisors" },
    { value: "₹500Cr+", label: "Assets Managed" },
    { value: "95%", label: "Client Satisfaction" },
    { value: "50%", label: "Time Savings" }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Senior Financial Advisor, Mumbai",
      content: "Richie AI has transformed how I manage my clients. The AI-powered insights help me provide better recommendations.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Priya Sharma", 
      role: "Wealth Manager, Delhi",
      content: "The automation capabilities have saved me hours of manual work. More time for what matters - my clients.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Amit Patel",
      role: "Investment Consultant, Bangalore", 
      content: "The unified workflow is revolutionary. I can now show clients concrete comparisons of different strategies.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "₹2,999",
      period: "/month",
      color: "from-red-500 to-red-600",
      buttonColor: "bg-red-500 hover:bg-red-600",
      features: [
        { name: "Up to 50 clients", included: true },
        { name: "Basic CRM features", included: true },
        { name: "Standard financial planning", included: true },
        { name: "Email support", included: true },
        { name: "Mobile app access", included: false },
        { name: "AI automation", included: false }
      ]
    },
    {
      name: "Standard",
      price: "₹5,999",
      period: "/month",
      color: "from-blue-500 to-blue-600",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      popular: true,
      features: [
        { name: "Up to 200 clients", included: true },
        { name: "Advanced CRM & automation", included: true },
        { name: "AI-powered planning", included: true },
        { name: "Priority support", included: true },
        { name: "Mobile app access", included: true },
        { name: "API access", included: false }
      ]
    },
    {
      name: "Premium",
      price: "₹9,999",
      period: "/month",
      color: "from-green-500 to-green-600",
      buttonColor: "bg-green-500 hover:bg-green-600",
      features: [
        { name: "Unlimited clients", included: true },
        { name: "Full AI automation suite", included: true },
        { name: "Custom integrations", included: true },
        { name: "Dedicated support", included: true },
        { name: "White-label options", included: true },
        { name: "Advanced analytics", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Enhanced Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-100' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            {/* Logo with better visibility */}
            <div className={`flex items-center space-x-3 transform transition-all duration-300 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="relative bg-white p-2 rounded-lg shadow-md">
                <img 
                  src="https://richie-ai.com/wp-content/uploads/2021/07/Group-35-2.png" 
                  alt="Richie AI Logo" 
                  className="h-8 w-auto transform hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className={`text-xl font-bold ${scrollY > 50 ? 'text-gray-900' : 'text-white'} hidden sm:block`}>
                Richie AI
              </span>
            </div>
            
            {/* Desktop Navigation - Finofo Style */}
            <div className="hidden md:flex items-center space-x-1">
              {['Features', 'How It Works', 'Pricing'].map((item, index) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`} 
                  onClick={(e) => handleNavClick(e, item.toLowerCase().replace(' ', '-'))} 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                    scrollY > 50 
                      ? 'text-gray-700 hover:text-[#113866] hover:bg-gray-100' 
                      : 'text-white hover:text-[#48bf84] hover:bg-white/10'
                  }`}
                >
                  {item}
                </a>
              ))}
              
                             <div className="flex items-center space-x-3 ml-6">
                 <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#113866] transition-colors">
                   Log in
                 </Link>
                 <Link to="/signup" className="px-6 py-2 bg-white text-[#113866] text-sm font-medium rounded-full hover:bg-gray-50 transition-all duration-300 shadow-lg">
                   Start free trial
                 </Link>
                 <button className="px-6 py-2 bg-transparent border border-white text-white text-sm font-medium rounded-full hover:bg-white hover:text-[#113866] transition-all duration-300">
                   Book a demo
                 </button>
               </div>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden relative z-10" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="relative w-6 h-6">
                <span className={`absolute top-0 left-0 w-6 h-0.5 ${scrollY > 50 ? 'bg-gray-900' : 'bg-white'} transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 top-3' : ''}`}></span>
                <span className={`absolute top-2.5 left-0 w-6 h-0.5 ${scrollY > 50 ? 'bg-gray-900' : 'bg-white'} transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`absolute top-5 left-0 w-6 h-0.5 ${scrollY > 50 ? 'bg-gray-900' : 'bg-white'} transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 top-3' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b shadow-2xl transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}>
          <div className="px-6 py-6 space-y-4">
            {['Features', 'How It Works', 'Pricing'].map((item, index) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                onClick={(e) => {handleNavClick(e, item.toLowerCase().replace(' ', '-')); setIsMenuOpen(false);}} 
                className="block text-gray-700 hover:text-[#113866] text-lg font-semibold py-2 transition-colors duration-300"
              >
                {item}
              </a>
            ))}
                         <div className="pt-4 space-y-3 border-t border-gray-200">
               <Link to="/login" className="block w-full py-3 text-[#113866] border-2 border-[#113866] rounded-full font-semibold text-center">Log in</Link>
               <Link to="/signup" className="block w-full py-3 bg-gradient-to-r from-[#113866] to-[#48bf84] text-white rounded-full font-semibold text-center">Start free trial</Link>
             </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Dashboard Image */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#113866] via-[#1e4f7a] to-[#2a5f8f] overflow-hidden">
        {/* Animated Background Elements - More Subtle */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#48bf84] rounded-full opacity-5 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#ff9f1c] rounded-full opacity-5 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`text-white transform transition-all duration-1000 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
                <Sparkles className="w-4 h-4 mr-2 text-[#ff9f1c]" />
                <span className="text-sm font-medium">For CFPs and SEBI-registered RIAs</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
                Stronger Client
                <br />
                <span className="bg-gradient-to-r from-[#48bf84] to-[#ff9f1c] bg-clip-text text-transparent">
                  Relationships.
                </span>
                <br />
                Smarter Outcomes.
              </h1>
              
              <p className="text-lg lg:text-xl mb-10 opacity-90 leading-relaxed max-w-2xl">
                For CFPs and SEBI-registered RIAs who demand modern tech, seamless workflows, and time back to focus on what matters—advice, not administration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/signup" className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#ff9f1c] to-[#e68a00] text-white font-bold rounded-full hover:from-[#e68a00] hover:to-[#ff9f1c] transition-all duration-300 transform hover:scale-105 shadow-xl">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <button className="group flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Watch Demo
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl lg:text-3xl font-bold mb-1 text-[#ff9f1c]">{stat.value}</div>
                    <div className="text-xs lg:text-sm opacity-80 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Image */}
            <div className={`relative transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-white/20 backdrop-blur-sm">
                  <img 
                    src="https://www.anychart.com/blog/wp-content/uploads/2017/03/investment-portfolio-dashboard-design-for-simple-forms.png"
                    alt="Investment Portfolio Dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-[#ff9f1c] to-[#48bf84] rounded-full flex items-center justify-center text-white font-bold text-sm animate-bounce shadow-xl">
                  AI
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#113866] to-[#48bf84] text-white rounded-full mb-8 font-semibold shadow-lg">
              <Infinity className="w-5 h-5 mr-2" />
              Unified Modern Workflow
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#113866] mb-6">
              Why Richie AI Works
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              No more fragmented tools—plan, track, and engage within one intelligent platform built specifically for your advisory practice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#113866]/5 to-[#48bf84]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#113866] to-[#48bf84] rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#113866] mb-4 group-hover:text-[#48bf84] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-[#113866] to-[#1e4f7a] relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Three simple steps to transform your advisory practice with AI-powered automation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Onboard clients in minutes",
                description: "Streamlined & digital client onboarding with eKYC verification and document signing",
                icon: <Users className="w-8 h-8" />
              },
              {
                step: "02", 
                title: "Generate AI-powered plans",
                description: "Intuitive, branded, actionable financial plans with AI-driven insights and recommendations",
                icon: <Brain className="w-8 h-8" />
              },
              {
                step: "03",
                title: "Maintain engagement effortlessly", 
                description: "Analytics, follow-ups, reporting—all automated in one intelligent platform",
                icon: <TrendingUp className="w-8 h-8" />
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:-translate-y-4 shadow-xl">
                  <div className="text-5xl font-bold text-[#ff9f1c] mb-6 opacity-30">{item.step}</div>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#48bf84] to-[#ff9f1c] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-blue-100 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-[#48bf84]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Real Images */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#113866] mb-6">
              Trusted by leading financial advisors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of SEBI-registered advisors who have transformed their practice with Richie AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#ff9f1c] fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-8 text-lg leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-gray-200"
                  />
                  <div>
                    <div className="text-[#113866] font-bold text-lg">{testimonial.name}</div>
                    <div className="text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Pricing Section - Ribbon Clipped Cards */}
<section id="pricing" className="py-24 bg-gray-200 relative overflow-hidden">
  <div className="relative max-w-7xl mx-auto px-6">
    <div className="text-center mb-20">
      <h2 className="text-4xl lg:text-5xl font-bold text-[#113866] mb-6">
        Simple, Transparent Pricing
      </h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Control costs by selecting only the tools you need—no bundled features you'll never use
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      
      {/* One-time Registration Card */}
      <div className="relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
           style={{
             borderRadius: '20px 20px 20px 20px'
           }}>
        
        {/* Top Header with Cut */}
        <div className="relative bg-[#48bf84] text-white p-4 text-center font-bold"
             style={{
               clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)'
             }}>
          <h3 className="text-sm uppercase tracking-wide">BASIC</h3>
          <p className="text-xs opacity-90">PACKAGE</p>
        </div>
        
        {/* Price Tag - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-[#48bf84] text-white px-3 py-1 text-xs font-bold rounded"
               style={{
                 clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)'
               }}>
            ₹2,800
          </div>
        </div>
        
        <div className="p-6 pt-12">
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Account setup</span>
            </li>
            <li className="flex items-center text-sm">
              <X className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-gray-400">Onboarding process</span>
            </li>
            <li className="flex items-center text-sm">
              <X className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-gray-400">Custom workspace branding</span>
            </li>
            <li className="flex items-center text-sm">
              <X className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-gray-400">Monthly platform access</span>
            </li>
          </ul>
          
          {/* Price Display */}
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-[#113866]">₹2,800</div>
          </div>
          
          <button className="w-full bg-[#48bf84] hover:bg-[#3da368] text-white font-bold py-3 text-sm transition-colors rounded">
            SELECT
          </button>
        </div>
      </div>

      {/* Flat Monthly Access Fee Card */}
      <div className="relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
           style={{
             borderRadius: '20px 20px 20px 20px'
           }}>
        
        {/* Top Header with Cut */}
        <div className="relative bg-[#113866] text-white p-4 text-center font-bold"
             style={{
               clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)'
             }}>
          <h3 className="text-sm uppercase tracking-wide">STANDARD</h3>
          <p className="text-xs opacity-90">PACKAGE</p>
        </div>
        
        {/* Price Tag - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-[#113866] text-white px-3 py-1 text-xs font-bold rounded"
               style={{
                 clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)'
               }}>
            ₹2,499
          </div>
        </div>
        
        <div className="p-6 pt-12">
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Full platform access</span>
            </li>
            <li className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">All dashboards</span>
            </li>
            <li className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Admin tools</span>
            </li>
            <li className="flex items-center text-sm">
              <X className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-gray-400">Pay-per-use services</span>
            </li>
          </ul>
          
          {/* Price Display */}
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-[#113866]">₹2,499</div>
            <div className="text-sm text-gray-500">/ month</div>
          </div>
          
          <button className="w-full bg-[#113866] hover:bg-[#0d2d52] text-white font-bold py-3 text-sm transition-colors rounded">
            SELECT
          </button>
        </div>
      </div>

      {/* Pay-Per-Use Services Card */}
      <div className="relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
           style={{
             borderRadius: '20px 20px 20px 20px'
           }}>
        
        {/* Top Header with Cut */}
        <div className="relative bg-[#ff9f1c] text-white p-4 text-center font-bold"
             style={{
               clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)'
             }}>
          <h3 className="text-sm uppercase tracking-wide">PREMIUM</h3>
          <p className="text-xs opacity-90">PACKAGE</p>
        </div>
        
        {/* Price Tag - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-[#ff9f1c] text-white px-3 py-1 text-xs font-bold rounded"
               style={{
                 clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)'
               }}>
            ₹X
          </div>
        </div>
        
        <div className="p-6 pt-12">
          <ul className="space-y-2 mb-8">
            <li className="flex items-center text-xs">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">eKYC + eSign — ₹X / client</span>
            </li>
            <li className="flex items-center text-xs">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">Meeting transcription — ₹X / meeting</span>
            </li>
            <li className="flex items-center text-xs">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">Plan export — ₹X / plan</span>
            </li>
            <li className="flex items-center text-xs">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">Onboarding parser — ₹X / upload</span>
            </li>
            <li className="flex items-center text-xs">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-gray-700">Charged only when used</span>
            </li>
          </ul>
          
          {/* Price Display */}
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-[#113866]">Pay-Per-Use</div>
            <div className="text-sm text-gray-500">Individual pricing</div>
          </div>
          
          <button className="w-full bg-[#ff9f1c] hover:bg-[#e68a00] text-white font-bold py-3 text-sm transition-colors rounded">
            SELECT
          </button>
        </div>
      </div>
    </div>

    <div className="text-center mt-12">
      <Link to="/signup" className="inline-block px-12 py-4 bg-gradient-to-r from-[#ff9f1c] to-[#e68a00] text-white font-bold rounded-full hover:from-[#e68a00] hover:to-[#ff9f1c] transition-all duration-300 transform hover:scale-105 shadow-xl text-lg">
        Estimate My Monthly Cost
      </Link>
      <p className="text-gray-600 mt-4 text-sm">
        Why this works: you control cost by selecting only the tools you need — no bundled features you'll never use.
      </p>
    </div>
  </div>
</section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-[#48bf84] to-[#ff9f1c] relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to elevate your advisory practice with AI?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Start smarter, stay compliant, and deliver better client outcomes with the most advanced financial advisory platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/signup" className="group px-12 py-4 bg-white text-[#113866] font-bold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <button className="px-12 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-[#113866] transition-all duration-300 transform hover:scale-105">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-[#113866] relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 py-20">
         <div className="grid md:grid-cols-4 gap-12 mb-12">
           <div className="col-span-2">
             <div className="flex items-center space-x-3 mb-6">
               <div className="bg-white p-2 rounded-lg">
                 <img 
                   src="https://richie-ai.com/wp-content/uploads/2021/07/Group-35-2.png" 
                   alt="Richie AI Logo" 
                   className="h-8 w-auto"
                 />
               </div>
               <span className="text-2xl font-bold text-white">
                 Richie AI
               </span>
             </div>
             <p className="text-blue-100 mb-8 max-w-md text-lg leading-relaxed">
               Empowering SEBI-registered financial advisors with AI-driven insights and automated workflows for superior client service.
             </p>
             <div className="flex flex-wrap gap-6">
               {[
                 { icon: <Globe className="w-5 h-5" />, label: "Global Reach" },
                 { icon: <Shield className="w-5 h-5" />, label: "Secure Platform" },
                 { icon: <Award className="w-5 h-5" />, label: "Award Winning" }
               ].map((item, index) => (
                 <div key={index} className="flex items-center space-x-2 text-[#48bf84]">
                   {item.icon}
                   <span className="text-sm font-medium">{item.label}</span>
                 </div>
               ))}
             </div>
           </div>
           
           <div>
             <h3 className="text-white font-bold mb-6 text-lg">Product</h3>
             <ul className="space-y-3">
               {['Features', 'Pricing', 'API', 'Security', 'Integrations'].map((item, index) => (
                 <li key={index}>
                   <a href="#" className="text-blue-100 hover:text-[#48bf84] transition-colors duration-300 flex items-center group">
                     <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                     {item}
                   </a>
                 </li>
               ))}
             </ul>
           </div>
           
           <div>
             <h3 className="text-white font-bold mb-6 text-lg">Company</h3>
             <ul className="space-y-3">
               {['About', 'Contact', 'Privacy', 'Terms', 'Support'].map((item, index) => (
                 <li key={index}>
                   <a href="#" className="text-blue-100 hover:text-[#48bf84] transition-colors duration-300 flex items-center group">
                     <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                     {item}
                   </a>
                 </li>
               ))}
             </ul>
           </div>
         </div>
         
         <div className="border-t border-white/10 pt-8">
           <div className="flex flex-col md:flex-row justify-between items-center">
             <p className="text-blue-100 mb-4 md:mb-0">
               &copy; 2025 Richie AI. All rights reserved. For SEBI-registered financial advisors in India.
             </p>
             <div className="flex items-center space-x-6">
               <span className="text-[#48bf84] font-semibold">Powered by AI</span>
               <div className="w-2 h-2 bg-[#ff9f1c] rounded-full animate-pulse"></div>
               <span className="text-blue-100">Made with ❤️ for advisors</span>
             </div>
           </div>
         </div>
       </div>
     </footer>

     {/* Floating Action Button */}
     <div className="fixed bottom-8 right-8 z-40">
       <button className="w-16 h-16 bg-gradient-to-r from-[#ff9f1c] to-[#e68a00] text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group">
         <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
       </button>
     </div>
   </div>
 );
};

export default Home;