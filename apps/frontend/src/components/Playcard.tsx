import { useNavigate } from "react-router-dom"
import chessIcon from '../../public/chess.png';
import computerIcon from '../../public/computer.png';
import lightningIcon from '../../public/lightning-bolt.png';
import friendIcon from '../../public/friendship.png';

import {
  Card,
  CardContent,
  CardDescription,
 
  CardHeader,
  CardTitle,
} from "./ui/card"
import { GameModelcomponent } from "./GameModelcomponent";



export const Playcard = () => {
      const navigate =useNavigate() 

    const gamemodel=[
        {
            icon:(
                <img src={lightningIcon} alt="lightgicon" className="inline-block mt-1 h-7 w-7" />
            ),
            title:'Play online',
            description:'play with random people',
            onclick:()=>{
                navigate('game/random')
            },
            disabled:false
        },
         {
            icon:(
                <img src={computerIcon} alt="lightgicon" className="inline-block mt-1 h-7 w-7" />
            ),
            title:'Play with Computer',
            description:'play with machine',
            onclick:()=>{
                navigate('game/random')
            },
            disabled:false
        }, {
            icon:(
                <img src={friendIcon} alt="lightgicon" className="inline-block mt-1 h-7 w-7" />
            ),
            title:'Play online with friends ',
            description:'play with random people',
            onclick:()=>{
                navigate('game/random')
            },
            disabled:false
        }
        
        
    ]



  
  return (
  <Card className="bg-transparent border-none">
      <CardHeader className="text-center shadow-md text-white pb-3 rounded-t-md">
        <CardTitle className="font-semibold tracking-wide flex flex-col items-center justify-center">
          <p >
            Play
            <span className="text-green-700 font-bold pt-1"> Chess</span>
          </p>
          <img src={chessIcon} alt="chess icon" className="pl-1 w-1/3 mt-1" />
        </CardTitle>
        <CardDescription className="mt-2 text-gray-300">Enjoy the game with friends and family.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 cursor-pointer shadow-md mt-1 p-4 rounded-b-md">
        {gamemodel.map((data) => (
          <GameModelcomponent  {...data} />
        ))}
      </CardContent>
    </Card>  )
}


