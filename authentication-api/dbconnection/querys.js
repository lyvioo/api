const { MongoClient } = require('mongodb');

async function connect() {

    const url = process.env.DBQUERYS2;
    
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
    connect
};
