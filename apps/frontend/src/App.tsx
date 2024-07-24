import { BrowserRouter, Route, Routes } from "react-router-dom"
import { LandingPage } from "./Screens/LandingPage"
import { GamingPage } from "./Screens/GamingPage"
import { Suspense } from "react"
import { RecoilRoot } from "recoil"
import { Layout } from "./layout"
import { Loader } from "./components/Loader"
import { Login } from "./Screens/Login"

function App(){
  return (
    <div className="min-h-screen bg-stone-800">
       <RecoilRoot>
        <Suspense fallback={<Loader></Loader>}>
          <AppAuth></AppAuth>
        </Suspense>
       </RecoilRoot>
    </div>
  )
}


function AppAuth() {
  

  return (
    <div className="h-screen bg-zinc-800">
    <BrowserRouter >
      <Routes>
        <Route path="/" element={<Layout children={<LandingPage></LandingPage>}></Layout>} ></Route>
        <Route path="/login" element={<Login ></Login>}/>
        <Route path="/game/:gameId" element={<Layout children={<GamingPage></GamingPage>}></Layout>}/> 

     
      </Routes>
    </BrowserRouter>
       
    </div>
  )
}

export default App
