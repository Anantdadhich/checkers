
import { useEffect, useRef, useState } from "react"
import {useRecoilValue,useSetRecoilState} from "recoil"
import { Button } from "../components/Button"
import { ChessBoard, isPromoting } from "../components/Chessboard"
import { useSocket } from "../hooks/UseSocket"
import { Chess, Move } from "chess.js"
import { useUser } from "@repo/store/useUser"
import {Movesatom,userSelectedMoveIndexAtom} from "@repo/store/chessBoard"
import { useNavigate, useParams } from "react-router-dom"
import moveSound from "../../public/move.wav"
import { UserAvatar } from "../components/UserAvatar"
import { GameEndModal } from "../components/GameEndModal"
export const INIT_GAME="init_game"
export const MOVE="move"
export const GAME_OVER="game_over"
export const GAME_TIME="game_time"
export const GAME_RESULT='game_result'
export const GAME_JOINED='game_joined'
export const JOIN_ROOM='game_join'
export const GAME_ADDED='game_added'
export const GAME_ENDED='game_ended'
export const USER_TIMEOUT='user_timeout'
export enum Result{
 WHITE_WINS='WHITE_WINS',
 BLACK_WINS='BLACK_WINS',
 DRAW="DRAW"
}

export interface GameResult{
  result:Result,
  by:string
}

interface MetaData{
  blackplayer:{
    id:string,
    name:string
  };
  whiteplayer:{
    id:string,
    name:string
  };
}
const GAME_TIME_MS = 10 * 60 * 1000;



 export const GamingPage = () => {
    const socket=useSocket();   //hook
    const {gameId}=useParams()

    const user=useUser();    //hook 
    const navigate=useNavigate()
     const [chess,setchess]=useState(new Chess())
     const [board,setboard]=useState(chess.board())
     const [added,setadded]=useState(false)
     const [started,setstarted]=useState(false)
     const [gameMetaData,setGameMetadata]=useState<MetaData |null>(null)
     const [player1timeconsumed,setplayer1timeConsumed]=useState(0)
     const [palyer2timeconsumed,setplayer2timeConsumed]=useState(0)
     const [result,setResult]=useState<GameResult |null>(null)
     const setMoves=useSetRecoilState(Movesatom)   //it is used to manage the websocket connection
     const userSelectedMoveIndex=useRecoilValue(userSelectedMoveIndexAtom)
     const userSelectedMoveIndexRef=useRef(userSelectedMoveIndex)
     const moveAudio=new Audio(moveSound)
     useEffect(()=>{
      userSelectedMoveIndexRef.current=userSelectedMoveIndex
     },[userSelectedMoveIndex])
  
  
     useEffect(()=>{
      if(!user){
        window.location.href='/login'
      }
    })
    
    
     useEffect(()=>{   //runs after the compo render
       if(!socket){    //check if socket is available
        return
       }

       socket.onmessage=(event)=>{
         const message=JSON.parse(event.data)
         console.log(message)

         switch(message.type){
          case GAME_ADDED:
            setadded(true) 
             break;
          //inital the new game
          case INIT_GAME:
           
            setboard(chess.board())  
            setstarted(true)
            navigate(`/game/${message.payload.gameId}`)
            setGameMetadata({
              blackplayer:message.payload.blackPlayer,
              whiteplayer:message.payload.whitePlayer
            })
            break;
             case MOVE:
              const {move,player1timeconsumed,palyer2timeconsumed}=message.payload
              setplayer1timeConsumed(player1timeconsumed);
              setplayer2timeConsumed(palyer2timeconsumed)
               //check that user is select move or not 
              if(!userSelectedMoveIndexRef.current !==null){
                setMoves((moves)=>[...moves,move])
                return
              }

              try {
                if(isPromoting(chess,move.from,move.to)){
                  chess.move({
                    from:move.from,
                    to:move.to,
                    promotion:'q'
                  })
                }else{
                  chess.move({
                    from:move.from,
                    to:move.to
                  })
                }

                setMoves((moves)=>[...moves,move])
                moveAudio.play()
              } catch (error) {
                  console.log("error found",error)
              }

              break;
           case GAME_OVER:
             setResult(message.payload.result)
            break;

          case GAME_ENDED:
            const wonby=message.payload.status ==='COMPLETED'?
             message.payload.result !=='DRAW' ? 'CheckMate':'Draw':'Timeout';
             setResult({
              result:message.payload.result,
              by:wonby
             });
             chess.reset();
           setMoves(() => {
            message.payload.moves.map((curr_move: Move) => {
              chess.move(curr_move as Move);
            });
            return message.payload.moves;
          });
           setGameMetadata({
            blackplayer:message.payload.blackplayer,
            whiteplayer:message.payload.whiteplayer
           })
          break;

          case USER_TIMEOUT:
            setResult(message.payload.win)
            break;
       
            case GAME_JOINED:
               setGameMetadata({
                blackplayer:message.payload.blackplayer,
                whiteplayer:message.payload.whiteplayer 
               })
               setplayer1timeConsumed(message.payload.player1timeconsumed);
               setplayer2timeConsumed(message.payload.palyer2timeconsumed)

               console.error(message.payload)

               setstarted(true)

               message.payload.moves.map((rnd:Move)=>{
                if(isPromoting(chess,rnd.from,rnd.to)){
                  chess.move({...rnd,promotion:'q'})
                }else{
                  chess.move(rnd)
                }
               })
               setMoves(message.payload.moves)
            break;
             
            case GAME_TIME:
              setplayer1timeConsumed(message.payload.player1timeconsumed)
              setplayer2timeConsumed(message.payload.palyer2timeconsumed)
          break;

          default:
            alert(message.payload.message)
            break;
         }
          };
      
      if(gameId !=='random'){
        socket.send(
          JSON.stringify({
            type:JOIN_ROOM,
            gameId,

          })
        )
      }


    },[chess,socket])


   useEffect(()=>{
    if(started){
      const interval=setInterval(()=>{
        if(chess.turn()==='w'){
          setplayer1timeConsumed((p)=> p+100)
        }else{
          setplayer2timeConsumed((p)=>p +100)
        }
      },100)
      return ()=>clearInterval(interval)
    }
   },[gameMetaData,user,started]) 

  const getTimer=(timeConsumed:number)=>{
      const timeleft_ms=GAME_TIME_MS-timeConsumed;

      const minutes=Math.floor(timeleft_ms/(1000*60))
      const remainingseconds=Math.floor(timeleft_ms%(1000*60)/1000)

      return <div className="text-white">
                Time Left: {minutes < 10 ? '0' : ''}
        {minutes}:{remainingseconds < 10 ? '0' : ''}
        {remainingseconds}
      </div>
  }

    if(!socket) return <div>loading </div>
  return (
     //game model
     <div className="">
         {result && (
          <GameEndModal blackPlayer={gameMetaData?.blackplayer} whitePlayer={gameMetaData?.whiteplayer} gameResult={result}></GameEndModal>
         ) }

        {started && (
          <div className="justify-center flex pt-4 text-white">
           {(user.id ===gameMetaData?.blackplayer?.id ? 'b':'w')===
           chess.turn()?
           'Yours turn':'Opponents turn'
           }
          </div>
        )}


        <div className="justify-center flex ">
       <div className="pt-2 w-full">
        <div className="flex flex-wrap justify-center content-around w-full">
           <div className="text-white">
             <div className="flex justify-center">
                 <div>
                  <div className="mb-4">
                    {started &&(
                      <div className="flex justify-between">
                    <UserAvatar name={
                      user.id===gameMetaData?.whiteplayer?.id ?
                      gameMetaData?.blackplayer?.name :
                      gameMetaData?.whiteplayer?.name ?? ''
                    }></UserAvatar>

                    {getTimer(user.id ===gameMetaData?.whiteplayer?.id
                      ?palyer2timeconsumed :player1timeconsumed
                    )}
                      </div>
                    )}
                  </div>

                 <div>
                   <div className={`w-full justify-center text-white flex `}>
                    <ChessBoard started={started} gameId={gameId ??''} chess={chess} setBoard={setboard} board={board} socket={socket} myColor={user.id ===gameMetaData?.blackplayer?.id ?'b':'w'} ></ChessBoard>



                   </div>
                  </div> 

                 {started &&(
                  <div>
                    <UserAvatar name={
                      user.id===gameMetaData?.blackplayer?.id ?
                      gameMetaData?.blackplayer?.name :
                      gameMetaData?.whiteplayer?.name ?? ''
                    }></UserAvatar>

                    {getTimer(user.id ===gameMetaData?.blackplayer?.id
                      ?palyer2timeconsumed :player1timeconsumed
                    )}
                  </div>
                 )}

                 </div>
             </div>
           </div>

           <div className="rounded-md overflow-auto h-[90vh] mt-10 bg-brown-500">
              {!started  &&(
                <div className="flex justify-center w-full pt-8" >
                  {added ? (
                    <div className="text-white">
                    waiting
                    </div>
                  ):(
                    gameId === 'random' &&(
                      <Button onClick={()=>{
                        socket.send(
                          JSON.stringify({
                            type:INIT_GAME
                          })
                        )
                      }}>
                       play 
                      </Button>
                    )
                  )}
                </div>
              )}
           </div>

     
        </div>
       </div>
        </div>
     </div>
  )
}


