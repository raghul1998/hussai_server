import {google} from 'googleapis';

const TOKEN_PATH = 'token.json'
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// const gmail = google.gmail({
//                                version: 'v1',
//                                auth: new google.auth.JWT({
//                                                              credentials,
//                                                              scopes: SCOPES,
//                                                          }),
//                            });

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

const searchGmail = async (req, res) => {
    try {
        const query = req.query.q;
        const response = await gmail.users.messages.list(
            {userId: 'me', q: query}
        );

        const messageIds = response.data.messages.slice(0, 20).map(message => message.id);
        const messages = [];

        for (const messageId of messageIds) {
            const messageResponse = await gmail.users.messages.get({
                                                                       userId: 'me',
                                                                       id: messageId,
                                                                   });

            const messageSubjectHeader = messageResponse.data.payload.headers.find(
                header => header.name.toLowerCase() === 'subject'
            );

            const messageSubject = messageSubjectHeader ? messageSubjectHeader.value : 'No Subject';

            console.log('Email Subject:', messageSubject);

            messages.push({id: messageId, subject: messageSubject});
        }
        res.json(messages);
    } catch (error) {
        console.error('Error fetching Gmail messages:', error.message);
        res.status(500).json({error: 'An error occurred'});
    }
}

export default (app) => {
    app.get('/api/gmail/search-gmail', searchGmail);
}