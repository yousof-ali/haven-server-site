const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;



app.use(cors({
    origin:[
        'http://localhost:5173',
        'http://localhost:5174',
        'https://haven-d2f54.web.app',
        'https://haven-d2f54.firebaseapp.com'
    ],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());


const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lewcb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(url,{
    serverApi:{
        version:ServerApiVersion.v1,
        strict:true,
        deprecationErrors:true,
    }
});

const cookieOption = {
    httpOnly:true,
    sameSite:process.env.NODE_ENV === 'production'?'none':'strict',
    secure:process.env.NODE_ENV === 'production'? true:false
  };


//   middlewares
const verifyToken = (req,res,next) => {
    const tok = req.cookies.token
    if(!tok) {
        return res.status(401).send({message:"Unauthorized"});
    };
    jwt.verify(tok,process.env.ACCESS_TOKEN_SECRET,(err,decoded) => {
        if(err){
            return res.status(401).send({message:"Unauthorized access"});
        };
        req.user = decoded;
        next()
    })
}

async function run(){
    try{

        // await client.connect();

        const estateCollections = client.db("haven").collection("homes");
        const userCollections = client.db("haven").collection("users");
        const bookmarksCollections = client.db("haven").collection('bookmarks');
        const newEstateCollections = client.db("haven").collection('newEstate');
        const bookingCollections = client.db('haven').collection('booking');
        // const userCollections = client.db("haven").collection("users");
         

        // cookie
        // create a cookie 
        app.post('/jwt',async(req,res) => {
            const userEmail = req.body
            const token = jwt.sign(userEmail,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'3h'});
            

            res
            .cookie('token',token,cookieOption)
            .send({createToken:token});
        });

        app.post('/logout',async(req,res) =>{
            
            res
            .clearCookie('token',{...cookieOption,maxAge:0})
            .send({removedToken:true});
        })


        // estateCollections

        app.get('/homes',async(req,res) => {
            const result = await estateCollections.find().toArray();
            res.send(result);
            
        });

        app.delete('/delete-estate/:id',async(req,res) => {
            const ids = req.params.id;
            const query = {_id : new ObjectId(ids)}
            const result = await estateCollections.deleteOne(query);
            res.send(result);
        })

        // for pagination

        app.get('/sale-rent',async(req,res) => {
            const query = req.query.searchBy
            let result
            if(query !== 'rent' && query!=='sale'){
                result= await estateCollections.find().toArray();

            }else{
                if(query == 'rent'){
                    const query = {status:"Rent"};
                    result = await estateCollections.find(query).toArray();

                }else if(query == 'sale'){
                    const query = {status:"Sale"};
                    result = await estateCollections.find(query).toArray();
                }
            }
            

            res.send({total:result.length})     
        });

        app.get('/pagination',async(req,res) => {
            const pageNo = parseInt(req.query.page)
            const dataLength = parseInt(req.query.size)
            const sortedBy = req.query.sortBy
            
            let result
            if(sortedBy =='all'){
                result = await estateCollections.find().skip(pageNo*dataLength).limit(dataLength).toArray()

            }
            else if(sortedBy == 'hp'){
                result = await estateCollections.find().skip(pageNo*dataLength).limit(dataLength).sort({price: -1}).toArray();
            }
            else if(sortedBy == 'lp'){
                result = await estateCollections.find().skip(pageNo*dataLength).limit(dataLength).sort({price: 1}).toArray();
            }
            else if(sortedBy == 'rent'){
                const query = {status:"Rent"};
                 result = await estateCollections.find(query).skip(pageNo*dataLength).limit(dataLength).toArray();
                
            }
            else if(sortedBy == 'sale'){
                const query = {status:"Sale"};
                 result = await estateCollections.find(query).skip(pageNo*dataLength).limit(dataLength).toArray();
            }

            res.send(result);
        });

        app.get('/homes-length',async(req,res) => {
            const count = await estateCollections.estimatedDocumentCount();
            res.send({count});

        });

        app.get('/details/:id',async(req,res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const result = await estateCollections.findOne(query);
            res.send(result)
        });

        app.put('/update/:id',async(req,res) => {
            const id = req.params.id;
            const {area,description,facilities,img,location,price,segment_name,status,title} = req.body
            console.log(id);
            const result = await estateCollections.findOneAndUpdate(
                {_id:new ObjectId(id)},
                {$set: {area:area,
                    description:description,
                    facilities:facilities,
                    img:img,
                    location:location,
                    price:price,
                    segment_name:segment_name,
                    status:status,
                    title:title
                }},
                {   
                    new:true,
                    upsert:true
                }
            )
            res.send(result);
        })
       
        app.get('/aproved',async(req,res) => {
            const query = req.query.email
            const query2 = {email:query};
            const result = await estateCollections.find(query2).toArray();
            res.send(result);
        })

        app.post('/addnew-estate', async(req,res) => {
            const newEstate = req.body;
            const result = await estateCollections.insertOne(newEstate);
            res.send(result)
        })

        // app.get('/properties',async(req,res) => {
        //     const qbody = req.query.sortBy;
        //     let result;
        //     if(qbody == 'all'){
        //          result = await estateCollections.find().toArray();
                
        //     }
        //     else if(qbody == "hp"){
        //         result = await estateCollections.find().sort({price: -1}).toArray();
        //     }
        //     else if(qbody == "lp"){
        //         result = await estateCollections.find().sort({price: 1}).toArray();
        //     }
        //     else if(qbody == 'rent'){
        //         const query = {status:"Rent"};
        //          result = await estateCollections.find(query).toArray();
                
        //     }
        //     else if(qbody == 'sale'){
        //         const query = {status:"Sale"};
        //          result = await estateCollections.find(query).toArray();
                
        //     }
        //     res.send(result);
        // })

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



        // bookmarksCollections
        app.post('/bookmarks',async(req,res) => {
            const body = req.body
            const query1 = {email:body.email};
            
            const result1 = await bookmarksCollections.find(query1).toArray();
            const filter = result1.filter(single => single.bookmarkId == body.bookmarkId);
            if(filter.length<1){
                const result = await bookmarksCollections.insertOne(body);
                res.send(result);
            }else{
                res.send({status:"bookmarked"});
            }
            // console.log(result);
            // const result2 = await bookmarksCollections.find(query2).toArray();
            // console.log(result2);
            // if(result1.length && result2.length<1){
                //  const result = await bookmarksCollections.insertOne(body);
                // res.send(result);
            // }else if(result1.length<1) {
            //     //  const result = await bookmarksCollections.insertOne(body);
            //     //  res.send(result);
            // }else{
            //     // res.send({status:"bookmarked"})
            // }
           
        });
        
        app.get('/bookmark',verifyToken,async(req,res) => {
            if(req.query.email !== req.user.email){
                return res.status(403).send({message:'forbidden access'});
            };
            const emails = req.query.email;
            const query = {email : emails};
            const result = await bookmarksCollections.find(query).toArray();
            res.send(result);
        });

        app.delete('/delete-bookmark/:id',async(req,res) => {
            const ids = req.params.id;
            const query = {_id : new ObjectId(ids)};
            const result = await bookmarksCollections.deleteOne(query);
            res.send(result);
        });


        // usersCollections
        app.post('/users',async(req,res) => {
            const usersBody = req.body
            const query = {email:usersBody.email};
            const query2 = {providerId:usersBody.providerId}
            const filter = await userCollections.find(query).toArray();
            const filter2 = await userCollections.find(query2).toArray();
            if(filter.length>=1 && filter2.length>=1){
                res.send({alreadyTaken:true})
            }else{
            const result = await userCollections.insertOne(usersBody);
            res.send(result);
            
            }
        });

        app.get('/users',async(req,res) => {
            const result = await userCollections.find().toArray();
            res.send(result)
        });

        app.delete('/user-delete/:id',async(req,res) => {
            const deleteId = req.params.id
            const query = {_id:new ObjectId(deleteId)};
            const result = await userCollections.deleteOne(query);
            res.send(result);
        })

        app.put("/update-profile",async(req,res) => {
            const query = req.query.email;
            const {name,photo} = req.body;
           
            const updateObject = await userCollections.findOneAndUpdate(
                {email:query},
                {$set: {displayName:name,photoURL:photo}},
                {   
                    new:true,
                    upsert:true
                }
            );
             
            res.send({update:true});
        });

        app.put('/update-lastlogin',async(req,res) => {
            const query = req.query.email
            const {lastSignInTime} =req.body
            const updateLastLogin = await userCollections.findOneAndUpdate(
                {email:query},
                {$set: {lastSignInTime:lastSignInTime}},
                {
                    new:true,
                    upsert:true
                }
            );
            res.send({update:true});
        });


       
        // newEstate collections
        app.post('/sale-rent-request',async(req,res) => {
            const neweState = req.body;
            const result = await newEstateCollections.insertOne(neweState);
            res.send(result);
        });
        app.get('/get-newestate',async(req,res) => {
            const result = await newEstateCollections.find().toArray();
            res.send(result);
        });

        app.get('/newEstate',async(req,res) =>{
            const query = req.query.email;
            const query2 = {email:query};
            const result = await newEstateCollections.find(query2).toArray();
            res.send(result);
        })

        app.get('/pending-details/:id',async(req,res) => {
            const ids = req.params.id;
            const query = {_id:new ObjectId(ids)};
            const result = await newEstateCollections.findOne(query);
            res.send(result);
        });
        
        app.put('/pending-update/:id',async(req,res) => {
            const ids = req.params.id;
            const {requestStatus,img,title,segment_name,description,price,status,area,location,facilities} = req.body          
            const result = await newEstateCollections.findOneAndUpdate(
                {_id : new ObjectId(ids)},
                {$set: {area:area,
                    description:description,
                    facilities:facilities,
                    img:img,
                    location:location,
                    price:price,
                    segment_name:segment_name,
                    status:status,
                    title:title,
                    requestStatus:requestStatus
                }},
                {
                    new:true,
                    upsert:true
                }

            );
            res.send(result);
        });


        app.put('/admin-aprove/:id',async(req,res) => {
             const ids = req.params.id;
            
             const {requestStatus} = req.body
             const result = await newEstateCollections.findOneAndUpdate(
                {_id : new ObjectId(ids)},
                {$set: {requestStatus:requestStatus
                }},
                {
                    new:true,
                    upsert:true
                });
            res.send(result);    
        });



        // bookingCollections
        app.post('/booking',async(req,res) => {
            const body = req.body
            const result = await bookingCollections.insertOne(body)
            res.send(result);
        });

        app.get('/all-bookings',async(req,res) => {          
                 const result = await bookingCollections.find().toArray()
                 res.send(result);
        });

        
        app.get('/bookings/person',verifyToken,async(req,res) => {
            if(req.query.email !== req.user.email){
                return res.status(403).send({message:'forbidden access'});
            };
            const option = {email:req.query.email,};
            const result = await bookingCollections.find(option).toArray();
            res.send(result);

        })
        // app.get('/checkisBooking',async(req,res) => {
        //     const option1 = {email:req.query.email}
        //     const option2 = {productId:req.query.bookingId}
        //     const result1 = await bookingCollections.find(option1).toArray()
        //     const result2 = await bookingCollections.find(option2).toArray()
        //     // if(result1.length<0 && result2<0){
        //     //     res.send({booking:false});
        //     //     console.log('yes')
        //     // }
        //     console.log(result1.length)
        //     console.log(result2.length)
        // })

        

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