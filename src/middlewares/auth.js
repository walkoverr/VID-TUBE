import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";


export const verifyJWT= asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]||req.cookies.accessToken;
    if (!token) {
        throw new ApiError(401, "Access token is missing");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user)
        {
            throw new ApiError(400,"Unauthorized")
        }
        req.user=user
        next();
    }
    catch(error){
        throw new ApiError(401,error?.message ||"Invalid access token")
    }
})