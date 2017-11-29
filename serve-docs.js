const _ = require('lodash');
const getPort = require('get-port');
const liveServer = require('live-server');

Promise
  .resolve()
  .then(getDocsPort)
  .then(serveDocs);

function getDocsPort() {
  return process.env.PORT || getPort();
}

function serveDocs(port) {

  const liveServerConfig = {
    browser: process.env.BROWSER,
    file: 'index.html',
    host: process.env.HOST || 'localhost',
    open: process.env.OPEN !== undefined ? process.env.OPEN.match(/^(1|y|yes|t|true)$/i) : true,
    port: port,
    root: './docs',
    wait: 50
  };

  liveServer.start(liveServerConfig);
}
