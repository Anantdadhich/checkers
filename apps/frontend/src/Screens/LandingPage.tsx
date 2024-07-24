import { Playcard } from "../components/Playcard"

export const LandingPage = () => {
  return (
    <div className="w-full h-screen mt-0">
      <div className="flex flex-col md:flex-row w-full md:w-3/4 max-w-screen-lg mx-auto p-4 gap-x-4">
        <img
          className="rounded-md w-full md:w-1/2 h-auto md:h-3/4 object-cover hidden md:block lg:rounded"
          src="https://res.cloudinary.com/dcugqfvvg/image/upload/v1713647295/standardboard.1d6f9426_asqzum.png"
          alt="chess-board"
        />
        
        <div className="w-full md:w-1/2 flex items-center justify-center pb-6 ">
          <Playcard />
        </div>
      </div>
    </div>
  )
}
