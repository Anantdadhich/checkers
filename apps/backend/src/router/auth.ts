import { Router,Response,Request } from "express";
import passport from "passport";
import jwt from 'jsonwebtoken'
import { db } from "../db";


const router=Router()

const CLIENT_URL=process.env.AUTH_REDIRECT_URL ??'http://localhost:5173/game/random' 
const JWT_SECRET=process.env.JWT_SECRET_KEY ||"your_secret_key"

interface User {
    id:string;
}

router.get('/refresh',async (req:Request,res:Response)=>{
  
     //check if user present in the 
    if(req.user){
        const user=req.user as User

        const userDb=await db.user.findFirst({
            where:{
                id:user.id
            },
        });

        const token=jwt.sign({userId:user.id  },JWT_SECRET)

        res.json({
            token,
            id:user.id,
            name:userDb?.name
        });
 }   else{
       res.status(401).json({
        succuss:"false",
        message:"unauthorized"
       })
 }
})

router.get("/login/failed",async(req:Request,res:Response)=>{
      res.status(401).json({
        succuss:"false",
        message:"login failed"
       })
})

router.get("logout",async(req:Request,res:Response)=>{
    req.logOut((err)=>{
        if(err){
            console.error("error logging out",err);
            res.status(500).json({message:"not logingnout"})
        }else{
            res.clearCookie('jwt');
            res.redirect('http://localhost:5173/')
        }
    })
})
   //call the auth from passpot auth library
router.get(
  '/google',   
  passport.authenticate('google', { scope: ['profile', 'email'] }), 
 //permission req from user 
);


//redirects to google auth page if permission grant then it send to callback

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

router.get(
  '/github',
  passport.authenticate('github', { scope: ['read:user', 'user:email'] }),
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  }),
);

export default router;