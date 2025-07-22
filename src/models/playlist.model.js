import mongoose,{Schema} from 'mongoose' 

const playlistSchema = new Schema({
    name: {
        type: String,   
        required: true,
        trim: true,
        lowercase: true,
        index: true 
    },
    description: {
        type: String,   
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }]  
}, {timestamps: true, versionKey: false})

export const Playlist = mongoose.model("Playlist",playlistSchema)