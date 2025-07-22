import express from 'express'
import cors from 'cors'
const app = express();

import logger from "./logger.js";
import morgan from "morgan";

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


app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        credentials:true 
    })
)

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

//routes

import healthCheckRouter from "./routes/healthCheck.js"

//routes
app.use("/api/v1/healthcheck",healthCheckRouter)

export {app}