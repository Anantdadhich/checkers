import { MouseEventHandler, ReactNode } from "react"

interface Gamecompo{
    icon:ReactNode,
    title:string,
    description:string,
   disabled:boolean,
    onclick?:MouseEventHandler<HTMLDivElement>
}



export const GameModelcomponent = ({icon,title,description,disabled,onclick}:Gamecompo) => {
  return (
    <div onClick={onclick}  className="-mx-2 mt-1 bg-green-700 flex items-start space-x-4 rounded-sm p-2 transition-all hover:bg-green-500 hover:text-accent-foreground shadow-lg">
       {icon}
       <div className="space-y-1">
       <p className="text-sm font-medium leading-none text-slate-100 pt-1 lg:font-bold">{title}</p>
       <p className="text-xs pt-2 text-muted-foreground text-slate-900"  >  {description} </p>
       {disabled && (
        <p className="text-xs text-red-500 font-semibold"> comming..sonn</p>
       )}
       </div>
    </div>
  )
}

