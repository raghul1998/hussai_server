import {google} from 'googleapis';
import cheerio from 'cheerio'
import mongoose from 'mongoose';

const CONNECTION_STRING = "mongodb://127.0.0.1:27017/email_database";
mongoose.connect(CONNECTION_STRING);

const emailSchema = mongoose.Schema({
                                   subject: String,
                                   sender: String,
                                   content: String
                               }, {collection: 'email'});

const emailModel = mongoose.model('EmailModel', emailSchema);

const credentials = {
    client_id: '4673391694-j3gvrj13nhnkir9bhe1dktfsjfik9h3e.apps.googleusercontent.com',
    client_secret: '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',
    redirect_uris: ['http://localhost:4000'],
};

const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
);

oAuth2Client.credentials = {
    refresh_token: '1//0gAJyL0Kj7KqTCgYIARAAGBASNwF-L9IrPLXEcIMrdG6vc6gQXd9p_cz9aoW811tTBZ-Swse5sYENmqyq0aisi4Rn645JR8KtEEQ'
};

// Create Gmail API client
const gmail = google.gmail({version: 'v1', auth: oAuth2Client});

async function fetchEmailData() {
    try {
        const response = await gmail.users.messages.list(
            {userId: 'me', maxResults: 500}
        );

        const messages = response.data.messages;
        let count = 1;
        if (messages.length) {
            const emailData = [];
            messages.forEach((message) => {
                gmail.users.messages.get({
                                             userId: 'me',
                                             id: message.id,
                                         }, async (err, res) => {
                    if (err) {
                        return console.error('Error fetching Gmail message:', err.message);
                    }
                    const emailContent = getEmailContent(res.data);
                    if (emailContent.content !== 'No content available.') {
                        emailData.push(emailContent);
                        await emailModel.create(emailContent);
                        //console.log('Email Data:', emailData);
                        console.log(count);
                        count = count + 1;
                    }
                });
            });
        } else {
            console.log('No emails found.');
        }
    } catch (error) {
        console.error('Error fetching Gmail messages:', error.message);
    }
}

function getEmailContent(message) {
    const subject = preprocessSubject(getHeaderValue(message.payload.headers, 'Subject'));
    const sender = preprocessSender(getHeaderValue(message.payload.headers, 'From'));
    const content = removeSensitiveInfo(preprocessContent(extractContentFromBody(message.payload)));

    return {
        subject,
        sender,
        content,
    };
}

function getHeaderValue(headers, name) {
    const header = headers.find(header => header.name === name);
    return header ? header.value : 'N/A';
}

function extractContentFromBody(payload) {
    const body = payload.body;
    if (body.size === 0) {
        return 'No content available.';
    }
    const encodedData = body.data;
    const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');

    const $ = cheerio.load(decodedData);
    const textContent = $('body').text();
    return textContent;
}

function preprocessSubject(subject) {
    // Remove symbols and special characters
    subject = subject.replace(/[^\w\s]/g, '');
    return subject;
}

function preprocessContent(content) {
    // Remove leading and trailing whitespace
    content = content.trim();
    // Remove multiple consecutive spaces
    content = content.replace(/\s+/g, ' ');
    // Remove line breaks and tabs
    content = content.replace(/[\n\t\r]/g, ' ');
    // Remove special characters and symbols
    content = content.replace(/[^\w\s.,!?]/g, '');
    // Normalize multiple punctuation marks
    content = content.replace(/([.,!?])+/g, '$1');
    return content;
}

function preprocessSender(sender) {
    // Remove email address enclosed in angle brackets
    sender = sender.replace(/<[^>]+>/g, '').trim();

    return sender;
}

function removeSensitiveInfo(content) {
    const keywords = ['password', 'social security number', 'credit card', 'personal address'];
    const sensitivePatterns = [/(\d{4}-){3}\d{4}/g, /\b\d{3}-\d{2}-\d{4}\b/g]; // Example: Social Security Numbers
    // Replace keywords with placeholder
    for (const keyword of keywords) {
        const keywordRegex = new RegExp(keyword, 'gi');
        content = content.replace(keywordRegex, '[Sensitive Info]');
    }
    // Replace sensitive patterns with placeholder
    for (const pattern of sensitivePatterns) {
        content = content.replace(pattern, '[Sensitive Info]');
    }
    return content;
}


fetchEmailData().then(r => console.log('fetched'));

