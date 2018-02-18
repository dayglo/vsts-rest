const package = require('./package.json')
const program = require('commander');
const VstsApi = require('./api.js');
const fse = require('fs-extra')


var vstsAccount = process.env.VSTS_ACCOUNT // 'al-opsrobot-2'
var token =       process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);

const gitRepo = require('simple-git/promise')('./tests/repos/demoapplication');



var timeStamp = Date.now()

var projectName;

program
	.version(package.version)
	.usage("[projectName]")
	.arguments('[projectName]')
	.option('-b, --buildsteps [path to build process json]', 'Include release steps in the new release definition [buildSteps]', './buildProcess.json')
	.option('-r, --releasesteps [path to release process json]', 'Include build steps in the new build definition [releaseSteps]', './releaseProcess.json')
	.action((ProjectName)=>{projectName = ProjectName})
	.parse(process.argv);


function addRemote(){
	return gitRepo.addRemote(projectName + timeStamp, 'https://'+ vstsAccount +'.visualstudio.com/_git/' +projectName + timeStamp)
}


if (!projectName) projectName = require("os").userInfo().username + '-' + timeStamp;
console.log('Project name: ' + projectName)
console.log(`Opening ${program.buildsteps} and ${program.releasesteps }...`)

function spitAndQuit(error) {
	console.error("there was an error: " + error)
	process.exit(5)
}

var build,release,projectId,buildDefId;

Promise.all([
	fse.readJson(program.buildsteps  ).catch(spitAndQuit),
	fse.readJson(program.releasesteps).catch(spitAndQuit)
])
.then(files => {
	buildProcess = files[0]
	releaseProcess = files[1]
})
.then(()=>{
	return vstsApi.getProjectByName(projectName)
})
.then(project => {
	if (project) 	return project
	else 			return vstsApi.createProject(projectName)
})
.then(project=>{
	return addRemote()
	.then(()=>{
		return project
	}) 
})
.then(project => {
	projectId = project.id
	return vstsApi.createBuildDefinition(project.id, 'Hosted VS2017', 'Imported Build ' + timeStamp, buildProcess)
})
.then(buildDef => {
	buildDefId	= buildDef.id
})
.then(()=>{
    return gitRepo.push(projectName + timeStamp) 
})
.then(()=>{
    return vstsApi.startBuild(projectId, buildDefId)
})
.then(() => {
    return vstsApi.createReleaseDefinition('Imported Release Definition ' + timeStamp, projectName, projectId, 'Imported Build ' + timeStamp, buildDefId, 'Hosted VS2017' , releaseProcess) 
})
.then(console.log)
.catch(console.error)


// .then(console.log)
// .catch(console.error)





//if project exists dont create it, use it