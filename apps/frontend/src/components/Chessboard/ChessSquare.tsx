import { Color, PieceSymbol, Square } from "chess.js"


export const ChessSquare = ({square}:{square:{
    square:Square,
    type:PieceSymbol,
    color:Color
}}) => {
  return (
    <div className="h-full justify-center flex flex-col ">
      {square ? (
        <img
          className="w-14"
          src={`/${square?.color === 'b' ? `b${square.type}` : `w${square.type}`}.png`}
        />
      ) : null}
    </div>

  )
}


