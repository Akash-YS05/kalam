import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws, request) {
    const url = request.url;    //the specific url
    if (!url) {
        return;
    }
    const params = new URLSearchParams(url.split('?')[1]);
    const token = params.get('token') || '';    //extract the token from the url
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !(decoded as JwtPayload).userId) {
        ws.close();
        return;
    }

    ws.on('message', function message(data) {
    console.log('received: %s', data);
    });

});