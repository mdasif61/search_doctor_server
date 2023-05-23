const express=require('express');
const app=express();
const port=process.env.PORT || 5000;
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt=require('jsonwebtoken');
require('dotenv').config()

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Search Doctor Server Running")
});
// search_doctor
// 8nSa4IH5vCnMJW1I

const uri = "mongodb+srv://search_doctor:8nSa4IH5vCnMJW1I@cluster0.kuomool.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT=(req,res,next)=>{
    const authorization=req.headers.authorization;
    if(!authorization){
      return res.send({error:true, message:'unauthorized'})
    }
    const token=authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN,(error,decoded)=>{
      if(error){
        return res.send({error:true, message:'unauthorized'})
      }
      req.decoded=decoded;
      next()
    })
}

async function run() {
  try {
    await client.connect();
    
    const doctorCollection=client.db('doctors').collection('doctorService');
    const bookedCollection=client.db('serviceBooked').collection('booking');

    app.get('/service',async(req,res)=>{
        const page=parseInt(req.query.page) || 0;
        const limit=parseInt(req.query.limit) || 2;
        const skip=page*limit;
        const result=await doctorCollection.find().skip(skip).limit(limit).toArray()
        res.send(result);
    });

    app.get('/totalService',async(req,res)=>{
        const result=await doctorCollection.estimatedDocumentCount();
        res.send({total:result})
    })

    app.get('/service/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)};
        const result=await doctorCollection.findOne(query);
        res.send(result)
    });

    app.get('/bookings', verifyJWT ,async(req,res)=>{

        const decoded=req.decoded;
        if(decoded.email!==req.query.email){
          return res.send({error:true, message:'unauthorized'})
        }

        let query={};
        if(req.query?.email){
          query={email:req.query.email}
        }
        const result=await bookedCollection.find(query).toArray();
        res.send(result)
    });

    app.post('/bookings',async(req,res)=>{
        const service=req.body;
        const result=await bookedCollection.insertOne(service);
        res.send(result)
    });

    app.post('/addService',async(req,res)=>{
      const doctors=req.body
      const result=await doctorCollection.insertOne(doctors);
      res.send(doctors)
    })

    app.get('/myServices',async(req,res)=>{
      let query={}
      if(req.query?.email){
        query={providerEmail:req.query.email}
      }
      const result=await doctorCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/jwt', (req,res)=>{
        const user=req.body;
        const token=jwt.sign( user, process.env.ACCESS_TOKEN, {
          expiresIn:'5h'
        });
        res.send({token})
    })

    app.patch('/bookings/:id',async(req,res)=>{
        const id=req.params.id;
        const filter={_id:new ObjectId(id)};
        const updateBook=req.body;
        const update={
          $set:{
            status:updateBook.status
          }
        };
        const result=await bookedCollection.updateOne(filter,update);
        res.send(result)
    })

    app.delete('/bookings/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await bookedCollection.deleteOne(query);
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log("server is running port : ",port)
})