"use client"

import { Button } from "@/components/ui/button"
import { Github, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    // Clear backend tokens
    localStorage.removeItem("backend_token")
    localStorage.removeItem("backend_token_user_id")
    localStorage.removeItem("token")
    await signOut({ callbackUrl: "/" })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-devanagari">Kalam</Link>

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

          {status === "loading" ? (
            <Button
              size="sm"
              disabled
              className="bg-violet-800 text-white font-light"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          ) : session ? (
            <Button
              onClick={handleLogout}
              size="sm"
              className="bg-violet-800 hover:bg-violet-600 text-white font-light"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
