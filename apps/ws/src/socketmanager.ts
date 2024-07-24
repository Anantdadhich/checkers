import { User } from "./user"
//central hub for managing WebSocket connections and user associations in a WebSocket application
export class SocketManager {
   private static instance:SocketManager;
   private intrestedSockets:Map<string,User[]>; //A Map where the keys are room IDs (strings) and the values are arrays of User objects. This map tracks which users are interested in which rooms.
   private userRoomMaping:Map<string,string>  //This map tracks which room each user is currently in.
   
   private constructor(){
    this.intrestedSockets=new Map<string,User[]>();
    this.userRoomMaping=new Map<string,string>();
   }

   static getInstance(){
    if(this.instance){
        return this.instance
    }
    this.instance=new SocketManager()
    return this.instance
   }

   addUser(user:User,roomId:string){
    this.intrestedSockets.set(roomId,[
        ...(this.intrestedSockets.get(roomId)||[]),
        user,

    ])
    this.userRoomMaping.set(user.userId,roomId)
   }

   broadCast(roomId:string,message:string){
    const users=this.intrestedSockets.get(roomId)
    if(!users){
        console.error('no user in room')
        return
    }
    users.forEach((user)=>{
        user.socket.send(message)
    })
   }
   
   removeUser(user:User){
    const roomId=this.userRoomMaping.get(user.userId)
    if(!roomId){
        console.error("user not intrested in any room")
        return
    }
    const room=this.intrestedSockets.get(roomId)||[]

    const remainingusers=room.filter(u=>    //it contains all users except one to be removed
        u.userId !==user.userId  
    )
    this.intrestedSockets.set(
        roomId,
        remainingusers
    )
    if(this.intrestedSockets.get(roomId)?.length===0){
        this.intrestedSockets.delete(roomId)
    }
    this.userRoomMaping.delete(user.userId)
   }

}