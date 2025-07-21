import mongoose from 'mongoose'
import{DB_NAME} from '../constants.js'
import dotenv from 'dotenv'

const connectDB= async()=>{
    try{
        const co = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`MongoDB connected! DB host:${co.connection.host}`)
    }
    catch(error){
        console.log("something went wrong in DB connection",error)
        process.exit(1);
    }
}

export {connectDB}