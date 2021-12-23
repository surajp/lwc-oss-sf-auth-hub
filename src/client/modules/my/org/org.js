import { LightningElement, api } from 'lwc';

export default class Org extends LightningElement {
    @api
    orgDetail;

    @api
    username;

    isMenuVisible = false;

    @api
    isLoading = false;

    showShare = false;

    @api
    hideMenu() {
        this.isMenuVisible = false;
    }

    get containerclass() {
        return this.orgDetail.issandbox ? 'container sbx' : 'container';
    }

    get isShowMenu() {
        return this.isShareVisible || this.isDeleteVisible || this.isHistoryVisible;
    }

    get isShareVisible() {
        return this.orgDetail.accesslevel && ['Manage', 'Owner'].indexOf(this.orgDetail.accesslevel) > -1;
    }
    get isDeleteVisible() {
        return this.orgDetail.accesslevel && ['Owner'].indexOf(this.orgDetail.accesslevel) > -1;
    }
    get isHistoryVisible() {
        return this.orgDetail.accesslevel && ['Manage', 'Owner'].indexOf(this.orgDetail.accesslevel) > -1;
    }

    toggleMenu(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.isMenuVisible = !this.isMenuVisible;
        this.dispatchEvent(new CustomEvent('menutoggle', { detail: { orgId: this.orgDetail.id } }));
    }

    get menuClass() {
        return this.isMenuVisible ? '' : 'slds-hide';
    }

    handleClick() {
        this.isLoading = true;
        this.dispatchEvent(
            new CustomEvent('orgopen', {
                detail: { instanceUrl: this.orgDetail.instanceUrl, orgId: this.orgDetail.id }
            })
        );
    }

    handleDelete(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('orgdelete', {
                detail: { instanceUrl: this.orgDetail.instanceUrl, orgId: this.orgDetail.id }
            })
        );
    }

    handleShareSelect(event) {
        event.preventDefault();
        event.stopPropagation();
        this.showShare = true;
        this.template.querySelector('my-modal').toggleModal();
        this.toggleMenu();
    }

    saveShareChanges = () => {
        this.template.querySelector('my-share').saveShares();
    };
}
