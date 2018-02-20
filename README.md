# Automation Logic's Visual Studio Team Services API toolkit

This repo consists of 

1. a simple client library module that allows developers to work with VSTS's build and release definitions;
2. some command line tools that use the library.

# How to use the client library

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

You should see a json object pop out which describes your vsts project 

# How to use the command line tools

## vsts-import

```
npm i -g vsts-rest // install the client
```

Make sure you have a vsts account created with a project that has an azure subscription linked.

Navigate to a folder that contains buildProcess.json and releaseProcess.json. TODO: document how to make these.

Run these commands:

```
export VSTS_PAT=your-pat-token 
export VSTS_ACCOUNT=your-vsts-account.
export VSTS_AZURE_SERVICE=azureService // this is the name you created when you made the azure link

vsts-import YourProjectName -g https://bitbucket.org/automationlogic/demoapplication 

```