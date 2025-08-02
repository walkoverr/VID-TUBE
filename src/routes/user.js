import {Router} from 'express'

import {registerUser,logOutUser, changeCurrentPassword, getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserCoverImage, getWatchHistory} from '../controllers/user.js'
import{verifyJWT} from '../middlewares/auth.js'

import {upload} from "../middlewares/multer.js"

const router = Router();


//unsecured routes
router.post("/registerUser",upload.fields([{
    name:"avatar",
    maxCount:1
},
{
    name:"coverImage",
    maxCount:1
}
]),registerUser);

router.post('/login',loginUser)
router.post("/refresh-token",refreshAccesToken)

//secured routes
router.post("/logout",verifyJWT,logOutUser)
router.post("/change-password",changeCurrentPassword)
router.get("/current-user",verifyJWT,getCurrentUser)
router.get("/c/:username",verifyJWT,getUserChannelProfile)
router.patch("/update-account",verifyJWT,updateAccountDetails)
router.patch("/avatar",verifyJWT,upload.single("avatar"),updateUserAvatar)
router.patch("/cofver-image",verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.get("/history",verifyJWT,getWatchHistory)


export default router

