import User from '../models/userModel.js';
import jwt from "jsonwebtoken";

const JWT_SECRET=process.env.JWT_SECRET; // ye secret key ko environment variable se le raha h

export default async function authMiddleware(req,res,next){
    //grab the token 
    const authHeader=req.headers.authorization; // ye authorization header se token ko grab krta h
    if(!authHeader || !authHeader.startsWith("Bearer ")){ 
        return res.status(401).json({
            success:false,
            message:"Not authorized or token is missing."
        })
    }

    const token=authHeader.split(" ")[1]; // ye token ko split kr rha h jaise ki "Bearer <token>" me se token ko le rha h

    // to verify the token
    try{
        const payload=jwt.verify(token,JWT_SECRET); // ye token ko verify krta h
        const user=await User.findById(payload.id).select("-password"); // ye user ko find krta h aur password ko exclude krta h
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not found."
            })
        }
        req.user=user; // ye user ko request object me save kr deta h
        next(); // ye request ko controller me bhejta h
    }
    catch(error){
        console.error("JWT verification failed:",error);
        return res.status(401).json({
            success:false,
            message:"Token is invalid or expired."
        })

    }
}