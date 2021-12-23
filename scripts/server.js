// Simple Express server setup to serve the build output
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const path = require('path');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 8080;
const DIST_DIR = './dist';

const app = express();
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            connectSrc: [`${API_HOST}:${API_PORT}`, "'self'", 'accounts.google.com'],
            defaultSrc: ["'self'", "'unsafe-inline'", 'accounts.google.com', 'apis.google.com']
        }
    })
);
app.use(compression());

app.use(express.static(DIST_DIR));

app.use('*', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => console.log(`✅  Yo, Server started: //${HOST}:${PORT}`));
