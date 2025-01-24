"use client";

import { useEffect, useRef } from "react"

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {

        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) {

                return;
            }

            ctx.strokeRect(20, 20, 100, 100);
        }

    })
    return (
        <canvas ref={canvasRef} height={1000} width={1000}></canvas>
    )
}