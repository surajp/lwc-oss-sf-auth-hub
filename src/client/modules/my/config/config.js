/*eslint-disable */
// we have to do it this way to enable webpack's EnvironmentPlugin to find and replace these variables during build. https://webpack.js.org/plugins/environment-plugin/
const clientId = process.env.GOOGLE_APP_CLIENT_ID;
const protocol = process.env.PROTOCOL;
const apiHost = process.env.API_HOST;
const apiPort = process.env.API_PORT;

const config = {
    client_id: clientId,
    api_url: `${protocol}://${apiHost}:${apiPort}/api/v1`
};
export default config;
