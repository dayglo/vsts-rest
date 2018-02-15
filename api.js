var request = require("request");

module.exports = function(vstsAccount, token) {

    var vstsApi = {}

    var endPoint = 'https://'+ vstsAccount +'.visualstudio.com'

    vstsApi.getObject = (url) => {
        return new Promise((resolve, reject)=>{
            var options = { method: 'GET',
                url: endPoint +  url,
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                json: true 
            };

            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);
        })
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

    vstsApi.createProject = (projectName) => {
        return vstsApi._createProject(projectName)
        .then(waitSec(35))
        .then(()=>{
            return vstsApi.getProjectByName(projectName)
        })
    }

    vstsApi._createProject = (projectName) => {
        return new Promise((resolve, reject)=>{

            var options = { method: 'POST',
                url: endPoint + '/_api/_project/CreateProject',
                headers: {
                    accept: 'application/json;api-version=4.0',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                body: { 
                    projectName: projectName,
                    projectDescription: '',
                    processTemplateTypeId: 'adcc42ab-9882-485e-a3ed-7678f01f66bc',
                    //collectionId: 'ba47a542-7971-4401-8d4e-aaa5f04d9ec6',
                    source: 'NewProjectCreation:',
                    projectData: '{"VersionControlOption":"Git","ProjectVisibilityOption":null}' 
                },
                json: true 
            };

            request(options, function (error, response, body) {
                console.log('created project ' + projectName)
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);
        })
    }

    vstsApi.getProjectByName = (projectName) => {
        return vstsApi.getObject('/_apis/projects/')
        .then((projectData)=>{
            return projectData.value.filter(p => p.name == projectName )[0]
        })
    }

    // vstsApi.getProjectId = (projectName) => {
    //     return vstsApi.getObject('/_apis/projects/')
    //     .then((projectData)=>{
    //         return projectData.value.filter( p => p.name == projectName )[0].id
    //     })
    // }

    vstsApi.deleteProject = (projectId) => {
        return new Promise((resolve, reject)=>{
            var options = {
                method: 'DELETE',
                url: endPoint + '/_apis/projects/' + projectId,
                headers: {
                    'accept-language': 'en-US,en;q=0.9',
                    accept: 'application/json;api-version=4.0',
                    'content-type': 'application/json'
                    // origin: endPoint
                },
                json: true
             }                

            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);

        })
    }

    vstsApi.createBuildDefinition = (projectId, queueName, buildDefinitionName)=>{

        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues')
        ])
        .then((queryData)=>{
            project = queryData[0];
            projectQueues = queryData[1];

            var queueId = projectQueues.value.filter(q => q.name == queueName)[0].id;
            projectName = project.name;

            return vstsApi._createBuildDefinition( projectId, projectName, queueId, queueName ,buildDefinitionName)
        })
    }

    vstsApi._createBuildDefinition = (projectId, projectName, queueId, queueName, buildDefinitionName) => {
        return new Promise((resolve, reject)=>{
            var url = endPoint + '/' + projectId + '/_apis/build/Definitions';

            var buildProcess = {
                phases:[ 
                    { 
                        steps: 
                        [ { environment: {},
                        enabled: true,
                        continueOnError: false,
                        alwaysRun: false,
                        displayName: 'Archive $(Build.BinariesDirectory)',
                        timeoutInMinutes: 0,
                        condition: 'succeeded()',
                        task: 
                        { id: 'd8b84976-e99a-4b86-b885-4849694435b0',
                        versionSpec: '2.*',
                        definitionType: 'task' },
                        inputs: 
                        { rootFolderOrFile: '$(Build.BinariesDirectory)',
                        includeRootFolder: 'true',
                        archiveType: 'zip',
                        tarCompression: 'gz',
                        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip',
                        replaceExistingArchive: 'true' } },
                        { environment: {},
                        enabled: true,
                        continueOnError: false,
                        alwaysRun: false,
                        displayName: 'Archive $(Build.BinariesDirectory)',
                        timeoutInMinutes: 0,
                        condition: 'succeeded()',
                        task: 
                        { id: 'd8b84976-e99a-4b86-b885-4849694435b0',
                        versionSpec: '2.*',
                        definitionType: 'task' },
                        inputs: 
                        { rootFolderOrFile: '$(Build.BinariesDirectory)',
                        includeRootFolder: 'true',
                        archiveType: 'zip',
                        tarCompression: 'gz',
                        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip',
                        replaceExistingArchive: 'true' } } ],
                        name: 'Phase 1',
                        condition: 'succeeded()',
                        target: 
                        { executionOptions: { type: 0 },
                        allowScriptsAuthAccessOption: false,
                        type: 1 },
                        jobAuthorizationScope: 'projectCollection',
                        jobCancelTimeoutInMinutes: 1 
                    } 
                ],
                type: 1 
            }

            var queue =  {
                _links: {
                    self: {
                        href: endPoint + '/_apis/build/Queues/' + queueId
                    }
                },
                id: queueId,
                name: queueName,
                url: endPoint + '/_apis/build/Queues/' + queueId,
                pool: {
                    id: 4,
                    name: queueName,
                    isHosted: true
                }
            }

            var body = {
                options: [{
                    enabled: false,
                    definition: {
                        id: '5d58cc01-7c75-450c-be18-a388ddb129ec'
                    },
                    inputs: {
                        branchFilters: '["+refs/heads/*"]',
                        additionalFields: '{}'
                    }
                }, {
                    enabled: false,
                    definition: {
                        id: 'a9db38f9-9fdc-478c-b0f9-464221e58316'
                    },
                    inputs: {
                        workItemType: '1844284',
                        assignToRequestor: 'true',
                        additionalFields: '{}'
                    }
                }, {
                    enabled: false,
                    definition: {
                        id: '57578776-4c22-4526-aeb0-86b6da17ee9c'
                    },
                    inputs: {}
                }],
                variables: {
                    'system.debug': {
                        value: 'false',
                        allowOverride: true
                    }
                },
                retentionRules: [{
                    branches: ['+refs/heads/*'],
                    artifacts: [],
                    artifactTypesToDelete: ['FilePath', 'SymbolStore'],
                    daysToKeep: 10,
                    minimumToKeep: 1,
                    deleteBuildRecord: true,
                    deleteTestResults: true
                }],
                properties: {
                    source: {
                        '$type': 'System.String',
                        '$value': 'projecthome'
                    }
                },
                tags: [],
                jobAuthorizationScope: 'projectCollection',
                jobTimeoutInMinutes: 60,
                jobCancelTimeoutInMinutes: 5,
                process: buildProcess,
                repository: {
                    properties: {
                        cleanOptions: '0',
                        labelSources: '0',
                        labelSourcesFormat: '$(build.buildNumber)',
                        reportBuildStatus: 'true',
                        gitLfsSupport: 'false',
                        skipSyncSource: 'false',
                        checkoutNestedSubmodules: 'false',
                        fetchDepth: '0'
                    },
                    id: '38966012-3a8a-4377-9da4-89cf0116d369',
                    type: 'TfsGit',
                    name: projectName,
                    url: endPoint + '/_git/' + projectName ,
                    defaultBranch: 'refs/heads/master',
                    clean: 'false',
                    checkoutSubmodules: false
                },
                processParameters: {},
                quality: 'definition',
                drafts: [],
                queue: queue,
                id: 6,
                name: '' + projectName + '-CI',
                url: url,
                path: '\\',
                type: 'build',
                queueStatus: 'enabled'
            }


            var options = {
                method: 'POST',
                url: endPoint + '/' + projectId + '/_apis/build/definitions',
                headers: {
                    'accept-language': 'en-US,en;q=0.9',
                    accept: 'application/json;api-version=4.0',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                body: body,
                json: true
             }                

            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);

        })
    }

    return vstsApi
}
