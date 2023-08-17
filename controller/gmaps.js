const searchGmail = async (req, res) => {
    return null;
}

export default (app) => {
    app.get('/api/gmaps/search-gmail', searchGmail);
}