import { useLayoutEffect, useState } from "react"


export const useWindowSize=()=>{
    const [windowsize,setwindowsize]=useState({width:0,height:0})
    
    const handleSize=()=>{
        setwindowsize({
            height:window.innerHeight,
            width:window.innerWidth
        })
    }

    useLayoutEffect(()=>{
        handleSize()

        window.addEventListener('resize',handleSize)

        return ()=> window.removeEventListener('resize',handleSize)
    },[])
    
    return windowsize

}