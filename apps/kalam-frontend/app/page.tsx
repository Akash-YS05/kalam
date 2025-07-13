"use client"

import { useEffect, useState } from "react"
import { Pencil, Share2, Shapes, Sparkles, ArrowRight, Github, Twitter, Sun, Moon } from "lucide-react"
import { Vortex } from "@/components/ui/vortex"
  import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Component from "@/components/landing-page"

function App() {
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

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
      <Component/>
    </div>
  )
}

export default App
