# Automation Logic's Visual Studio Team Services API toolkit

This repo consists of 

1. a simple client library module that allows developers to work with VSTS's build and release definitions;
2. some command line tools that use the library.

# How to use the client library

IN your terminal, run:

```
mkdir myNewProject
cd myNewProject
npm install vsts-rest
touch myprogram.js

``` 


Set a couple of environment variables:

```
export VSTS_ACCOUNT=MyVstsAccount   							 // this is the bit that goes in front of .visualstudio.com
export VSTS_PAT=3n84vy05noty28bo45n89y3ev04589ye49n49eve8pr		 // Generate one of these in the web UI

```

Add the following to myprogram.js :

```
VstsApi = require('vsts-rest')

myProject = process.argv[2]

var vstsAccount = 			 process.env.VSTS_ACCOUNT;
var token =      			 process.env.VSTS_PAT;

var vstsApi = new VstsApi(vstsAccount,token);

vstsApi.getProjectByName(myProject)
.then((project)=>{
	return JSON.stringify(project, null, 2)
})
.then(console.log)
.catch(console.error)
```

and run it with
```
node myprogram.js 'My Project Name'
```

You should see a json object pop out which describes your vsts project. There are other features (such as creating build definitions etc), but they are yet to be documented. To see how to write a longer program with the module, see the [cli.js file](https://bitbucket.org/automationlogic/vsts-rest/src/6e3a5c4547272803e7c97608dd9e87f384625540/cli.js?at=master&fileviewer=file-view-default). 

# How to use the command line tools

## vsts-import

```
npm i -g vsts-rest // install the client
```

Make sure you have a vsts account created with a project that has an azure subscription linked.

Navigate to a folder that contains buildProcess.json and releaseProcess.json. Documentation for this can be found [here.](https://bitbucket.org/automationlogic/vsts-definitions)

Run these commands:

```
export VSTS_PAT=your-pat-token 
export VSTS_ACCOUNT=your-vsts-account
export VSTS_USER=your-vsts-email-address

vsts-import YourProjectName -g https://bitbucket.org/automationlogic/demoapplication 

```

If all goes well, A build definition and release definition will be created. In addition, the specified repo will be pushed to your project, and a build will be initiated.

### Overriding build or release agents

If you want to override the agents from the exported build or release, you'll need to specify the ```--buildagent``` or ```--releaseagent``` switches. They are used like so: 

```vsts-import MyProject --buildagent 'Hosted Linux Preview' --releaseagent 'Hosted macOS preview'```

### Setting connected service endpoints (preview feature).

If your definitions were exported from another project, you may not have access to the connected services that they had access to. You may connect definitions to services by specifying the input key name to override, and the name of the connected service. Example:

```
vsts-import MyProject \
  --releaseservice 'connectedServiceNameARM=AzureServiceWestEurope' \
  --releaseservice 'ConnectedServiceName=AzureServiceWestEurope' \
  --buildservice 'SonarQube=SonarqubeService'

``` 

This feature works fine, but needs further testing.


## Command line options:
```

  Usage: vsts-import [projectName]


  Options:

    -V, --version                                        output the version number
    -g, --gitrepo <path to git repo>                     Path to the git repo to deploy. Default is the current directory. (default: ./)
    -b, --build <path to build definition json>          Include release steps in the new release definition [build] (default: ./build.json)
    -r, --release <path to release definition json>      Include build steps in the new build definition [release] (default: ./release.json)
    -a, --buildagent <build agent queue name>            Agent type to use for build (default: Hosted VS2017)
    -A, --releaseagent <release agent queue name>        Agent type to use for release (default: Hosted VS2017)
    -v, --var [release_env_name:]variable=value          override variables in your release definition. (default: )
    --buildservice <input key=Service endpoint name>     override service endpoints in your build definition. (default: )
    --releaseservice <input key=Service endpoint name>   override service endpoints in your build definition. (default: )
    -h, --help                                       output usage information

```


