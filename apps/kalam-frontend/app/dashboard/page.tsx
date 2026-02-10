"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Loader2, Share2, PenTool, LogOut } from "lucide-react"
import axios from "axios"
import { HTTP_URL } from "@/config"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useBackendToken } from "@/hooks/useBackendToken"

interface Room {
  id: number
  slug: string
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const router = useRouter()
  
  const { data: session, status: sessionStatus } = useSession()
  const { token, isLoading: isTokenLoading, error: tokenError } = useBackendToken()

  const fetchRooms = useCallback(async () => {
    if (!token) return
    
    try {
      const res = await axios.get<{ rooms: Room[] }>(`${HTTP_URL}/room`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRooms(res.data.rooms ?? [])
    } catch (err) {
      console.error("Failed to fetch rooms", err)
    } finally {
      setIsLoadingRooms(false)
    }
  }, [token])

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin")
    }
  }, [sessionStatus, router])

  // Fetch rooms when token is ready
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
      fetchRooms()
    }
  }, [token, fetchRooms])

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !token) return

    const optimisticRoom = {
      id: Date.now(), // Temporary ID
      slug: newRoomName.trim()
    }
    
    // Optimistic update - add to UI immediately
    setRooms(prev => [optimisticRoom, ...prev])
    setNewRoomName("")

    try {
      const res = await axios.post<{ roomId: number }>(
        `${HTTP_URL}/room`, 
        { name: newRoomName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
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
    if (!token) return
    
    const previousRooms = rooms
    
    // Optimistic update - remove from UI immediately
    setRooms(prev => prev.filter(r => r.id !== id))

    try {
      await axios.delete(`${HTTP_URL}/room/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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

  const handleSignOut = async () => {
    // Clear both old and new token keys
    localStorage.removeItem("backend_token")
    localStorage.removeItem("token")
    await signOut({ callbackUrl: "/signin" })
  }

  // Show loading state while session or token is loading
  if (sessionStatus === "loading" || isTokenLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-violet-500 h-8 w-8" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if token fetch failed
  if (tokenError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Failed to authenticate: {tokenError}</p>
          <button
            onClick={() => router.push("/signin")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg"
          >
            Sign In Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="relative z-10 p-8 pt-16 max-w-6xl mx-auto space-y-12">

        {/* Header with user info and sign out */}
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
          {session?.user && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-gray-400">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
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
        {isLoadingRooms && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-violet-500" />
          </div>
        )}

        {!isLoadingRooms && rooms.length === 0 && (
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
