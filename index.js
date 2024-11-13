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
        const bookmarksCollections = client.db("haven").collection('bookmarks')


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

        app.get('/segment',async(req,res) => {
            const opt = req.query.option;
            let result;
            if(opt == 'student-housing'){
               const query = {segment_name:'Student Housing'};
               result = await estateCollections.find(query).toArray();
            }
            else if(opt == 'vacation-rentals'){
                const query = {segment_name:'Vacation Rentals'};
               result = await estateCollections.find(query).toArray();
            }
            else if(opt == 'family-house'){
                const query = {segment_name:'Single Family Homes'};
               result = await estateCollections.find(query).toArray();
            }
            else if(opt == 'townhouse'){
                const query = {segment_name:'Townhouse'};
               result = await estateCollections.find(query).toArray();
            }
            else if(opt == 'apartments'){
                const query = {segment_name:'Apartment'};
               result = await estateCollections.find(query).toArray();
            }
           
            res.send(result);
        });
        
        app.post('/bookmarks',async(req,res) => {
            const body = req.body
            const query1 = {email:body.email};
            const query2 = {bookmarkId:body.bookmarkId};
            const result1 = await bookmarksCollections.find(query1).toArray();
            const result2 = await bookmarksCollections.find(query2).toArray();
            if(result1.length && result2.length<1){
                 const result = await bookmarksCollections.insertOne(body);
                res.send(result);
            }else if(result1.length<1) {
                 const result = await bookmarksCollections.insertOne(body);
                 res.send(result);
            }else{
                res.send({status:"bookmarked"})
            }
           
        })
        
        app.get('/bookmark',async(req,res) => {
            const emails = req.query.email
            const query = {email : emails}
            const result = await bookmarksCollections.find(query).toArray()
            res.send(result);
        })

        app.delete('/delete-bookmark/:id',async(req,res) => {
            const ids = req.params.id;
            const query = {_id : new ObjectId(ids)};
            const result = await bookmarksCollections.deleteOne(query);
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