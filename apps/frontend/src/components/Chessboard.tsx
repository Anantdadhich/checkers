import { Chess, Color, Move, PieceSymbol, Square } from "chess.js"
import React, { MouseEvent,  memo, useEffect, useState } from "react";
import { MOVE } from "../Screens/GamingPage";
import { useWindowSize } from "../hooks/useWindowsize";
import { isBoardflippedatom ,userSelectedMoveIndexAtom,Movesatom} from "@repo/store/chessBoard";
import { useRecoilState } from "recoil";
import moveSound from '../../public/move.wav'
import capturaudio   from '../../public/capture.wav'
import { drawArrow } from "../utils/canvas";
import Confetti from "react-confetti"
import { NumberNotation } from "./Chessboard/NumberNotation";
import { ChessSquare } from "./Chessboard/ChessSquare";
import { LetterNotation } from "./Chessboard/LetterNotation";
import { LegalMoveIndicator } from "./Chessboard/LegalMoveindicator";



export function isPromoting(chess:Chess,from:Square,to:Square){
 //from square is empty
  if(!from){
    return
  }

  const piece=chess.get(from)

  if(piece?.type !=='p'){
    return
  }
  if(piece.color !==chess.turn()){
    return
  }
   //check the destination suare where on 1 and 8th rank where the pawns can promote 
  if(!['1','8'].some((it)=>to.endsWith(it))){
   return false
  }

 return chess
    .history({ verbose: true })
    .map((it) => it.to)
    .includes(to);
}

export const ChessBoard = memo(({
  gameId,
  started,
  myColor,
  chess,
  board,
  socket,
  setBoard,
}: {
  myColor: Color;
  gameId: string;
  started: boolean;
  chess: Chess;
  setBoard: React.Dispatch<
    React.SetStateAction<
      ({
        square: Square;
        type: PieceSymbol;
        color: Color;
      } | null)[][]
    >
  >;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
}) => {
    
  const {width,height}=useWindowSize()
   //updates the board 
  const [isFlipped,setisflipped]=useRecoilState(isBoardflippedatom)   //this hook is used to update the multiple times the state updates
   //track the user selelcted moves history 
  const [userSelectedMoveIndex,setuserSelectedMoveIndex]=useRecoilState(userSelectedMoveIndexAtom)
  //update the moves 
  const [moves,setMoves]=useRecoilState(Movesatom)
  //define the from where the user can move
  const [from,setfrom]=useState<null|Square>(null)
  const [lastmove,setlastmove]=useState<{from:string; to:string} |null>(null)
    //check the user turn
  const isMyturn =myColor===chess.turn()

  const [rightClickedSquares,setrightClickedSquares]=useState<string[]>([])
  const [arrowstart,setarrowstart]=useState<string |null>(null)

  const [legalmoves,setlegalmoves]=useState<string[]>([])

  const [gameOver,setgameOver]=useState(false)
  //array pf chessboard columns
  const labels=['a','b','c','d','e','f','g','h']
 
  const [canvas,setcanavas]=useState<HTMLCanvasElement |null>(null)
  //constant value padding around the chessboard
  const OFFSET=100;
  //size of each box cal 

  const boxSize=width>height
  ? Math.floor((height-OFFSET)/8)
   :Math.floor((width-OFFSET)/8)


   const moveAudio=new Audio(moveSound)
   const captureAudio=new Audio(capturaudio)
  //mouse down events
  const handlemouseDown=(
    e:MouseEvent<HTMLDivElement>,
    SquareRep:string

  )=>{
    
    e.preventDefault()
    if(e.button===2){
      setarrowstart(SquareRep)   //arrow move for a piece
    }
     }
//chess board is flippes for user perspective which the user is turn
useEffect(()=>{
  if(myColor==='b'){
    setisflipped(true)
  }
},[myColor])

//for whent he board is redrwan
const clearCanavas=()=>{
 
  setrightClickedSquares([])

  if(canvas){
    const ctx=canvas.getContext('2d')
    ctx?.clearRect(0,0,canvas.height,canvas.width)
  }
}

//toogls the selection of moves of square on right click
const handlerightClick=(SquareRep:string)=>{
    if(rightClickedSquares.includes(SquareRep)){
      setrightClickedSquares((prev)=>prev.filter((sq)=>sq !==SquareRep))
    }else{
      setrightClickedSquares((prev)=> [...prev,SquareRep])
    }
}

const handleArrowStart=(SquareRep:string)=>{
  if(arrowstart){
    const stoppedAtSquare=SquareRep
    if(canvas){
      const ctx=canvas.getContext('2d')
      if(ctx){
        drawArrow({
          ctx,
          start:arrowstart,
          end:stoppedAtSquare,
          isFlipped,
          Squarenumber:boxSize
        })
      }
    }
    setarrowstart(null)
  }
}

const handleMouseup=(e:MouseEvent<HTMLDivElement>,SquareRep:string)=>{
      e.preventDefault()
      if(!started){
        return
      }
      if(e.button===2){
        if(arrowstart===SquareRep){
          handlerightClick(SquareRep)
        }else{
          handleArrowStart(SquareRep)
        }
      }else{
        clearCanavas()
      }
}

useEffect(()=>{
  clearCanavas()
  const lmove=moves.at(-1)
  if(lmove){
    setlastmove({
      from:lmove.from,
      to:lmove.to
    })
  }else{
    setlastmove(null)
  }
},[moves])

useEffect(()=>{
  if(userSelectedMoveIndex !==null){
    const move=moves[userSelectedMoveIndex]
    setlastmove({
      from:move.from,
      to:move.to
    })
    chess.load(move.after)
    setBoard(chess.board())
    return
  }
},[userSelectedMoveIndex])
 return (
  <>
  {gameOver && <Confetti></Confetti>}
    <div className="flex relative">
      <div className="text-white-200 rounded-md overflow-hidden ">
         {(isFlipped ?board.slice().reverse() :board).map((row,i)=>{  //board need to be flipped for user perspective 
          i=isFlipped ? i+1:8-i ;
          return (
            <div key={i} className="flex relative">
              <NumberNotation isMainBoxcolor={isFlipped ? i%2==0 :i%2 !==0} label={i.toString()}></NumberNotation>

              {(isFlipped ?row.slice().reverse():row).map((square,j)=>{
                j=isFlipped ? 7 -(j%8) :j%8;

                const isMainBoxcolor=(i+j)%2 !==0;
                const isPiece:boolean=!!square
                
                const SquareRepresentation=(String.fromCharCode(97+j)+""+i) as Square;

                const ishighlightedSqaure=from===SquareRepresentation ||
                SquareRepresentation=== lastmove?.from ||
                SquareRepresentation=== lastmove?.to

                const isRightclickedSquares=rightClickedSquares.includes(SquareRepresentation)
                   
                const piece =square && square.type

                //for check the game

                const isKingchecked=piece ==='k'&&
                square?.color===chess.turn()
                && chess.inCheck()


                return (
                   <div onClick={()=>{
                    if(!started){
                      return
                    }
                    if(userSelectedMoveIndex !==null){
                      chess.reset()
                      moves.forEach((move)=>{
                        chess.move({
                          from:move.from,
                          to:move.to
                        }) 
                      })
                        setBoard(chess.board())
                        setuserSelectedMoveIndex(null)
                        return }

                  if(!from &&  square?.color !==chess.turn() ) return
                 
                  if(!isMyturn) return

                  if(from !=SquareRepresentation){
                     setfrom(SquareRepresentation)

                     if(isPiece){
                      setlegalmoves(
                        chess.moves({
                          verbose:true,
                          square:square?.square
                        }).map((move)=>move.to)
                      )
                     }
                  }else{
                    setfrom(null)
                  }

                  if(!isPiece){
                    setlegalmoves([])
                  }

                  if(!from){
                    setfrom(SquareRepresentation)
                    setlegalmoves(
                      chess.moves({
                        verbose:true,
                        square:square?.square
                      }).map((move)=>move.to)
                    )
                  }else{
                    try {
                      let moveResult:Move;
                      if(isPromoting(chess,from,SquareRepresentation)){
                        moveResult=chess.move({
                          from,
                          to:SquareRepresentation,
                          promotion:'q'
                        })

                      }else{
                        moveResult=chess.move({
                          from,
                          to:SquareRepresentation
                        })
                      }

                      if(moveResult){
                        moveAudio.play()

                        if(moveResult?.captured){
                          captureAudio.play()
                        }

                        setMoves((prev)=>[...prev,moveResult])
                        setfrom(null)
                        setlegalmoves([])

                        if(moveResult.san.includes("#")){
                          setgameOver(true)
                        }

                        socket.send(
                          JSON.stringify({
                            type:MOVE,
                            payload:{
                              gameId,
                              move:moveResult
                            }
                          })
                        )
                      }
                    } catch (error) {
                      console.error("")
                    }
                  }
                   }}  style={{width:boxSize,height:boxSize}} key={j} 
                   
                    className={`${isRightclickedSquares ? (isMainBoxcolor ? 'bg-[#CF664E]' : 'bg-[#E87764]') : isKingchecked ? 'bg-[#FF6347]' : ishighlightedSqaure ? `${isMainBoxcolor? 'bg-[#BBCB45]' : 'bg-[#F4F687]'}` : isMainBoxcolor ? 'bg-[#739552]' : 'bg-[#EBEDD0]'} ${''}`}
                     
                    onContextMenu={(e)=>{
                      e.preventDefault()
                    }}

                    onMouseDown={(e)=>{
                   handlemouseDown(e,SquareRepresentation)
                    }}
                    onMouseUp={(e)=>{
                      handleMouseup(e,SquareRepresentation)
                    }}
                     
                  >
             
                  <div className="w-full justify-center flex relative h-full">

                    {square && <ChessSquare square={square}/>}
                      {isFlipped ? i===8 && (
                        <LetterNotation label={labels[j] } isMainBoxColor={j%2===0}></LetterNotation>
                      ): i===1  &&(
                        <LetterNotation label={labels[j]} isMainBoxColor={j%2 !==0}></LetterNotation>
                      )}

                      {!!from && legalmoves.includes(SquareRepresentation) &&
                       (
                        <LegalMoveIndicator isPiece={!!square?.type} isMainBoxColor={isMainBoxcolor}></LegalMoveIndicator>

                       )

                      }

                  </div>
          


                   </div>
                )
              })}
            </div>
          )
         })}
      </div>

     <canvas 
       ref={(ref)=>setcanavas(ref)}
         height={boxSize * 8}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onMouseUp={(e) => e.preventDefault()}
     
     ></canvas>



    </div>
  
  </>
 )
});
