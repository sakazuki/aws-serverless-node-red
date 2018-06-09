'use strict'
const awsServerlessExpress = require('aws-serverless-express')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const RED = require('node-red')
let server;

let headless = (process.env.HEADLESS === "true") || false;
let reloadFlow = (process.env.RELOAD_FLOW === "true") || false;

let settings = {
    disableEditor: true,
    httpAdminRoot: false,
    httpNodeRoot: '/',
    // httpStatic: 'public',
    awsRegion: process.env.AWS_REGION,
    awsS3Bucket: process.env.S3_BUCKET,
    awsS3Appname: process.env.AWS_LAMBDA_FUNCTION_NAME,
    storageModule: require('node-red-contrib-storage-s3'),
    functionGlobalContext: { },
    credentialSecret: process.env.NODE_RED_SECRET || "a-secret-key"
};

if (headless) {
  settings.httpRoot = false;
  settings.httpAdminRoot = false;
  settings.httpNodeRoot = false;
}
// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below, then redeploy (`npm run package-deploy`)
const binaryMimeTypes = [
  'application/javascript',
  'application/json',
  'application/octet-stream',
  'application/xml',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'text/comma-separated-values',
  'text/css',
  'text/html',
  'text/javascript',
  'text/plain',
  'text/text',
  'text/xml'
]

if (!headless) {
  app.use(compression())
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(awsServerlessExpressMiddleware.eventContext())
  server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)
}

let init = (() => {
  if (headless) {
    RED.init(settings)
  }else{
    RED.init(server, settings)
    //app.use(settings.httpAdminRoot,RED.httpAdmin);
    app.use(settings.httpNodeRoot,RED.httpNode);
  }
  return new Promise((resolve, reject) => {
    let deployed;
    RED.events.on("runtime-event", deployed = function(data){
      if (data.id === "runtime-deploy") {
        RED.events.removeListener("runtime-event", deployed);
        // console.log('flow deployed');
        resolve();
      }
    })
    RED.start();
  });
})()

function setup(){
  return init.then(() => {
    return new Promise((resolve, reject) => {
      if (reloadFlow) {
        RED.nodes.loadFlows().then(() => { resolve() });
      }else{
        resolve();
      }
    });
  });
}

exports.handler = (event, context, callback) => {
  setup().then(()=>{
    if (headless) {
      let handlers = {};
      function clearHandlers(){
        for(var key in handlers) RED.events.removeListener(key, handlers[key]);
      }
      function setHandlers(){
        for(var key in handlers) RED.events.once(key, handlers[key]);
      }
      handlers['aws:lambda:done:' + context.awsRequestId] = function(msg){ clearHandlers(); callback(null, msg) };
      handlers['aws:lambda:error'] = function(msg){ clearHandlers(); callback(msg) };
      setHandlers();
      RED.events.emit('aws:lambda:invoke', event, context)
    }else{
      awsServerlessExpress.proxy(server, event, context)
    }
  })
}
