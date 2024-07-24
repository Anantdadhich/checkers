import { Router } from "express";


const v1Router=Router()

v1Router.get('/',(req,res)=>{
    res.send("helloooo")
})

export default v1Router;

