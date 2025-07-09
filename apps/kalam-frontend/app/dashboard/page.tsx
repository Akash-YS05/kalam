"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Share2, PenTool } from "lucide-react";
import axios from "axios";
import { HTTP_URL } from "@/config";
import { useRouter } from "next/navigation";
import { NextResponse } from "next/server";

interface Room {
  id: number;
  slug: string;
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      
      if (!token) {
        console.error("No token found");
        setRooms([]);
        return;
      }
      
      const response = await axios.get<{ rooms: Room[] }>(`${HTTP_URL}/room`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
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
    } catch (error) {
      console.error(error);
      return new NextResponse("Something went wrong", { status: 500 });
  }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      //todo: delete room
      await axios.delete(`${HTTP_URL}/room/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRooms();
    } catch (error) {
      console.error(error);
      return new NextResponse("Something went wrong", { status: 500 });
  }
  };

  const handleShare = async (roomId: number) => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
  
    console.log("Trying to copy:", roomUrl); // Debugging
  
    try {
      await navigator.clipboard.writeText(roomUrl);
      alert(`✅ Room URL copied: ${roomUrl}`);
    } catch (error) {
      console.error(error);
      return new NextResponse("Something went wrong", { status: 500 });
  }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-8 font-display">
     
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-8"
      >
       

        {/* Title */}
        <motion.h1
        
          className="text-5xl font-extrabold text-white text-center mb-12 font-[Gotu]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Your Gallery
        </motion.h1>

        {/* Create Room Section */}
        <motion.div
          className="backdrop-blur-md  p-8 rounded-md shadow-xl border border-indigo-800"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 font-[Gotu]">Create a New Room</h2>
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
          
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </motion.div>
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <motion.div
                  key={room.id}
                  className="relative p-8 rounded-md shadow-2xl overflow-hidden
                             transition-all duration-300 transform hover:-translate-y-2 hover:shadow-3xl group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[2px]"
                    style={{
                      backgroundImage: "url('https://i.pinimg.com/736x/25/cc/1b/25cc1b47ef2eed4310736146d083f316.jpg')",
                    }}
                  ></div>
                  {/* <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 group-hover:bg-opacity-30"></div> */}
                  <div className="relative z-10">
                    <div
                      
                      className="flex justify-between items-center mb-6"
                    >
                      <h3 className="text-2xl font-bold text-white mb-2 font-[Gotu] ">
                        {room.slug}
                      </h3>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShare(room.id)
                          }}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Share Room"
                        >
                          <Share2 className="w-5 h-5 text-white " />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRoom(room.id)
                          }}
                          className="p-2 rounded-lg bg-white/10 transition-colors duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="h-5 w-5 text-white group-hover:text-red-300" />
                        </motion.button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-200 mb-1">Slug: {room.slug}</p>
                    <p className="text-sm text-gray-200 mb-6">ID: {room.id}</p>

                    <motion.button
                      className=" pt-4 text-white items-center group-hover:text-indigo-300 transition-colors duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <button className="flex gap-2 items-center" onClick={() => router.push(`/canvas/${room.id}`)}>
                      <PenTool className="h-5 w-5" />
                      Enter Canvas
                      </button>
                      
                    </motion.button>
                  </div>
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
