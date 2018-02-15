// https://{instance}[/{collection}[/{team-project}]/_apis[/{area}]/{resource}?api-version={version}
var request = require("request");

var vstsApi = {}

vstsApi.createBuildDefinition = (vstsAccount,projectId,buildDefinitionName) => {
    return new Promise((resolve, reject)=>{
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
            _links: {
                self: {
                    href: 'https://' + vstsAccount + '.visualstudio.com/' + projectId + '/_apis/build/Definitions/5?revision=3'
                },
                web: {
                    href: 'https://' + vstsAccount + '.visualstudio.com/_permalink/_build/index?collectionId=ba47a542-7971-4401-8d4e-aaa5f04d9ec6&projectId=' + projectId + '&definitionId=5'
                },
                editor: {
                    href: 'https://' + vstsAccount + '.visualstudio.com/_permalink/_build/definitionEditor?collectionId=ba47a542-7971-4401-8d4e-aaa5f04d9ec6&projectId=' + projectId + '&definitionId=5'
                }
            },
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
            url: 'https://' + vstsAccount + '.visualstudio.com/' + projectId + '/_apis/build/Definitions/5?revision=3',
            uri: 'vstfs:///Build/Definition/5',
            path: '\\',
            type: 'build',
            queueStatus: 'enabled',
            revision: 3,
            createdDate: '2018-02-14T20:41:25.977Z',
            project: {
                id: '' + projectId + '',
                name: '' + buildDefinitionName + '',
                url: 'https://' + vstsAccount + '.visualstudio.com/_apis/projects/' + projectId + '',
                state: 'wellFormed',
                revision: 56,
                visibility: 'private'
            }
        }


        var options = {
            method: 'POST',
            url: 'https://' + vstsAccount + '.visualstudio.com/' + projectId + '/_apis/build/definitions',
            headers: {
                'postman-token': '608acb50-c3ce-1f10-8469-d2b58a8d9fad',
                'cache-control': 'no-cache',
                cookie: '_ga=GA1.2.1704427815.1518007566; MSCC=1518007582; VstsSession=%7B%22PersistentSessionId%22%3A%22f55c5eaf-9ad8-4e54-8c27-61e880fc95f2%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%22679d3835-82b3-4133-9e47-36c9a09b1619%22%7D; __RequestVerificationToken=Rq62ticqUiwDF53-LbVqCAt3M-NoHueP4rfIyysjb14GaTqvsCfKu69Ko6wLiSv7SHaUi6OjiDatFQJNJ3U4Ez_nINc1; __RequestVerificationToken26b0d0477-83e8-4fcb-9d21-372d45c9c601=Rq62ticqUiwDF53-LbVqCAt3M-NoHueP4rfIyysjb14GaTqvsCfKu69Ko6wLiSv7SHaUi6OjiDatFQJNJ3U4Ez_nINc1; MSFPC=ID=856f35ff130741749dd5993f553cff8d&CS=3&LV=201802&V=1; _ga=GA1.2.1704427815.1518007566; MSCC=1518007582; VstsSession=%7B%22PersistentSessionId%22%3A%22f55c5eaf-9ad8-4e54-8c27-61e880fc95f2%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%22679d3835-82b3-4133-9e47-36c9a09b1619%22%7D; _gid=GA1.2.1417922665.1518532498; MSFPC=ID=856f35ff130741749dd5993f553cff8d&CS=3&LV=201802&V=1; FedAuth=77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48U2VjdXJpdHlDb250ZXh0VG9rZW4gcDE6SWQ9Il82ODg5ZjUxNy0yZDc4LTRkOGItOThhMy00ZGQ4NGI5YjM0NzItRDAwMzVEOEQ0QzQ4NzlENEU0QUY3QTE3QUQyNjBDQzIiIHhtbG5zOnAxPSJodHRwOi8vZG9jcy5vYXNpcy1vcGVuLm9yZy93c3MvMjAwNC8wMS9vYXNpcy0yMDA0MDEtd3NzLXdzc2VjdXJpdHktdXRpbGl0eS0xLjAueHNkIiB4bWxucz0iaHR0cDovL2RvY3Mub2FzaXMtb3Blbi5vcmcvd3Mtc3gvd3Mtc2VjdXJlY29udmVyc2F0aW9uLzIwMDUxMiI+PElkZW50aWZpZXI+dXJuOnV1aWQ6OTFmNmI2YzAtMWM2Mi00OGE3LWE2OTMtOWMzYjc0NDg5OTRkPC9JZGVudGlmaWVyPjxDb29raWUgeG1sbnM9Imh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwNi8wNS9zZWN1cml0eSI+MFlkQ1daWk9tSTRBQVFBQXAxbWppbVExWlNoNHdNajdvSU1qTWFKQmdtYTFUaHJZclJsNkM5WTkwVm50ajJ5V0o1RTZZdTkxOGFEZytSYWM2eE5RdldBYVhNbktyL1NsUGh0NnVJbWYxZW1TREtlc3dXd0cyb05sRnhPRUVOb2ZuVno1RlIzTGd4SGtDMHQwL2ZESWtZVXJFbk9rZ2hNRE1MUFNRUlNyOVBYTURsVjVra0IvNVJyblNSd0V6aGRoaVZLNkczQWcxWGRIZzdkbWkvSklVOStVYmxocG5ScHFRL056Kzdka240dE5WdUwwU05PeFA2Nk11VGlkMnhrZzFVd2xzekVWWGFsV0xpY3lJK2dGTmxLa0k3UU5XTDFNYVBFcTNoWjZXNStjUzlRUGJuVHJINFMyOTIzVldtMmRMQnhtejIwNmJ0N0ZvcENDRWxkcUhYOG9tZGR5N0QxNU1oa1R1d2VRdEVsZFA1dlNDOFk3b3Z1TlNMR01XNVVYKzVveCtZT21ZaUtFMWZhN0FBRUFBTkZVNU5hY2VNalY5SmU0cjVhQ0x6dzNhcHJCcVQ2MUUvdzVVRUwrdlRwUUZKRFlZUC9hNzFiVEU5UXFpOHRvaEFJSzRobGE1dm5Db2xEdSt0L2kya0hId2t6cXZoZDNJNG1jZHE1bnlzdk8rU3pHbk5nL0crUDVxSnlsS1NXV1BvU1FTSEt5YVV1MDdySU1meFZhV1pxMEw2OTJLRmNsS3M5OHliRXp5TXFKbTNUZW0xRFlHYTR6eWRHdSt6UWxCL2hmOVJRNy92TE1HbjA3U3d1aWFydGVOd2ZkQTNTcTFiQzlUNWV2K1FVcE1ZS1pIK1UxdXUvNVBkUVpzS3FSSWIzVDlhNlRhU3hvRlJqdjJqdGQrblhtUEttNzVOWTQwVmo3ZmVJSlBOWkVsb1RWb2FsUHRNTnVxaTg3djV3cFFnR0tOMFdmN0djKzlZN256Z1hZUVErQUF3QUFRTWdZZ1JjNmJoNzJoQlZucWlaZWpwU1dFeE5iZFhuVUhZYU1mZ2VRZGZVRDloczVubzZYUXFlTjZsK2k3U1dwMTRLbWF2bUdPU0QxcXhTNjlrQkVIdjcveWd0Z01jdHN4KzJKLzlmZFNiUEY5UEpOaG94blZPaS94SzZDeEVPSkh1UWhKT1NZVHhWOHVJSXRqMXRjK2FRV053Qnp1S1pWTjZYcEczOHpHemVyenFVZkhMSnY4R2NEUjZIaWw5TThjaG40UzhPN0RnRWppZUxmbmVOQ3kwRXhZT2t0WHdodUU3OG5pUmFCR3FESW1SVGxwSyt6UVhQSWxjSlg5S2I1WG5sRzZuUXZXb052Z0VCY3NSTzVLZ1FibkZ5MUxMRHFuNzdoeGw4Z0F1SXVuTjV5SkFN; FedAuth1=ci9wU3NtL3BBWDF5eDFYa2dmL0R6eTk1QWhLY1M0TEhpSDExeU9MTUliZUU4OUIvMkpiQlFNRDBzcXVRVjBxN2JId0UwZnZvTEFwNEdTY3ZWNXZ1bTNPYW1CK2JoVmxTODRjNzZwd1lGeCttbVB4dy9mNzNNQ3gxVGhrR09xNysyS0lTdjRCUVhQN1VFWVJPUzdGeUJSWVU4Q0EzNE5ELzhzUUlTSFgyYWYwdGVmODNpczh0RzIzTG5YaGdJb1pKcVQ3bUo2RjEzRFhRSTdOT09rOEVjQm1KNW1MTzUvZ3JkQytYeVpQZ3laK1Q0RlV6RDhaWVhoTnJaZ2N4NTFTekZ1Q3kwVVNEWks4SW5UcytBWFEyVUM5Mkt3MlpnK1dkVnF1YTk4R1JGUjh4bGQ2Z2djTWFlMnlsNmcrNVZObzZJUzQzY2pNT2QrejBHSFdkY1cwdXlzcGJBZnh0bXgwK0hBSE1lenNGeFZ5WEFYa0Z3SkJveTdBb3RaOVhXeFNYb0tISkhQR2xWZGJmYXgrUDQ3UTYxMXhwUUo0U0NwNmtiY0hONFVJRjAzN0VqUWtJMjBVVXBMdDhMWmdLM2VaZXdtMTNWU0FXREJzRzRmVjIrNW5MK20za2xycU9xRXdwOHFKRDZkeU1Ba08wdDg3Q0lGQm80eG9WdDJJU0xPZzFEeExMdyt4TGNFMVpOUk96NFFIRVBEOFlKV3hVamtWc2xoQ1Boa1ljOThram4rWHNLclhRcjFBQW5GR2g0RHF2VVlmVnhjTDg2WEhaQ2g0VzRpcTc3a0hDSXR4UjVENzBmbmpjRmo4Zm44bXBlTFhvOTI1RjUrUkxGZVVyVWdFZVppd3ZHNkxoTVJnZkxVLy9sRXBueUZzRklWaHlSdTc2bFlJQnJnMlFaeFV2NUsrUDBMZTVkVnFSM1hJYU8rejB3dUdIK1psTTBiY2VMVG85dHlaVys0aTRIVng0QnVVelMrYXBUMytnYk5uWnA1ck5VSkovK0Q3UitjdVA0V1Iza1cydVRRNjNVdG0wMHUrSHB4RGVGb2ZqOXhqQng4Nmd5VHlRNUpvV2dDOHFjNzkzd0FTcWFhOXlvWW9mN0dJWkFhb3Z5bThrcHErL1dqU2w0NFVpdFhQN3JVU3NoM0JTcTZXMzErMnloWUNrTUI0Q0I0Wk5ETFNRPTwvQ29va2llPjwvU2VjdXJpdHlDb250ZXh0VG9rZW4+',
                'accept-language': 'en-US,en;q=0.9',
                'x-tfs-session': '3ab96d0f-0b49-4acb-b9f8-0ddf2381c008',
                'x-requested-with': 'XMLHttpRequest',
                accept: 'application/json;api-version=4.1-preview.6;excludeUrls=true',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
                'x-vss-reauthenticationaction': 'Suppress',
                origin: 'https://' + vstsAccount + '.visualstudio.com'
            },
            body: body,
            json: true
         }

                        

        request(options, function (error, response, body) {
            debugger;
            if (error) reject( new Error(error))
            else resolve(body)
        });

    })

}

vstsApi.createBuild = (vstsAccount,projectId,buildName) =>{


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


vstsApi.createBuildDefinition( vstsAccount, projectId , buildDefinitionName)
.then(console.log)
.then(spit(buildDefinitionName))
.catch(console.error)
