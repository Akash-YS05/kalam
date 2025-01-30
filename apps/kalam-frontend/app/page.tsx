"use client"

import React, { useEffect } from 'react';
import { 
  Pencil, 
  Share2, 
  Users, 
  Shapes, 
  Sparkles,
  ArrowRight,
  Github,
  Twitter
} from 'lucide-react';
import Features from '@/components/Features';
import { Vortex } from '@/components/ui/vortex';

function App() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Hero Section */}
      <nav className="fixed top-0 w-full bg-gray-950/80 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Pencil className="w-6 h-6 text-primary-400" />
              <span className="text-xl font-bold text-white font-display">Kalam</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">Features</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors font-medium">Testimonials</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors font-medium">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="hidden md:block px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium">
                Sign in
              </button>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 duration-200 font-medium">
                Try Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="w-full pt-32 pb-20 sm:px-6">
          {/* <div className="max-w-7xl mx-auto">
            <div className="text-center fade-in">
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 font-display tracking-tight">
                Visualize Your Ideas with
                <span className="text-primary-400 ml-2">Kalam</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Create beautiful diagrams, wireframes, and illustrations with our intuitive whiteboard tool. Perfect for teams and individuals.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 font-medium">
                  <span>Start Drawing</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border-2 border-gray-800 text-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-400 transition-all font-medium">
                  Watch Demo
                </button>
              </div>
            </div> */}
            <div className="w-[calc(100%-4rem)] mx-auto rounded-md  h-[30rem] overflow-hidden">
            <Vortex
              backgroundColor="black"
              className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
            >
              <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
                Ideas begin here. <br /> Bring them to life with <br />
                <span className="text-indigo-700 pt-4">KALAM</span>
              </h2>
              <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
              Create beautiful diagrams, wireframes, and illustrations with our intuitive whiteboard tool. Perfect for teams and individuals.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 p-4">
                <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 font-medium">
                  <span>Start Drawing</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-3 border-2 border-gray-800 text-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-400 transition-all font-medium">
                  Watch Demo
                </button>
              </div>
            </Vortex>
          </div>

            {/* <div className="mt-20 relative fade-in">
              <div className="rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 ring-1 ring-gray-800">
                <img 
                  src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=2000&q=80" 
                  alt="Kalam Interface"
                  className="w-full object-cover"
                />
              </div>
            </div> */}
          {/* </div> */}
        </div>

        {/* Features */}
        <section id="features" className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 fade-in">
              <h2 className="text-3xl font-bold text-white mb-4 font-display">Why Choose Kalam?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Everything you need to bring your ideas to life, all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Share2 className="w-6 h-6" />,
                  title: "Real-time Collaboration",
                  description: "Work together with your team in real-time, anywhere in the world."
                },
                {
                  icon: <Shapes className="w-6 h-6" />,
                  title: "Smart Shapes",
                  description: "Perfect shapes every time with our smart drawing assistance."
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "Beautiful Exports",
                  description: "Export your drawings in multiple formats with crystal clear quality."
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="fade-in p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors duration-300 border border-gray-700"
                >
                  <div className="w-12 h-12 bg-primary-950 rounded-lg flex items-center justify-center text-primary-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-display">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary-600 rounded-2xl p-8 md:p-16 text-center fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-4 font-display">
                  Ready to start creating?
                </h2>
                <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of creators and teams who trust Kalam for their visual communication needs.
                </p>
                <button className="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors transform hover:scale-105 duration-200 font-medium">
                  Get Started for Free
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 font-display">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Templates</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 font-display">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 font-display">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 font-display">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-primary-400" />
                <span className="text-white font-semibold font-display">Kalam</span>
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;