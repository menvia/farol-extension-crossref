import * as Mustache from 'mustache';
import * as farolExtensionConfig from './farol-extension.json';
import * as path from 'path';
import * as request from 'request-promise';
import { FarolExtension } from '@farol/extension-kit';
import { promises as fsPromises } from 'fs';

const crossref = new FarolExtension(farolExtensionConfig);

crossref.register('submission_publish', async (item: any, settings: any) => {
  const parseText = (text: string, textKey: string) =>
    settings.XMLParser === 'crappy' &&
    [
      'CONFERENCE_NAME',
      'CONFERENCE_ACRONYM',
      'PROCEEDINGS_TITLE',
      'PAPER_TITLE',
    ].includes(textKey)
      ? `{{${textKey}}}`
      : `<![CDATA[${text}]]>`;
  // Load and fill the doi document template
  const template = await fsPromises.readFile(
    path.resolve(__dirname, 'template.xml'),
    'utf-8',
  );
  const context = {
    DOI_BATCH_ID: item._id.toString(),
    TIMESTAMP: new Date().getTime(),
    DEPOSITOR_NAME: settings.depositorName,
    DEPOSITOR_EMAIL: settings.depositorEmail,
    REGISTRANT: settings.registrant,
    CONFERENCE_NAME: parseText(item.event.name, 'CONFERENCE_NAME'),
    CONFERENCE_ACRONYM: parseText(item.event.short_name, 'CONFERENCE_ACRONYM'),
    CONFERENCE_DATE: item.event.start_on,
    PROCEEDINGS_TITLE: parseText(
      'Proceedings ' + item.event.name,
      'PROCEEDINGS_TITLE',
    ),
    PROCEEDINGS_PUBLISHER_NAME: settings.proceedingsPublisherName,
    PROCEEDINGS_PUBLICATION_YEAR: new Date(item.event.start_on).getFullYear(),
    PROCEEDINGS_ISBN: item.event.isbn
      ? '<isbn>' + item.event.isbn + '</isbn>'
      : '<noisbn reason="archive_volume" />',
    PAPER_TITLE: parseText(item.title, 'PAPER_TITLE'),
    PAPER_PUBLICATION_YEAR: new Date(item.event.start_on).getFullYear(),
    AUTHORS: [],
    DOI: settings.prefix + '/' + item._id.toString(),
    DOI_RESOURCE: settings.doiResourceHost + '/' + item._id.toString(),
  };

  context.AUTHORS = item.author.map((author: any, index: number) => ({
    SEQUENCE: index === 0 ? 'first' : 'additional',
    ROLE: author.authoring_role,
    FIRSTNAME: author.name.split(',')[1],
    LASTNAME: author.name.split(',')[0],
  }));

  let crossrefDoc = Mustache.render(template, context);

  if (settings.XMLParser === 'crappy') {
    const crappyContext = {
      CONFERENCE_NAME: item.event.name,
      CONFERENCE_ACRONYM: item.event.short_name,
      PROCEEDINGS_TITLE: 'Proceedings ' + item.event.name,
      PAPER_TITLE: item.title,
    };
    crossrefDoc = Mustache.render(crossrefDoc, crappyContext);
  }

  // Build the parameters to the crossref service
  const fileName = `${item._id}.xml`;
  const formData: any = {};
  formData['fname'] = {
    value: crossrefDoc,
    options: {
      filename: fileName,
      contentType: 'text/xml',
    },
  };
  const options = {
    method: 'POST',
    url: 'https://doi.crossref.org/servlet/deposit',
    qs: {
      operation: 'doMDUpload',
      login_id: settings.login,
      login_passwd: settings.password,
    },
    headers: {
      'Content-Type': 'multipart/form-data;',
    },
    formData: formData,
  };

  // Call the result
  if (settings.test === 'false') {
    const result = await request(options);
    console.log(result);
  } else if (settings.test === 'remote') {
    options.url = 'https://test.crossref.org/servlet/deposit';
    const result = await request(options);
    console.log(result);
  } else {
    console.log(options);
    console.log(crossrefDoc);
  }
});
