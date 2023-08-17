import {google} from "googleapis";
import credentials from './credentials.json' assert { type: "json" };
import path from 'path';
import fs from 'fs';

const code = '4/0Adeu5BWOlizHpjKUehqVK8ibEeGHCPGgVlAT-79tXryhRsplIIjL6xcP5RigPTFkqhpeyg'

const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

oAuth2Client.getToken(code).then(({ tokens }) => {
    const tokenPath = path.join(__dirname, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    console.log('Access token and refresh token stored to token.json');
});