import Google from '../assets/google.png';
import Github from '../assets/github.png';

import { useNavigate } from "react-router-dom";


const BACKEND_URL=import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

export const Login = () => {
    const navigate=useNavigate()

    const google=()=>{
        window.open(`${BACKEND_URL}/auth/google`,'_self')
    }

    const github=()=>{
        window.open(`${BACKEND_URL}/auth/github`,'_self')
    }
  return (
    <div className="flex flex-col items-center justify-center h-screen  text-white">
      <h1 className='text-4xl font-bold mb-8 text-green-500 drop-shadow-lg text-center '>
        Enter the Game World
      </h1>
      <div className=" rounded-lg shadow-lg p-8 flex flex-col md:flex-row">
          
      <div className='mb-8 md:mb-0 md:mr-8 flex justify-center flex-col space-y-4'>
          
          <div className='flex items-center justify-center chess-board text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 transition-colors duration-300 ' onClick={google}>
            <img src={Google} alt="sign in with google" className='m-6 h-6 mr-2' />
            Sign in With Google
          </div>
          
          <div className='flex items-center justify-center chess-board text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-600 transition-colors duration-300 ' onClick={github}>
            <img src={Github} alt="sign in with google" className='m-6 h-6 mr-2' />
            Sign in With Github
          </div>
      </div>
       <div className='flex items-center md:ml-8 flex-col'>
        <div className='flex items-center mb-8'>
          <div className='bg-gray-600 h-1 w-12 mr-2'></div>
          <span className='text-gray-400'>OR</span>
          <div className='bg-gray-600 h-1 ml-2 w-12'></div>
        </div>
        <input  type="text" placeholder='Username' className='rounded-md mb-4 w-full md:w-64 px-4 py-2 text-slate-800'/>
        <button className='bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300' onClick={()=>{navigate('/game/random')}}>Play as a Guest</button>
       </div>

      </div>
    </div>
  )
}

