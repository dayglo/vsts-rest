set -e
set -x

node \
	$1 vsts-import GeorgeTestProject3 \
	--release tests/definitions/queue-replacement/release-queue-replacement-test.json \
	--build tests/definitions/basic/buildProcess.json \
	-g https://bitbucket.org/automationlogic/demoapplication \
	-A "Default" \
	--no-git


./vsts-build.js GeorgeTestProject3 --build DemoApplication-CI