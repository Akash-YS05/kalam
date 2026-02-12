import { useState, useRef, useEffect, useCallback } from "react"
import { Circle, RectangleHorizontal, Sun, Moon, Home, LogOut, Eraser, PencilLine, ArrowRightLeft, Pencil, Undo } from "lucide-react"
import { Game } from "@/draw/Game";
import { useRouter } from "next/navigation";
import { Shape } from "@/draw/http";

export type Tool = "pencil" | "rect" | "circle" | "line" | "arrow" | "eraser"

// Tool configuration for cleaner code
const TOOLS: { tool: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: "pencil", icon: <Pencil size={20} />, label: "Pencil", shortcut: "P" },
  { tool: "rect", icon: <RectangleHorizontal size={20} />, label: "Rectangle", shortcut: "R" },
  { tool: "circle", icon: <Circle size={20} />, label: "Circle", shortcut: "C" },
  { tool: "line", icon: <PencilLine size={20} />, label: "Line", shortcut: "L" },
  { tool: "arrow", icon: <ArrowRightLeft size={20} />, label: "Arrow", shortcut: "A" },
  { tool: "eraser", icon: <Eraser size={20} />, label: "Eraser", shortcut: "E" },
];

function IconButton({
  onClick,
  activated,
  icon,
  tooltip,
  shortcut,
}: {
  onClick: () => void;
  activated: boolean;
  icon: React.ReactNode;
  tooltip?: string;
  shortcut?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip ? `${tooltip}${shortcut ? ` (${shortcut})` : ''}` : undefined}
      className={`p-2 rounded-lg transition-all duration-200 relative group
        ${activated
          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }
        hover:scale-105 active:scale-95`}
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
    <>
      {/* Main toolbar - centered at top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg">
          {TOOLS.map(({ tool, icon, label, shortcut }) => (
            <IconButton
              key={tool}
              onClick={() => setSelectedTool(tool)}
              activated={selectedTool === tool}
              icon={icon}
              tooltip={label}
              shortcut={shortcut}
            />
          ))}
          
          {/* Divider */}
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          
          <IconButton
            onClick={handleUndo}
            icon={<Undo size={20} />}
            activated={false}
            tooltip="Undo"
            shortcut="Ctrl+Z"
          />
          
          <IconButton
            onClick={toggleTheme}
            activated={false}
            icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            tooltip={isDarkMode ? "Light mode" : "Dark mode"}
          />
        </div>
      </div>

      {/* Navigation buttons - top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => router.push('/')}
          title="Home"
          className="p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
        >
          <Home size={20} />
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          title="Dashboard"
          className="p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
        >
          <LogOut size={20} />
        </button>
      </div>
    </>
  )
}

export default function Canvas({ 
  roomId, 
  socket, 
  initialShapes 
}: { 
  roomId: string; 
  socket: WebSocket;
  initialShapes: Shape[];
}) {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null)
  const activeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Game>() 
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.classList.toggle("dark", savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev
      document.body.classList.toggle("dark", newMode)
      localStorage.setItem("theme", newMode ? "dark" : "light")
      // Re-render canvas with new theme
      game?.clearCanvas();
      return newMode
    })
  }, [game]);

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
    if (staticCanvasRef.current && activeCanvasRef.current) {
      const g = new Game(staticCanvasRef.current, activeCanvasRef.current, roomId, socket, initialShapes)
      setGame(g)

      return () => {
        g.destroy()
      }
    }
  }, [roomId, socket, initialShapes])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (staticCanvasRef.current && activeCanvasRef.current) {
        staticCanvasRef.current.width = window.innerWidth;
        staticCanvasRef.current.height = window.innerHeight;
        activeCanvasRef.current.width = window.innerWidth;
        activeCanvasRef.current.height = window.innerHeight;
        game?.clearCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [game]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        game?.undo();
        return;
      }
      
      // Tool shortcuts
      const key = e.key.toLowerCase();
      switch (key) {
        case 'p': setSelectedTool('pencil'); break;
        case 'r': setSelectedTool('rect'); break;
        case 'c': setSelectedTool('circle'); break;
        case 'l': setSelectedTool('line'); break;
        case 'a': setSelectedTool('arrow'); break;
        case 'e': setSelectedTool('eraser'); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game]);

  const handleUndo = useCallback(() => {
    game?.undo();
  }, [game]);

  // Get cursor style based on selected tool
  const getCursorStyle = () => {
    switch (selectedTool) {
      case 'pencil': return 'crosshair';
      case 'eraser': return 'crosshair';
      case 'rect': 
      case 'circle':
      case 'line':
      case 'arrow':
        return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Topbar 
        selectedTool={selectedTool} 
        setSelectedTool={setSelectedTool} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        handleUndo={handleUndo} 
      />
      
      {/* Canvas container */}
      <div className="absolute inset-0">
        {/* Static layer - for committed shapes */}
        <canvas
          ref={staticCanvasRef}
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: isDarkMode ? '#0a0a0a' : '#fafafa',
          }}        
        />
        {/* Active layer - for shape being drawn (transparent overlay) */}
        <canvas
          ref={activeCanvasRef}
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          className="absolute inset-0 z-10"
          style={{
            backgroundColor: 'transparent',
            cursor: getCursorStyle(),
          }}        
        />
      </div>
    </div>
  )
}
