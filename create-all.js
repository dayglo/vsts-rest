const VstsApi = require('./api.js')  

var vstsAccount = 'al-opsrobot-1'
var projectName = 'George_project_' +  Date.now()
// var projectId = 'd2506f04-0ed2-48d9-afaa-0d9b32c27812';
var buildDefinitionName = 'builddef-' +  Date.now()
var queueName = 'Hosted VS2017'

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

var token = process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);


vstsApi.createProject(projectName)
.then((project)=>{
    return vstsApi.createBuildDefinition(project.id , queueName, buildDefinitionName)
})

.then(console.log)
.catch(console.error)
