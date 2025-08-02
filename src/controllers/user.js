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

const logOutUser= asyncHandler(async()=>{
    //todo later on
    await User.findById(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {new:true}
    )
    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"User log out Successfully!"))

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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword ,newPassword }= req.body;
    if(!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {    
        throw new ApiError(404, "User not found");
    }   
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {},"Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken -__v");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, { user }, "Current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email} = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "Full name, email, and username are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.fullname = fullname;
    user.email = email;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, { user }, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    const user = await User.findById(req.user._id);
    if (!user) {    
        throw new ApiError(404, "User not found");
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }   
    let avatar;
    try {       
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("Avatar uploaded successfully");
    } catch (error) {
        console.error("Error uploading avatar to Cloudinary:", error);
        throw new ApiError(500, "Internal Server Error", "Failed to upload avatar");
    }
    user.avatar = avatar?.url;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, { user }, "Avatar updated successfully"));
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }
    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log("Cover image uploaded successfully");
    } catch (error) {
        console.error("Error uploading cover image to Cloudinary:", error);
        throw new ApiError(500, "Internal Server Error", "Failed to upload cover image");
    }
    user.coverImage = coverImage?.url;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, { user }, "Cover image updated successfully"));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const username = req.params.username;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }
    const channel= await User.aggregate([
        {
            $match: { username: username.toLowerCase() }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            },
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])
    if (!channel || channel.length === 0) {
        throw new ApiError(404, "Channel not found");
    }
    return res.status(200).json(new ApiResponse(200, { channel: channel[0] }, "Channel profile fetched successfully"));   
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)

            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                           from:"users",
                           localField:"owner",
                           foreignField:"_id",
                           as:"owner",
                           pipeline:[
                            {
                                $project:{
                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                           ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])
    return  res.status(200).json(new ApiResponse(200,user[0],"Watch history fetched successfully") )
});

export {
    registerUser,
    userLogin,
    refreshAccessToken,
    logOutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 