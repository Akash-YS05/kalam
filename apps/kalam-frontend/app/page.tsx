"use client"

import { useEffect, useState } from "react"
import Component from "@/components/landing-page"

function App() {

  
  const [isDarkMode, _] = useState(true) // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false) // eslint-disable-next-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black text-gray-100" : "bg-white text-gray-900"}`}>
      <Component/>
    </div>
  )
}

export default App
