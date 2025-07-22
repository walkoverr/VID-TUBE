import mongoose,{Schema} from 'mongoose' 

const subscriptionSchema = new Schema({
   subscriber: {  //user who is subscribing
        type: Schema.Types.ObjectId,    
        ref: "User",
        required: true  
    },
    channel: {   //channel being subscribed to
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true, versionKey: false})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)