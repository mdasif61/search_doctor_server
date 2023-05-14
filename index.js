const express=require('express');
const app=express();
const port=process.env.PORT || 5000;
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

async function run() {
  try {
    await client.connect();
    
    const doctorCollection=client.db('doctors').collection('doctorService');
    const bookedCollection=client.db('serviceBooked').collection('booking');

    app.get('/service',async(req,res)=>{
        const cursor=doctorCollection.find();
        const result=await cursor.toArray();
        res.send(result);
    });

    app.get('/service/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)};
        const result=await doctorCollection.findOne(query);
        res.send(result)
    });

    app.get('/bookings',async(req,res)=>{
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