const searchGmail = async (req, res) => {
    return null;
}

export default (app) => {
    app.get('/api/gmail/search-gmail', searchGmail);
}