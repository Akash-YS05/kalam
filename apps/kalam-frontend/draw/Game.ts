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
} | {
    type: "eraser",
    points: {x: number, y: number} []
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
                else {
                    this.existingShape.push(parsedShape.shape);
                    this.saveToUndoHistory();
                }
    
                this.clearCanvas();
            } 
        }
    
    }

    saveToUndoHistory() {
        //creating a deep copy of existing shapes
        const shapesCopy = JSON.parse(JSON.stringify(this.existingShape));
        this.undoHistory.push(shapesCopy);

        if (this.undoHistory.length > 30) {
            this.undoHistory.shift();       //preventing memmory issues
        }
    }

    undo() {
        if (this.undoHistory.length <= 1) {
            return;
        }
        this.undoHistory.pop();
        this.existingShape = JSON.parse(JSON.stringify(this.undoHistory[this.undoHistory.length - 1]));

        //broadcasting
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ undo: true, shapes: this.existingShape }),
            roomId: this.roomId
        }));

        this.clearCanvas();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);


        this.existingShape.map((shape) => {
            if (shape.type === "rect") {
                
                //todo: add color options to stroke 
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } 
            
            else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } 
            
            else if (shape.type === "pencil") {
                // this.ctx.strokeStyle = "rgba(255, 255, 255)";
                // this.ctx.beginPath();
                // for (let i = 0; i < shape.points.length; i++) {
                //     if (i === 0) {
                //         this.ctx.moveTo(shape.points[i].x, shape.points[i].y);
                //     } else {
                //         this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                //     }
                // }
                // this.ctx.stroke();
                // this.ctx.closePath();

                this.drawPath(shape.points);
            }

            else if (shape.type === "eraser") {
                const originalStyle = this.ctx.strokeStyle;
                this.ctx.strokeStyle = "rgba(0,0,0)";
                this.drawPath(shape.points);
                this.ctx.strokeStyle = originalStyle;
            }
            else if (shape.type == "line") {
                this.drawLine(shape.startX, shape.startY, shape.endX, shape.endY, shape.isArrow);
            }
        })
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
            // for the arrowhead
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

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
    
        if ((this.selectedTool === "pencil" || this.selectedTool === "eraser") && this.currentPencilShape) {
            this.existingShape.push(this.currentPencilShape);
    
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: this.currentPencilShape }),
                roomId: this.roomId
            }));

            this.saveToUndoHistory();
            this.currentPencilShape = null; 
        } 
        else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            const shape: Shape = {
                type: "line",
                startX: this.startX,
                startY: this.startY,
                endX: e.clientX,
                endY: e.clientY,
                isArrow: this.selectedTool === "arrow"
            }

            this.existingShape.push(shape);
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: this.roomId
            }));
            
            this.saveToUndoHistory();
        }
        else if (this.selectedTool === "rect" || this.selectedTool === "circle") {
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
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape }),
                    roomId: this.roomId
                }));

                this.saveToUndoHistory();
            }
        }
    };
    

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        if (this.selectedTool === "pencil") {
            this.currentPencilShape = { type: "pencil", points: [{ x: e.clientX, y: e.clientY }] };
            this.existingShape.push({
                type: "pencil",
                points: [{ x: e.clientX, y: e.clientY }],
            });
        } 
        else if (this.selectedTool === "eraser") {
            this.currentPencilShape = { 
                type: "eraser", 
                points: [{ x: e.clientX, y: e.clientY }] 
            };
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
    
        if ((this.selectedTool === "pencil" || this.selectedTool === "eraser") && 
            this.currentPencilShape && 
            (this.currentPencilShape.type === "pencil" || this.currentPencilShape.type === "eraser")) {

            const newPoint = { x: e.clientX, y: e.clientY };
            this.currentPencilShape.points.push(newPoint);
    
            this.ctx.strokeStyle = this.selectedTool === "eraser" ? "rgba(0, 0, 0)" : "rgba(255, 255, 255)";
            this.ctx.beginPath();
            const points = this.currentPencilShape.points;
            this.ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            this.ctx.lineTo(newPoint.x, newPoint.y);
            this.ctx.stroke();
            this.ctx.closePath();
        } 
        else if (this.selectedTool === "line" || this.selectedTool === "arrow") {
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            this.drawLine(this.startX, this.startY, e.clientX, e.clientY, this.selectedTool === "arrow");
        }
        else {
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
    
            if (this.selectedTool === "rect") {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            } 
            
            else if (this.selectedTool === "circle") {
                // const radius = Math.max(e.clientX - this.startX, e.clientY - this.startY) / 2;
                // const centerX = this.startX + radius;
                // const centerY = this.startY + radius;
                // this.ctx.beginPath();
                // this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                // this.ctx.stroke();
                // this.ctx.closePath();

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