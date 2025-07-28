import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js"
import fs from'fs';

const generateAccessAndRefreshToken=asyncHandler(async(userId)=>{
   try{
    const user= User.findById(userId);
    if(!user)
    {
        throw new ApiError("400","user not found!")
    }
    const refreshToken= User.generateRefreshToken();
    const accessToken = User.generateAccessToken();
    user.refreshToken= this.refreshToken;
    await user.save({validateBeforeSave:false})
    return {accessToken, refreshToken}
    }
   catch(error){
    throw new ApiError(500 , "something went wrong while generating the tokens!")
   }
})

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
        // fs.unlinkSync(FilePath)
        console.log("nimbuda");
        throw new ApiError(409,"user with email or username already exist")
    }

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath)
    {
        console.log(avatarLocalPath);
        throw new ApiError(400,"Avatar file is missing")
    }
    let avatar="";
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log(avatar)
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
    
   try{
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
}
   catch(error){
    console.log("user Creation Failed");
    if(avatar)
    {
        await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage)
    {
        await deleteFromCloudinary(coverImage.public_id)
    }
    throw new ApiError(500,"something went wrong and images are deleted from cloudinary")
   }
})


const userLogin= asyncHandler(async(req,res)=>{
    const {email,username,password}= req.body
    if(!email||!username||!password)
    {
        throw new ApiError(400,"all fields are required!")
    }
    const user = User.findOne(username=> username=this.username)
    if(!user)
    {
        throw new ApiError(400,"user not found! please Register")
    }
    //validate password
    const isPasswordValid= User.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(401,"Oops! Invalid Credentials ")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser= await User.findById(user._id).select("-password -refreshToken -__v")
    if(!loggedInUser)
    {
        throw new ApiError(500,"something went wrong")
    }

    const options={
        httpOnly:true,
        secure: process.env.NODE_ENV==='production'
    }
    return res 
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User Logged In Successfully!"))
})

const logoutUser= asyncHandler(async()=>{
    //todo later on
})


const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken|| req.body;
    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Please Login to continue")
    }
    try{
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken.userId);
        if(!user || user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .set(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { user, accessToken, newRefreshToken }, "Access Token Refreshed Successfully!"));
    }catch(error){
        console.error("Error refreshing access token:", error);
        throw new ApiError(500, "Internal Server Error", "Failed to refresh access token");

    }
})


export {
    registerUser,
    userLogin,
    refreshAccessToken
}