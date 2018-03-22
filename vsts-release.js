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
    .option('-r, --releasedef <name of release definition>', 'release def to trigger')
    .option('-w, --wait' , 'wait for release to finish.')
    .option('--releaseid <releaseid>', 'use an existing release')
    .option('-a, --artifact', 'name of the artifact to use.',"")
    .option('-e, --environmentdeploy <environment_name>', 'trigger a particular environment to deploy.')
    .option('-m, --manualenvironment <environment_name>', 'set an environment to manual. May be specified multiple times.', collect, [])
    .option('-E, --environmentcheck <environment_name>', 'check a particular environment deployed successfully and ignore the others. May be specified multiple times.', collect, [])
    .action((ProjectName)=>{projectName = ProjectName})
    .parse(process.argv);

var releasedef = program.releasedef;
var environmentsToCheck = program.environmentcheck;
var manualEnvironments = program.manualenvironment;
var environmentDeploy = program.environmentdeploy;
var existingReleaseId = program.releaseid;

var errCode = 0


if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);


if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;

console.log('---')
log('project-name: ' + projectName )
log('release-definition-name: '+ program.releasedef)

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Helper Functions
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function log(t){
    console.log(t)
}

function collect(val, memo) {
    memo.push(val);
    return memo;
}

var completionPredicate = (release, environmentsToCheck) => {
    
    if (environmentsToCheck === undefined) {
        environmentsToCheck = release.environments.map(x => x.name)
    }

    var status = release.environments.reduce((acc,i) => {
        if (environmentsToCheck.indexOf(i.name) === -1) {
            return acc
        }
        acc.push("  " + i.name + ": " + i.status)
        return acc
    },[]).join("\n")

    var isFinished = true

    environmentsToCheck.forEach(envName => {
        var envStatus = release.environments.filter(e => e.name == envName)[0].status
        if ((envStatus === "inProgress") || (envStatus === "queued") || (envStatus === "notStarted")) {
            isFinished = false
        }

    })

    var result = "succeeded"
    if (isFinished) {
        environmentsToCheck.forEach(envName => {
            var envStatus = release.environments.filter(e => e.name == envName)[0].status
            if (envStatus !== "succeeded") {
                result = "failed"
            }
        })
    }

    return [isFinished,result,status]
}

var waitForReleaseComplete = (release, environmentsToCheck) => {
    return new Promise((resolve,reject) =>{
        console.log("status-check-log: |")
        var checkResult = () => {
            vstsApi.getObject(
                release.url,
                "",
                null,
                (body)=>{
                    var [isFinished,result,status] = completionPredicate(body,environmentsToCheck)
                    if (!isFinished) {
                        console.log(status)
                        setTimeout(checkResult,6000)
                    } else {
                        console.log(status)
                        console.log("result: " + result)
                        resolve(result)
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
        return vstsApi.getReleaseDefinitionsbyName(projectId, releasedef)
    })
    .then(definitions => {
        if ((definitions["length"] !== 1)) {
            throw new Error("The release definition did not exist or was not uniquely named.")
            return 
        }

        log("release-definition-id: " + definitions[0].id)
        log("release-definition-url: " + definitions[0].url)

        if (existingReleaseId) {
            return vstsApi.getReleaseById(projectId, existingReleaseId)
        } else {
            return vstsApi.createRelease(projectId, definitions[0].id)
        }

    })
    .then(release => {
        log("release-id: " + release.id)
        log("release-url: " + release.url)
        return release
    })
    .then(release => {
        if (typeof environmentDeploy == "string") {
            let environmentId = release.environments.filter(e => e.name == environmentDeploy)[0].id

            return vstsApi.triggerReleaseEnvironment(projectId, release.id, environmentId)
            .then(()=>{return release})

        } else {return release}
    })
    .then(release => {
        if (program.wait) {
            return waitForReleaseComplete(release, environmentsToCheck,manualEnvironments)
            .then(result=>{
                if (result == "succeeded"){
                    errCode = 0
                } else {
                    errCode = 2
                }
            })
        } else {
            return release
        }

    })
    .catch(sayError)

})
.then(()=>{
    log('...')
    process.exit(errCode)
})



