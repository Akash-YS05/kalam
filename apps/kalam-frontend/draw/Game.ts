import { Tool } from "@/components/Canvas";

type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number,
    color?: string,
    strokeWidth?: number,
} | {
    type: "circle",
    centerX: number,
    centerY: number,
    radius: number,
    color?: string,
    strokeWidth?: number,
} | {
    type: "pencil",
    points: {x: number, y: number}[],
    color?: string,
    strokeWidth?: number,
} | {
    type: "line",
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isArrow: boolean,
    color?: string,
    strokeWidth?: number,
}

export class Game {

    // Static layer - for committed shapes (rarely redrawn)
    private staticCanvas: HTMLCanvasElement;
    private staticCtx: CanvasRenderingContext2D;
    
    // Active layer - for shape being drawn (frequently redrawn)
    private activeCanvas: HTMLCanvasElement;
    private activeCtx: CanvasRenderingContext2D;
    
    private existingShape: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "rect";
    private currentPencilShape: Shape | null = null;
    private undoHistory: Shape[][] = [];
    private eraserSize = 10;
    
    // For requestAnimationFrame optimization
    private animationFrameId: number | null = null;
    private needsStaticRender = false;
    private needsActiveRender = false;
    private pendingMouseEvent: { x: number, y: number } | null = null;
    
    // Zoom and pan state
    private scale = 1;
    private offsetX = 0;
    private offsetY = 0;
    private isPanning = false;
    private lastPanX = 0;
    private lastPanY = 0;
    
    // Stroke customization
    private strokeColor = "#ffffff";
    private strokeWidth = 2;
    
    // Callback for zoom changes
    private onZoomChange?: (scale: number) => void; 
    private safeSend(data: any) {
        if (this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error("Error sending message:", error);
                return false;
            }
        } else {
            console.warn("WebSocket not open. State:", this.socket.readyState, "Data:", data);
            
            return false;
        }
    }
    
    socket: WebSocket;
    
    constructor(
        staticCanvas: HTMLCanvasElement,
        activeCanvas: HTMLCanvasElement,
        roomId: string, 
        socket: WebSocket,
        initialShapes: Shape[] = []
    ) {
        this.staticCanvas = staticCanvas;
        this.staticCtx = staticCanvas.getContext('2d')!;
        this.activeCanvas = activeCanvas;
        this.activeCtx = activeCanvas.getContext('2d')!;
        
        this.existingShape = initialShapes;
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        
        // Set initial stroke color based on theme
        const isDark = document.body.classList.contains('dark');
        this.strokeColor = isDark ? "#ffffff" : "#000000";

        this.saveToUndoHistory();
        this.initHandlers();
        this.initPointerHandlers();
        this.initWheelHandler();
        this.renderStaticLayer();
    }

    destroy() {
        // Cancel any pending animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.activeCanvas.removeEventListener("pointerdown", this.pointerDownHandler);
        this.activeCanvas.removeEventListener("pointerup", this.pointerUpHandler);
        this.activeCanvas.removeEventListener("pointermove", this.pointerMoveHandler);
        this.activeCanvas.removeEventListener("pointerleave", this.pointerLeaveHandler);
        this.activeCanvas.removeEventListener("wheel", this.wheelHandler);
    }

    setTool(tool: "circle" | "rect" | "pencil" | "line" | "arrow" | "eraser" | "pan") {
        this.selectedTool = tool;
    }

    setEraserSize(size: number) {
        this.eraserSize = size;
    }
    
    setStrokeColor(color: string) {
        this.strokeColor = color;
    }
    
    setStrokeWidth(width: number) {
        this.strokeWidth = width;
    }
    
    getScale(): number {
        return this.scale;
    }
    
    setOnZoomChange(callback: (scale: number) => void) {
        this.onZoomChange = callback;
    }
    
    // Reset zoom and pan to default
    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.renderStaticLayer();
        this.clearActiveLayer();
        this.onZoomChange?.(this.scale);
    }
    
    // Zoom to a specific level
    setZoom(newScale: number) {
        const centerX = this.staticCanvas.width / 2;
        const centerY = this.staticCanvas.height / 2;
        
        // Clamp scale
        newScale = Math.max(0.1, Math.min(5, newScale));
        
        // Adjust offset to zoom towards center
        this.offsetX = centerX - (centerX - this.offsetX) * (newScale / this.scale);
        this.offsetY = centerY - (centerY - this.offsetY) * (newScale / this.scale);
        
        this.scale = newScale;
        this.renderStaticLayer();
        this.clearActiveLayer();
        this.onZoomChange?.(this.scale);
    }

    joinRoom() {
        this.safeSend({
            type: "join_room",
            roomId: this.roomId
        });
    }

    initHandlers() {
        this.socket.onopen = () => {
            console.log("WebSocket connected, readyState:", this.socket.readyState);
            this.joinRoom();
        };
    
        this.socket.onclose = (event) => {
            console.log("WebSocket closed:", {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });
        };
    
        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
    
            if (message.type === "chat") {
                const parsedShape = JSON.parse(message.message);
                if (parsedShape.undo) {
                    this.existingShape = parsedShape.shapes || [];
                } 
                else if (parsedShape.erased != null) {
                    this.existingShape = this.existingShape.filter((_, index) => 
                        !parsedShape.erased.includes(index));
                    this.saveToUndoHistory();
                } 
                else {
                    this.existingShape.push(parsedShape.shape);
                    this.saveToUndoHistory();
                }
                this.clearCanvas();
            } 
        }
    }

    saveToUndoHistory() {
        const shapesCopy = JSON.parse(JSON.stringify(this.existingShape));
        this.undoHistory.push(shapesCopy);
        
        if (this.undoHistory.length > 50) {
            this.undoHistory.shift();  //preventing memory issues
        }
    }

    undo() {
        if (this.undoHistory.length <= 1) {
            return;
        }
        
        this.undoHistory.pop();
        
        this.existingShape = JSON.parse(JSON.stringify(this.undoHistory[this.undoHistory.length - 1]));
        
        // broadcasting
        this.safeSend({
            type: "chat",
            message: { undo: true, shapes: this.existingShape },
            roomId: this.roomId
        });
        
        this.renderStaticLayer();
    }

    // Render static layer - only called when shapes are added/removed
    renderStaticLayer() {
        const ctx = this.staticCtx;
        const canvas = this.staticCanvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.body.classList.contains('dark');
        const bgColor = isDark ? '#0a0a0a' : '#fafafa'; 
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan transformation
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        this.existingShape.forEach((shape) => {
            // Use shape's color if available, otherwise use theme default
            ctx.strokeStyle = shape.color || (isDark ? "#ffffff" : "#000000");
            ctx.lineWidth = (shape.strokeWidth || 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (shape.type === "rect") {
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                ctx.beginPath();
                ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                ctx.stroke();
            } else if (shape.type === "pencil") {
                this.drawPathOnContext(ctx, shape.points, shape.strokeWidth || 2);
            } else if (shape.type === "line") {
                this.drawLineOnContext(ctx, shape.startX, shape.startY, shape.endX, shape.endY, shape.isArrow);
            }
        });
        
        ctx.restore();
    }

    // Clear active layer only
    clearActiveLayer() {
        this.activeCtx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);
    }

    // Render the shape currently being drawn on the active layer
    renderActiveShape(endX: number, endY: number) {
        this.clearActiveLayer();
        const ctx = this.activeCtx;
        
        // Apply zoom and pan transformation (same as static layer)
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Use current stroke settings
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.selectedTool === "pencil" && this.currentPencilShape && this.currentPencilShape.type === "pencil") {
            this.drawPathOnContext(ctx, this.currentPencilShape.points, this.strokeWidth);
        } else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            this.drawLineOnContext(ctx, this.startX, this.startY, endX, endY, this.selectedTool === "arrow");
        } else if (this.selectedTool === "rect") {
            const width = endX - this.startX;
            const height = endY - this.startY;
            ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "circle") {
            const width = endX - this.startX;
            const height = endY - this.startY;
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // Schedule a render using requestAnimationFrame
    scheduleRender() {
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.animationFrameId = null;
                
                if (this.needsStaticRender) {
                    this.renderStaticLayer();
                    this.needsStaticRender = false;
                }
                
                if (this.needsActiveRender && this.pendingMouseEvent) {
                    this.renderActiveShape(this.pendingMouseEvent.x, this.pendingMouseEvent.y);
                    this.needsActiveRender = false;
                }
            });
        }
    }

    // Legacy method for compatibility - triggers static layer render
    clearCanvas() {
        this.renderStaticLayer();
        this.clearActiveLayer();
    }

    // Draw smooth path using quadratic bezier curves
    drawPathOnContext(ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], lineWidth: number = 2) {
        if (points.length < 2) return;
        
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        ctx.moveTo(points[0].x, points[0].y);
        
        if (points.length === 2) {
            // Just two points, draw a straight line
            ctx.lineTo(points[1].x, points[1].y);
        } else {
            // Use quadratic bezier curves for smooth interpolation
            for (let i = 1; i < points.length - 1; i++) {
                const midX = (points[i].x + points[i + 1].x) / 2;
                const midY = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
            }
            // Connect to the last point
            const lastPoint = points[points.length - 1];
            ctx.lineTo(lastPoint.x, lastPoint.y);
        }
        
        ctx.stroke();
    }

    drawLineOnContext(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, isArrow: boolean) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        if (isArrow) {
            const headLength = 15;
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);
            
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }
    }

    // Keep old methods for backwards compatibility (delegate to new methods)
    drawPath(points: {x: number, y: number}[]) {
        this.drawPathOnContext(this.staticCtx, points);
    }

    drawLine(startX: number, startY: number, endX: number, endY: number, isArrow: boolean) {
        this.drawLineOnContext(this.staticCtx, startX, startY, endX, endY, isArrow);
    }

    isPointNearShape(x: number, y: number, shape: Shape): boolean {
        if (shape.type === "rect") {
            const nearLeft = Math.abs(x - shape.x) <= this.eraserSize;
            const nearRight = Math.abs(x - (shape.x + shape.width)) <= this.eraserSize;
            const nearTop = Math.abs(y - shape.y) <= this.eraserSize;
            const nearBottom = Math.abs(y - (shape.y + shape.height)) <= this.eraserSize;
            
            const insideX = x >= shape.x && x <= shape.x + shape.width;
            const insideY = y >= shape.y && y <= shape.y + shape.height;
            
            return (insideX && (nearTop || nearBottom)) || 
                   (insideY && (nearLeft || nearRight)) ||
                   (insideX && insideY);
        } 
        else if (shape.type === "circle") {
            const distance = Math.sqrt(
                Math.pow(x - shape.centerX, 2) + 
                Math.pow(y - shape.centerY, 2)
            );
            return Math.abs(distance - shape.radius) <= this.eraserSize || distance <= shape.radius;
        } 
        else if (shape.type === "pencil") {
            for (let i = 1; i < shape.points.length; i++) {
                const p1 = shape.points[i - 1];
                const p2 = shape.points[i];
                
                if (this.distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= this.eraserSize) {
                    return true;
                }
            }
            return false;
        } 
        else if (shape.type === "line") {
            return this.distToSegment(x, y, shape.startX, shape.startY, shape.endX, shape.endY) <= this.eraserSize;
        }
        
        return false;
    }
    
    distToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    findShapeIndexAt(x: number, y: number): number {
        // Search in reverse order (top-most shape first)
        for (let i = this.existingShape.length - 1; i >= 0; i--) {
            if (this.isPointNearShape(x, y, this.existingShape[i])) {
                return i;
            }
        }
        return -1; // No shape found
    }

    // Get coordinates from pointer event (handles both mouse and touch)
    // Converts screen coordinates to world coordinates (accounting for zoom/pan)
    private getPointerCoords(e: PointerEvent): { x: number, y: number } {
        const rect = this.activeCanvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldX = (screenX - this.offsetX) / this.scale;
        const worldY = (screenY - this.offsetY) / this.scale;
        
        return { x: worldX, y: worldY };
    }
    
    // Get screen coordinates (for pan tool which works in screen space)
    private getScreenCoords(e: PointerEvent): { x: number, y: number } {
        const rect = this.activeCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    pointerUpHandler = (e: PointerEvent) => {
        this.clicked = false;
        this.isPanning = false;
        this.clearActiveLayer();  // Clear the preview
        
        // Pan tool doesn't create shapes
        if (this.selectedTool === "pan") {
            return;
        }
        
        const coords = this.getPointerCoords(e);
    
        if (this.selectedTool === "pencil" && this.currentPencilShape) {
            // Add color and strokeWidth to the shape
            this.currentPencilShape.color = this.strokeColor;
            this.currentPencilShape.strokeWidth = this.strokeWidth;
            
            this.existingShape.push(this.currentPencilShape);
            
            this.safeSend({
                type: "chat",
                message: { shape: this.currentPencilShape },
                roomId: this.roomId
            });
            
            this.saveToUndoHistory();
            this.currentPencilShape = null;
            this.renderStaticLayer();
        } else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            const shape: Shape = {
                type: "line",
                startX: this.startX,
                startY: this.startY,
                endX: coords.x,
                endY: coords.y,
                isArrow: this.selectedTool === "arrow",
                color: this.strokeColor,
                strokeWidth: this.strokeWidth,
            };
            
            this.existingShape.push(shape);
            this.safeSend({
                type: "chat",
                message: { shape },
                roomId: this.roomId
            });
            
            this.saveToUndoHistory();
            this.renderStaticLayer();
        } else if (this.selectedTool === "rect" || this.selectedTool === "circle") {
            const width = coords.x - this.startX;
            const height = coords.y - this.startY;
            let shape: Shape | null = null;
    
            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    width,
                    height,
                    color: this.strokeColor,
                    strokeWidth: this.strokeWidth,
                };
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                shape = {
                    type: "circle",
                    centerX: this.startX + width/2,
                    centerY: this.startY + height/2,
                    radius: radius,
                    color: this.strokeColor,
                    strokeWidth: this.strokeWidth,
                };
            }
    
            if (shape) {
                this.existingShape.push(shape);
                this.safeSend({
                    type: "chat",
                    message: { shape },
                    roomId: this.roomId
                });
                
                this.saveToUndoHistory();
                this.renderStaticLayer();
            }
        }
    };

    pointerDownHandler = (e: PointerEvent) => {
        // Capture pointer for better touch handling
        this.activeCanvas.setPointerCapture(e.pointerId);
        
        this.clicked = true;
        
        // Pan tool works in screen space
        if (this.selectedTool === "pan") {
            const screenCoords = this.getScreenCoords(e);
            this.isPanning = true;
            this.lastPanX = screenCoords.x;
            this.lastPanY = screenCoords.y;
            return;
        }
        
        const coords = this.getPointerCoords(e);
        this.startX = coords.x;
        this.startY = coords.y;

        if (this.selectedTool === "pencil") {
            this.currentPencilShape = { 
                type: "pencil", 
                points: [{ x: coords.x, y: coords.y }] 
            };
        } else if (this.selectedTool === "eraser") {
            const indexToRemove = this.findShapeIndexAt(coords.x, coords.y);
            
            if (indexToRemove !== -1) {
                const indicesToRemove = [indexToRemove];
                this.existingShape = this.existingShape.filter((_, index) => 
                    !indicesToRemove.includes(index));
                
                this.safeSend({
                    type: "chat",
                    message: { erased: indicesToRemove },
                    roomId: this.roomId
                });
                
                this.saveToUndoHistory();
                this.renderStaticLayer();
            }
        }
    }

    pointerMoveHandler = (e: PointerEvent) => {
        if (!this.clicked) return;
        
        // Handle pan tool in screen space
        if (this.selectedTool === "pan" && this.isPanning) {
            const screenCoords = this.getScreenCoords(e);
            const dx = screenCoords.x - this.lastPanX;
            const dy = screenCoords.y - this.lastPanY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastPanX = screenCoords.x;
            this.lastPanY = screenCoords.y;
            
            this.renderStaticLayer();
            this.clearActiveLayer();
            return;
        }
        
        const coords = this.getPointerCoords(e);
    
        if (this.selectedTool === "pencil" && this.currentPencilShape && this.currentPencilShape.type === "pencil") {
            const points = this.currentPencilShape.points;
            const lastPoint = points[points.length - 1];
            
            // Point sampling - only add point if moved enough distance (reduces data bloat)
            const distance = Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y);
            if (distance < 2) return; // Skip if moved less than 2px
            
            const newPoint = { x: coords.x, y: coords.y };
            this.currentPencilShape.points.push(newPoint);
            
            // Draw smooth incremental segment on active layer
            const ctx = this.activeCtx;
            
            // Apply zoom/pan transforms for live drawing
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
            ctx.scale(this.scale, this.scale);
            
            // Use current stroke settings
            ctx.strokeStyle = this.strokeColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = this.strokeWidth;
            
            // For smoother live drawing, use quadratic bezier if we have enough points
            if (points.length >= 3) {
                const p0 = points[points.length - 3];
                const p1 = points[points.length - 2];
                const p2 = newPoint;
                
                // Calculate midpoints for smooth connection
                const mid1X = (p0.x + p1.x) / 2;
                const mid1Y = (p0.y + p1.y) / 2;
                const mid2X = (p1.x + p2.x) / 2;
                const mid2Y = (p1.y + p2.y) / 2;
                
                ctx.beginPath();
                ctx.moveTo(mid1X, mid1Y);
                ctx.quadraticCurveTo(p1.x, p1.y, mid2X, mid2Y);
                ctx.stroke();
            } else {
                // Not enough points yet, just draw a line
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(newPoint.x, newPoint.y);
                ctx.stroke();
            }
            
            ctx.restore();
            
        } else if (this.selectedTool === "eraser") {
            // Find a shape to erase at the current mouse position
            const indexToRemove = this.findShapeIndexAt(coords.x, coords.y);
            
            if (indexToRemove !== -1) {
                const indicesToRemove = [indexToRemove];
                // Remove the shape
                this.existingShape = this.existingShape.filter((_, index) => 
                    !indicesToRemove.includes(index));
                
                // Notify other clients about the erasure
                this.safeSend({
                    type: "chat",
                    message: { erased: indicesToRemove },
                    roomId: this.roomId
                });
                
                this.saveToUndoHistory();
                this.renderStaticLayer();
            }
            
        } else {
            // Use requestAnimationFrame for shape preview (rect, circle, line, arrow)
            this.pendingMouseEvent = coords;
            this.needsActiveRender = true;
            this.scheduleRender();
        }
    };

    pointerLeaveHandler = (e: PointerEvent) => {
        // Clear preview if pointer leaves canvas without releasing
        if (this.clicked && this.selectedTool !== "pencil" && this.selectedTool !== "eraser") {
            this.clearActiveLayer();
        }
    };

    initPointerHandlers() {
        // Use pointer events for unified mouse + touch + pen support
        this.activeCanvas.addEventListener("pointerdown", this.pointerDownHandler);
        this.activeCanvas.addEventListener("pointerup", this.pointerUpHandler);
        this.activeCanvas.addEventListener("pointermove", this.pointerMoveHandler);
        this.activeCanvas.addEventListener("pointerleave", this.pointerLeaveHandler);
        
        // Prevent default touch behaviors (scrolling, zooming)
        this.activeCanvas.style.touchAction = "none";
    }

    // Wheel handler for zoom
    wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        
        const rect = this.activeCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom factor
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newScale = Math.max(0.1, Math.min(5, this.scale * (1 + delta)));
        
        // Zoom towards mouse position
        const scaleChange = newScale / this.scale;
        this.offsetX = mouseX - (mouseX - this.offsetX) * scaleChange;
        this.offsetY = mouseY - (mouseY - this.offsetY) * scaleChange;
        
        this.scale = newScale;
        this.renderStaticLayer();
        this.clearActiveLayer();
        this.onZoomChange?.(this.scale);
    };

    initWheelHandler() {
        this.activeCanvas.addEventListener("wheel", this.wheelHandler, { passive: false });
    }
}