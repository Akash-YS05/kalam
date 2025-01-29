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
    startX: number,
    startY: number,
    endX: number,
    endY: number,
}


export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShape: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
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

    async init() {
        this.existingShape = await getExistingShapes(this.roomId);
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
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }
        })
    }

    initMouseHandlers() {
        // arrow function - this keyword is lexically bound i.e. it will refer to the class instance
        // normal function - this keyword is dynamically bound i.e. it will refer to the object that called the function which is canvas
        this.canvas.addEventListener("mousedown", (e) => {
            this.clicked = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
        })


        this.canvas.addEventListener("mouseup", (e) => {
            this.clicked = false;
            const width = e.clientX - this.startX
            const height = e.clientY - this.startY
    
            //@ts-ignore
            const selectedTool = this.selectedTool;
            let shape :Shape | null = null;
    
            if (selectedTool === "rect") {
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    width,
                    height
                }
            } else if (selectedTool === "circle") {
                const radius = Math.max(width, height) / 2;
                shape = {
                    type: "circle",
                    centerX: this.startX,
                    centerY: this.startY,
                    radius: radius
                }
            }
    
            if (!shape) {
                return;
            }
    
            this.existingShape.push(shape);
            
            this.socket.send(JSON.stringify({type: "chat", message: JSON.stringify({shape}), roomId: this.roomId}));
        })

        this.canvas.addEventListener("mousemove", (e) =>{
            if (this.clicked) {
                const width = e.clientX - this.startX
                const height = e.clientY -this.startY
                this.clearCanvas();
                this.ctx.strokeStyle = "rgba(255, 255, 255)";

                //@ts-ignore
                const selectedTool = this.selectedTool;

                if (selectedTool === "rect") {
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                } else if (selectedTool === "circle") {
                    const radius = Math.max(width, height) / 2;
                    const centerX = this.startX + radius;
                    const centerY = this.startY + radius;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            }
        })
    }

}