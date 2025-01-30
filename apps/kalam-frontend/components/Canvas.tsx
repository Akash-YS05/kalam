import { useState, useRef, useEffect } from "react"
import { Circle, Pencil, RectangleHorizontal, Sun, Moon } from "lucide-react"
import { Game } from "@/draw/Game";

export type Tool = "pencil" | "rect" | "circle"

function IconButton({ onClick, activated, icon }: { onClick: () => void; activated: boolean; icon: any }) {
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
  return (
    <div className="fixed top-10 left-10">
      <div className="flex gap-4">
        <IconButton
          onClick={() => {
            setSelectedTool("pencil")
          }}
          activated={selectedTool === "pencil"}
          icon={<Pencil />}
        />
        <IconButton
          onClick={() => {
            setSelectedTool("rect")
          }}
          activated={selectedTool === "rect"}
          icon={<RectangleHorizontal />}
        />
        <IconButton
          onClick={() => {
            setSelectedTool("circle")
          }}
          activated={selectedTool === "circle"}
          icon={<Circle />}
        />
        <IconButton onClick={toggleTheme} activated={false} icon={isDarkMode ? <Sun /> : <Moon />} />
      </div>
    </div>
  )
}

export default function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}) {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [game, setGame] = useState<Game>()  //reference to Game class
    const [selectedTool, setSelectedTool] = useState<Tool>('rect')
    const [isDarkMode, setIsDarkMode] = useState(false)

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev)
        document.body.classList.toggle("dark")
    }

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game])

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);   
            
            return () => {
                g.destroy();
        }
                
    }

}, [canvasRef])

  return (
    <>
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
        className={`${isDarkMode ? "bg-gray-900" : "bg-white"}`}
      ></canvas>
    </>
  )
}


