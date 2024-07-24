import { WebSocket } from "ws"
import {randomUUID} from "crypto"
export class User{
    public socket:WebSocket     //it stores the websocket connections associated to user
    public id:string     //we will give the it random id
    public userId:string 

    constructor(socket:WebSocket,userId:string){   //it is called when the user is created
        this.socket=socket
        this.userId=userId
        this.id=randomUUID()
    }
}