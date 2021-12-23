const webpack = require('webpack');

//eslint-disable-next-line no-undef
module.exports = {
    plugins: [
        new webpack.EnvironmentPlugin({
            GOOGLE_APP_CLIENT_ID: '',
            PROTOCOL: 'http',
            API_HOST: 'localhost',
            API_PORT: 8080
        })
    ]
};
