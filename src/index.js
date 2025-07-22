import dotenv from 'dotenv'
import {app} from './app.js'
import {connectDB} from './db/index.js'



dotenv.config()

console.log(process.env.PORT)

connectDB().then(()=>{
app.listen(PORT,()=>{
    console.log("hello")
    console.log(`server is listening on port No-:${PORT}`)
})
}).catch(()=>{
console.log("Database not connected")
})
const PORT = process.env.PORT || 8001;

