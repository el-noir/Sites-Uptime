import express from "express"
import dotenv from "dotenv"
import { authMiddleware } from "./auth"
import { prismaClient } from "db/client"

const app = express()

dotenv.config({
    path: "./.env"
})

app.use(express.json());

app.post("/api/v1/website", authMiddleware, async (req, res)=>{
    const userId= req.userId!;
    const url = req.body;

  const data = await prismaClient.website.create({
         data:{
            url,
            userId: userId,
            disabled: false
         }
    })

    res.json({
        id:data.id
    })
})

app.get("/api/v1/website/status",authMiddleware, async (req, res)=>{
    const websiteId = req.query.websiteId as string;
    const userId = req.userId;

    const data = await prismaClient.website.findFirst({
        where:{
            id:websiteId,
            userId
        },
        include:{
            ticks:true
        }
    })

    res.json(data)
})

app.get("/api/v1/websites",authMiddleware, async (req, res)=>{
      const userId = req.userId!;

      const websites= await prismaClient.website.findMany({
        where: {
            userId,
            disabled: false
        }
      })

      res.json({
        websites
      })
})

app.delete("/api/v1/website",authMiddleware, async (req, res)=>{
   const websiteId = req.query.websiteId as string;
   const userId = req.userId!;

   await prismaClient.website.update({
    where: {
        id: websiteId,
        userId
    },
    data:{
        disabled: true
    }
   })
   res.json({
    message: "Website deleted successfully"
   })
})

const port = process.env.PORT || 5000

app.listen(port, ()=>{
    console.log(`Api Server is listening on ${port}`);
})