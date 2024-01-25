const { MongoClient } = require('mongodb');


const getAdConfig = async () => {
    const uri = 'mongodb://devs:qwert12345@172.16.10.244:27018/?authMechanism=DEFAULT';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        const db = client.db('frontConfig');
        const collection = db.collection('ADSettings');

        const adConfigDoc = await collection.findOne({});
        
        if (!adConfigDoc || !adConfigDoc.adConfig) {
            console.error('[ERROR] AD config not found in MongoDB');
            return null;
        }

        return adConfigDoc.adConfig;
    } catch (err) {
        console.error('[ERROR] Error fetching AD config from MongoDB:', err.message);
        throw err;
    } finally {
        await client.close();
    }
};

module.exports = getAdConfig;