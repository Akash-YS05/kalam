import { initDraw } from '@/draw';
import React, { useEffect, useRef, useState } from 'react'
import IconButton from './IconButton';
import { Circle, Pencil, RectangleHorizontal } from 'lucide-react';
import { Game } from '@/draw/Game';

export type Tool = 'pencil' | 'rect' | 'circle';

export default function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}) {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [game, setGame] = useState<Game>()  //reference to Game class
    const [selectedTool, setSelectedTool] = useState<Tool>('rect')

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

    return <div className='h-screen overflow-hidden'>
        <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth}></canvas>
        <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
    </div>
  
}

function Topbar({selectedTool, setSelectedTool} : {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}){
    return <div className='fixed top-10 left-10'>
        <div className='flex gap-4'>
            <IconButton onClick={() =>{
                setSelectedTool('pencil')
            }} activated={selectedTool === "pencil"} icon={<Pencil/>}/>
            <IconButton onClick={() =>{
                setSelectedTool('rect')
            }} activated={selectedTool === "rect"} icon={<RectangleHorizontal/>}/>
            <IconButton onClick={() =>{
                setSelectedTool('circle')
            }} activated={selectedTool === "circle"} icon={<Circle/>}/>
        </div>
    </div>
}
