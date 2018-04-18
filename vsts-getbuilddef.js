#!/usr/bin/env node

const chalk = require('chalk');
const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Init
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var timeStamp = Date.now()
var ProjectName;

program
    .version(package.version)
    .usage("[projectName]")
    .arguments('[projectName]')
    .option('-b, --build <name of build definition>', 'build def to get')
    .action((ProjectName)=>{projectName = ProjectName})
    .parse(process.argv);


if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);


vstsApi.getProjectByName(projectName)
.then(project => {
	return vstsApi.getBuildDefinitionsbyName(project.id, program.build)
})
.then(console.log)
.catch(console.error)