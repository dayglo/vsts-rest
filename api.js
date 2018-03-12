var request = require("request");
var _ = require('lodash');


module.exports = function(vstsAccount, token) {

    var vstsApi = {}

    var endPoint   = 'https://'+ vstsAccount +'.visualstudio.com'
    var rmEndPoint = 'https://'+ vstsAccount +'.vsrm.visualstudio.com'

    var headers = {
        accept: 'application/json;api-version=4.0-preview;excludeUrls=true',
        'content-type': 'application/json',
        origin: endPoint,
    }

    function checkResponse(resolve,reject,predicate,resultExtractor){
        return (error, response, body) => {
            if (!predicate)         predicate       = () => {return true}
            if (!resultExtractor)   resultExtractor = x => x

            if (error) return reject( new Error(error));

            var result = {
                response:response,
                body:body
            }

            if (predicate(result)) {
                resolve(resultExtractor(body))
            } else {
                reject( new Error("The request's result was not as expected: " + JSON.stringify(result,null,2)))
            }
        }
    }

    vstsApi.getObject = (url, endpoint, predicate, resultExtractor) => {
        return new Promise((resolve, reject)=>{
            if (endpoint) endPoint = endpoint;
            
            if (!predicate) {
                var predicate = (result) => {
                    return (result.response.statusCode == 200)
                }
            }

            var options = { 
                method: 'GET',
                url: endPoint +  url,
                headers: headers,
                json: true 
            };

            request(options, checkResponse(resolve, reject, predicate, resultExtractor)).auth('',token);
        })
    }

    vstsApi.postObject = (url, body, endpoint, predicate, resultExtractor, accept) => {
        return vstsApi.sendObject('POST', url, body, endpoint, predicate, resultExtractor, accept) 
    }

    vstsApi.putObject = (url, body, endpoint, predicate, resultExtractor, accept) => {
        return vstsApi.sendObject('PUT', url, body, endpoint, predicate, resultExtractor, accept) 
    }

    vstsApi.sendObject = (method, url, body, endpoint, predicate, resultExtractor, accept) => {
        return new Promise((resolve, reject)=>{
            if (endpoint) endPoint = endpoint;

            if (!predicate) {
                var predicate = (result) => {
                    return (result.response.statusCode == 200)
                }
            }

            var myHeaders = headers;
            if (accept) myHeaders.accept = accept;

            var options = { method: method,
                url: endPoint +  url,
                headers: myHeaders,
                json: true,
                body: body
            };
            request(options, checkResponse(resolve, reject, predicate, resultExtractor)).auth('',token);
        })
    }

    vstsApi.delObject = (url, endpoint, predicate) => {
        return new Promise((resolve, reject)=>{
            if (endpoint) endPoint = endpoint;

            if (!predicate) {
                var predicate = (result) => {
                    return (result.response.statusCode == 204)
                }
            }

            var options = { method: 'DELETE',
                url: endPoint +  url,
                headers: headers
            };
            request(options, checkResponse(resolve, reject, predicate)).auth('',token);
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

    vstsApi.getActiveUser = ()=>{
        return vstsApi.getObject('/_apis/profile/profiles/me', 'https://app.vssps.visualstudio.com')
    }

    vstsApi.searchIdentity = (identityEmail) => {

        body = {
            "filterByAncestorEntityIds": [],
            "filterByEntityIds": [],
            "identityTypes": [
            "user",
            "group"
            ],
            "operationScopes": [
            "ims"
            ],
            "options": {
            "MaxResults": 40,
            "MinResults": 40
            },
            "properties": [
            "DisplayName",
            "IsMru",
            "ScopeName",
            "SamAccountName",
            "Active",
            "SubjectDescriptor",
            "Department",
            "JobTitle",
            "Mail",
            "MailNickname",
            "PhysicalDeliveryOfficeName",
            "SignInAddress",
            "Surname",
            "Guest",
            "TelephoneNumber",
            "Description"
            ],
            "query": identityEmail
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

        return vstsApi.postObject('/_apis/IdentityPicker/Identities', body)
        .then(o => {
            return o.results[0].identities[0]
        })
        .catch(e=>{
            console.error('Couldnt search identities: ' + e);
            process.exit(10)
        })
    }

    vstsApi.getAzureRmSubscriptions = () => {
         return vstsApi.getObject('_apis/distributedtask/serviceendpointproxy/azurermsubscriptions')
         .then(o=>{
            return o.value
         })
    }

    vstsApi.getServiceEndpoint = (projectId, endpointName) =>{
        return vstsApi.getServiceEndpoints (projectId)
        .then((endpoints)=>{
            var result = endpoints.filter(e => e.name == endpointName)[0]
            if (result) return result  
            else {
                console.error('the specified service endpoint ('+ endpointName +') couldnt be found.')
                process.exit(11)
            }
        })
    }

    vstsApi.getServiceEndpoints = (projectId) => {
        return vstsApi.getObject('/DefaultCollection/' + projectId +'/_apis/distributedtask/serviceendpoints')
        .then(o => o.value)
    }

    vstsApi.createReleaseDefinition = (projectName, projectId, buildDefinitionName, buildDefinitionId, releaseAgents, releaseDefinition, releaseServiceEndpoints, user, overwrite, releaseVariables) => { 

        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues'),
            vstsApi.getDefaultCollection(),
            vstsApi.getServiceEndpoints(projectId),
            vstsApi.searchIdentity(user)
        ])
        .then((queryData)=>{
            var project = queryData[0];
            var projectQueues = queryData[1];
            var defaultCollectionId = queryData[2].id;
            //var azureServiceEndpointId = queryData[3].id;
            var projectServiceEndpoints = queryData[3];
            var identity = queryData[4];

            var owner = {
                "displayName": identity.displayName,
                "id": identity.localId,
                "isContainer": false,
                "uniqueName": identity.signInAddress,
                "url": endPoint
            }

            var releaseServiceEndpointIds = mapServiceEndpointNamesToIds(releaseServiceEndpoints, projectServiceEndpoints);

            return vstsApi.getReleaseDefinitionsbyName(projectId, releaseDefinition.name)
            .then(definitions => {
                if ((definitions.length != 0) && !overwrite) {
                    return Promise.reject(new Error("The release definition already exists."))
                }

                if ((definitions.length != 0) && overwrite) {
                    console.log("Release definition " + releaseDefinition.name + " already exists, updating...")
                    return vstsApi.updateReleaseDefinition(defaultCollectionId, project.name, projectId, buildDefinitionName, buildDefinitionId, projectQueues.value, releaseAgents, releaseDefinition, definitions[0], releaseServiceEndpointIds, owner, releaseVariables)
                }

                return vstsApi._createReleaseDefinition(defaultCollectionId, project.name, projectId, buildDefinitionName, buildDefinitionId, projectQueues.value, releaseAgents, releaseDefinition, releaseServiceEndpointIds, owner, releaseVariables)
            })

        })
        .catch(e=>{
            console.error('Couldnt create the release definition: ' + e + "\n" + e.stack)
            process.exit(10)
        })
    }

    vstsApi.getDefaultCollection = () => {
        return vstsApi.getObject(
            '/_apis/projectcollections',
            null,
            null,
            (projectCollection) => {return projectCollection.value[0]} 
        )
    }

    vstsApi.getReleaseDefinitionsbyName = (projectId, releaseDefinitionName) => {
        return vstsApi.getObject('/'+ projectId +'/_apis/Release/definitions', rmEndPoint)
        .then((definitions)=>{
            return definitions.value.filter(r => r.name == releaseDefinitionName);
        })
    }

    vstsApi.deleteReleaseDefinition = (projectId, definitionId) => {
        return vstsApi.delObject('/'+ projectId +'/_apis/Release/definitions/' + definitionId , rmEndPoint)
    }

    vstsApi.updateReleaseDefinition = (collectionId, projectName, projectId, buildDefinitionName, buildDefinitionId, queues, releaseAgents, releaseDefinition, definitionIdProperties, releaseServiceEndpointIds, owner, releaseVariables)  => {

        releaseDefinition = vstsApi._assembleReleaseDefinition(collectionId, projectName, projectId, buildDefinitionName, buildDefinitionId, queues, releaseAgents, releaseDefinition, releaseServiceEndpointIds, owner, releaseVariables)
        _.merge(releaseDefinition, definitionIdProperties)

        console.log(
            JSON.stringify(releaseDefinition,null,2)
        )
        return vstsApi.putObject(
            '/'+ projectId +'/_apis/Release/definitions/' + releaseDefinition.id,
            releaseDefinition,
            rmEndPoint
        )
    }

    defaultArtifacts = (projectName, projectId, buildDefinitionName, buildDefinitionId, collectionId, endPoint) =>{
        return [
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
                "sourceId": projectId + ':1'
            }
        ]

    }

    applyReleaseServiceEndpointMappings = (releaseDefinition, releaseServiceEndpointIds) => {
        releaseDefinition.environments = releaseDefinition.environments.map(environment =>{
            environment.deployPhases = environment.deployPhases.map((phase)=>{
                phase.workflowTasks = phase.workflowTasks.map(workflowTask=>{
                    _.forOwn(workflowTask.inputs ,(value,key)=>{  
                        if (key in releaseServiceEndpointIds) {
                            workflowTask.inputs[key] = releaseServiceEndpointIds[key]
                        }
                    })
                    return workflowTask
                })
                return phase
            })
            return environment
        })
        return releaseDefinition
    }

    replaceQueues = (releaseDefinition, queues, newQueueName, targetEnvironmentName, targetPhaseName) => {
        releaseDefinition.environments = releaseDefinition.environments.map(environment =>{
            if ((environment.name == targetEnvironmentName) || (targetEnvironmentName == null)) {
                environment.deployPhases = environment.deployPhases.map((phase)=>{

                    if ((phase.name == targetPhaseName) || (targetPhaseName == null)) {
                        phase.deploymentInput.queueId = getQueueId(queues, newQueueName)
                    }
                    return phase

                })
            }
            return environment
        }) 
        return releaseDefinition
    }

    getQueueId = (queues, queueName)=>{
        //check the string specified is an existing queue first
        let queue = _.find(queues,{name:queueName})
        if (!queue) {
            console.error("the queue " + queueName + " was not found in the project.")
            process.exit(16)
        }
        return queue.id
    }

    applyQueueReplacements = (releaseDefinition, queues, releaseAgentReplacements) =>{ 

        // Iterate the specified replacement rules in order
        _.forEach(releaseAgentReplacements, (releaseAgentReplacement)=>{

            //replace ALL queues
            if (typeof releaseAgentReplacement == "string") {
                let newQueueName = releaseAgentReplacement;
                return replaceQueues(releaseDefinition, queues, newQueueName)
            }

            if (typeof releaseAgentReplacement == "object") {
                let targetEnvironmentName = Object.keys(releaseAgentReplacement)[0]

                if (typeof releaseAgentReplacement[targetEnvironmentName] == "string"){
                    //replace all queues in the environment
                    let newQueueName = releaseAgentReplacement[targetEnvironmentName]
                    return replaceQueues(releaseDefinition, queues, newQueueName, targetEnvironmentName)
                    
                } else {
                    //replace a single phase's queue
                    let targetPhaseName = Object.keys(releaseAgentReplacement[targetEnvironmentName])[0]
                    let newQueueName = releaseAgentReplacement[targetEnvironmentName][targetPhaseName]
                    return replaceQueues(releaseDefinition, queues, newQueueName, targetEnvironmentName, targetPhaseName)
                }
            }
        })

        return releaseDefinition
    }

    vstsApi._assembleReleaseDefinition = (collectionId, projectName, projectId, buildDefinitionName, buildDefinitionId, queues, releaseAgents, releaseDefinition, releaseServiceEndpointIds, owner, releaseVariables) => {
        
        // set release scope variables
        Object.keys(releaseVariables.release).forEach(function(key) {
            releaseDefinition.variables[key] = {value: releaseVariables.release[key]} 
        });

        releaseDefinition.owner = owner

        releaseDefinition.environments = _.map(releaseDefinition.environments,(env) => {

            env.id = -1
            env.owner = owner
            
            // set environment scope variables
            if (releaseVariables.environments[env.name]) {
                Object.keys(releaseVariables.environments[env.name]).forEach(function(key) {
                    env.variables[key] = {value: releaseVariables.environments[env.name][key]} 
                });
            }

            return env
        })

        releaseDefinition = applyQueueReplacements(releaseDefinition, queues, releaseAgents)
        releaseDefinition = applyReleaseServiceEndpointMappings(releaseDefinition, releaseServiceEndpointIds)

        releaseDefinition.artifacts = defaultArtifacts(projectName, projectId, buildDefinitionName, buildDefinitionId, collectionId, endPoint)

        return releaseDefinition
    }

    vstsApi._createReleaseDefinition = (collectionId, projectName, projectId, buildDefinitionName, buildDefinitionId, queueId, releaseDefinition, releaseServiceEndpointIds, owner, releaseVariables) => {
        return new Promise((resolve,reject)=>{ 

            releaseDefinition = vstsApi._assembleReleaseDefinition(collectionId, projectName, projectId, buildDefinitionName, buildDefinitionId, queueId, releaseDefinition, releaseServiceEndpointIds, owner, releaseVariables)
           
            vstsApi.postObject(
                '/'+ projectId +'/_apis/Release/definitions',
                releaseDefinition,
                rmEndPoint
            )
            .then(resolve,reject)
        })
    }

    vstsApi.createProject = (projectName) => {
        return vstsApi._createProject(projectName)
        .then(waitSec(45))
        .then(()=>{
            return vstsApi.getProjectByName(projectName)
        })
        .catch(e=>{
            console.error('Couldnt create the project: ' + e)
            process.exit(10)
        })
    }

    vstsApi._createProject = (projectName) => {
        return vstsApi.postObject(
            '/_api/_project/CreateProject',
            { 
                projectName: projectName,
                projectDescription: '',
                processTemplateTypeId: 'adcc42ab-9882-485e-a3ed-7678f01f66bc',
                //collectionId: 'ba47a542-7971-4401-8d4e-aaa5f04d9ec6',
                source: 'NewProjectCreation:',
                projectData: '{"VersionControlOption":"Git","ProjectVisibilityOption":null}' 
            },
            endPoint
        )
    }

    vstsApi.startBuild = (projectId, buildId) => {
        return vstsApi.postObject(
            '/DefaultCollection/' + projectId + '/_apis/build/builds',
            {
                "definition": {
                    "id": buildId
                },
                "sourceBranch": "refs/heads/master",
                "parameters": "{\"system.debug\":\"true\",\"BuildConfiguration\":\"debug\",\"BuildPlatform\":\"x64\"}"
            }
        )
    }

    vstsApi.getProject = (project) => {
        return vstsApi.getObject('/_apis/projects/' + project)
    }

    vstsApi.getProjectByName = (projectName) => {
        return vstsApi.getObject(
            '/_apis/projects/',
            null,
            (httpResult)=>{
                var project = httpResult.body.value.filter(p => p.name == projectName )
                return project.length
            },
            (body)=>{
                var project = body.value.filter(p => p.name == projectName )
                return project[0]
            }
        )
    }

    vstsApi.deleteProject = (projectId) => {
        return vstsApi.delObject('/_apis/projects/' + projectId)
    }

    mapServiceEndpointNamesToIds = (buildServiceEndpoints, projectServiceEndpoints) =>{
        return _.mapValues(buildServiceEndpoints,(serviceEndpointName)=>{ //{inputkey:serviceID , ...}
            var targetEndpoint = projectServiceEndpoints.filter(e => e.name == serviceEndpointName)
            if (targetEndpoint.length == 1){
                return targetEndpoint[0].id
            } else {
                console.error("The service endpoint  " + serviceEndpointName + " could not be found in your project, OR there are more than one of them.")
                process.exit(13)
            }
        })
    }

    vstsApi.createBuildDefinition = (projectId, queueName, buildDefinition, buildServiceEndpoints, overwrite)=>{

        return Promise.all([
            vstsApi.getObject('/_apis/projects/' + projectId),
            vstsApi.getObject('/DefaultCollection/'+ projectId +'/_apis/distributedtask/queues'),
            vstsApi.getServiceEndpoints(projectId)
        ])
        .then((queryData)=>{
            var project = queryData[0];
            var projectQueues = queryData[1];
            var projectServiceEndpoints = queryData[2];

            var queue = projectQueues.value.filter(q => q.name == queueName)[0];
            if (!queue) {
                console.error("The queue " + queueName + " could not be found")
                process.exit(12)
            }

            var buildServiceEndpointIds = mapServiceEndpointNamesToIds(buildServiceEndpoints, projectServiceEndpoints);

            return vstsApi.getBuildDefinitionsbyName(projectId, buildDefinition.name)
            .then(definitions => {
                if ((definitions["length"]) && !overwrite) {
                    return Promise.reject(new Error("The build definition already exists."))
                }

                if ((definitions["length"]) && overwrite) {
                    console.log("Build definition " + buildDefinition.name + " already exists, updating...")
                    return vstsApi._updateBuildDefinition(projectId, project.name, buildDefinition, definitions[0], buildServiceEndpointIds)  
                }
                return vstsApi._createBuildDefinition( projectId, project.name, queue.id, queueName, buildDefinition , buildDefinition.name, buildServiceEndpointIds)

            })
   
     
        })
        .catch(e=>{
            console.error('Couldn\'t create the build definition: ' + e + "\n" + e.stack)
            process.exit(10)
        })
    }

    defaultRepository = (endPoint , projectName) => {
        return {
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
            type: 'TfsGit',
            name: projectName,
            url: endPoint + '/_git/' + projectName ,
            defaultBranch: 'refs/heads/master',
            clean: 'false',
            checkoutSubmodules: false
        }
    }

    applyBuildServiceEndpointMappings = (buildDefinition, buildServiceEndpointIds) => {
        buildDefinition.process.phases = buildDefinition.process.phases.map(phase =>{
            phase.steps = phase.steps.map(step=>{
                _.forOwn(step.inputs ,(value,key)=>{  
                    if (key in buildServiceEndpointIds) {
                        step.inputs[key] = buildServiceEndpointIds[key]
                    }
                })
                return step
            })
            return phase
        })
        return buildDefinition
    }

    vstsApi._updateBuildDefinition = (projectId, projectName, buildDefinition, definitionIdProperties, buildServiceEndpointIds)  => {

         _.merge(buildDefinition, definitionIdProperties)

        buildDefinition.repository = defaultRepository(endPoint,projectName);
        buildDefinition = applyBuildServiceEndpointMappings(buildDefinition, buildServiceEndpointIds)

        return vstsApi.putObject(
            '/' + projectId + '/_apis/build/definitions/' + buildDefinition.id,
            buildDefinition
        )

    }

    vstsApi._createBuildDefinition = (projectId, projectName, queueId, queueName, buildDefinition, buildDefinitionName, buildServiceEndpointIds)  => {

        buildDefinition = applyBuildServiceEndpointMappings(buildDefinition, buildServiceEndpointIds)

        return vstsApi._assembleBuildDefinition(projectId, projectName, queueId, queueName, buildDefinition, buildDefinitionName)
        .then(buildDefinition => {
            return vstsApi.postObject(
                '/' + projectId + '/_apis/build/definitions',
                buildDefinition
            )
        })
    }

    vstsApi.getBuildDefinitionsbyName = (projectId, buildDefinitionName) => {
        return vstsApi.getObject(
            '/' + projectId + '/_apis/build/definitions/',
            null,
            null,
            (body) => {
                return body.value.filter(x => x.name == buildDefinitionName);
            },
        )
    }

    vstsApi.getBuildDefinition = (projectId, buildDefinitionId) => {
        return vstsApi.getObject(
            '/' + projectId + '/_apis/build/definitions/' + buildDefinitionId
        )
    }

    vstsApi.deleteBuildDefinition = (projectId, definitionId) => {
        return vstsApi.delObject('/' + projectId + '/_apis/build/definitions/' + definitionId)
    }

    vstsApi._assembleBuildDefinition = (projectId, projectName, queueId, queueName, buildDefinition, buildDefinitionName, buildDefinitionId) => {

        if (!buildDefinitionName) {
            buildDefinitionName = buildDefinition.name;
        }

        if (buildDefinitionId) {
            buildDefinition.id = buildDefinitionId
            buildDefinition.uri = "vstfs:///Build/Definition/" + buildDefinitionId
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

        buildDefinition.repository = defaultRepository(endPoint,projectName);

        buildDefinition.queue = queue
        
        delete buildDefinition.project;
        delete buildDefinition._links;

        return Promise.resolve(buildDefinition)

                    
    }

    return vstsApi
}
