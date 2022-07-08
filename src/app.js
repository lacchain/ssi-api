import express from 'express';
import http from 'http';
import cors from 'cors';
import VCRouter from "./routes/vc.js";
import PKIRouter from "./routes/pki.js";
import RegistryRouter from "./routes/registry.js";
import IndexRouter from "./routes/index.js";
import Logger from "./util/logger.js";
import config from "./config.js";
import fs from "fs";
import https from "https";
import { initServices } from "./services/index.js";

const logger = new Logger();
const app = express();
const vcRouter = new VCRouter( logger.instance() );
const pkiRouter = new PKIRouter( logger.instance() );
const registryRouter = new RegistryRouter( logger.instance() );
const indexRouter = new IndexRouter( logger.instance() );

app.use( cors() );
app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );


initServices().then( () => {
  console.log( 'Services initialized' );
} ).catch( error => {
  console.error( 'Initializing services', error );
  process.exit( 1 );
} );

app.use( function( req, res, next ) {
  res.setHeader( 'Strict-Transport-Security', 'max-age=15724800; includeSubDomains' );
  next();
} );

app.use( '/', indexRouter.getRouter() );
app.use( '/pki', pkiRouter.getRouter() );
app.use( '/vc', vcRouter.getRouter() );
app.use( '/registry', registryRouter.getRouter() );

try {
  if( !config.server.ssl.enabled ) {
    const server = http.createServer( app );

    server.listen( config.server.port, config.server.ip, function() {
      console.log( `${config.server.name} v${config.server.ver} HTTP | port`, config.server.port );
    } );
  } else {
    const privateKey = fs.readFileSync( config.server.ssl.key, 'utf8' );
    const certificate = fs.readFileSync( config.server.ssl.crt, 'utf8' );
    const credentials = { key: privateKey, cert: certificate };
    const ssl = https.createServer( credentials, app );

    ssl.listen( config.server.port, config.server.ip, function() {
      console.log( `${config.server.name} v${config.server.ver} HTTPS | port`, config.server.port );
    } );
  }
} catch( error ) {
  console.error( error );
  process.exit();
}