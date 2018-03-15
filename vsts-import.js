#!/usr/bin/env node

const chalk = require('chalk');
const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');
const fse = require('fs-extra')
const tmp = require('tmp');
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
    .option('-g, --gitrepo <path to git repo>', 'Path to the git repo to deploy. Default is the current directory.' , './')
    .option('-b, --build <path to build definition json>', 'Include release steps in the new release definition [build]', './build.json')
    .option('-r, --release <path to release definition json>', 'Include build steps in the new build definition [release]', './release.json')
    .option('-a, --buildagent <build agent queue name>', 'Agent type to use for build', 'Hosted VS2017')
 //   .option('-A, --releaseagent <release agent queue name>', 'Agent type to use for release', 'Hosted VS2017')  
    .option('-A, --releaseagent [release_env_name[:phase_name]=agent_type', 'Agent type to use for release', collect, [])  
    .option('-v, --var [release_env_name:]variable=value', 'override variables in your release definition.' , collect, [])
    .option('--buildservice <input key=Service endpoint name>', 'override service endpoints in your build definition.' ,collect, [])
    .option('--releaseservice <input key=Service endpoint name> ', 'override service endpoints in your build definition.' , collect, [])
    .option('--no-git', 'don\'t push the repo to vsts', false )

    .action((ProjectName)=>{projectName = ProjectName})
    .parse(process.argv);

var gitRepo = program.gitrepo;
var buildFile = program.build;
var releaseFile = program.release;
var buildAgent = program.buildagent;
var releaseAgent = program.releaseagent;


var releaseVariables = {
    release: {},
    environments: {}
}

releaseVariables = program.var.reduce((acc,i) => {
    var [key,value] = i.split('=')
    
    if (key.indexOf(":") == -1) { 
        acc.release[key] = value
    } else {
        [env,key] = key.split(':')
        if (!acc.environments[env]) {
            acc.environments[env] = {}
        }
        acc.environments[env][key] = value
    }
    
    return acc
},releaseVariables)

var releaseAgents = program.releaseagent.map((i)=>{
    if (i.indexOf("=") == -1) {
        return i
    } else {
        var out = {}
        var [path,queueName] = i.split('=')

        if (path.indexOf(":") == -1) {
            var environment = path
            out[path] = queueName
        } else {
            var [environment,phase] = path.split(':')
            o = {}
            o[phase] = queueName
            out[environment] = o
        }
        return out
    }
},[])

var buildServiceEndpoints = program.buildservice.reduce((acc,i)=>{
    var [key,value] = i.split('=')
    acc[key] = value
    return acc
},{})

var releaseServiceEndpoints = program.releaseservice.reduce((acc,i)=>{
    var [key,value] = i.split('=')
    acc[key] = value
    return acc
},{})

if (!process.env.VSTS_ACCOUNT)           {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)               {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
if (!process.env.VSTS_USER)              {console.log("Env var VSTS_USER is not set. This should be set to the email address you use to log into VSTS.") ; process.exit(1)}
if (!process.env.VSTS_AZURE_SERVICE)     {console.log("Env var VSTS_AZURE_SERVICE is not set. Go to https://" + process.env.VSTS_ACCOUNT + "/" + projectName + "/_admin/_services to create one.") ; process.exit(1)}
var vstsAccount =            process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =                  process.env.VSTS_PAT;
var user =                   process.env.VSTS_USER;
var vstsAzureServiceName =   process.env.VSTS_AZURE_SERVICE
var vstsApi = new VstsApi(vstsAccount,token);


if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;

console.log('Project name:      ' + chalk.blue(projectName))
console.log('Build agent:       ' + chalk.yellow(buildAgent)) 
console.log("Release agent replacements:\n" + chalk.yellow(JSON.stringify(releaseAgents,null,2)))



//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Helper Functions
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function collect(val, memo) {
    memo.push(val);
    return memo;
}

function colourLog(colour,level){
    return (t)=>{
        console[level](chalk[colour](t))
    }
}

function log(t){
    console.log(t)
}

function spitAndQuit(error) {
    console.error("there was an error: " + error)
    process.exit(5)
}


var git = (localPath, command, stdout, stderr) =>{
    return new Promise((resolve,reject)=>{

        var pullRepoProcess = spawn('git' , command , {cwd:localPath});

        pullRepoProcess.stdout.setEncoding('utf-8');
        pullRepoProcess.stderr.setEncoding('utf-8');

        pullRepoProcess.stdout.on('data', stdout);
        pullRepoProcess.stderr.on('data', stderr);

        pullRepoProcess.on('error', stdout);

        pullRepoProcess.on('close', (code) => {
            //stdout(`command "git ${command.join(' ')}" exited with code ${code}`);
            if (code == 0 ){
                resolve(code)
            } else {
                reject(code)
            }
        });
    })
} 


//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Main
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var build,
    release,
    projectId,
    buildDefId,
    temporaryFolder,
    buildDefinition,
    releaseDefinition;

log(`Opening ${buildFile} and ${releaseFile }...`)
Promise.all([
    fse.readJson(buildFile  ).catch(spitAndQuit),
    fse.readJson(releaseFile).catch(spitAndQuit)
])
.then(files => {
    buildDefinition = files[0]
    releaseDefinition = files[1]
})
.then(()=>{
    log("Getting project data for project: " + chalk.blue(projectName))
    return vstsApi.getProjectByName(projectName)
})
.then(project => {
    if (project)    return project
    else {
        log("project didnt exist - creating it....")
        return vstsApi.createProject(projectName)
    }
})
.then(project=>{

    if (program.git) {
        temporaryFolder = tmp.dirSync({unsafeCleanup:true});
        log(`pulling repo ${gitRepo} into ${temporaryFolder.name}`)

        return git(temporaryFolder.name , ['clone' , gitRepo , '.'] , colourLog('gray',"log") , colourLog('gray',"error"))
        .then(()=>{
            return git(
                temporaryFolder.name , 
                ['remote', 'add' , projectName , 'https://'+ vstsAccount +'.visualstudio.com/_git/' + projectName] , 
                colourLog('cyan',"log") , 
                colourLog('cyan',"error")
            )
        })
        .then(()=>{
            return project
        })
    } else {
        return project
    }


})
.then(project => {
    log("creating build definition: " + chalk.magenta(buildDefinition.name))
    projectId = project.id
    return vstsApi.createBuildDefinition(project.id, buildAgent, buildDefinition, buildServiceEndpoints ,true)
})
.then(buildDef => {
    buildDefId  = buildDef.id
})
.then(()=>{
    if (program.git) {
        log("pushing code to repo")
        return git(temporaryFolder.name , ['push' , projectName , 'master'] , colourLog('gray',"log") , colourLog('gray',"error"))    
    }
    return Promise.resolve()
})
.then(()=>{
    log("starting build")
    return vstsApi.startBuild(projectId, buildDefId)
})
.then(() => {
    log("creating release definition: " + chalk.green(releaseDefinition.name))
    return vstsApi.createReleaseDefinition(
        projectName, 
        projectId, 
        buildDefinition.name, 
        buildDefId, 
        releaseAgents , 
        releaseDefinition, 
        releaseServiceEndpoints, 
        user, 
        true, 
        releaseVariables
    ) 
})
.then(json => {
    return JSON.stringify(json,null,2)
})
.then(console.log)
.catch(handleExit)

function handleExit (e) {
    console.error(e)
    process.exit(1)
}
