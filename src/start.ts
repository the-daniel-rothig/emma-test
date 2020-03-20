import dotenv from 'dotenv';
import express from 'express';
import { Database } from './database';
import { handePercentilesRequest } from './handlePercentilesRequest';

dotenv.config();

const app = express();
const database = new Database();

app.get('/percentiles', handePercentilesRequest(database));

app.listen(8080, () => {
  console.log("listening on port 8080");
});