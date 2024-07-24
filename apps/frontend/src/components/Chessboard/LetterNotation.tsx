

export const LetterNotation = ({label,isMainBoxColor}:{
    label:string,
    isMainBoxColor:boolean
}) => {
  return (
    <div className={`font-bold absolute ${isMainBoxColor  ? 'text-[#739552]' : 'text-[#EBEDD0]'} ring-0.5 bottom-0`}>
         {label}
    </div>
  )
}

