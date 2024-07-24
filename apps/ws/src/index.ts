import { WebSocketServer } from "ws";
import { GameManager } from "./gamemanager";
import url from "url"
import { extractUserId } from "./auth";
import { User } from "./user";

const wss =new WebSocketServer({port:8080})

const gameManager=new GameManager();

wss.on('connection',function connection(socket,req){
    //@ts-ignore
   const token:string=url.parse(req.url,true).query.token
   const userId=extractUserId(token)
    gameManager.addUser(new User(socket,userId))

    socket.on("close",()=>{
     gameManager.removeUser(socket)
    })

})

console.log("done")