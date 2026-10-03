require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    for (const collectionInfo of collections) {
      if (collectionInfo.options && collectionInfo.options.validator) {
        console.log(`\nValidation rules for ${collectionInfo.name}:`);
        console.dir(collectionInfo.options.validator, { depth: null });
      }

      const collection = db.collection(collectionInfo.name);
      const docs = await collection.find({}).limit(1).toArray();
      if (docs.length > 0) {
        console.log(`\nSample doc from ${collectionInfo.name}:`);
        console.dir(docs[0], { depth: null });
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
