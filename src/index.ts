import { FarolExtension } from '@farol/extension-kit';

const farolExtensionConfig = require('../farol-extesion');
const crossref = new FarolExtension(farolExtensionConfig);
crossref.register('submission_publish', (item: any, config: any) => {
  console.log(item);
  console.log(config);
});
