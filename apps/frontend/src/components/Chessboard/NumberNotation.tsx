

export const NumberNotation = ({label,isMainBoxcolor}:{label:string,isMainBoxcolor:boolean}) => {
  return (
    <div className={`font-bold absolute ${isMainBoxcolor ? 'text-[#739552]' : 'text-[#EBEDD0]'}`}>
        {label}
    </div>
  )
}

