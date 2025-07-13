import { useState, useRef, useEffect, ReactNode } from "react"
import { Circle, RectangleHorizontal, Sun, Moon, Home, LogOut, Eraser, PencilLine, ArrowRightLeft, EqualApproximately, Undo } from "lucide-react"
import { Game } from "@/draw/Game";
import { useRouter } from "next/navigation";

export type Tool = "pencil" | "rect" | "circle" | "line" | "arrow" | "eraser"

function IconButton({
  onClick,
  activated,
  icon,
}: {
  onClick: () => void;
  activated: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-1 px-2 rounded-md transition-colors duration-150
        ${activated
          ? "bg-indigo-500 text-white"
          : "bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white"
        }
        hover:bg-indigo-400 hover:text-white`}
    >
      {icon}
    </button>
  );
}


function Topbar({
  selectedTool,
  setSelectedTool,
  isDarkMode,
  toggleTheme,
  handleUndo
}: {
  selectedTool: Tool
  setSelectedTool: (s: Tool) => void
  isDarkMode: boolean
  toggleTheme: () => void
  handleUndo: () => void
}) {
  const router = useRouter();
  return (
    <div className="fixed top-9 left-10">
<div className="flex gap-4 p-2 border border-indigo-600 rounded-md bg-neutral-50 dark:bg-zinc-900">
<IconButton
          onClick={() => setSelectedTool("pencil")}
          activated={selectedTool === "pencil"}
          icon={<EqualApproximately />}
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
        <IconButton
          onClick={() => setSelectedTool("line")}
          activated={selectedTool === "line"}
          icon={<PencilLine />}
        />
        <IconButton
          onClick={() => setSelectedTool("arrow")}
          activated={selectedTool === "arrow"}
          icon={<ArrowRightLeft />}
        />
        <IconButton
          onClick={() => setSelectedTool("eraser")}
          activated={selectedTool === "eraser"}
          icon={<Eraser />}
        />
        <IconButton
          onClick={() => handleUndo()}
          icon={<Undo />}
          activated={false} // Undo button doesn't have an activated state
        />
        {/* <Undo onClick={() => handleUndo()} className="p-1 hover:bg-gray-700 cursor-pointer" /> */}
        
        <IconButton onClick={toggleTheme} activated={false} icon={isDarkMode ? <Sun /> : <Moon />} />
      </div>

      <div className="fixed flex gap-4 top-9 right-10 px-2 py-1 border border-indigo-600 rounded-md bg-neutral-50 dark:bg-zinc-900 shadow-md justify-end">
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white hover:bg-indigo-500 hover:text-white transition-colors"
        >
          <Home />
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white hover:bg-indigo-500 hover:text-white transition-colors"
        >
          <LogOut />
        </button>
      </div>


    </div>
  )
}

export default function Canvas({ roomId, socket }: { roomId: string; socket: WebSocket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game>() 
  const [selectedTool, setSelectedTool] = useState<Tool>("rect")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.classList.toggle("dark", savedTheme);
  }, []);
  


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
  }, [canvasRef, roomId, socket])

  const handleUndo = () => {
    game?.undo();
  }


  return (
    <>
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleUndo={handleUndo} />
        <canvas
          ref={canvasRef}
          height={window.innerHeight}
          width={window.innerWidth}
          style={{
            backgroundColor: isDarkMode ? '#0f0f0f' : '#fafcfa', // Dark: zinc-900, Light: neutral-50
          }}        
        />
    </>
  )
}
