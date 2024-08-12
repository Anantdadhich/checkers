import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { userAtom} from '@repo/store/userAtom';

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();
  const guestNameRef = useRef<HTMLInputElement>(null);
  const setUser = useSetRecoilState(userAtom);

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.open(`${BACKEND_URL}/auth/${provider}`, '_self');
  };

  const loginAsGuest = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: guestNameRef.current?.value || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to login as guest');
      }

      const user = await response.json();
      setUser(user);
      navigate('/game/random');
    } catch (error) {
      console.error('Error logging in as guest:', error);
     
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-textMain">
      <h1 className="text-4xl font-bold mb-8 text-center text-green-500 drop-shadow-lg">
        Enter the Game World
      </h1>
      <div className="bg-bgAuxiliary2 rounded-lg shadow-lg p-8 flex flex-col md:flex-row">
        <div className="mb-8 md:mb-0 md:mr-8 justify-center flex flex-col">
          {['google', 'github'].map((provider) => (
            <button
              key={provider}
              className="flex items-center justify-center px-4 py-2 rounded-md mb-4 cursor-pointer transition-colors hover:bg-gray-600 duration-300"
              onClick={() => handleOAuthLogin(provider as 'google' | 'github')}
            >
              <img src={`${provider}.svg`} alt="" className="w-6 h-6 mr-2" />
              Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center md:ml-8">
          <div className="flex items-center mb-4">
            <div className="bg-gray-600 h-1 w-12 mr-2"></div>
            <span className="text-gray-400">OR</span>
            <div className="bg-gray-600 h-1 w-12 ml-2"></div>
          </div>
          <input
            type="text"
            ref={guestNameRef}
            placeholder="Username"
            className="border px-4 py-2 rounded-md mb-4 w-full md:w-64"
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
            onClick={loginAsGuest}
          >
            Enter as guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;