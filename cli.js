const chalk = require('chalk');
const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');
const fse = require('fs-extra')

var timeStamp = Date.now()
var projectName;

program
	.version(package.version)
	.usage("[projectName]")
	.arguments('[projectName]')
	.option('-g, --gitrepo [path to git repo]', 'Path to the git repo to deploy. Default is the current directory.' , './')
	.option('-b, --buildsteps [path to build process json]', 'Include release steps in the new release definition [buildSteps]', './buildProcess.json')
	.option('-r, --releasesteps [path to release process json]', 'Include build steps in the new build definition [releaseSteps]', './releaseProcess.json')
	.action((ProjectName)=>{projectName = ProjectName})
	.parse(process.argv);

var gitRepository = require('simple-git/promise')(program.gitrepo); 

if (!process.env.VSTS_ACCOUNT) 			 {console.log("Env var VSTS_ACCOUNT is not set. (This is the first part of your vsts project domain name). ") ; process.exit(1)}
if (!process.env.VSTS_PAT)    			 {console.log("Env var VSTS_PAT is not set. You need to generate one form the VSTS UI. Make sure it has access to the correct projects.") ; process.exit(1)}
if (!process.env.VSTS_AZURE_SERVICE)     {console.log("Env var VSTS_AZURE_SERVICE is not set. Go to https://" + process.env.VSTS_ACCOUNT + "/" + projectName + "/_admin/_services to create one.") ; process.exit(1)}
var vstsAccount = 			 process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =      			 process.env.VSTS_PAT;
var vstsAzureServiceName =	 process.env.VSTS_AZURE_SERVICE
var vstsApi = new VstsApi(vstsAccount,token);


function log(t){
	console.log(t)
}
function addRemote(){
	return gitRepository.addRemote(projectName, 'https://'+ vstsAccount +'.visualstudio.com/_git/' +projectName + timeStamp)
}
function spitAndQuit(error) {
	console.error("there was an error: " + error)
	process.exit(5)
}
function setRemote(projectName){
	return new Promise((resolve,reject)=>{

		var addRemote = ()=>{
			return gitRepository.addRemote(projectName, 'https://'+ vstsAccount +'.visualstudio.com/_git/' + projectName)
		}
		gitRepository.removeRemote(projectName)
		.then(addRemote,addRemote)
		.then(resolve,reject)
	})
}



if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;
var buildDefinitionName = "Imported Build " + timeStamp
var releaseDefinitionName = "Imported Release " + timeStamp
console.log('Project name:         ' + chalk.blue(projectName))
console.log('Build definition:     ' + chalk.magenta(buildDefinitionName))
console.log('Release definition:   ' + chalk.green(releaseDefinitionName))





var build,release,projectId,buildDefId;

log(`Opening ${program.buildsteps} and ${program.releasesteps }...`)
Promise.all([
	fse.readJson(program.buildsteps  ).catch(spitAndQuit),
	fse.readJson(program.releasesteps).catch(spitAndQuit)
])
.then(files => {
	buildProcess = files[0]
	releaseProcess = files[1]
})
.then(()=>{
	log("Getting project data for project: " + chalk.blue(projectName))
	return vstsApi.getProjectByName(projectName)
})
.then(project => {
	if (project) 	return project
	else {
		log("project didnt exist - creating it....")
		return vstsApi.createProject(projectName)
	}
})
.then(project=>{
	log("Set project remote")
	return setRemote(projectName)
	.then(()=>{
		return project
	})
	.catch((e)=>{
		console.error(e)
		return project
	})
})
.then(project => {
	log("creating build definition: " + chalk.magenta(buildDefinitionName))
	projectId = project.id
	return vstsApi.createBuildDefinition(project.id, 'Hosted VS2017', buildDefinitionName, buildProcess)
})
.then(buildDef => {
	buildDefId	= buildDef.id
})
.then(()=>{
	log("pushing code to repo")
	return gitRepository.push(projectName, 'master')
})
.then(()=>{
	log("starting build")
	return vstsApi.startBuild(projectId, buildDefId)
})
.then(() => {
	log("creating release definition: " + chalk.green(releaseDefinitionName))
	return vstsApi.createReleaseDefinition(releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefId, 'Hosted VS2017' , releaseProcess, vstsAzureServiceName) 
})
.then(console.log)
.catch(console.error)

