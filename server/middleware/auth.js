import jwt from "jsonwebtoken"
import User from "../models/User.js"


// Middleware to protect routes


export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token

        if (!token) {
            return res.json({success:false,message:"Token must be provided"})
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password")

        if(!user){
            return res.json({success:false,message:"User not Found"})
        }

        req.user = user
        next()


    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
} 