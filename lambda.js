'use strict'
const awsServerlessExpress = require('aws-serverless-express')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const RED = require('node-red')
const when = require('when');

var delay = (msec) => {
  return when.promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, msec)
  })
}

var settings = {
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

app.use(compression())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(awsServerlessExpressMiddleware.eventContext())

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

var init = (() => {
  RED.init(server,settings)
  // app.use(settings.httpAdminRoot,RED.httpAdmin);
  app.use(settings.httpNodeRoot,RED.httpNode);
  return RED.start().then(() => {
    console.log('Node-RED server started.')
    return delay(1000)
  })

})()

exports.handler = (event, context) => {
  init.then(() => {
    RED.nodes.loadFlows().then(()=>{
      awsServerlessExpress.proxy(server, event, context)
    })
  })
}
