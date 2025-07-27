import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY
});
 const uploadOnCloudinary = async (localFilePath) => {
    try{
        console.log("Uploading file to Cloudinary:", localFilePath);
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:"auto"
            }
    )
    console.log("File uploaded on cloudinary. File src:" + response.url)
    fs.unlinkSync(localFilePath)
    return response 

    }
    catch(error){
        console.log("Error uploading file to Cloudinary:", error);
        fs.unlinkSync(localFilePath)
        return null
    }
};
const deleteFromCloudinary = async (publicId) => {
    try {
        const response = await cloudinary.uploader.destroy(publicId)
        console.log("File deleted from Cloudinary:", response);
        
        // return response;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
};

export {uploadOnCloudinary, deleteFromCloudinary};
