import {Move} from "chess.js"

import {atom } from "recoil"

export const isBoardflippedatom=atom({    //it is represneting whetehr the chessboard is flipped or not
    key:"isboardflippedatom",
    default:false
})
export const Movesatom=atom<Move[]>({  //manages the state of the move made in the game
    key:"moveatom",
    default:[]
})
export const userSelectedMoveIndexAtom=atom<number|null>({
    key:"userSelecetedMoveAtom",
    default:null
})

