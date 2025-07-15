"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ImageIcon, Users, Shapes, Download, Plus, UserPlus, Palette, StarIcon } from "lucide-react"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Component() {
  const router = useRouter()
  return (
    <div className="bg-black text-white overflow-hidden">
      <Navbar />
      {/* Hero Section */}
      <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-16 pt-24">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-violet-500/25 via-violet-500/8 to-transparent rounded-t-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-radial from-violet-400/15 via-violet-500/5 to-transparent rounded-t-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/10 rounded-t-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] opacity-45">
          <div className="absolute inset-0 bg-grid-pattern mask-gradient-bottom"></div>
        </div>
        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Hero Heading */}
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <p className="text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight text-metallic font-devanagari font-extralight p-3">
              Real-time collaboration meets limitless creativity.
            </p>
            {/* Description */}
            <p className="text-xl md:text-2xl text-metallic-subtle max-w-4xl mx-auto tracking-tight leading-relaxed font-light">
              Create beautiful diagrams, wireframes, and illustrations with our intuitive whiteboard tool. Perfect for
              teams and individuals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="bg-violet-900 hover:bg-violet-600 text-white px-10 py-4 rounded-full text-lg font-light transition-all duration-200"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                View Gallery
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="https://github.com/Akash-YS05/kalam">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-300 bg-transparent hover:opacity-70 text-metallic px-10 py-4 rounded-full text-lg font-light transition-all duration-200"
                >
                  <StarIcon className="w-5 h-5 text-yellow-300" />
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div id="features" className="relative py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-thin text-metallic mb-8 font-devanagari p-3">
              Built for collaboration
            </h2>
          </div>
          {/* Diagonal feature layout */}
          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:justify-between max-w-5xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <Users className="w-32 h-32 text-violet-500/30" />
              </div>
              {/* Text content */}
              <div className="relative z-10 flex-1 p-4 md:pr-16 md:p-0 md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-6">
                  <Users className="w-8 h-8 text-violet-800 mr-4 md:hidden" />{" "}
                  {/* Small icon for text on small screens */}
                  <h3 className="text-2xl md:text-3xl font-thin">Real-time Collaboration</h3>
                </div>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Work together with your team in real-time, anywhere in the world. See changes instantly as your
                  teammates contribute to the canvas.
                </p>
              </div>
              {/* Original icon block for larger screens */}
              <div className="hidden md:flex w-64 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-3xl border border-gray-800 items-center justify-center">
                <Users className="w-16 h-16 text-violet-500/30" />
              </div>
            </div>
            {/* Feature 2 */}
            <div className="relative flex flex-col items-center text-center md:flex-row-reverse md:items-center md:justify-between max-w-5xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <Shapes className="w-32 h-32 text-violet-500/30" />
              </div>
              {/* Text content */}
              <div className="relative z-10 flex-1 p-4 md:pl-16 md:p-0 md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-6">
                  <Shapes className="w-8 h-8 text-violet-800 mr-4 md:hidden" />{" "}
                  {/* Small icon for text on small screens */}
                  <h3 className="text-2xl md:text-3xl font-thin">Smart Shapes</h3>
                </div>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Perfect shapes every time with our smart drawing assistance. Create professional diagrams with
                  intelligent shape recognition and auto-alignment.
                </p>
              </div>
              {/* Original icon block for larger screens */}
              <div className="hidden md:flex w-64 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-3xl border border-gray-800 items-center justify-center">
                <Shapes className="w-16 h-16 text-violet-500/30" />
              </div>
            </div>
            {/* Feature 3 */}
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:justify-between max-w-5xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <Download className="w-32 h-32 text-violet-500/30" />
              </div>
              {/* Text content */}
              <div className="relative z-10 flex-1 p-4 md:pr-16 md:p-0 md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-6">
                  <Download className="w-8 h-8 text-violet-800 mr-4 md:hidden" />{" "}
                  {/* Small icon for text on small screens */}
                  <h3 className="text-2xl md:text-3xl font-thin">Beautiful Exports</h3>
                </div>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Export your drawings in multiple formats with crystal clear quality. Share your work in PNG, SVG, PDF,
                  or any format you need. (Coming soon)
                </p>
              </div>
              {/* Original icon block for larger screens */}
              <div className="hidden md:flex w-64 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-3xl border border-gray-800 items-center justify-center">
                <Download className="w-16 h-16 text-violet-500/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* How It Works Section */}
      <div id="how-it-works" className="relative py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-thin text-metallic mb-8 font-devanagari p-2">How It Works</h2>
            <p className="text-base md:text-xl text-metallic-subtle font-light max-w-3xl mx-auto leading-relaxed">
              Get started with Kalam in just a few simple steps.
            </p>
          </div>
          {/* Steps */}
          <div className="space-y-20">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:text-left max-w-4xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <Plus className="w-32 h-32 text-violet-800" />
              </div>
              {/* Original circular icon for larger screens */}
              <div className="hidden md:flex w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 items-center justify-center mr-8 flex-shrink-0">
                <Plus className="w-8 h-8 text-violet-800" />
              </div>
              {/* Text content */}
              <div className="relative z-10 p-4 md:p-0">
                <h3 className="text-xl md:text-2xl font-thin text-metallic mb-3">Create a Board</h3>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Start with a blank canvas or choose from our collection of professionally designed templates to
                  jumpstart your creativity.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:text-left max-w-4xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <UserPlus className="w-32 h-32 text-violet-800" />
              </div>
              {/* Original circular icon for larger screens */}
              <div className="hidden md:flex w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 items-center justify-center mr-8 flex-shrink-0">
                <UserPlus className="w-8 h-8 text-violet-800" />
              </div>
              {/* Text content */}
              <div className="relative z-10 p-4 md:p-0">
                <h3 className="text-xl md:text-2xl font-thin mb-3">Invite Your Team</h3>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Collaborate in real-time with your teammates. Share your board with a simple link and watch ideas come
                  together seamlessly.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:text-left max-w-4xl mx-auto">
              {/* Background icon for small screens */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 md:hidden">
                <Palette className="w-32 h-32 text-violet-500" />
              </div>
              {/* Original circular icon for larger screens */}
              <div className="hidden md:flex w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 items-center justify-center mr-8 flex-shrink-0">
                <Palette className="w-8 h-8 text-violet-500" />
              </div>
              {/* Text content */}
              <div className="relative z-10 p-4 md:p-0">
                <h3 className="text-xl md:text-2xl font-thin mb-3">Start Creating</h3>
                <p className="text-base md:text-lg text-metallic-subtle font-light leading-relaxed">
                  Use our intuitive tools to bring your ideas to life. Draw, shape, annotate, and create beautiful
                  visual content effortlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {/* Bottom spacing for gradient */}
      {/* <div className="h-32"></div> */}
    </div>
  )
}
