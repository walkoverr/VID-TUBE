console.log("hello from abhishek")
import logger from "./logger.js";
import morgan from "morgan";
import express from 'express'

const app= express();
const PORT=3000;
const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.get('/',(req,res)=>{
    logger.info("someone ask for hello buddy!")
    res.send("hello world!")
})

app.listen(PORT,()=>{
    console.log(`PORT is listening on PORT no-:${PORT}`)
})