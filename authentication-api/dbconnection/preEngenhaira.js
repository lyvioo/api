const { MongoClient } = require('mongodb');

async function connectPreEngenharia() {

    const url = process.env.DBENGENHARIA;
    
    const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    try {
        await client.connect();
        console.log(`Connected to database at ${url}`);
        return client;
    } catch (err) {
        console.error(`Error connecting to database at ${url}:`, err);
        throw err;
    }
}

module.exports = {
    connectPreEngenharia
};
