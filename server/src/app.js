import express from "express"
import cors from "cors"

const app=express()

app.use(cors(
    {
        origin:[
            "http://localhost:5173/",
            "http://localhost:5174/",
            "http://localhost:3000/",
            // add production URL
            

        ]
    }
))

app.use(express.json())

app.get("/",(req,res)=>{
    res.json({
        message:"Backend is Running"
    })
})

app.get("/api/message",(req,res)=>{
    res.json({
        message:"Hello World!"
    })
})

export default app