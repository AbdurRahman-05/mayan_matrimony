import { config } from 'dotenv';
config();
import('./schema.js').then(m => m.default ? m.default() : console.log('not a function')).catch(err => {
    console.log("HELLO THE ERROR IS:");
    console.log(err.message);
    console.log(err);
});
