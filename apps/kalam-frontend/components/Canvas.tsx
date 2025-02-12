import { useState, useRef, useEffect, ReactNode } from "react"
import { Circle, Pencil, RectangleHorizontal, Sun, Moon, Home, LogOut } from "lucide-react"
import { Game } from "@/draw/Game";
import { useRouter } from "next/navigation";

export type Tool = "pencil" | "rect" | "circle"

function IconButton({ onClick, activated, icon }: { onClick: () => void; activated: boolean; icon: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md ${activated ? "bg-gray-200 dark:bg-gray-700" : ""} hover:bg-gray-100 dark:hover:bg-gray-600`}
    >
      {icon}
    </button>
  )
}

function Topbar({
  selectedTool,
  setSelectedTool,
  isDarkMode,
  toggleTheme,
}: {
  selectedTool: Tool
  setSelectedTool: (s: Tool) => void
  isDarkMode: boolean
  toggleTheme: () => void
}) {
  const router = useRouter();
  return (
    <div className="fixed top-10 left-10">
      <div className="flex gap-4 p-3 border-2 border-indigo-600 rounded-md bg-gray-100 dark:bg-gray-900">
        <IconButton
          onClick={() => setSelectedTool("pencil")}
          activated={selectedTool === "pencil"}
          icon={<Pencil />}
        />
        <IconButton
          onClick={() => setSelectedTool("rect")}
          activated={selectedTool === "rect"}
          icon={<RectangleHorizontal />}
        />
        <IconButton
          onClick={() => setSelectedTool("circle")}
          activated={selectedTool === "circle"}
          icon={<Circle />}
        />
        <IconButton onClick={toggleTheme} activated={false} icon={isDarkMode ? <Sun /> : <Moon />} />
      </div>
      <div className="fixed flex gap-4 top-10 right-10 p-3 border-2 border-indigo-600 rounded-md bg-gray-100 dark:bg-gray-900 justify-end">
        <button onClick={() => router.push('/')} className="hover:bg-gray-500 p-2 rounded"><Home/></button>
        <button onClick={() => router.push('/dashboard')} className="hover:bg-gray-500 p-2 rounded"><LogOut/></button>
      </div>
    </div>
  )
}

export default function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game>() // Reference to Game class
  const [selectedTool, setSelectedTool] = useState<Tool>("rect")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark"
  })

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev
      document.body.classList.toggle("dark", newMode)
      localStorage.setItem("theme", newMode ? "dark" : "light")
      return newMode
    })
  }

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    game?.setTool(selectedTool)
  }, [selectedTool, game])

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket)
      setGame(g)

      return () => {
        g.destroy()
      }
    }
  }, [canvasRef])

  return (
    <>
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth} className={`${isDarkMode ? "bg-gray-900" : "bg-white"}`}></canvas>
    </>
  )
}
