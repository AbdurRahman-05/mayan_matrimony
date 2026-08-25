import setupDatabase from './backend/schema.js';
setupDatabase().then(() => {
    console.log("DB Updated");
    process.exit(0);
});
