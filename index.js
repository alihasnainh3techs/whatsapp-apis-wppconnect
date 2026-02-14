import dotenv from 'dotenv';
import connectDB from './db/connection.js';
import { app } from './app.js';

dotenv.config();

connectDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
});
