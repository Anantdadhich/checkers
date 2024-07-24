import React from "react"


export const Button = ({onClick,children}:{onClick:()=>void ,children:React.ReactNode}) => {

  return <button onClick={onClick} className="bg-green-500 text-white font-bold hover:bg-green-700 py-4 px-8 rounded">
          {children}
                </button>
}


