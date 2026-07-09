import dotenv from 'dotenv';
dotenv.config();
console.log('PORT=' + process.env.PORT);
console.log('VITE_API_BASE_URL=' + process.env.VITE_API_BASE_URL);
