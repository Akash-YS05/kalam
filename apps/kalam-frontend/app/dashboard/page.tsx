"use client"

interface Room {
  id: number
  slug: string
}

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import axios from "axios"
import { HTTP_URL } from "@/config"

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")

  const fetchRooms = async() => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get<Room[]>(`${HTTP_URL}/room`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      //@ts-ignore
      setRooms(response.data.rooms || response.data)
    } catch(err: any) {
      console.error("Error fetching rooms:", err.response?.data || err.message);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, [])

  const handleCreateRoom = async() => {
    if (!newRoomName.trim()) return;
      try {

        const token = localStorage.getItem("token")

        const response = await axios.post(`${HTTP_URL}/room`, {
          name: newRoomName
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        console.log("Created room response:", response.data);

        await fetchRooms()
        setNewRoomName("")

      } catch (err: any) {
        console.error("Create room error:", err.response?.data || err.message)
    }
  
}

  const handleDeleteRoom = (id: number) => {
    setRooms(rooms.filter((room) => room.id !== id))
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <motion.div className="max-w-7xl mx-auto space-y-8">
        <motion.h1 className="text-4xl font-bold">Your Kalam Rooms</motion.h1>

        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold">Create a New Room</h2>
          <div className="flex gap-4 mt-3">
            <input
              className="border p-2 rounded w-full"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
            />
            <button onClick={handleCreateRoom} className="bg-indigo-600 text-white px-4 py-2 rounded">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
          {rooms.length > 0 ? (
              rooms.map((room) => (
                <motion.div key={room.id} className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold">{room.slug}</h3> {/* ✅ Show correct field */}
                  <p className="text-sm text-muted-foreground">Slug: {room.slug}</p>
                  <p className="text-sm text-muted-foreground">ID: {room.id}</p>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500">No rooms available.</p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}