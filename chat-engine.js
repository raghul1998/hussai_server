import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const CONNECTION_STRING = "mongodb://127.0.0.1:27017/email_database";
mongoose.connect(CONNECTION_STRING);

const OPEN_AI_KEY = process.env.OPENAI_API_TOKEN;
//const OPEN_AI_ORG_ID = process.env.OPENAI_ORGANIZATION_ID;
const openai = new OpenAI({
                              apiKey: OPEN_AI_KEY,
                              //organization: OPEN_AI_ORG_ID
                          });

const emailSchema = mongoose.Schema({
                                        subject: String,
                                        sender: String,
                                        content: String
                                    }, {collection: 'email'});

const emailModel = mongoose.model('EmailModel', emailSchema);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
                 origin: "*"
             }));

app.use(express.json());

// Keyword matching function
function matchEmailsWithKeywords(query, emails) {
    const relevantEmails = [];
    // Extract keywords from the query (you might use more advanced NLP techniques)
    const keywords = query.split(' ');

    // Iterate through emails and match keywords
    for (const email of emails) {
        let relevanceScore = 0;
        for (const keyword of keywords) {
            if (email.subject.includes(keyword) || email.content.includes(keyword)) {
                relevanceScore++;
            }
        }
        if (relevanceScore > 0) {
            relevantEmails.push({...email, relevanceScore});
        }
    }

    // Sort emails by relevance score in descending order
    relevantEmails.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return relevantEmails;
}

app.post('/search', async (req, res) => {
    const userQuery = req.body.query;

    try {
        const emailData = await emailModel.find();

        // Match emails based on keywords
        const relevantEmails = matchEmailsWithKeywords(userQuery, emailData);

        if (relevantEmails.length > 0) {
            // Construct email context for LLM prompt
            const emailContext = relevantEmails[0]._doc.content;
            // Construct prompt for LLM
            // const prompt = `User Query: ${userQuery} | Email Content: ${emailContext} | Response:`;
            const messages = [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: userQuery },
                { role: 'assistant', content: `Email Content: ${emailContext}` },
            ];

            // Generate response using GPT-3
            try {
                const response = await openai.chat.completions.create({
                                                                          model: 'gpt-3.5-turbo',
                                                                          messages: messages,
                                                                          temperature: 0.8
                                                                      });

                const generatedResponse = response.choices[0].message;
                let messageContent = generatedResponse.content;
                console.log(generatedResponse);
                // Use the modified regex to capture last complete sentence
                const sentenceRegex = /[.!?](?:\s*|\n|$)/;
                const reversedResponse = messageContent.split('').reverse().join('');
                const match = reversedResponse.match(sentenceRegex);

                if (match) {
                    // Remove any incomplete sentence that follows the last complete sentence
                    const startIndex = messageContent.length - match.index - match[0].length;
                    messageContent = messageContent.substring(0, startIndex).trim() + '.';
                }

                // Remove newline characters from the response
                messageContent = messageContent.replace(/\n/g, ' ');
                console.log(messageContent);
                res.json({success: true, response: messageContent});
            } catch (error) {
                console.log(error);
                res.status(500).json({error: 'Error querying the model.'});
            }

        } else {
            res.json({success: true, response: 'No relevant emails found.'});
        }
    } catch (error) {
        res.status(500).json({error: 'Error fetching email data from MongoDB.'});
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});