var request = require("request");

module.exports = function(vstsAccount, token) {

    var vstsApi = {}

    var endPoint   = 'https://'+ vstsAccount +'.visualstudio.com'
    var rmEndPoint = 'https://'+ vstsAccount +'.vsrm.visualstudio.com'

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

    vstsApi.createReleaseDefinition = (releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId, queueName) => {
        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues')
        ])
        .then((queryData)=>{
            project = queryData[0];
            projectQueues = queryData[1];

            var queueId = projectQueues.value.filter(q => q.name == queueName)[0].id;
            projectName = project.name;

            return vstsApi._createReleaseDefinition(releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId,queueId)
        })
    }

    vstsApi._createReleaseDefinition = (releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId, queueId) => {
        return new Promise((resolve,reject)=>{   
            var rmObj = {
                "id": 0,
                "name": releaseDefinitionName,
                "source": 2,
                "comment": "",
                "createdOn": "2018-02-15T16:57:54.742Z",
                "createdBy": null,
                "modifiedBy": null,
                "modifiedOn": "2018-02-15T16:57:54.742Z",
                "environments": [
                    {
                        "id": -1,
                        "name": "Environment 1",
                        "rank": 1,
                        "variables": {},
                        "variableGroups": [],
                        "preDeployApprovals": {
                            "approvals": [
                                {
                                    "rank": 1,
                                    "isAutomated": true,
                                    "isNotificationOn": false,
                                    "id": 0
                                }
                            ]
                        },
                        "deployStep": {
                            "tasks": [],
                            "id": 0
                        },
                        "postDeployApprovals": {
                            "approvals": [
                                {
                                    "rank": 1,
                                    "isAutomated": true,
                                    "isNotificationOn": false,
                                    "id": 0
                                }
                            ]
                        },
                        "deployPhases": [
                            {
                                "deploymentInput": {
                                    "parallelExecution": {
                                        "parallelExecutionType": "none"
                                    },
                                    "skipArtifactsDownload": false,
                                    "artifactsDownloadInput": {},
                                    "queueId": queueId,
                                    "demands": [],
                                    "enableAccessToken": false,
                                    "timeoutInMinutes": 0,
                                    "jobCancelTimeoutInMinutes": 1,
                                    "condition": "succeeded()",
                                    "overrideInputs": {}
                                },
                                "rank": 1,
                                "phaseType": 1,
                                "name": "Agent phase",
                                "workflowTasks": [],
                                "tasks": []
                            }
                        ],
                        "runOptions": {},
                        "environmentOptions": {
                            "emailNotificationType": "OnlyOnFailure",
                            "emailRecipients": "release.environment.owner;release.creator",
                            "skipArtifactsDownload": false,
                            "timeoutInMinutes": 0,
                            "enableAccessToken": false,
                            "publishDeploymentStatus": true,
                            "autoLinkWorkItems": false
                        },
                        "demands": [],
                        "conditions": [
                            {
                                "conditionType": 1,
                                "name": "ReleaseStarted",
                                "value": ""
                            }
                        ],
                        "executionPolicy": {
                            "queueDepthCount": 0,
                            "concurrencyCount": 0
                        },
                        "schedules": [],
                        "properties": {},
                        "preDeploymentGates": {
                            "id": 0,
                            "gatesOptions": null,
                            "gates": []
                        },
                        "postDeploymentGates": {
                            "id": 0,
                            "gatesOptions": null,
                            "gates": []
                        },
                        "owner": {
                            "displayName": "George Cairns",
                            "id": "bbb8585f-0e50-4a81-884c-8bcce0330c36",
                            "isContainer": false,
                            "uniqueName": "george@opsrobot.co.uk",
                            "url": "https://al-opsrobot-1.visualstudio.com/"
                        },
                        "retentionPolicy": {
                            "daysToKeep": 30,
                            "releasesToKeep": 3,
                            "retainBuild": true
                        },
                        "processParameters": {}
                    }
                ],
                "artifacts": [
                    {
                        "type": "Build",
                        "definitionReference": {
                            "project": {
                                "name": projectName,
                                "id":   projectId
                            },
                            "definition": {
                                "name": buildDefinitionName,
                                "id": buildDefinitionId
                            },
                            "defaultVersionType": {
                                "name": "Latest",
                                "id": "latestType"
                            },
                            "defaultVersionBranch": {
                                "name": "",
                                "id": ""
                            },
                            "defaultVersionTags": {
                                "name": "",
                                "id": ""
                            },
                            "defaultVersionSpecific": {
                                "name": "",
                                "id": ""
                            }
                        },
                        "alias": buildDefinitionName,
                        "isPrimary": true,
                        "sourceId": ""
                    }
                ],
                "variables": {},
                "variableGroups": [],
                "triggers": [],
                "lastRelease": null,
                "tags": [],
                "path": "\\",
                "properties": {
                    "DefinitionCreationSource": "ReleaseNew"
                },
                "releaseNameFormat": "Release-$(rev:r)",
                "description": ""
            }

             var options = { method: 'POST',
                url: rmEndPoint + '/'+ projectId +'/_apis/Release/definitions',
                headers: {
                    accept: 'application/json;api-version=4.0-preview',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                body: rmObj,
                json: true 
            };


            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);
        })

    }

    vstsApi.createProject = (projectName) => {
        return vstsApi._createProject(projectName)
        .then(waitSec(45))
        .then(()=>{
            return vstsApi.getProjectByName(projectName)
        })
    }

    vstsApi._createProject = (projectName) => {
        return new Promise((resolve, reject)=>{

            var options = { method: 'POST',
                url: endPoint + '/_api/_project/CreateProject',
                headers: {
                    accept: 'application/json;api-version=4.0-preview',
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
                    accept: 'application/json;api-version=4.0-preview',
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
                    accept: 'application/json;api-version=4.0-preview',
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
