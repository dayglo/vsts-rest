const VstsApi = require('./api.js');

var vstsAccount = 'al-opsrobot-1'
var projectName = 'George_project_' +  Date.now()
// var projectId = 'd2506f04-0ed2-48d9-afaa-0d9b32c27812';
var buildDefinitionName = 'builddef-' +  Date.now()
var queueName = 'Hosted VS2017'

var releaseDefinitionName = 'releasedef-' +  Date.now()




const gitRepo = require('simple-git')('./tests/repos/simpleweb');
gitRepo.addRemote(projectName, 'https://'+ vstsAccount +'.visualstudio.com/_git/' +projectName)



var spit = (t)=>{
    return (d)=>{
        console.log(t)     
        return d
    }
}

function waitSec(t){
    return (d)=>{
        return new Promise((resolve, reject)=>{
            setTimeout(()=>{
                resolve(d)
            },t * 1000)
        }) 
    }
 
}

function push(repo){
    return new Promise((resolve, reject)=>{
        gitRepo.push(projectName,'master',(error,result)=>{
            if (error) reject( new Error(error))
            else resolve(result)
        })
    })
}

var token = process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);

var projectId = ""
var buildDefId = ""

vstsApi.createProject(projectName)
.then((project)=>{
    projectId = project.id;
    return vstsApi.createBuildDefinition(projectId , queueName, buildDefinitionName)
})
.then((buildDef)=>{
    buildDefId = buildDef.id
    return vstsApi.createReleaseDefinition(releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefId, queueName) 
})
.then(()=>{
    return push(projectName) 
})
.then((buildDef)=>{
    return vstsApi.startBuild(projectId, buildDefId)
})

.then(console.log)
.catch(console.error)


//needs to upload simpleweb repo
// trigger build
// trigger release