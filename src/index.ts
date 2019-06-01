import * as Mustache from 'mustache';
import * as path from 'path';
import * as request from 'request-promise';
import { FarolExtension } from '@farol/extension-kit';
import { promises as fsPromises } from 'fs';
import { config } from 'bluebird';
const farolExtensionConfig = require('../farol-extension');
const crossref = new FarolExtension(farolExtensionConfig);

crossref.register('submission_publish', async (item: any, settings: any) => {
  // Load and fill the doi document template
  const template = await fsPromises.readFile(
    path.resolve(__dirname, 'template.xml'),
    'utf-8'
  );
  const context = {
    DOI_BATCH_ID: item._id.toString(),
    TIMESTAMP: new Date(),
    DEPOSITOR_NAME: settings.depositorName,
    DEPOSITOR_EMAIL: settings.depositorEmail,
    REGISTRANT: settings.registrant,
    CONFERENCE_NAME: item.event.name,
    CONFERENCE_ACRONYM: item.event.short_name,
    CONFERENCE_DATE: item.event.start_on,
    PROCEEDINGS_TITLE: "Proceedings " + item.event.name,
    PROCEEDINGS_PUBLISHER_NAME: settings.proceedingsPublisherName,
    PROCEEDINGS_PUBLICATION_YEAR: (new Date(item.event.start_on)).getFullYear(),
    PAPER_TITLE: item.title,
    PAPER_PUBLICATION_YEAR: (new Date(item.event.start_on)).getFullYear(),
    AUTHORS: [],
    DOI: settings.prefix + '/' + item._id.toString(),
    DOI_RESOURCE: settings.doiResourceHost + '/' + item._id.toString(),
  }

  context.AUTHORS = item.author.map((author: any, index: number) => {
    return {
      SEQUENCE: (index === 0)? 'first' : 'additional',
      ROLE: author.authoring_role,
      FIRSTNAME: author.name.split(',')[1],
      LASTNAME: author.name.split(',')[0],    
    };
  }); 

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
  if (settings.test === 'false') {
    const result = await request(options);
  } else if ('remote'){
    options.url = 'https://test.doi.crossref.org/servlet/deposit';
    const result = await request(options);
  } else {
    console.log(options);
    console.log(crossrefDoc);
  }
});
