const VstsApi = require('./api.js')  

var vstsAccount = 'al-opsrobot-1'

var token = process.env.VSTS_PAT;
var vstsApi = new VstsApi(vstsAccount,token);

var projectNamePrefix = 'George_project_'

// var spit = (t)=>{
//     return (d)=>{
//         console.log(t)     
//         return d
//     }
// }

// function waitSec(t){
//     return (d)=>{
//         return new Promise((resolve, reject)=>{
//             setTimeout(()=>{
//                 resolve(d)
//             },t * 1000)
//         }) 
//     }
 
// }

vstsApi.getObject('/_apis/projects/')
.then((projectData)=>{
    return projectData.value.filter(p => p.name.substr(0,15) == projectNamePrefix )
})
.then((projects)=>{
	return Promise.all(
		projects.map((p)=>{
			return vstsApi.deleteProject(p.id)
		})
	)
})
.then(console.log)
.catch(console.error)
