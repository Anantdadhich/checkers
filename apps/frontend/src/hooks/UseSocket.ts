import { useEffect, useState } from "react"
import {useUser} from "@repo/store/useUser"

  const WS_URL=import.meta.env.VITE_APP_WS_URL ?? "ws://localhost:8080";

export const useSocket = () => {
   const [soket,setsocket]=useState<WebSocket |null>(null)
   const user=useUser()

useEffect(()=>{
   if(!user) return
   //user available we create the websocket connection 
     const ws= new WebSocket(`${WS_URL}?token=${user.token}`)

     ws.onopen=()=>{
      
        setsocket(ws)
     }
    
     ws.onclose=()=>{

        setsocket(null)
     }

     return ()=>{
        ws.close()
     }
 
},[user])
    return soket
}


