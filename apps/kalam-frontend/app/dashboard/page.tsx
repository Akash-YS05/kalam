"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Loader2, Share2, PenTool } from "lucide-react"
import axios from "axios"
import { HTTP_URL } from "@/config"
import { useRouter } from "next/navigation"

interface Room {
  id: number
  slug: string
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  const fetchRooms = useCallback(async () => {
    try {
      const res = await axios.get<{ rooms: Room[] }>(`${HTTP_URL}/room`)
      setRooms(res.data.rooms ?? [])
    } catch (err) {
      console.error("Failed to fetch rooms", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Combined auth check and data fetch to avoid race condition
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/signin")
      return
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`
    setIsAuthenticated(true)
    fetchRooms()
  }, [router, fetchRooms])

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return

    const optimisticRoom = {
      id: Date.now(), // Temporary ID
      slug: newRoomName.trim()
    }
    
    // Optimistic update - add to UI immediately
    setRooms(prev => [optimisticRoom, ...prev])
    setNewRoomName("")

    try {
      const res = await axios.post<{ roomId: number }>(`${HTTP_URL}/room`, { name: newRoomName.trim() })
      // Update with real ID from server
      setRooms(prev => prev.map(room => 
        room.id === optimisticRoom.id 
          ? { ...room, id: res.data.roomId }
          : room
      ))
    } catch (error) {
      // Revert on error
      setRooms(prev => prev.filter(room => room.id !== optimisticRoom.id))
      console.error("Create room failed", error)
    }
  }

  const handleDeleteRoom = async (id: number) => {
    const previousRooms = rooms
    
    // Optimistic update - remove from UI immediately
    setRooms(prev => prev.filter(r => r.id !== id))

    try {
      await axios.delete(`${HTTP_URL}/room/${id}`)
    } catch (error) {
      // Revert on error
      setRooms(previousRooms)
      console.error("Delete room failed", error)
    }
  }

  const handleShare = async (roomId: number) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/room/${roomId}`
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="relative z-10 p-8 pt-16 max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <h1 className="text-6xl font-thin">Your Gallery</h1>
          <p className="text-xl font-light">
            Manage your creative spaces
          </p>
        </motion.div>

        {/* Create */}
        <div className="max-w-2xl mx-auto bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
          <div className="flex gap-4">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              placeholder="Canvas name"
              className="flex-1 bg-gray-800 rounded-xl px-4 py-3 outline-none"
            />
            <button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim()}
              className="bg-violet-700 px-6 rounded-xl disabled:opacity-50"
            >
              <Plus />
            </button>
          </div>
        </div>

        {/* Grid */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-violet-500" />
          </div>
        )}

        {!isLoading && rooms.length === 0 && (
          <p className="text-center py-12 text-gray-400">
            No canvases yet
          </p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-900/20 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="h-32 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 mb-4" />

              <h3 className="text-xl font-thin truncate">{room.slug}</h3>
              <p className="text-sm text-gray-400 mb-4">
                Canvas #{room.id}
              </p>

              <div className="flex justify-between gap-2">
                <button
                  onClick={() => router.push(`/canvas/${room.id}`)}
                  className="flex-1 bg-violet-500/10 border border-violet-500/30 rounded-xl py-2"
                >
                  <PenTool className="inline mr-2 h-4 w-4" />
                  Enter
                </button>

                <button onClick={() => handleShare(room.id)}>
                  <Share2 />
                </button>

                <button onClick={() => handleDeleteRoom(room.id)}>
                  <Trash2 />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
