import { Square } from "chess.js";


const calculateindexX=(square:string,isFlipped:boolean,Squarenumber:number)=>{
  
    let columnIndex=square.charCodeAt(0) - 'a'.charCodeAt(0)   //column letter to index

    if(isFlipped){
        columnIndex=7-columnIndex   //reverse the column index if board if flipped

    }

    return columnIndex*Squarenumber+Squarenumber/2

}

const calculateindexY=(square:string,isFlipped:boolean,Squarenumber:number)=>{

let rowIndex=8-parseInt(square[1])

if(isFlipped){
    rowIndex=7-rowIndex
}
return rowIndex*Squarenumber+Squarenumber/2

}

export const drawArrow=({ctx,isFlipped,Squarenumber,end,start}:{
    ctx:CanvasRenderingContext2D,
    start:string,
    end:string,
    isFlipped:boolean,
    Squarenumber:number
})=>{

  const startX = calculateindexX(start, isFlipped, Squarenumber);
  const startY = calculateindexY(start, isFlipped, Squarenumber);
  const endX = calculateindexX(end, isFlipped,Squarenumber);
  const endY = calculateindexY(end, isFlipped, Squarenumber);

  ctx.beginPath()
  ctx.moveTo(startX,startY)
  ctx.lineTo(endX,endY)
  ctx.strokeStyle = '#EC923F';
  ctx.lineWidth = 2;
  ctx.stroke();
  //for arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
  const arrowheadSize = 15; // Adjust arrowhead size as needed
  const arrowheadX1 = endX - arrowheadSize * Math.cos(angle - Math.PI / 6);
  const arrowheadY1 = endY - arrowheadSize * Math.sin(angle - Math.PI / 6);
  const arrowheadX2 = endX - arrowheadSize * Math.cos(angle + Math.PI / 6);
  const arrowheadY2 = endY - arrowheadSize * Math.sin(angle + Math.PI / 6);

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(arrowheadX1, arrowheadY1);
  ctx.moveTo(endX, endY);
  ctx.lineTo(arrowheadX2, arrowheadY2);
  ctx.strokeStyle = '#EC923F';
  ctx.lineWidth = 2;
  ctx.stroke();
}