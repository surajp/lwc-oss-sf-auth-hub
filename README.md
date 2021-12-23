# Salesforce Authentication Hub

Authenticate into multiple Salesforce orgs. Share orgs with other users on your team without sharing passwords. The app maintains an audit log of all requests so you can report on who accessed orgs and when.

## Motivation

Salesforce consulting partners often find themselves having to share credentials amongst team mates with customers that do not have additional licenses to spare. This is an unsafe practice as this often involves sharing passwords and there is no record of who actually logged into an org at a given time. Having to share verification codes and upcoming mandatory 2FA requirements will further complicate this scenario. This app hopes to allow consulting partners to safely share login privileges with others on the team, allowing one-click logins, without having to share passwords. The privileges may be revoked at any time by the original provider and each access is logged in an audit table for reference.

## Mechanism

The app uses [Web Server OAuth flow](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/intro_oauth_web_server_flow.htm) to get an access token and refresh token for an org. The refresh token is encrypted and stored in the database and is used for all subsequent authentication requests. Users authenticate into the app using their Google credentials. Authorized users' Google usernames should be added to the `authorized_users` table (unless `ALLOW_UNAUTHORIZED_USERS` is set to true, which is not recommended in production)

## Steps to run locally

Clone the repo. Run `docker-compose up`. Wait for the server to start and go to `http://localhost:3001` in your browser.

## Steps to run in production

-   Set up a [Salesforce connected app](https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm&type=5) and add `<your api server url>/authcallback` to the redirect urls list. Use this app's client id and secret when setting the environment variables on your api server.
-   Set up [Google OAuth credentials](https://support.google.com/cloud/answer/6158849?hl=en) and add your web server domain to the list of allowed Javascript origins.
-   Set your environment variables using native commands on the server. **Do not store production environment variables in a file on your server**
-   Set up a Postgresql database and run `pgsql -f scripts/dbscript.sql` to set up your database schema. Add authorized users' emails to the `authorized_users` table.
-   Deploy the project to your api server. Delete the `src/client` folder.
-   Deploy the project to your web server. Delete the `src/server` folder
-   **Important**: Delete or set `ALLOW_UNAUTHORIZED_USERS` environment variable to `false` in production. Setting it to true allows anyone with a Google account to use your application (although they won't see any orgs unless its explicitly shared with them)
-   Ideally, you want to use different physical servers for your web server, api server and database for security, but you may combine one or more.

## Notes

-   [API Access Controls](https://help.salesforce.com/s/articleView?id=sf.security_api_access_control_all_users.htm&type=5)
-   [Session Policies for Connected Apps](https://help.salesforce.com/s/articleView?id=sf.connected_app_manage_session_policies.htm&type=5)
-   If you plan on running the client server or api server on a different domain, you will need to set up a Salesforce connected app and Google OAuth credential yourself with these domains allowed. The steps for setting up your own Google app and credentials may be found [here](https://developers.google.com/identity/sign-in/web/sign-in)
-   It is **strongly** recommended that you change the encryption key and salt before deploying to production

## Disclaimer

While I have tried to secure the app to the extent of my abilities, I am not an nodejs/express developer and do not claim that the app is a 100% secure. Use it at your own discretion. Feel free to report bugs or security issues and I will do my best to address them.
