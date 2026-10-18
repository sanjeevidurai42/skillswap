const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillswap';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB Warning]: Could not connect to MongoDB at ${uri}.`);
    console.warn(`[Notice]: Ensure MongoDB is running locally (mongod) or provide a valid MONGODB_URI in backend/.env for Atlas.`);
    console.warn(`[Error Details]: ${err.message}`);
    // Do not crash server in dev mode so API docs/static pages can still be inspected
    return null;
  }
};

module.exports = connectDB;
