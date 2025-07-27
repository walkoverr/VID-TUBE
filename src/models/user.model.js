import mongoose,{Schema} from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
const userSchema = new Schema({
    username: {
        type: String,   
        required: true,
        unique: true,   
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,   
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    refreshToken: {
        type: String,
    }
},{timestamps: true, versionKey: false});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password= bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password); 
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
    {
        userId: this._id,
        username: this.username,
        email: this.email,
        fullname: this.fullname
    }, 
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
)
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
    {
        userId: this._id,
    }, 
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
)
}

export const  User  = mongoose.model("User",userSchema)