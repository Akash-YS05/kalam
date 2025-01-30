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

    setTool(tool: "circle" | "rect" | "pencil") {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShape = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
    
            if (message.type === "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShape.push(parsedShape.shape);
    
                this.clearCanvas();
            } 
        }
    
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);


        this.existingShape.map((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "pencil") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.beginPath();
                for (let i = 0; i < shape.points.length; i++) {
                    if (i === 0) {
                        this.ctx.moveTo(shape.points[i].x, shape.points[i].y);
                    } else {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                }
                this.ctx.stroke();
                this.ctx.closePath();
            }
        })
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
    
        if (this.selectedTool === "pencil" && this.currentPencilShape) {
            this.existingShape.push(this.currentPencilShape);
    
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: this.currentPencilShape }),
                roomId: this.roomId
            }));
    
            this.currentPencilShape = null; 
        } else {
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
                const radius = Math.max(width, height) / 2;
                shape = {
                    type: "circle",
                    centerX: this.startX + radius,
                    centerY: this.startY + radius,
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
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
    
        if (this.selectedTool === "pencil" && this.currentPencilShape?.type === "pencil") {
            const newPoint = { x: e.clientX, y: e.clientY };
            this.currentPencilShape.points.push(newPoint);
    
            this.ctx.beginPath();
            const points = this.currentPencilShape.points;
            this.ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
            this.ctx.lineTo(newPoint.x, newPoint.y);
            this.ctx.stroke();
            this.ctx.closePath();
        } else {
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
    
            if (this.selectedTool === "rect") {
                const width = e.clientX - this.startX;
                const height = e.clientY - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(e.clientX - this.startX, e.clientY - this.startY) / 2;
                const centerX = this.startX + radius;
                const centerY = this.startY + radius;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
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