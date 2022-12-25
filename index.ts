import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import jp from 'jsonpath';
import * as stream from 'stream';
import { promisify } from 'util';
import { GraphQLClient, gql } from 'graphql-request'
import fs from 'fs';
import axios from 'axios';
import alasql from "alasql"



dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT ?? "";
import { v4 as uuidv4 } from 'uuid';

const finished = promisify(stream.finished);

const client = new GraphQLClient(graphqlEndpoint)

const exts: any = { "image/svg+xml": "svg", "image/png": "png" }
export async function downloadFile(fileUrl: string, outputLocationPath: string): Promise<any> {
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {
    response.data.pipe(writer);
    return finished(writer); //this is a Promise
  });
}


app.get('/', async (req: Request, res: Response) => {
  console.log(__dirname)
  const query = gql`
  query MyQuery {
    airtable_bases(limit: 1) {
      table_datas(path: "views")
    }
  }
  
  `

  const data = await client.request(query)
  let urls: any = jp.query(data, '$..[?(@.url)]')


  let ids  = alasql('select distinct id, url, type from ? where id is not null', [urls])

  for (let i in ids) {
    // let id = uuidv4();
    let item = ids[i]

    if (item.id) {
      console.log(item.id)
      let url = `${__dirname}/uploads/${item.id}.${exts[item.type] ?? "png"}`;
      // console.log(url)
      await downloadFile(item.url, url)
    }
  }


  res.json(ids);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});