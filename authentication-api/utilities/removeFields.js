const removeUnwantedFields = (doc) => {
    delete doc._id;
    delete doc.timestamp;
    delete doc.last_update;
    return doc;
  };

module.exports = {
    removeUnwantedFields
};