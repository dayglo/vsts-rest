set -e
set -x

timestamp="$(date +"%s")"

node \
	$1 vsts-import GeorgeTestProject3 \
	--release tests/definitions/queue-replacement/release-queue-replacement-test.json \
	--build tests/definitions/basic/buildProcess.json \
	-g https://bitbucket.org/automationlogic/demoapplication \
	-A "Default" \
	--no-git \
	--releasedefname releasedef-$timestamp


# ./vsts-build.js GeorgeTestProject3 --build DemoApplication-CI --wait

./vsts-release.js GeorgeTestProject3 --releasedef releasedef-$timestamp --artifact DemoApplication-CI --wait