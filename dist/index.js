"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var Mustache = require("mustache");
var path = require("path");
var request = require("request-promise");
var extension_kit_1 = require("@farol/extension-kit");
var fs_1 = require("fs");
var farolExtensionConfig = require("../farol-extension");
var crossref = new extension_kit_1.FarolExtension(farolExtensionConfig);
crossref.register("submission_publish", function (item, settings) { return __awaiter(_this, void 0, void 0, function () {
    var parseText, template, context, crossrefDoc, fileName, formData, options, result, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                parseText = settings.XMLParser === "crappy"
                    ? function (text) {
                        encodeURIComponent(text);
                    }
                    : function (text) {
                        "<![CDATA[" + text + "]]>";
                    };
                return [4 /*yield*/, fs_1.promises.readFile(path.resolve(__dirname, "template.xml"), "utf-8")];
            case 1:
                template = _a.sent();
                context = {
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
                context.AUTHORS = item.author.map(function (author, index) { return ({
                    SEQUENCE: index === 0 ? "first" : "additional",
                    ROLE: author.authoring_role,
                    FIRSTNAME: author.name.split(",")[1],
                    LASTNAME: author.name.split(",")[0]
                }); });
                crossrefDoc = Mustache.render(template, context);
                fileName = item._id + ".xml";
                formData = {};
                formData["fname"] = {
                    value: crossrefDoc,
                    options: {
                        filename: fileName,
                        contentType: "text/xml"
                    }
                };
                options = {
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
                if (!(settings.test === "false")) return [3 /*break*/, 3];
                return [4 /*yield*/, request(options)];
            case 2:
                result = _a.sent();
                console.log(result);
                return [3 /*break*/, 6];
            case 3:
                if (!(settings.test === "remote")) return [3 /*break*/, 5];
                options.url = "https://test.crossref.org/servlet/deposit";
                return [4 /*yield*/, request(options)];
            case 4:
                result = _a.sent();
                console.log(result);
                return [3 /*break*/, 6];
            case 5:
                console.log(options);
                console.log(crossrefDoc);
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
