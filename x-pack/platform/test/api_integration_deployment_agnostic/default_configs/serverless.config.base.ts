/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  fleetPackageRegistryDockerImage,
  FtrConfigProviderContext,
  Config,
  defineDockerServersConfig,
} from '@kbn/test';

import { ScoutTestRunConfigCategory } from '@kbn/scout-info';
import { ServerlessProjectType } from '@kbn/es';
import path from 'path';
import { DeploymentAgnosticCommonServices, services } from '../services';
import { LOCAL_PRODUCT_DOC_PATH } from './common_paths';

interface CreateTestConfigOptions<T> {
  serverlessProject: ServerlessProjectType;
  esServerArgs?: string[];
  kbnServerArgs?: string[];
  services?: T;
  testFiles: string[];
  junit: { reportName: string };
  suiteTags?: { include?: string[]; exclude?: string[] };
  tier?: 'oblt_logs_essentials';
}

// include settings from elasticsearch controller
// https://github.com/elastic/elasticsearch-controller/blob/main/helm/values.yaml
const esServerArgsFromController = {
  es: [],
  oblt: ['xpack.apm_data.enabled=true'],
  security: ['xpack.security.authc.api_key.cache.max_keys=70000'],
  chat: [],
};

// include settings from kibana controller
// https://github.com/elastic/kibana-controller/blob/main/internal/controllers/kibana/config/config_settings.go
const kbnServerArgsFromController = {
  es: [
    // useful for testing (also enabled in MKI QA)
    '--coreApp.allowDynamicConfigOverrides=true',
  ],
  oblt: [
    '--coreApp.allowDynamicConfigOverrides=true',
    // defined in MKI control plane
    '--xpack.uptime.service.manifestUrl=mockDevUrl',
  ],
  security: [
    '--coreApp.allowDynamicConfigOverrides=true',
    // disable fleet task that writes to metrics.fleet_server.* data streams, impacting functional tests
    `--xpack.task_manager.unsafe.exclude_task_types=${JSON.stringify(['Fleet-Metrics-Task'])}`,
  ],
  chat: [],
};

export function createServerlessTestConfig<T extends DeploymentAgnosticCommonServices>(
  options: CreateTestConfigOptions<T>
) {
  return async ({ readConfigFile }: FtrConfigProviderContext): Promise<Config> => {
    if (options.esServerArgs || options.kbnServerArgs) {
      throw new Error(
        `FTR doesn't provision custom ES/Kibana server arguments into the serverless project on MKI.
  It may lead to unexpected test failures on Cloud. Please contact #appex-qa.`
      );
    }

    const packageRegistryConfig = path.join(__dirname, './fixtures/package_registry_config.yml');
    const dockerArgs: string[] = ['-v', `${packageRegistryConfig}:/package-registry/config.yml`];

    /**
     * This is used by CI to set the docker registry port
     * you can also define this environment variable locally when running tests which
     * will spin up a local docker package registry locally for you
     * if this is defined it takes precedence over the `packageRegistryOverride` variable
     */
    const dockerRegistryPort: string | undefined = process.env.FLEET_PACKAGE_REGISTRY_PORT;

    const svlSharedConfig = await readConfigFile(
      require.resolve('../../serverless/shared/config.base.ts')
    );

    return {
      ...svlSharedConfig.getAll(),

      testConfigCategory: ScoutTestRunConfigCategory.API_TEST,
      services: {
        // services can be customized, but must extend DeploymentAgnosticCommonServices
        ...(options.services || services),
      },
      dockerServers: defineDockerServersConfig({
        registry: {
          enabled: !!dockerRegistryPort,
          image: fleetPackageRegistryDockerImage,
          portInContainer: 8080,
          port: dockerRegistryPort,
          args: dockerArgs,
          waitForLogLine: 'package manifests loaded',
          waitForLogLineTimeoutMs: 60 * 4 * 1000, // 4 minutes
        },
      }),
      esTestCluster: {
        ...svlSharedConfig.get('esTestCluster'),
        serverArgs: [
          'xpack.security.authc.native_roles.enabled=true',
          ...svlSharedConfig.get('esTestCluster.serverArgs'),
          ...esServerArgsFromController[options.serverlessProject],
          ...(options.tier && options.tier === 'oblt_logs_essentials'
            ? [
                'serverless.project_type=observability',
                'serverless.observability.tier=logs_essentials',
              ]
            : []),
        ],
      },
      kbnTestServer: {
        ...svlSharedConfig.get('kbnTestServer'),
        serverArgs: [
          ...svlSharedConfig.get('kbnTestServer.serverArgs'),
          ...kbnServerArgsFromController[options.serverlessProject],
          `--serverless=${options.serverlessProject}`,
          ...(options.serverlessProject === 'oblt'
            ? [
                // defined in MKI control plane. Necessary for Synthetics app testing
                '--xpack.uptime.service.password=test',
                '--xpack.uptime.service.username=localKibanaIntegrationTestsUser',
                '--xpack.uptime.service.devUrl=mockDevUrl',
                '--xpack.uptime.service.manifestUrl=mockDevUrl',
                `--xpack.productDocBase.artifactRepositoryUrl=file:///${LOCAL_PRODUCT_DOC_PATH}`,
              ]
            : []),
          ...(dockerRegistryPort
            ? [`--xpack.fleet.registryUrl=http://localhost:${dockerRegistryPort}`]
            : []),
          ...(options.tier && options.tier === 'oblt_logs_essentials'
            ? [
                `--pricing.tiers.products=${JSON.stringify([
                  { name: 'observability', tier: 'logs_essentials' },
                ])}`,
              ]
            : []),
        ],
      },
      testFiles: options.testFiles,
      junit: options.junit,
      suiteTags: {
        include: options.suiteTags?.include,
        exclude: [...(options.suiteTags?.exclude || []), 'skipServerless'],
      },
    };
  };
}
