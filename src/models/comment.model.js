import mongoose,{Schema} from 'mongoose' 
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
const commentsSchema = new Schema({
    content: {
        type: String,   
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {timestamps: true, versionKey: false})

commentsSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment",commentsSchema)