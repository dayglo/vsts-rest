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


    vstsApi.createReleaseDefinition = (releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId, queueName, releaseEnvironments) => { 

        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues'),
            vstsApi.getDefaultCollection()
        ])
        .then((queryData)=>{
            project = queryData[0];
            projectQueues = queryData[1];
            defaultCollectionId = queryData[2].id;

            var queueId = projectQueues.value.filter(q => q.name == queueName)[0].id;
            projectName = project.name;

            return vstsApi._createReleaseDefinition(defaultCollectionId, releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId, queueId, releaseEnvironments)
        })
    }

    vstsApi.getDefaultCollection = () => {
        return new Promise((resolve,reject)=>{ 
            var options = { method: 'GET',
                url: endPoint +  '/_apis/projectcollections',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                json: true 
            };

            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body.value[0])
            }).auth('',token);
        })
    }

    vstsApi._createReleaseDefinition = (collectionId, releaseDefinitionName, projectName, projectId, buildDefinitionName, buildDefinitionId, queueId, releaseEnvironments) => {
        return new Promise((resolve,reject)=>{ 

            var releaseEnvironments = [
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
            ]

            var rmObj = {
                "id": 0,
                "name": releaseDefinitionName,
                "source": 2,
                "comment": "",
                "createdOn": "2018-02-15T16:57:54.742Z",
                "createdBy": null,
                "modifiedBy": null,
                "modifiedOn": "2018-02-15T16:57:54.742Z",
                "environments": releaseEnvironments,
                "artifacts": [


// {
//       "alias": "GeorgeTestProject-CI",
//       "definitionReference": {
//         "artifactSourceDefinitionUrl": {
//           "id": "https://al-opsrobot-2.visualstudio.com/_permalink/_build/index?collectionId=6de18e65-7250-4d77-a0f5-937656f08a7e&projectId=8c8528f2-40e6-4dba-bf80-07ce61f71f0e&definitionId=3",
//           "name": ""
//         },
//         "defaultVersionBranch": {
//           "id": "",
//           "name": ""
//         },
//         "defaultVersionSpecific": {
//           "id": "",
//           "name": ""
//         },
//         "defaultVersionTags": {
//           "id": "",
//           "name": ""
//         },
//         "defaultVersionType": {
//           "id": "latestType",
//           "name": "Latest"
//         },
//         "definition": {
//           "id": "3",
//           "name": "GeorgeTestProject-CI"
//         },
//         "project": {
//           "id": "8c8528f2-40e6-4dba-bf80-07ce61f71f0e",
//           "name": "GeorgeTestProject"
//         }
//       },
//       "isPrimary": true,
//       "sourceId": "8c8528f2-40e6-4dba-bf80-07ce61f71f0e:3",
//       "type": "Build"
//     }

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
                            },
                            "artifactSourceDefinitionUrl": {
                              "id": endPoint + "/_permalink/_build/index?collectionId="+ collectionId +"&projectId=" + projectId + "definitionId=" + buildDefinitionId,
                              "name": ""
                            },
                        },
                        "alias": buildDefinitionName,
                        "isPrimary": true,
                        "sourceId": projectId + ':3'
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
                console.log('creating project ' + projectName)
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);
        })
    }

    vstsApi.startBuild = (projectId, buildId) => {
        return new Promise((resolve, reject)=>{
            var body = {
                "definition": {
                    "id": buildId
                },
                "sourceBranch": "refs/heads/master",
                "parameters": "{\"system.debug\":\"true\",\"BuildConfiguration\":\"debug\",\"BuildPlatform\":\"x64\"}"
            }

            var options = { method: 'POST',
                url: endPoint + '/DefaultCollection/' + projectId + '/_apis/build/builds',
                headers: {
                    accept: 'application/json;api-version=4.0-preview',
                    'content-type': 'application/json',
                    origin: endPoint
                },
                body: body,
                json: true 
            };

            request(options, function (error, response, body) {
                if (error) reject( new Error(error))
                else resolve(body)
            }).auth('',token);
        })

    }

    vstsApi.getProject = (project) => {
        return vstsApi.getObject('/_apis/projects/' + project)
    }

    vstsApi.getProjectByName = (projectName) => {
        return new Promise((resolve, reject)=>{
            vstsApi.getObject('/_apis/projects/')
            .then((projectData)=>{
                var result = null
                var project = projectData.value.filter(p => p.name == projectName )
                if (project) result = project[0]
                resolve(result)
            })
            .then(resolve,reject)
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

    vstsApi.createBuildDefinition = (projectId, queueName, buildDefinitionName, buildProcess)=>{

        if (!buildProcess) {
            var buildProcess = {
                "phases": [
                    {
                        "steps": [
                            {
                                "environment": {},
                                "enabled": true,
                                "continueOnError": false,
                                "alwaysRun": false,
                                "displayName": "Archive $(Build.BinariesDirectory)",
                                "timeoutInMinutes": 0,
                                "condition": "succeeded()",
                                "task": {
                                    "id": "d8b84976-e99a-4b86-b885-4849694435b0",
                                    "versionSpec": "2.*",
                                    "definitionType": "task"
                                },
                                "inputs": {
                                    "rootFolderOrFile": "$(Build.BinariesDirectory)",
                                    "includeRootFolder": "true",
                                    "archiveType": "zip",
                                    "tarCompression": "gz",
                                    "archiveFile": "$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip",
                                    "replaceExistingArchive": "true"
                                }
                            },
                            {
                                "environment": {},
                                "enabled": true,
                                "continueOnError": false,
                                "alwaysRun": false,
                                "displayName": "Archive $(Build.BinariesDirectory)",
                                "timeoutInMinutes": 0,
                                "condition": "succeeded()",
                                "task": {
                                    "id": "d8b84976-e99a-4b86-b885-4849694435b0",
                                    "versionSpec": "2.*",
                                    "definitionType": "task"
                                },
                                "inputs": {
                                    "rootFolderOrFile": "$(Build.BinariesDirectory)",
                                    "includeRootFolder": "true",
                                    "archiveType": "zip",
                                    "tarCompression": "gz",
                                    "archiveFile": "$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip",
                                    "replaceExistingArchive": "true"
                                }
                            }
                        ],
                        "name": "Phase 1",
                        "condition": "succeeded()",
                        "target": {
                            "executionOptions": {
                                "type": 0
                            },
                            "allowScriptsAuthAccessOption": false,
                            "type": 1
                        },
                        "jobAuthorizationScope": "projectCollection",
                        "jobCancelTimeoutInMinutes": 1
                    }
                ],
                "type": 1
            }
        }

        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues')
        ])
        .then((queryData)=>{
            project = queryData[0];
            projectQueues = queryData[1];

            var queueId = projectQueues.value.filter(q => q.name == queueName)[0].id;
            projectName = project.name;

            return vstsApi._createBuildDefinition( projectId, projectName, queueId, queueName ,buildDefinitionName, buildProcess)
        })
    }

    vstsApi._createBuildDefinition = (projectId, projectName, queueId, queueName, buildDefinitionName, buildProcess) => {
        return new Promise((resolve, reject)=>{
            var url = endPoint + '/' + projectId + '/_apis/build/Definitions';

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
                name: '' + buildDefinitionName,
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
