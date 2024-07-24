import { WebSocket } from "ws"
import { GAME_ADDED, GAME_ALERT, GAME_ENDED, GAME_JOINED, GAME_NOT_FOUND, INIT_GAME, JOIN_ROOM, MOVE } from "./messages"
import { Game } from "./game"
import { db } from "./db"
import { User } from "./user"
import { SocketManager } from "./socketmanager"
import { GameStatus } from "@prisma/client"



export class GameManager{
    private games:Game[]  // array to store the game objects 
    private pendingUsers:string|null  //waiting for another user to connect then 
    private users:User[]   //an array to store the no of websockets servers in user form 
    constructor(){
        this.games=[]   //initalise the empty game array
        this.pendingUsers=null
        this.users=[]
    }

    addUser(user:User){
     this.users.push(user)   //adds a new websocket server
     this.addHandler(user)   //register message listeners
    }
    removeUser(socket:WebSocket){
    const user=this.users.find((user) => user.socket ===socket)
       
    if(!user){
      console.error("user not found")
      return
    }
    this.users=this.users.filter(user =>user.socket !==socket)
    SocketManager.getInstance().removeUser(user)
    //stop the game here bacuse the user left
    }
    
    removeGame(gameId:string){
     this.games=this.games.filter((g)=>g.gameId !==gameId)
    }
    //function will handle incoming messages from the user which is connect from the web socket 
    private addHandler(user:User){
    user.socket.on("message",async (data)=>{
        const message=JSON.parse(data.toString());
          //init game 
        if(message.type===INIT_GAME){
         if(this.pendingUsers){
            //
          const game =this.games.find((x)=> x.gameId===this.pendingUsers);
          if(!game){
            console.error("pending game not found")
            return
          }
          //user will join  the game same user who created the game 
          if(user.userId=== game.player1UserId){
            SocketManager.getInstance().broadCast(
                game.gameId,
                JSON.stringify({
                    type:GAME_ALERT,
                    payload:{
                        message:"trying to connect with yourself"
                    },
                }),
            );
            return
          }

        SocketManager.getInstance().addUser(user,game.gameId);  //add the user to game by gameid
          await game?.UpdateSecondplayer(user.userId);   //update the second player 
          this.pendingUsers=null  // the user is joind no game is no more pending 
         }else{     
            const game=new Game(user.userId,null);
            this.games.push(game)
            this.pendingUsers=game.gameId;
            
           SocketManager.getInstance().addUser(user,game.gameId)
           SocketManager.getInstance().broadCast(
            game.gameId,
            JSON.stringify({
                type:GAME_ADDED,
            }),
           ) ;
         }
        }
   
        //about the move from gameid
    if(message.type===MOVE){
        const gameId=message.payload.gameId;
        const game=this.games.find((game)=> game.gameId === gameId);
        //if succesfully found the game
        if(game){
            game.makeMove(user,message.payload.move)
            if(game.result){
                this.removeGame(game.gameId)
            }
        }
    }

    if(message.type===JOIN_ROOM){
        const gameId=message.payload?.gameId;
        if(!gameId){
            return
        }

    let avilablegame=this.games.find((game)=>game.gameId===gameId)

    const gamefromdb=await db.game.findUnique({
        where:{
            id:gameId
        },
        include:{
            moves:{
                orderBy:{
                    movenumber:'asc'
                },
            },
            blackPlayer:true,
            whitePlayer:true,
        }
    });

    if(!gamefromdb){
        user.socket.send(
            JSON.stringify({
                type:GAME_NOT_FOUND
            })
        )
        return
    }
     //check if game status is not in progress
     if(gamefromdb.status !==GameStatus.IN_PROGRESS){
        user.socket.send(JSON.stringify({
            type:GAME_ENDED,
            payload:{
                result:gamefromdb.result,
                status:gamefromdb.status,
                moves:gamefromdb.moves,
                blackplayer:{
                    id:gamefromdb.blackPlayer.id,
                    name:gamefromdb.blackPlayer.name
                },
                whiteplayer:{
                    id:gamefromdb.whitePlayer.id,
                    name:gamefromdb.whitePlayer.name
                }
            }
        }))
        return
     }


    if(!avilablegame){
        const game=new Game(
            gamefromdb?.whitePlayerid!,
            gamefromdb?.blackPlayerid!,
            gamefromdb.id,
            gamefromdb.startAt
        )
         //@ts-ignore
       game.sendMoves(gamefromdb?.moves ||[])
        this.games.push(game)
        avilablegame=game
    }

    console.log(avilablegame.getPlayer1timeConsumed())
    console.log(avilablegame.getPlayer2timeConsumed())

     user.socket.send(
        JSON.stringify({
            type:GAME_JOINED,
            payload:{
                gameId,
                moves:gamefromdb.moves,
                blackplayer:{
                    id:gamefromdb.blackPlayer.id,
                    name:gamefromdb.whitePlayer.id
                },
                whiteplayer:{
                    id:gamefromdb.whitePlayer.id,
                    name:gamefromdb.whitePlayer.name
                },
                player1TimeConsumed:avilablegame.getPlayer1timeConsumed(),
                player2TimeConsumed:avilablegame.getPlayer2timeConsumed()

            }
        })
     )
         SocketManager.getInstance().addUser(user,gameId)

    }
      
    })
    }
    }