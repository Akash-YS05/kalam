import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number,
} | {
    type: "circle",
    centerX: number,
    centerY: number,
    radius: number,
} | {
    type: "pencil",
    points: {x: number, y: number}[]
} | {
    type: "line",
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isArrow: boolean  
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShape: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "rect";
    private currentPencilShape: Shape | null = null;
    private undoHistory: Shape[][] = [];
    private eraserSize = 10; 
    private safeSend(data: any) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket not open. Dropping message:", data);
        }
    }
    
    socket: WebSocket;
    
    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;    // ! - means that the value will never be null
        this.existingShape = []
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;

        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: "circle" | "rect" | "pencil" | "line" | "arrow" | "eraser") {
        this.selectedTool = tool;
    }

    setEraserSize(size: number) {
        this.eraserSize = size;
    }

    async init() {
        this.existingShape = await getExistingShapes(this.roomId);
        this.saveToUndoHistory();
        this.clearCanvas();
    }

    initHandlers() {
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
        
        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShape.map((shape) => {
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            
            if (shape.type === "rect") {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "pencil") {
                this.drawPath(shape.points);
            } else if (shape.type === "line") {
                this.drawLine(shape.startX, shape.startY, shape.endX, shape.endY, shape.isArrow);
            }
        })

        if (this.selectedTool === "eraser" && !this.clicked) {
            // eraser preview maybe idk
        }
    }

    drawPath(points: {x: number, y: number}[]) {
        if (points.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawLine(startX: number, startY: number, endX: number, endY: number, isArrow: boolean) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        if (isArrow) {
            const headLength = 15;
            const dx = endX - startX;
            const dy = endY - startY;
            const angle = Math.atan2(dy, dx);
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
            this.ctx.closePath();
        }
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

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
    
        if (this.selectedTool === "pencil" && this.currentPencilShape) {
            this.existingShape.push(this.currentPencilShape);
            
            this.safeSend({
                type: "chat",
                message: { shape: this.currentPencilShape },
                roomId: this.roomId
            });
            
            this.saveToUndoHistory();
            this.currentPencilShape = null; 
        } else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            const shape: Shape = {
                type: "line",
                startX: this.startX,
                startY: this.startY,
                endX: e.clientX,
                endY: e.clientY,
                isArrow: this.selectedTool === "arrow"  
            };
            
            this.existingShape.push(shape);
            this.safeSend({
                type: "chat",
                message: { shape },
                roomId: this.roomId
            });
            
            this.saveToUndoHistory();
        } else if (this.selectedTool === "rect" || this.selectedTool === "circle") {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            let shape: Shape | null = null;
    
            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    width,
                    height
                };
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                shape = {
                    type: "circle",
                    centerX: this.startX + width/2,
                    centerY: this.startY + height/2,
                    radius: radius
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
            }
        }
    };

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        if (this.selectedTool === "pencil") {
            this.currentPencilShape = { 
                type: "pencil", 
                points: [{ x: e.clientX, y: e.clientY }] 
            };
        } else if (this.selectedTool === "eraser") {
            const indexToRemove = this.findShapeIndexAt(e.clientX, e.clientY);
            
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
                this.clearCanvas();
            }
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
    
        if (this.selectedTool === "pencil" && this.currentPencilShape && this.currentPencilShape.type === "pencil") {
            const newPoint = { x: e.clientX, y: e.clientY };
            this.currentPencilShape.points.push(newPoint);
            
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.ctx.beginPath();
            const points = this.currentPencilShape.points;
            this.ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            this.ctx.lineTo(newPoint.x, newPoint.y);
            this.ctx.stroke();
            this.ctx.closePath();
            
        } else if (this.selectedTool === "eraser") {
            // Find a shape to erase at the current mouse position
            const indexToRemove = this.findShapeIndexAt(e.clientX, e.clientY);
            
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
                this.clearCanvas();
            }
            
        } else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.drawLine(this.startX, this.startY, e.clientX, e.clientY, this.selectedTool === "arrow");
            
        } else {
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
    
            if (this.selectedTool === "rect") {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            } 
            
            else if (this.selectedTool === "circle") {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width/2;
                const centerY = this.startY + height/2;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
    };

    initMouseHandlers() {
        // arrow function - this keyword is lexically bound i.e. it will refer to the class instance
        // normal function - this keyword is dynamically bound i.e. it will refer to the object that called the function which is canvas
        
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)
    }
}