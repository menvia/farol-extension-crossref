import * as Mustache from "mustache";
import * as path from "path";
import * as request from "request-promise";
import { FarolExtension } from "@farol/extension-kit";
import { promises as fsPromises } from "fs";

const farolExtensionConfig = require("../farol-extension");
const crossref = new FarolExtension(farolExtensionConfig);

interface EntityMap {
  "&": string;
  "<": string;
  ">": string;
  '"': string;
  "'": string;
  "/": string;
}

const entityMap: EntityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

function escapeHtml(source: string) {
  return String(source).replace(/[&<>"'\/]/g, (s: string) => {
    return entityMap[s];
  });
}

crossref.register("submission_publish", async (item: any, settings: any) => {
  const parseText =
    settings.XMLParser === "crappy"
      ? (text: string) => encodeURIComponent(text)
      : (text: string) => "<![CDATA[" + text + "]]>";
  // Load and fill the doi document template
  const template = await fsPromises.readFile(
    path.resolve(__dirname, "template.xml"),
    "utf-8"
  );
  const context = {
    DOI_BATCH_ID: item._id.toString(),
    TIMESTAMP: new Date().getTime(),
    DEPOSITOR_NAME: settings.depositorName,
    DEPOSITOR_EMAIL: settings.depositorEmail,
    REGISTRANT: settings.registrant,
    CONFERENCE_NAME: parseText(item.event.name),
    CONFERENCE_ACRONYM: parseText(item.event.short_name),
    CONFERENCE_DATE: item.event.start_on,
    PROCEEDINGS_TITLE: parseText("Proceedings " + item.event.name),
    PROCEEDINGS_PUBLISHER_NAME: settings.proceedingsPublisherName,
    PROCEEDINGS_PUBLICATION_YEAR: new Date(item.event.start_on).getFullYear(),
    PROCEEDINGS_ISBN: item.event.isbn
      ? "<isbn>" + item.event.isbn + "</isbn>"
      : '<noisbn reason="archive_volume" />',
    PAPER_TITLE: parseText(item.title),
    PAPER_PUBLICATION_YEAR: new Date(item.event.start_on).getFullYear(),
    AUTHORS: [],
    DOI: settings.prefix + "/" + item._id.toString(),
    DOI_RESOURCE: settings.doiResourceHost + "/" + item._id.toString()
  };

  context.AUTHORS = item.author.map((author: any, index: number) => ({
    SEQUENCE: index === 0 ? "first" : "additional",
    ROLE: author.authoring_role,
    FIRSTNAME: author.name.split(",")[1],
    LASTNAME: author.name.split(",")[0]
  }));

  const crossrefDoc = Mustache.render(template, context);

  // Build the parameters to the crossref service
  const fileName = `${item._id}.xml`;
  const formData: any = {};
  formData["fname"] = {
    value: crossrefDoc,
    options: {
      filename: fileName,
      contentType: "text/xml"
    }
  };
  const options = {
    method: "POST",
    url: "https://doi.crossref.org/servlet/deposit",
    qs: {
      operation: "doMDUpload",
      login_id: settings.login,
      login_passwd: settings.password
    },
    headers: {
      "Content-Type": "multipart/form-data;"
    },
    formData: formData
  };

  // Call the result
  if (settings.test === "false") {
    const result = await request(options);
    console.log(result);
  } else if (settings.test === "remote") {
    options.url = "https://test.crossref.org/servlet/deposit";
    const result = await request(options);
    console.log(result);
  } else {
    console.log(options);
    console.log(crossrefDoc);
  }
});
