"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import { HTTP_URL } from "@/config";

interface Room {
  id: number;
  slug: string;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<{ rooms: Room[] }>(`${HTTP_URL}/room`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.rooms || []);
    } catch (err: any) {
      console.error("Error fetching rooms:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${HTTP_URL}/room`,
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRooms();
      setNewRoomName("");
    } catch (err: any) {
      console.error("Create room error:", err.response?.data || err.message);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${HTTP_URL}/room/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRooms();
    } catch (err: any) {
      console.error("Delete room error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-8"
      >
        {/* Title */}
        <motion.h1
          className="text-5xl font-extrabold text-white text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Your Kalam Rooms
        </motion.h1>

        {/* Create Room Section */}
        <motion.div
          className="backdrop-blur-md  p-8 rounded-md shadow-xl border border-indigo-800"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Create a New Room</h2>
          <div className="flex gap-4">
            <input
              className="bg-gray-800 text-white placeholder-gray-400 border-0 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
            />
            <motion.button
              onClick={handleCreateRoom}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-6 w-6" />
            </motion.button>
          </div>
        </motion.div>

        {/* Room List */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                className="col-span-full flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              </motion.div>
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <motion.div
                  key={room.id}
                  className="relative p-6 rounded-md shadow-lg backdrop-blur-xl border border-white/10
                  bg-gradient-to-r from-gray-900/40 to-gray-800/50 hover:bg-gray-800/80
                  transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="absolute inset-0 rounded-xl border border-purple-600 opacity-20 group-hover:opacity-50 transition-all duration-300"></div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{room.slug}</h3>
                  <p className="text-sm text-gray-400 mb-1">Slug: {room.slug}</p>
                  <p className="text-sm text-gray-400 mb-4">ID: {room.id}</p>
                  <motion.button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-400 hover:text-red-300 flex items-center gap-2 transition duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </motion.button>
                </motion.div>
              ))
            ) : (
              <motion.p
                className="text-gray-400 col-span-full text-center text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                No rooms available. Create your first room!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
