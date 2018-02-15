// https://{instance}[/{collection}[/{team-project}]/_apis[/{area}]/{resource}?api-version={version}
var request = require("request");

var vstsApi = {}

vstsApi.getObject = (url) => {
    return new Promise((resolve, reject)=>{
        var options = { method: 'GET',
            url: url,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                origin: 'https://' + vstsAccount + '.visualstudio.com'
            },
            json: true 
        };

        request(options, function (error, response, body) {
            if (error) reject( new Error(error))
            else resolve(body)
        }).auth('',token);
    })
}


vstsApi.createProject = (projectName) => {
    return new Promise((resolve, reject)=>{

        var options = { method: 'POST',
            url: 'https://' + vstsAccount + '.visualstudio.com/_api/_project/CreateProject',
            headers: {
                'accept-language': 'en-US,en;q=0.9',
                accept: 'application/json;api-version=4.1-preview.6;excludeUrls=true',
                'content-type': 'application/json',
                origin: 'https://' + vstsAccount + '.visualstudio.com'
            },
            body: { 
                projectName: projectName,
                projectDescription: '',
                processTemplateTypeId: 'adcc42ab-9882-485e-a3ed-7678f01f66bc',
                collectionId: 'ba47a542-7971-4401-8d4e-aaa5f04d9ec6',
                source: 'NewProjectCreation:',
                projectData: '{"VersionControlOption":"Git","ProjectVisibilityOption":null}' 
            },
            json: true 
        };

        request(options, function (error, response, body) {
            if (error) reject( new Error(error))
            else resolve(body)
        }).auth('',token);
    })
}



vstsApi.createBuildDefinition = (vstsAccount,projectId,buildDefinitionName) => {
    return new Promise((resolve, reject)=>{
        var url = 'https://' + vstsAccount + '.visualstudio.com/' + projectId + '/_apis/build/Definitions';

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
                name: '' + buildDefinitionName + '',
                url: 'https://' + vstsAccount + '.visualstudio.com/_git/' + buildDefinitionName + '',
                defaultBranch: 'refs/heads/master',
                clean: 'false',
                checkoutSubmodules: false
            },
            processParameters: {},
            quality: 'definition',
            drafts: [],
            queue: {
                _links: {
                    self: {
                        href: 'https://' + vstsAccount + '.visualstudio.com/_apis/build/Queues/34'
                    }
                },
                id: 34,
                name: 'Hosted VS2017',
                url: 'https://' + vstsAccount + '.visualstudio.com/_apis/build/Queues/34',
                pool: {
                    id: 4,
                    name: 'Hosted VS2017',
                    isHosted: true
                }
            },
            id: 6,
            name: '' + buildDefinitionName + '-CI',
            url: url,
            path: '\\',
            type: 'build',
            queueStatus: 'enabled'
        }


        var options = {
            method: 'POST',
            url: 'https://' + vstsAccount + '.visualstudio.com/' + projectId + '/_apis/build/definitions',
            headers: {
                'accept-language': 'en-US,en;q=0.9',
                accept: 'application/json;api-version=4.1-preview.6;excludeUrls=true',
                'content-type': 'application/json',
                origin: 'https://' + vstsAccount + '.visualstudio.com'
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


var vstsAccount = 'al-opsrobot-1'
var projectId = 'd2506f04-0ed2-48d9-afaa-0d9b32c27812';
var buildDefinitionName = 'builddef-' +  Date.now()

var spit = (t)=>{
    return (d)=>{
        console.log(t)     
        return d
    }
}

vstsApi.getProjectId = (vstsAccount,projectName) => {
    return vstsApi.getObject('https://'+ vstsAccount +'.visualstudio.com/_apis/projects/')
    .then((projectData)=>{
        debugger;
        return projectData.value.filter( p => p.name == projectName )[0].id
    })
}



var token = process.env.VSTS_PAT;

//vstsApi.createBuildDefinition( vstsAccount, projectId , buildDefinitionName)
//vstsApi.getObject('https://al-opsrobot-1.visualstudio.com/_apis/projects/')
vstsApi.getProjectId(vstsAccount,'george_project_5')
.then(console.log)
//.then(spit(buildDefinitionName))
.catch(console.error)
