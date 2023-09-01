import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { KubernetesCluster, KubernetesClusterConfig, KubernetesClusterDefaultNodePool, KubernetesClusterServicePrincipal } from './.gen/providers/azurerm/kubernetes-cluster'
import { AzurermProvider, AzurermProviderConfig } from './.gen/providers/azurerm/provider'
import { ResourceGroup, ResourceGroupConfig } from './.gen/providers/azurerm/resource-group'
class K8SStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const providerConfig: AzurermProviderConfig = {
      features: {}
    }
    const provider = new AzurermProvider(this, 'AzureRm', providerConfig);


    const LOCATION = 'LOCATION'
    const RG_NAME = 'RESOURCE_GROUP'
    const AKS_NAME = 'CLUSTER_NAME'
    const AKS_DNS_PREFIX = 'DNS_PREFIX'

    const rgConfig: ResourceGroupConfig = {
      location: LOCATION,
      name: RG_NAME
    }
    const rg = new ResourceGroup(this, 'k8scluster-rg', rgConfig)

    const pool: KubernetesClusterDefaultNodePool = {
      name: 'default',
      vmSize: 'Standard_D2_v2',
      nodeCount: 1
    }

    const ident: KubernetesClusterServicePrincipal = {
      clientId: process.env.AZ_SP_CLIENT_ID as string,
      clientSecret: process.env.AZ_SP_CLIENT_SECRET as string
    }

    const k8sconfig: KubernetesClusterConfig = {
      dnsPrefix: AKS_DNS_PREFIX,
      location: LOCATION,
      name: AKS_NAME,
      resourceGroupName: rg.name,
      servicePrincipal: ident,
      defaultNodePool: pool,
      dependsOn: [rg],

    };

    const k8s = new KubernetesCluster(this, 'k8scluster', k8sconfig)


    const output = new TerraformOutput(this, 'k8s_name', {
      value: k8s.name
    });

    console.info(rg.name, k8s.name, provider.subscriptionId, output.friendlyUniqueId)

  }
}

const app = new App();
const k8tstack = new K8SStack(app, 'typescript-azurerm-k8s');
console.info(k8tstack.toString())
app.synth();