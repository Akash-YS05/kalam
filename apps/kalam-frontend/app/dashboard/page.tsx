"use client"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Loader2, Share2, PenTool } from "lucide-react"
import axios from "axios"
import { HTTP_URL } from "@/config"
import { useRouter } from "next/navigation"
import { NextResponse } from "next/server"

interface Room {
  id: number
  slug: string
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      console.log(token)

      if (!token) {
        console.error("No token found")
        setRooms([])
        return
      }

      const response = await axios.get<{ rooms: Room[] }>(`${HTTP_URL}/room`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRooms(response.data.rooms || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${HTTP_URL}/room`, { name: newRoomName }, { headers: { Authorization: `Bearer ${token}` } })
      await fetchRooms()
      setNewRoomName("")
    } catch (error) {
      console.error(error)
      return new NextResponse("Something went wrong", { status: 500 })
    }
  }

  const handleDeleteRoom = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${HTTP_URL}/room/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchRooms()
    } catch (error) {
      console.error(error)
      return new NextResponse("Something went wrong", { status: 500 })
    }
  }

  const handleShare = async (roomId: number) => {
    const roomUrl = `${window.location.origin}/room/${roomId}`
    console.log("Trying to copy:", roomUrl)
    try {
      await navigator.clipboard.writeText(roomUrl)
      alert(`✅ Room URL copied: ${roomUrl}`)
    } catch (error) {
      console.error(error)
      return new NextResponse("Something went wrong", { status: 500 })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-violet-500/25 via-violet-500/8 to-transparent rounded-t-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-radial from-violet-400/15 via-violet-500/5 to-transparent rounded-t-full blur-2xl"></div>
      {/* Subtle grid lines */}
      <div className="absolute bottom-0 left-0 right-0 h-[60vh] opacity-15">
        <div className="absolute inset-0 bg-grid-pattern mask-gradient-bottom"></div>
      </div>

      <div className="relative z-10 p-8 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto space-y-12"
        >
          {/* Header */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-6xl md:text-7xl font-thin text-metallic leading-tight font-devanagari p-2">Your Gallery</h1>
            <p className="text-xl font-light max-w-2xl mx-auto">
              Manage your creative spaces and collaborate with your team
            </p>
          </motion.div>

          {/* Create Room Section */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-thin text-metallic mb-6">Create New Canvas</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  className="w-full bg-gray-800/50 text-metallic placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-3 font-light focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter canvas name"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
                <motion.button
                  onClick={handleCreateRoom}
                  className="bg-violet-800 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-light transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!newRoomName.trim()}
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

          </motion.div>

          {/* Room Grid */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  className="flex justify-center items-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 text-violet-800 animate-spin" />
                </motion.div>
              ) : rooms.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      className="group relative bg-gray-900/20 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      layout
                    >
                      {/* Canvas preview area */}
                      <div className="inset-0 bg-cover bg-center bg-no-repeat filter h-32  rounded-xl mb-4 border border-gray-700/50 flex items-center justify-center"
                      style={{
                        backgroundImage: "url('https://i.pinimg.com/736x/25/cc/1b/25cc1b47ef2eed4310736146d083f316.jpg')"}}>
                      </div>

                      {/* Room info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-thin truncate">{room.slug}</h3>
                            <p className="text-sm text-metallic-subtle font-light">Canvas #{room.id}</p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleShare(room.id)
                              }}
                              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Share Canvas"
                            >
                              <Share2 className="w-4 h-4 text-metallic-subtle" />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteRoom(room.id)
                              }}
                              className="p-2 rounded-lg bg-gray-800/50 hover:bg-violet-500/20 border border-gray-700 hover:border-violet-500/30 transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="h-4 w-4 text-metallic-subtle hover:text-violet-400" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Enter canvas button */}
                        <motion.button
                          onClick={() => router.push(`/canvas/${room.id}`)}
                          className="w-full bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300 py-3 rounded-xl font-light transition-all duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <PenTool className="h-4 w-4" />
                          Enter Canvas
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <PenTool className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-xl font-light">No canvases yet. Create your first one!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
