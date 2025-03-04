"use client"

import { useEffect, useState } from "react"
import { Pencil, Share2, Shapes, Sparkles, ArrowRight, Github, Twitter, Sun, Moon } from "lucide-react"
import { Vortex } from "@/components/ui/vortex"
  import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"
import { useRouter } from "next/navigation"
import Link from "next/link"

function App() {
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  })

  function handleLogout() {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    router.push('/')
  }

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show")
        }
      })
    })

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }
  const placeholders = [
    "Start something new",
    "Bring your team in",
    "Sketch your vision",
    "Turn your thoughts into reality",
  ];
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black text-gray-100" : "bg-white text-gray-900"}`}>
      {/* Hero Section */}
      <nav
        className={`fixed top-0 w-full ${isDarkMode ? "bg-gray-950/80" : "bg-gray-50/80"} backdrop-blur-sm z-50 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}  font-display`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Pencil className="w-6 h-6 text-primary-400" />
              <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} font-display`}>
                Kalam
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium`}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium`}
              >
                Pricing
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${isDarkMode ? "bg-gray-800 text-white-400" : "bg-gray-200 text-gray-800"}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className={`hidden md:block px-4 py-2 ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transform hover:scale-105 duration-200`}
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => router.push('/signin')}
                  className={`hidden md:block px-4 py-2 ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transform hover:scale-105 duration-200`}
                >
                  Sign in
                </button>
              )}

            </div>
          </div>
        </div>
      </nav>
      <main>
        <div className="w-full h-auto pt-32 pb-20 sm:px-6 overflow-hidden">
        <div className="w-full mx-auto rounded-md h-auto">
        <Vortex
              isDarkMode={isDarkMode}
              className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
              baseHue={190}
            >
              <h2
                className={`${isDarkMode ? "font-[Satisfy] text-white" : "font-[Satisfy] text-gray-900"} text-2xl md:text-7xl text-center`}
              >
                Ideas begin here <br /> Bring them to life with <br />
              </h2>
              <div className="relative overflow-visible flex justify-center items-center">
                <span className="overflow-visible bg-gradient-to-r from-indigo-500 via-indigo-300 to-blue-600 bg-clip-text text-transparent font-[Satisfy] tracking-wide pt-4 font-bold text-9xl">
                  Kalam
                </span>
              </div>

              <p
                className={`${isDarkMode ? "text-white" : "text-gray-700"} text-sm md:text-xl max-w-xl mt-6 text-center font-thin font-[Geist]`}
              >
                Create beautiful diagrams, wireframes, and illustrations with our intuitive whiteboard tool. Perfect for
                teams and individuals.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 py-8">
                <Link href={isLoggedIn ? "/drawing" : "/signin"} passHref>
                  <button className="px-8 py-3 font-[Geist] bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 duration-200 flex items-center justify-center space-x-2 font-medium">
                    <span>{isLoggedIn ? "Start Drawing" : "Sign In"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href='#how-it-works' passHref>
                <button
                  className={`px-8 py-3 font-[Geist] border-2 ${isDarkMode ? "border-gray-800 text-gray-300 hover:border-primary-500 hover:text-primary-400" : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600"} rounded-lg transition-all font-medium flex items-center gap-2`}
                >
                  How it Works
                  <ArrowRight className="w-5 h-5" />
                </button>
                </Link>
                <Link href="/dashboard" passHref>
                <button
                  className={`px-8 py-3 font-[Geist] border-2 ${isDarkMode ? "border-gray-800 text-gray-300 hover:border-primary-500 hover:text-primary-400" : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600"} rounded-lg transition-all font-medium flex items-center gap-2`}
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
                </Link>
                
              </div>
            </Vortex>
          </div>
        </div>

        
        {/* Features */}
        <section id="features" className={`font-[Geist] py-10 ${isDarkMode ? "bg-slate-950" : "bg-gray-100"}`}>
        <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:py-6">
            <div className="text-center mb-16 fade-in">
              <h2 className={`text-3xl font-bold font-[Geist] ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}>
                Why Choose Kalam?
              </h2>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} max-w-2xl mx-auto font-[Geist]`}>
                Everything you need to bring your ideas to life, all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 font-[Geist] font-light">
              {[
                {
                  icon: <Share2 className="w-6 h-6" />,
                  title: "Real-time Collaboration",
                  description: "Work together with your team in real-time, anywhere in the world.",
                },
                {
                  icon: <Shapes className="w-6 h-6" />,
                  title: "Smart Shapes",
                  description: "Perfect shapes every time with our smart drawing assistance.",
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "Beautiful Exports",
                  description: "Export your drawings in multiple formats with crystal clear quality.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`fade-in p-6 ${isDarkMode ? "bg-gray-800/50 hover:bg-gray-800" : "bg-white hover:bg-gray-50"} rounded-xl transition-colors duration-300 border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="w-12 h-12 bg-primary-950 rounded-lg flex items-center justify-center text-primary-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3
                    className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 font-display`}
                  >
                    {feature.title}
                  </h3>
                  <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={`py-20 ${isDarkMode ? "bg-gray-950" : "bg-gray-50"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-[Geist] font-light">
            <div className="text-center mb-16 fade-in">
              <h2 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}>
                How It Works
              </h2>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} max-w-2xl mx-auto`}>
                Get started with Kalam in just a few simple steps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Create a Board",
                  description: "Start with a blank canvas or choose from our templates.",
                },
                {
                  step: "2",
                  title: "Invite Your Team",
                  description: "Collaborate in real-time with your teammates.",
                },
                {
                  step: "3",
                  title: "Start Creating",
                  description: "Use our intuitive tools to bring your ideas to life.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`fade-in p-6 ${isDarkMode ? "bg-gray-900" : "bg-white"} rounded-xl transition-colors duration-300 border ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
                >
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                    {item.step}
                  </div>
                  <h3
                    className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2 font-display`}
                  >
                    {item.title}
                  </h3>
                  <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="pricing" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary-600 rounded-2xl p-8 md:p-16 text-center fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-4 font-display">Ready to start creating?</h2>
                <p className="text-primary-100 mb-8 max-w-2xl mx-auto font-display">
                  Join thousands of creators and teams who trust Kalam for their visual communication needs.
                </p>
                <button className="px-8 py-4 font-display bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors transform hover:scale-105 duration-200 font-medium">
                  Get Started for Free
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className={`${isDarkMode ? "bg-gray-900 border-t border-gray-800" : "bg-gray-100 border-t border-gray-200"} font-display`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}
                >
                  Product
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Templates
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}
                >
                  Company
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}
                >
                  Resources
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Community
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4 font-display`}
                >
                  Legal
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
                    >
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className={`mt-8 pt-8 border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"} flex flex-col md:flex-row justify-between items-center`}
            >
              <div className="flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-primary-400" />
                <span className={`${isDarkMode ? "text-white" : "text-gray-900"} font-semibold font-display`}>
                  Kalam
                </span>
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a
                  href="#"
                  className={`${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className={`${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition-colors`}
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
