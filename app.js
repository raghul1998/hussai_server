import express from 'express';
import cors from 'cors';
import GmailController from './controller/gmail.js'
import GmapsController from './controller/gmaps.js'
import InstaController from './controller/instagram.js'
import LinkedInController from './controller/linkedin.js'
import HelloController from "./controller/hello-controller.js"

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
                 origin: "*"
             }));

HelloController(app);
GmailController(app);
GmapsController(app);
InstaController(app);
LinkedInController(app);

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});