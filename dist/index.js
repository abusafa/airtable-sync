"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonpath_1 = __importDefault(require("jsonpath"));
const stream = __importStar(require("stream"));
const util_1 = require("util");
const graphql_request_1 = require("graphql-request");
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const alasql_1 = __importDefault(require("alasql"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const graphqlEndpoint = (_a = process.env.GRAPHQL_ENDPOINT) !== null && _a !== void 0 ? _a : "";
const finished = (0, util_1.promisify)(stream.finished);
const client = new graphql_request_1.GraphQLClient(graphqlEndpoint);
const exts = { "image/svg+xml": "svg", "image/png": "png" };
function downloadFile(fileUrl, outputLocationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const writer = fs_1.default.createWriteStream(outputLocationPath);
        return (0, axios_1.default)({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
        }).then(response => {
            response.data.pipe(writer);
            return finished(writer); //this is a Promise
        });
    });
}
exports.downloadFile = downloadFile;
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    console.log(__dirname);
    const query = (0, graphql_request_1.gql) `
  query MyQuery {
    airtable_bases(limit: 1) {
      table_datas(path: "views")
    }
  }
  
  `;
    const data = yield client.request(query);
    let urls = jsonpath_1.default.query(data, '$..[?(@.url)]');
    let ids = (0, alasql_1.default)('select distinct id, url, type from ? where id is not null', [urls]);
    for (let i in ids) {
        // let id = uuidv4();
        let item = ids[i];
        if (item.id) {
            console.log(item.id);
            let url = `${__dirname}/uploads/${item.id}.${(_b = exts[item.type]) !== null && _b !== void 0 ? _b : "png"}`;
            // console.log(url)
            yield downloadFile(item.url, url);
        }
    }
    res.json(ids);
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
