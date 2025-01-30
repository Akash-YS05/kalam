"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

const initialRooms = [
  { id: 1, name: "Project Brainstorm", lastEdited: "2023-07-01", participants: 5 },
  { id: 2, name: "Weekly Team Meeting", lastEdited: "2023-06-28", participants: 8 },
  { id: 3, name: "Product Design Review", lastEdited: "2023-06-25", participants: 4 },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

export default function Dashboard() {
  const [rooms, setRooms] = useState(initialRooms)
  const [newRoomName, setNewRoomName] = useState("")

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      const newRoom = {
        id: rooms.length + 1,
        name: newRoomName,
        lastEdited: new Date().toISOString().split("T")[0],
        participants: 1,
      }
      setRooms([...rooms, newRoom])
      setNewRoomName("")
    }
  }

  const handleDeleteRoom = (id: number) => {
    setRooms(rooms.filter((room) => room.id !== id))
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto space-y-8"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-4xl font-bold tracking-tight"
        >
          Your Kalam Rooms
        </motion.h1>

        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Create a New Room</h2>
            <p className="text-muted-foreground">
              Start a new collaborative whiteboard session
            </p>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label
                htmlFor="new-room-name"
                className="text-sm font-medium"
              >
                Room Name
              </label>
              <input
                id="new-room-name"
                className="w-full px-3 py-2 bg-background/50 backdrop-blur-sm border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 
                       focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                       transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Room
            </button>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                variants={itemVariants}
                layout
                className="glass-card rounded-xl overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">{room.name}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Last edited: {room.lastEdited}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {room.participants} participant(s)
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-border/50 px-6 py-4 flex justify-between">
                  {/* <Link
                    to={`/room/${room.id}`}
                    className="text-primary hover:opacity-80 font-medium flex items-center gap-2
                             transition-all duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Link> */}
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-destructive hover:opacity-80 font-medium flex items-center gap-2
                             transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}