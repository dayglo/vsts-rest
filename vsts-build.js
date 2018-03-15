#!/usr/bin/env node

const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');
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
    .option('-w, --wait' , 'wait for build to finish.')
    .action((ProjectName)=>{projectName = ProjectName})
    .parse(process.argv);

var build = program.build;
var errCode = 0


if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);


if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;

console.log('---')
log('project-name: ' + projectName )
log('build-definition-name: '+ program.build)
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Helper Functions
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


function log(t){
    console.log(t)
}


var waitForBuildComplete = (build) => {
    return new Promise((resolve,reject) =>{
        console.log("status-check-log: |")
        var checkResult = () => {
            process.stdout.write("  checking status: ")
            vstsApi.getObject(
                build.url,
                "",
               null,
                (body)=>{
                    if (body.status !== "completed") {
                        console.log(body.status)
                        setTimeout(checkResult,3000)
                    } else {
                        console.log(body.status)
                        console.log("result: " + body.result)
                        resolve(body.result)
                    }
                    
                }
            )
        }
        checkResult()
    })
}

function sayError(e){
    console.log('error:')
    console.log('  message: ' + e.message)
    console.log('  stack: ' + JSON.stringify(e.stack))
    errCode = 1;
}

//url, endpoint, predicate, resultExtractor
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Main
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var projectId


Promise.resolve()
.then(()=>{

    return Promise.resolve()
    .then(()=>{
        //log("Getting project data for project: " + chalk.blue(projectName))
        return vstsApi.getProjectByName(projectName)
    })
    .then(project => {
        if (project) {
            projectId = project.id
        } 
        else {
            log("error: project didnt exist")
            process.exit(0)
        }
    })
    .then(() =>{
        return vstsApi.getBuildDefinitionsbyName(projectId, build)
    })
    .then(definitions => {
        if ((definitions["length"] !== 1)) {
            throw new Error("The build definition did not exist or was not uniquely named.")
            return 
        }

        log("build-definition-id: " + definitions[0].id)
        log("build-definition-url: " + definitions[0].url)
        return vstsApi.startBuild(projectId, definitions[0].id)
    })
    .then(build => {
        if (program.wait) {
            return waitForBuildComplete(build)
        } else {
            return build
        }

    })
    .catch(sayError)

})
.then(()=>{
    log('...')
    process.exit(errCode)
})



