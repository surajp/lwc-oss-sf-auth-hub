# Salesforce Org Hub

Authenticate into multiple Salesforce orgs. Share orgs with other users on your team without sharing passwords. The app maintains an audit log of all requests so you can report on who accessed orgs and when.

The app uses Web Server OAuth flow to get an access token and refresh token for an org. The refresh token is encrypted and stored in the database and is used for all subsequent authentication requests.

Steps to run:

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

WIP

-   Create audit fields on all tables
