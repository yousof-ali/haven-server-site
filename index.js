const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lewcb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(url,{
    serverApi:{
        version:ServerApiVersion.v1,
        strict:true,
        deprecationErrors:true,
    }
})

async function run(){
    try{

        await client.connect();

        const estateCollections = client.db("haven").collection("homes");
        const userCollections = client.db("haven").collection("users");


        app.get('/homes',async(req,res) => {
            const cursor = estateCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/details/:id',async(req,res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const result = await estateCollections.findOne(query);
            res.send(result)
        })

        app.get('/properties',async(req,res) => {
            const qbody = req.query.sortBy;
            let result;
            if(qbody == 'all'){
                 result = await estateCollections.find().toArray();
                
            }
            else if(qbody == "hp"){
                result = await estateCollections.find().sort({price: -1}).toArray();
            }
            else if(qbody == "lp"){
                result = await estateCollections.find().sort({price: 1}).toArray();
            }
            else if(qbody == 'rent'){
                const query = {status:"Rent"};
                 result = await estateCollections.find(query).toArray();
                
            }
            else if(qbody == 'sale'){
                const query = {status:"Sale"};
                 result = await estateCollections.find(query).toArray();
                
            }
            res.send(result);
        })

        console.log('connected with mongodb successfully');
        
    }finally{
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/',(req,res) => {
    res.send("Haven server is running!");
})
app.listen(port,() => {
    console.log(`haven is running on port ${port}`);
})