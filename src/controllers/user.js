import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
const registerUser= asyncHandler(async (req, res) => {
    //TODO
    const {fullname, email,username, password } = req.body;
     if ([fullname, email, password].some(field => !field || field.trim() === "")) {
  return res.status(400).json({ error: "All fields are required" });
}
 
    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })   
    if(existedUser)
    {
        throw new ApiError(409,"user with email or username already exist")
    }

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath)
    {
        console.log(avatarLocalPath);
        throw new ApiError(400,"Avatar file is missing")
    }

    // const avatar= await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar);
    // let coverImage= ""
    // if(coverLocalPath)
    // {
    //     coverImage= await uploadOnCloudinary(coverLocalPath)
    // }

    let avatar="";
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("avatar uploaded succesfully");
    }
    catch{
        console.log("Error uploading avatar to Cloudinary");
        return res.status(500).json(new ApiResponse(500, "Internal Server Error", "Failed to upload avatar"));
    } 
    
    let coverImage="";
    try{
        coverImage = await uploadOnCloudinary(coverLocalPath);
        console.log("cover uploaded succesfully");
    }
    catch{
        console.log("Error uploading coverImage to Cloudinary");
        return res.status(500).json(new ApiResponse(500, "Internal Server Error", "Failed to upload cover Image"));
    } 
    
   const user= await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"", //optional
        email,      
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken -__v")
    if(!createdUser)
    {
        throw new ApiError(500,"Internal Server Error","User creation failed")
    }
    return res.status(201).json(new ApiResponse(201, "User created successfully", createdUser))


})
export {
    registerUser
}