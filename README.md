# Salesforce Org Hub

Authenticate into multiple Salesforce orgs. Share orgs with other users on your team without sharing passwords. The app maintains an audit log of all requests so you can report on who accessed orgs and when.

## Motivation

Salesforce consulting partners often find themselves having to share credentials amongst team mates with customers that do not have additional licenses to spare. This is an unsafe practice as this often involves sharing passwords and there is no record of who actually logged into an org at a given time. Having to share verification codes and upcoming mandatory 2FA requirements will further complicate this scenario. This app hopes to allow consulting partners to safely share login privileges with others on the team, allowing one-click logins, without having to share passwords. The privileges may be revoked at any time by the original provider and each access is logged in an audit table for reference.

## Mechanism

The app uses [Web Server OAuth flow](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/intro_oauth_web_server_flow.htm) to get an access token and refresh token for an org. The refresh token is encrypted and stored in the database and is used for all subsequent authentication requests. Users authenticate into the app using their Google credentials. Authorized users' Google usernames should be added to the `authorized_users` table.

## Steps to run locally

-   Use `. local/setenv.sh` to set environment variables in calling shell. More on it [here](https://stackoverflow.com/questions/496702/can-a-shell-script-set-environment-variables-of-the-calling-shell)
-   Run scripts/dbscript.sql to set up database tables. Alternatively, you can run `docker-compose up -d` to start a postgresql server locally that will work the environment variables included in `. local/setenv.sh`. (Requires `docker` service to be installed and running and `docker-compose` to be installed.)
-   Run `npm install` to install dependencies.
-   Run `npm run watch` to start the server in development mode.
-   Add authorized email addresses ( google usernames ) to the `authorized_users` table. Once the database is set up, you can use any Postgresql client to connect to the database and run these commands.

## Notes

-   [API Access Controls](https://help.salesforce.com/s/articleView?id=sf.security_api_access_control_all_users.htm&type=5)
-   [Session Policies for Connected Apps](https://help.salesforce.com/s/articleView?id=sf.connected_app_manage_session_policies.htm&type=5)
-   Feel free to set up your own Salesforce Connected Apps and add the client id and secrets to the environment variables file.
-   Feel free to set up your own Google OAuth apps and add the client id to the environment variables file
-   If you plan on running the client server or api server on a different domain, you will need to set up a Salesforce connected app and Google OAuth credential yourself with these domains allowed. The steps for setting up your own Google app and credentials may be found [here](https://developers.google.com/identity/sign-in/web/sign-in)
-   It is **strongly** recommended that you change the encryption key and salt before deploying to production

##Disclaimer
While I have tried to secure the app to the extent of my abilities, I am not an nodejs/express developer and do not claim that the app is a 100% secure. Use it at your own discretion. Feel free to report bugs or security issues and I will do my best to address them.
