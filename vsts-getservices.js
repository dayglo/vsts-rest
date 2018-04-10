#!/usr/bin/env node

const chalk = require('chalk');
const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');

if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var vstsAzureServiceName =   process.env.VSTS_AZURE_SERVICE
var vstsApi = new VstsApi(vstsAccount,token);

var projectName = process.argv[2]

if (!projectName)           {console.error("No project specified") ; process.exit(1)}

var stringify = (x) => {
	return JSON.stringify(x,null,2)
}

vstsApi.getProjectByName(projectName)
.then(project => {
	return vstsApi.getServiceEndpoints(project.id)

})
.then(stringify)
.then(console.log)
.catch(console.error)