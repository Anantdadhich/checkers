
import {Chess, Move, Square} from "chess.js"
import { GAME_ENDED,  INIT_GAME, MOVE } from "./messages"
import {randomUUID} from "crypto"
import { db } from "./db";
import { SocketManager } from "./socketmanager";
import { User } from "./user";
type GAME_RESULT="WHITE_WINS"|"BLACK_WINS"|"DRAW";

type GAME_STATUS = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'TIME_UP';
const GAME_TIME_MS = 10 * 60 * 60 * 1000;

//chess is representing the current state   //from is represent the square strt move 
export function isPromoting(chess:Chess,from:Square,to:Square){
    if(!from){
        return false
    }
    
    const piece=chess.get(from)

    if(piece?.type !== 'p'){
        return false       // it check the it is pawn not then return false
    }

    if(piece.color !== chess.turn()){   //code verifies the pawn color mathces the current user turn  
        return false        //it asssumes or check ehose palyer the turn it is
    }

    if(!['1','8'].some((it)=> to.endsWith(it))){   
        return false
    }

    return chess.moves({square:from,verbose:true})
    .map((it)=>it.to)
    .includes(to)
}

export class Game{
    public gameId:string
    public player1UserId:string;
    public player2UserId:string|null;
    public board:Chess;
   private moveCount=0;

    private timer:NodeJS.Timeout |null=null;
    private movetimer:NodeJS.Timeout |null=null;
     public result:GAME_RESULT |null=null;
    private player1timeConsumed=0;
    private player2timeConsumed=0;
    private startTime=new Date(Date.now());
    private lastMoveTime=new Date(Date.now()); 


    constructor(player1UserId:string,player2UserId:string|null,gameId?:string,startTime?:Date){
    this.player1UserId=player1UserId
    this.player2UserId=player2UserId
        this.board=new Chess()
        this.gameId=gameId ??randomUUID()
          
        if(startTime){
            this.startTime=startTime;
            this.lastMoveTime=startTime
        }
       
    }
   

    sendMoves(moves:{
        id:string;
        gameId:string;
        moveNumber:number;
        from:string;
        to:string;
        
        comments:string|null;
        timeTaken:number|null;
        createdAt:Date
    }[]){
       console.log(moves)
         //iterate over each move in array
       moves.forEach((move)=>{
            if(isPromoting(this.board,move.from as Square,move.to as Square)){
                this.board.move({
                    from:move.from,
                    to:move.to,
                    promotion:'q'
                })
            }
            else{
                this.board.move({
                    from:move.from,
                    to:move.to
                })
            }
        })
        //it will update move count
        this.moveCount=moves.length;
         //update last move time if there at least one move
        if(moves[moves.length-1]){
            this.lastMoveTime=moves[moves.length-1].createdAt
        }
      // iterates over each move in the moves array
       moves.map((move,index)=>{   //move represent the current move in the array //index is index of current move
        if(move.timeTaken){
             if(index%2===0){
                this.player1timeConsumed += move.timeTaken
             }
             else{
                this.player2timeConsumed += move.timeTaken
             }
        }

       });
       this.resetAbandonTimer()
       this.resetMoveTimer()
      
      

    }

    async UpdateSecondplayer(player2UserId:string){
       this.player2UserId=player2UserId

       const users=await db.user.findMany({
        where:{
            id:{
                in:[this.player1UserId,this.player2UserId ?? '']
            }
        }
       })

       try {
        await this.createGameinDb()
       } catch (error) {
          console.log(error)
          return
       }
     
        //we broadcast an game initalising message to connceted client
        SocketManager.getInstance().broadCast(  //instance of socket manager 
            this.gameId,    //gameid is used for the target of broadcast 
            JSON.stringify({
                type:INIT_GAME, 
                payload:{     //actual data of broadcat 
                gameId:this.gameId,
                whiteplayer:{   //to find and assign the name of white user
                  name:users.find((user)=>user.id===this.player1UserId)?.name,
                  id:this.player1UserId
                },
                blackplayer:{
                    name:users.find((user)=>user.id===this.player2UserId)?.name,
                    id:this.player2UserId
                },
                fen:this.board.fen(),
                moves:[]     //empty array indicating no moves made yet 
                }
            })
        )

    }

    //creating  the new game  
    async createGameinDb(){
        this.startTime=new Date(Date.now())  //it sets the current date and time 
        this.lastMoveTime=this.startTime

        const game =await db.game.create({
            data:{
                id:this.gameId,
                timecontrol:'CLASSICAL',
                status:"IN_PROGRESS",
                startAt:this.startTime,
                currentfen:"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",   //represent start position
                whitePlayer:{
                  connect:{
                    id:this.player1UserId
                  }
                },
                blackPlayer:{
                    connect:{
                        id:this.player2UserId ??''
                    },
                },
            },
            include:{
                whitePlayer:true,
                blackPlayer:true
            }
        })
         this.gameId=game.id
    }

 async addMovetoDb(move:Move,moveTimeStamp:Date){
       
    await db.$transaction([
        db.move.create({
         
            data: {
            gameId: this.gameId,
            movenumber: this.moveCount + 1,
            from: move.from,
            to: move.to,
            before: move.before,
            after: move.after,
            createdAt: moveTimeStamp,
            timetaken: moveTimeStamp.getTime() - this.lastMoveTime.getTime(),
            san: move.san

            },
        }),
        db.game.update({
            data:{
                currentfen:move.after,
            },
            where:{
                id:this.gameId
            }
        })
    ])
   }

  async makeMove(user:User,move:Move){
      
    if(this.board.turn()==='w' && user.userId  !== this.player1UserId){  //it is checking the user is making th move sis expected to make the move means its turn
        return         //if the turn is white and userid is not match with the palyer.. then it exits without making move
    }
    if(this.board.turn()==='b' && user.userId !==this.player2UserId){
        return
    }

     if(this.result){
        console.error(`User ${user.userId} is making an post move completion`)
        return 
     }

     const moveTimeStamp=new Date(Date.now())   //we recoerd the time of the move
      
     try{
        if(isPromoting(this.board,move.from,move.to)){
            this.board.move({
                from:move.from,
                to:move.to,
                promotion:'q',
            });
        }
        else{
            this.board.move({
                from:move.from,
                to:move.to
            })
        }
     } catch (error) {
        console.error("error while maing move")
        return
     }
    
     //flipped because move is happended 
      //based on the we calculate the time of the move 

      //we add the difference in time correspond to player

      if(this.board.turn()==='b'){
        this.player1timeConsumed=this.player1timeConsumed + (moveTimeStamp.getTime()-this.lastMoveTime.getTime())   //represent the milli seconds on last move
      }
     
      if(this.board.turn()==='w'){
        this.player2timeConsumed=this.player2timeConsumed +(moveTimeStamp.getTime()-this.lastMoveTime.getTime())
      }
       //adding the palyed move or time in database 
      await this.addMovetoDb(move,moveTimeStamp)
         //reset a timer that infroce time activity by a move  
         this.resetMoveTimer()
         //track inactivity by a player
       this.resetAbandonTimer()
     //update the lastmove with current movetiem 
       this.lastMoveTime=moveTimeStamp
     
       //real time communication to all connected clients 
       SocketManager.getInstance().broadCast(
        this.gameId,
        JSON.stringify({
            type:MOVE,
            payload:{
                move,
                player1timeConsumed:this.player1timeConsumed,
                player2timeConsumed:this.player2timeConsumed
            },
        })
       )
    ////we see if the palyer is drwar we set it and it is not draw we now cjeck the winner
       if(this.board.isGameOver()){
        const result=this.board.isDraw() ? 'DRAW':
         this.board.turn()==='b'?   "WHITE_WINS" :
         "BLACK_WINS";
         
         this.endGame("COMPLETED",result)
         
       } 

       this.moveCount++
   }







  //we check the player spent time on before after move
   getPlayer1timeConsumed(){
    if(this.board.turn()==='w'){
       return this.player1timeConsumed +new Date(Date.now()).getTime()+this.lastMoveTime.getTime()
    }
    return this.player1timeConsumed
   }

   getPlayer2timeConsumed(){
    if(this.board.turn()==='b'){
        return this.player2timeConsumed+ new Date(Date.now()).getTime() +this.lastMoveTime.getTime()
    }
    return this.player2timeConsumed
   }
   // perform actions that take time (like waiting for timers to expire) before continuing execution.  in turn based games 
   async resetAbandonTimer(){
      if(this.timer){
        clearTimeout(this.timer)
      }

      this.timer=setTimeout(() => {
        this.endGame("ABANDONED",this.board.turn()==='b' ?"WHITE_WINS":"BLACK_WINS" )
      },60*1000);
   }

   async resetMoveTimer(){
    if(this.movetimer){
        clearTimeout(this.movetimer)
    }

    const turn=this.board.turn()
    //calculate the remaining time 
    const timeLeft=GAME_TIME_MS -(turn==='w'?this.player1timeConsumed :this.player2timeConsumed)
     
    this.movetimer=setTimeout(() => {
        this.endGame("TIME_UP" ,turn==="b"?"WHITE_WINS":"BLACK_WINS")
    },timeLeft );

   }

   async endGame(status:GAME_STATUS,result:GAME_RESULT){
      const updatedgame=await db.game.update({
        data:{
            status,
            result:result
        },
        where:{
            id:this.gameId
        },
        include:{
            moves:{
                orderBy:{
                    movenumber:"asc"
                },
            },
            blackPlayer:true,
            whitePlayer:true
        }
      })

      SocketManager.getInstance().broadCast(
        this.gameId,
        JSON.stringify({
            type:GAME_ENDED,
            payload:{
                result,        //who is winner 
                status,
                moves:updatedgame.moves,    //list of moves in game 
                blackPlayer:{
                    id:updatedgame.blackPlayer.id,
                    name:updatedgame.blackPlayer.name
                },
                whitePlayer:{
                    id:updatedgame.whitePlayer.id,
                    name:updatedgame.whitePlayer.id
                }
            }
        })
      )

      this.clearTimer()
      this.clearMoveTimer()
      
   }
    //set the time clock
   setTimer(timer:NodeJS.Timeout){
        timer:this.timer
    }
    //clear the timeclock
   clearTimer(){
    if(this.timer) clearTimeout(this.timer)
   }

    

   clearMoveTimer(){
    if(this.movetimer) clearTimeout(this.movetimer)
   }
}