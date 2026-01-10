"use client"

import { Button } from "@/components/ui/button"
import { Github, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Navbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  // 🔁 Sync auth state
  const syncAuthState = () => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }

  useEffect(() => {
    syncAuthState()

    // Listen for logout/login from other tabs or components
    window.addEventListener("storage", syncAuthState)
    return () => window.removeEventListener("storage", syncAuthState)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    syncAuthState()          // 👈 force UI update
    router.push("/")         // optional redirect
  }

  if (isLoggedIn === null) return null // prevents flicker

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-2xl font-devanagari">Kalam</div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="font-light hover:text-gray-300 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="font-light hover:text-gray-300 transition-colors">
            How It Works
          </a>
          <a href="#gallery" className="font-light hover:text-gray-300 transition-colors">
            Gallery
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="https://github.com/Akash-YS05/kalam" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-transparent hover:bg-gray-900 hover:text-white"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </Link>

          {isLoggedIn ? (
            <>
              <Button
                onClick={handleLogout}
                size="sm"
                className="bg-violet-800 hover:bg-violet-600 text-white font-light"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/signin")}
              size="sm"
              className="bg-violet-800 hover:bg-violet-600 text-white font-light"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
