const express = require('express');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');
const { appendLog } = require('../utilities/log');


router.get('/tags-info',tokenCheck, adminCheck, async (req, res) => {
    try {
        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('PreEngenharia');
        const collection = db.collection('Inventory');

        // Agregação para contar as tags e obter os hostnames correspondentes
        const pipeline = [
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags", // Agrupa por tag
                    count: { $sum: 1 },
                    hostnames: { $push: "$system_info.hostname" }
                }
            },
            {
                $project: { // Etapa de projeção para renomear o campo
                    tagName: "$_id",
                    _id: 0, // Remover o _id original
                    count: 1,
                    hostnames: 1
                }
            },
            { $sort: { count: -1 } }
        ];

        const tagsInfo = await collection.aggregate(pipeline).toArray();

        res.status(200).json(tagsInfo);

    } catch (err) {
        res.status(500).send('Server error: ' + err.message);
    }
});

// POST: Adicionar tag
router.post('/add-tag', tokenCheck, adminCheck, async (req, res) => {
    try {
        const { hostname, tag, color } = req.body;

        if (!tag) {
            return res.status(400).send('Tag is required.');
        }

        if (!color) {
            return res.status(400).send('Color is required.');
        }

        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('PreEngenharia');

        // Função auxiliar para adicionar a tag na coleção Inventory
        async function addTagToInventory() {
            const collection = db.collection('Inventory');
            const regexHostname = new RegExp(`^${hostname}$`, 'i');
            const item = await collection.findOne({ "system_info.hostname": regexHostname });

            if (!item) {
                throw new Error('Hostname not found in Inventory.');
            }

            const tagObject = { [tag]: color };

            if (!item.tags) {
                await collection.updateOne(
                    { "system_info.hostname": regexHostname },
                    { $set: { tags: [tagObject] } }
                );
            } else {
                const tagExists = item.tags.some(t => t[tag]);
                if (!tagExists) {
                    await collection.updateOne(
                        { "system_info.hostname": regexHostname },
                        { $push: { tags: tagObject } }
                    );
                }
            }
        }

        // Função auxiliar para adicionar a tag na coleção wr00004
async function addTagToWr00004() {
    const collection = db.collection('WR00004');
    // Define regexHostname no escopo da função addTagToWr00004
    const regexHostname = new RegExp(`^${hostname}$`, 'i'); 
    // Considerando que há apenas um documento, você não precisa procurar pelo hostname
    const doc = await collection.findOne({});

    if (!doc || !doc.systemDetails || !doc.systemDetails.length) {
        throw new Error('No system details found in wr00004.');
    }

    // Encontra o índice do objeto no array systemDetails que tem o hostname correto
    const index = doc.systemDetails.findIndex(detail => regexHostname.test(detail.hostname));

    if (index === -1) {
        throw new Error('Hostname not found in wr00004 systemDetails.');
    }

    const tagObject = { [tag]: color };
    const tagField = `systemDetails.$[elem].tags`;
    const filter = { [tagField]: { $exists: true } };

    // Verifica se já existe a tag no array de tags
    const tagExists = doc.systemDetails[index].tags && 
                      doc.systemDetails[index].tags.some(t => t.hasOwnProperty(tag));
    
    if (!tagExists) {
        await collection.updateOne(
            {},
            { $push: { [tagField]: tagObject } },
            { arrayFilters: [{ "elem.hostname": regexHostname }] }
        );
    }
}


        await addTagToInventory();
        await addTagToWr00004();

        res.status(200).send('Tag added successfully!');

    } catch (err) {
        res.status(500).send('Server error: ' + err.message);
    }
});

// DELETE: Remover tag
router.delete('/remove-tag', tokenCheck, adminCheck, async (req, res) => {
    try {
        const { hostname, tag } = req.body;

        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('PreEngenharia');

        // Função para remover tag da coleção Inventory
        async function removeFromInventory() {
            const collection = db.collection('Inventory');
            const regexHostname = new RegExp(`^${hostname}$`, 'i');
            const filter = { "system_info.hostname": regexHostname };
            const update = { $pull: { tags: { [tag]: { $exists: true } } } };

            await collection.updateMany(filter, update);
        }

        // Função para remover tag da coleção wr00004
        async function removeFromWr00004() {
            const collection = db.collection('WR00004');
            const update = { $pull: { "systemDetails.$[].tags": { [tag]: { $exists: true } } } };
            // Supondo que só existe um documento na coleção wr00004, podemos aplicar diretamente o update
            await collection.updateOne({}, update);
        }

        await removeFromInventory();
        await removeFromWr00004();

        res.status(200).send('Tag removed successfully!');
        appendLog(login, `Removed tag ${tag} from ${hostname}`);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error: ' + err.message);
    }
});




router.put('/edit-tag', tokenCheck, adminCheck, async (req, res) => {
    try {
        const { oldTag, newTag, newColor } = req.body;

        if (!oldTag || !newTag) {
            return res.status(400).send('Both old tag and new tag are required.');
        }

        if (!newColor) {
            return res.status(400).send('New color is required.');
        }

        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('PreEngenharia');
        const collection = db.collection('Inventory');

        // Encontra todos os documentos que contêm a tag antiga e atualiza para a nova tag e cor
        await collection.updateMany(
            { tags: { $elemMatch: { [oldTag]: { $exists: true } } } },
            { $set: { "tags.$[elem]": { [newTag]: newColor } } },
            { arrayFilters: [ { "elem": { [oldTag]: { $exists: true } } } ] }
        );

        res.status(200).send('Tag updated successfully.');
        appendLog(login, `Edited tag ${oldTag} to ${newTag}`);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error: ' + err.message);
    }
});




module.exports = router;
