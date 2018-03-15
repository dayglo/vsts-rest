#!/usr/bin/env node

const chalk = require('chalk');
const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');
const fse = require('fs-extra')
const spawn = require('child_process').spawn;


//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Init
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var timeStamp = Date.now()
var projectName;

program
    .version(package.version)
    .usage("[projectName]")
    .arguments('[projectName]')
    .option('-b, --build <name of build definition>', 'build def to trigger')

    .action((ProjectName)=>{projectName = ProjectName})
    .parse(process.argv);

var build = program.build;



if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);


if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Helper Functions
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


function log(t){
    console.log(t)
}

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Main
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var projectId

Promise.resolve()
.then(()=>{
    log("Getting project data for project: " + chalk.blue(projectName))
    return vstsApi.getProjectByName(projectName)
})
.then(project => {
    if (project) {
        projectId = project.id
    } 
    else {
        log("project didnt exist")
        process.exit(0)
    }
})
.then(() =>{
    return vstsApi.getBuildDefinitionsbyName(projectId, build)
})
.then(definitions => {
    if ((definitions["length"] !== 1)) {
        return Promise.reject(new Error("The build definition did not exist or was not uniquely named."))
    }

    return vstsApi.startBuild(projectId, definitions[0].id)
})
.then(json => {
    return JSON.stringify(json,null,2)
})
.then(console.log)
.catch(console.error)

