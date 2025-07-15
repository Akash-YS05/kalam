"use client"

import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";

export function Navbar() {

    const router = useRouter();

//   const [isDarkMode, setIsDarkMode] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

//   function handleLogout() {
//     localStorage.removeItem("token")
//     setIsLoggedIn(false)
//     router.push('/')
//   }
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-2xl font-devanagari">Kalam</div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="transition-colors font-light hover:text-gray-300 duration-200">
            Features
          </a>
          <a href="#how-it-works" className="font-light hover:text-gray-300 transition-colors duration-200">
            How It Works
          </a>
          <a href="#gallery" className="transition-colors font-light hover:text-gray-300 duration-200">
            Gallery
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <Link href='https://github.com/Akash-YS05/kalam' target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-transparent hover:bg-gray-900 hover:text-white"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </Link>
          {isLoggedIn ? (
            <Button onClick={() => router.push('/dashboard')} size="sm" className="bg-violet-800 hover:bg-violet-600 text-white font-light">
                Try Kalam
            </Button> 
          ) : (
            <Button onClick={() => router.push('/signin')} size="sm" className="bg-violet-800 hover:bg-violet-600 text-white font-light">
                Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
