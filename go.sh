node $* cli.js GeorgeTestProject3 \
	-g https://bitbucket.org/automationlogic/demoapplication \
	-b ../vsts-definitions/pipelines/nodejs-vmscaleset/buildProcess.json \
	-r ../vsts-definitions/pipelines/nodejs-vmscaleset/releaseProcess-deploy.json \
	--releaseagent 'Hosted Linux Preview' \
	-v DEV:applicationName=gcproject \
	-v DEV:resourceGroup=gc-resource-group \
	-v DEV:databaseName=gcdatabase \
	-v newVar=waaaat