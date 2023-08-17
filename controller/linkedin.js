import express from "express";
import axios from "axios";

const CLIENT_ID = '86h09z1ycsjzc5';
const CLIENT_SECRET = 'Aa3C0dbmDgT0UYr0';

const searchLinkedIn = async (req, res) => {
    try {
        const query = req.query.q;

        // Authenticate and get an access token
        const tokenResponse = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            null,
            {
                params: {
                    grant_type: 'client_credentials',
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Fetch sample LinkedIn connections' names
        const connectionsResponse = await axios.get(
            `https://api.linkedin.com/v2/me/connections?q=${query}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log(connectionsResponse);

        const connections = connectionsResponse.data.elements || [];
        const matchingConnections = connections
            .map(connection => connection.firstName + ' ' + connection.lastName);

        res.json(matchingConnections);
    } catch (error) {
        console.error('Error fetching LinkedIn connections:', error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
}

export default (app) => {
    app.get('/api/linkedin/search-linkedin', searchLinkedIn);
}