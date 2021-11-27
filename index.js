const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
require('dotenv').config();


//JWT
const { initializeApp } = require('firebase-admin/app');

var admin = require("firebase-admin");

var serviceAccount = require("./destination-9a155-firebase-adminsdk-s07n9-242d599e3e.json");   //key path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//JWT

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5nvb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


//JWT
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodeUserEmail = decodedUser.email
            console.log(decodedUser.email)
        }
        catch {
        }
    }
    next();
}
//JWT


async function run() {
    try {
        await client.connect();
        const database = client.db('Destination');
        const serviceCollection = database.collection('services');
        const userCollection = database.collection('users');

        //GET API


        //get services
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find({})
            const count = await cursor.count();
            const services = await cursor.toArray();
            res.send({
                services,
                count
            });
        })


        //get users
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find({})
            const count = await cursor.count();
            const users = await cursor.toArray();
            res.send({
                users,
                count
            });
        })

        //GET API



        //get service details
        app.get('/Details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.json(service)
        })


        //get user bookings
        app.get('/users/:mail', verifyToken, async (req, res) => {
            const mail = req.params.mail;
            if (req.decodedUserEmail === mail) {
                // const query = {}   //find user by email..an alternative of &regex below
                // query = { email: mail };
                // const result = await userCollection.find(query);

                const result = await userCollection.find({
                    email: { $regex: mail },
                }).toArray();
                res.json(result)
            }
            else {
                res.status(401).json({ Message: 'user not authorized' })
            }
        })


        //POST API

        //set services
        app.post('/services', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })

        //post users
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser)
            res.send(result)
        })
        //POST api




        //DELETE API

        //delete service
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.json(result)
        })

        //cancel booking
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.json(result)
        })

        //DELETE API




        //**update user */
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            // const updatedUser = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    status: "Approved"
                }

            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })
        //**update user */

        //UPDATE API


    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)





app.get('/', (req, res) => {
    res.send("this is node")
})

app.listen(port, () => {
    console.log('listening in port', port);

})
