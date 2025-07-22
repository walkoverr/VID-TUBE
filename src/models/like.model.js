import mongoose,{Schema} from 'mongoose' 

const likesSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        required: true
    },
    video: {
        type: Schema.Types.ObjectId,    
        ref: "Video",
        required: true
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tweet: {
        type: Schema.Types.ObjectId,    
        ref: "Tweet",
        required: true
    }
}, {timestamps: true, versionKey: false})

export const Like = mongoose.model("Like",likesSchema)