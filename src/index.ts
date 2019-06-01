import { FarolExtension } from '@farol/extension-kit';
import { promises as fsPromises, createReadStream } from 'fs';
import * as Mustache from 'mustache';
import * as request from 'request-promise';

const farolExtensionConfig = require('../farol-extension');
const crossref = new FarolExtension(farolExtensionConfig);

crossref.register('submission_publish', async (item: any, settings: any) => {
  // Load and fill the doi document template
  const template = await fsPromises.readFile('./template.xml', 'utf-8');
  const context = {};
  const crossrefDoc = Mustache.render(template, context);

  // Build the parameters to the crossref service
  const formData: any = {};
  formData[`${item._id}.xml`] = {
    value: crossrefDoc,
    options: {
      filename: 'doi.xml',
      contentType: null
    }
  };
  const options = {
    method: 'POST',
    url: 'https://doi.crossref.org/servlet/deposit',
    qs: {
      operation: 'doMDUpload',
      login_id: settings.login,
      login_passwd: settings.password
    },
    headers: {
      'Content-Type': 'multipart/form-data;',
      'Content-Disposition':
        'form-data; name="fname"; filename="crossref_query.xml"',
      'Accept-Language': 'en-us',
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
    },
    formData: formData
  };

  // Call the result
  if (settings === 'false') {
    const result = await request(options);
  } else {
    console.log(options);
    console.log(crossrefDoc);
  }
});
