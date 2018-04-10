set -e
set -x

timestamp="$(date +"%s")"

node \
	$1 vsts-import GeorgeTestProject3 \
	--release tests/definitions/queue-replacement/release-queue-replacement-test.json \
	--build tests/definitions/jsonpath/builddefregistry.json \
	-g https://bitbucket.org/automationlogic/demoapplication \
	-a "Hosted Linux Preview" \
	-A "Default" \
	--no-git \
	--releasedefname releasedef-$timestamp \
	-x '$.process.phases[*].steps[?(@.displayName=="Build an image")].inputs.azureContainerRegistry={"loginServer":"azureplatformtestingregistry.azurecr.io", "id" : "/subscriptions/00f39173-5e2b-4534-afc1-e899be7bca9e/resourceGroups/AzurePlatformTestingRegistry/providers/Microsoft.ContainerRegistry/registries/AzurePlatformTestingRegistry"}' \
	-x '$.process.phases[*].steps[?(@.displayName=="Push an image")].inputs.azureContainerRegistry={"loginServer":"azureplatformtestingregistry.azurecr.io", "id" : "/subscriptions/00f39173-5e2b-4534-afc1-e899be7bca9e/resourceGroups/AzurePlatformTestingRegistry/providers/Microsoft.ContainerRegistry/registries/AzurePlatformTestingRegistry"}'

# ./vsts-build.js GeorgeTestProject3 --build DemoApplication-CI --wait

#./vsts-release.js GeorgeTestProject3 --releasedef releasedef-$timestamp --artifact DemoApplication-CI --wait