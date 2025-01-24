"use client";

import { initDraw } from "@/draw";
import { useEffect, useRef } from "react"

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {

        if (canvasRef.current) {
            
            initDraw(canvasRef.current);
            
        }

    })
    return (
        <canvas ref={canvasRef} height={1000} width={2000}></canvas>
    )
}