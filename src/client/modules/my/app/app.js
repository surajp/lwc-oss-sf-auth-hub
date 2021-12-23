import { LightningElement, api } from 'lwc';
import jwt_decode from 'jwt-decode';
import config from 'my/config';
import Cookies from 'js-cookie';

export default class App extends LightningElement {
    rows = [];
    user;
    errorMessage;
    scriptInitialized = false;
    clientId;
    apiBaseUrl;

    @api
    async userDetails(response) {
        const profile = jwt_decode(response.credential);
        const resp = await this._loginToServer(response.credential);
        if (resp) this.user = profile;
    }

    @api
    async handleSignout() {
        Cookies.remove('sfhub_idtoken');
        this.errorMessage = '';
        this.user = null;
        this.rows = [];
        this._logoutFromServer();
    }

    refreshOrgsList() {
        this.errorMessage = '';
        this._fetchConnections();
    }

    _logoutFromServer() {
        const url = `${this.apiBaseUrl}/logout`;
        fetch(url, { method: 'POST', credentials: 'include' }); //we don't care about the response here
    }

    async addNewProd() {
        this.errorMessage = '';
        //eslint-disable-next-line no-alert
        const notes = prompt('Enter a one line description');
        const url = await this.getOAuthUrl('prod', notes);
        if (url) window.open(url, '_blank');
    }

    async addNewSbx() {
        this.errorMessage = '';
        //eslint-disable-next-line no-alert
        const notes = prompt('Enter a one line description');
        const url = await this.getOAuthUrl('sbx', notes);
        if (url) window.open(url, '_blank');
    }

    async openOrg(event) {
        this.errorMessage = '';
        const orgId = event.detail.orgId;
        const target = event.target;
        try {
            let resp = await fetch(`${this.apiBaseUrl}/connections/${orgId}/open`, {
                credentials: 'include',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            target.isLoading = false;
            if (!this._checkResponseValidity(resp)) return;
            resp = await resp.json();
            window.open(resp.url, '_blank');
        } catch (err) {
            target.isLoading = false;
            this.errorMessage = err?.message;
        }
    }

    get hasRows() {
        return this.rows && this.rows.length > 0;
    }

    _handleOrgMenuToggle = (orgId) => {
        const orgs = this.template.querySelectorAll('my-org');
        for (const org of orgs) {
            if (org.orgDetail.id !== orgId) {
                org.hideMenu();
            }
        }
    };

    handleOrgMenuToggle(event) {
        this.errorMessage = '';
        const orgId = event.detail?.orgId || '';
        this._handleOrgMenuToggle(orgId);
    }

    async _loginToServer(idToken) {
        try {
            let resp = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ idToken }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (this._checkResponseValidity(resp) === true) this._fetchConnections();
            else throw Error('Login Failed');
            return true;
        } catch (err) {
            console.error(`Login Request failed`);
            this.errorMessage = err?.message || 'Login Failed';
            return false;
        }
    }

    _checkResponseValidity(resp) {
        //eslint-disable-next-line eqeqeq
        if (resp.status == 200) return true;
        this.errorMessage = `Failed: ${resp.statusText}`;
        return false;
    }

    async _fetchConnections() {
        try {
            let resp = await fetch(`${this.apiBaseUrl}/connections`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!this._checkResponseValidity(resp)) return;
            resp = await resp.json();
            this.rows = resp.rows;
        } catch (err) {
            this.errorMessage = err?.message || 'Login Failed';
        }
    }

    async _deleteOrg(orgId) {
        try {
            let resp = await fetch(`${this.apiBaseUrl}/connections/${orgId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!this._checkResponseValidity(resp)) return;
            this._fetchConnections();
        } catch (err) {
            console.error('error in delete', err);
            this.errorMessage = err.message;
        }
    }

    handleDeleteOrg(event) {
        this.errorMessage = '';
        const orgId = event.detail.orgId;
        this._handleOrgMenuToggle('');
        this._deleteOrg(orgId);
    }

    _attachHandler() {
        //eslint-disable-next-line no-undef
        const auth2 = gapi.auth2.init({
            client_id: this.clientId,
            cookiepolicy: 'single_host_origin'
        });
        const btn = this.template.querySelector('.btnholder');
        auth2.attachClickHandler(
            btn,
            {},
            (googleUser) => {
                this._loginToServer(googleUser);
            },
            (error) => {
                console.error('signin error', error);
            }
        );
    }

    connectedCallback() {
        document.body.addEventListener('click', this._handleOrgMenuToggle);
        this.clientId = config.client_id;
        this.apiBaseUrl = config.api_url;
    }

    disconnectedCallback() {
        document.body.removeEventListener('click', this._handleOrgMenuToggle);
    }

    async getOAuthUrl(env, notes) {
        this.errorMessage = '';
        const encodedNotes = encodeURIComponent(notes);
        let resp = await fetch(`${this.apiBaseUrl}/oauthurl?env=` + env + '&notes=' + encodedNotes, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!this._checkResponseValidity(resp)) return;
        resp = await resp.json();
        //eslint-disable-next-line consistent-return
        return resp.url;
    }
}
