import '@lwc/synthetic-shadow';
import { createElement } from 'lwc';
import config from 'my/config';
import MyApp from 'my/app';

const app = createElement('my-app', { is: MyApp });
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);
//eslint-disable-next-line
const googleappclientid = config.client_id;
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#g_id_onload').dataset.client_id = googleappclientid;
