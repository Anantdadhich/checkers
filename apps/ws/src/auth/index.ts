import  jwt from "jsonwebtoken";

const JWT_SECERET=process.env.JWT_SECRET_KEY ||"your-secret-key"

export const extractUserId=(token:string)=>{
    const decoded=jwt.verify(token,JWT_SECERET) as {userId:string};
    return decoded.userId
}
