"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var extension_kit_1 = require("@farol/extension-kit");
var farolExtensionConfig = require('../farol-extension');
var crossref = new extension_kit_1.FarolExtension(farolExtensionConfig);
crossref.register('submission_publish', function (item, config) { });
