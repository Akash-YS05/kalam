import { useState, useRef, useEffect, useCallback } from "react"
import { Circle, RectangleHorizontal, Sun, Moon, Home, LogOut, Eraser, PencilLine, ArrowRightLeft, Pencil, Undo, Hand, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Game } from "@/draw/Game";
import { useRouter } from "next/navigation";
import { Shape } from "@/draw/http";

export type Tool = "pencil" | "rect" | "circle" | "line" | "arrow" | "eraser" | "pan"

// Preset colors for quick selection
const COLORS = [
  "#ffffff", // White
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#000000", // Black
];

// Stroke width options
const STROKE_WIDTHS = [1, 2, 4, 6, 8];

// Tool configuration for cleaner code
const TOOLS: { tool: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { tool: "pencil", icon: <Pencil size={20} />, label: "Pencil", shortcut: "P" },
  { tool: "rect", icon: <RectangleHorizontal size={20} />, label: "Rectangle", shortcut: "R" },
  { tool: "circle", icon: <Circle size={20} />, label: "Circle", shortcut: "C" },
  { tool: "line", icon: <PencilLine size={20} />, label: "Line", shortcut: "L" },
  { tool: "arrow", icon: <ArrowRightLeft size={20} />, label: "Arrow", shortcut: "A" },
  { tool: "eraser", icon: <Eraser size={20} />, label: "Eraser", shortcut: "E" },
  { tool: "pan", icon: <Hand size={20} />, label: "Pan", shortcut: "Space" },
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
  handleUndo,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: {
  selectedTool: Tool
  setSelectedTool: (s: Tool) => void
  isDarkMode: boolean
  toggleTheme: () => void
  handleUndo: () => void
  strokeColor: string
  setStrokeColor: (color: string) => void
  strokeWidth: number
  setStrokeWidth: (width: number) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
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

      {/* Color and stroke width panel - left side */}
      <div className="fixed top-1/2 -translate-y-1/2 left-4 z-50">
        <div className="flex flex-col gap-3 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg">
          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 px-1">Color</span>
            <div className="grid grid-cols-3 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-6 h-6 rounded-md border-2 transition-all duration-150 hover:scale-110 ${
                    strokeColor === color 
                      ? 'border-indigo-500 scale-110' 
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
          
          {/* Stroke width */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 px-1">Size</span>
            <div className="flex flex-col gap-1">
              {STROKE_WIDTHS.map((width) => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`flex items-center justify-center h-7 rounded-md transition-all duration-150 ${
                    strokeWidth === width
                      ? 'bg-indigo-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title={`${width}px`}
                >
                  <div 
                    className={`rounded-full ${strokeWidth === width ? 'bg-white' : 'bg-zinc-600 dark:bg-zinc-300'}`}
                    style={{ width: width + 4, height: width + 4 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls - bottom center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg">
          <IconButton
            onClick={onZoomOut}
            icon={<ZoomOut size={18} />}
            activated={false}
            tooltip="Zoom out"
            shortcut="-"
          />
          <span className="px-2 min-w-[60px] text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            onClick={onZoomIn}
            icon={<ZoomIn size={18} />}
            activated={false}
            tooltip="Zoom in"
            shortcut="+"
          />
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <IconButton
            onClick={onResetView}
            icon={<RotateCcw size={18} />}
            activated={false}
            tooltip="Reset view"
            shortcut="0"
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
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(1);
  const previousToolRef = useRef<Tool>("pencil");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.classList.toggle("dark", savedTheme);
    // Set initial stroke color based on theme
    setStrokeColor(savedTheme ? "#ffffff" : "#000000");
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

  // Sync stroke color with game
  useEffect(() => {
    game?.setStrokeColor(strokeColor)
  }, [strokeColor, game])

  // Sync stroke width with game
  useEffect(() => {
    game?.setStrokeWidth(strokeWidth)
  }, [strokeWidth, game])

  useEffect(() => {
    if (staticCanvasRef.current && activeCanvasRef.current) {
      const g = new Game(staticCanvasRef.current, activeCanvasRef.current, roomId, socket, initialShapes)
      setGame(g)
      
      // Set up zoom change callback
      g.setOnZoomChange((newZoom) => {
        setZoom(newZoom);
      });

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
      
      // Space for temporary pan mode
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        previousToolRef.current = selectedTool;
        setSelectedTool('pan');
        return;
      }
      
      // Zoom shortcuts
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handleResetView();
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
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space to go back to previous tool
      if (e.key === ' ') {
        e.preventDefault();
        setSelectedTool(previousToolRef.current);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game, selectedTool]);

  const handleUndo = useCallback(() => {
    game?.undo();
  }, [game]);

  const handleZoomIn = useCallback(() => {
    if (game) {
      game.setZoom(game.getScale() * 1.2);
    }
  }, [game]);

  const handleZoomOut = useCallback(() => {
    if (game) {
      game.setZoom(game.getScale() / 1.2);
    }
  }, [game]);

  const handleResetView = useCallback(() => {
    game?.resetView();
  }, [game]);

  // Get cursor style based on selected tool
  const getCursorStyle = () => {
    switch (selectedTool) {
      case 'pan': return 'grab';
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
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
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
