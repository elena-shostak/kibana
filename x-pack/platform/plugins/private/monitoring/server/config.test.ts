/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import fs from 'fs';
import { configSchema, createConfig } from './config';

describe('config schema', () => {
  it('generates proper defaults', () => {
    expect(configSchema.validate({})).toMatchInlineSnapshot(`
      Object {
        "agent": Object {
          "interval": "10s",
        },
        "cluster_alerts": Object {
          "email_notifications": Object {
            "email_address": "",
            "enabled": true,
          },
          "enabled": true,
        },
        "enabled": true,
        "kibana": Object {
          "collection": Object {
            "enabled": true,
            "interval": 10000,
          },
        },
        "licensing": Object {
          "api_polling_frequency": "PT30S",
        },
        "tests": Object {
          "cloud_detector": Object {
            "enabled": true,
          },
        },
        "ui": Object {
          "ccs": Object {
            "enabled": true,
          },
          "container": Object {
            "apm": Object {
              "enabled": false,
            },
            "elasticsearch": Object {
              "enabled": false,
            },
            "logstash": Object {
              "enabled": false,
            },
          },
          "debug_log_path": "",
          "debug_mode": false,
          "elasticsearch": Object {
            "apiVersion": "master",
            "apisToRedactInLogs": Array [],
            "compression": false,
            "customHeaders": Object {},
            "dnsCacheTtl": "P0D",
            "healthCheck": Object {
              "delay": "PT2.5S",
              "startupDelay": "PT0.5S",
            },
            "idleSocketTimeout": "PT1M",
            "ignoreVersionMismatch": false,
            "logFetchCount": 10,
            "logQueries": false,
            "maxIdleSockets": 256,
            "maxResponseSize": false,
            "maxSockets": 800,
            "pingTimeout": "PT30S",
            "requestHeadersWhitelist": Array [
              "authorization",
              "es-client-authentication",
            ],
            "requestTimeout": "PT30S",
            "shardTimeout": "PT30S",
            "skipStartupConnectionCheck": false,
            "sniffInterval": false,
            "sniffOnConnectionFault": false,
            "sniffOnStart": false,
            "ssl": Object {
              "alwaysPresentCertificate": false,
              "keystore": Object {},
              "truststore": Object {},
              "verificationMode": "full",
            },
          },
          "enabled": true,
          "kibana": Object {
            "reporting": Object {
              "stale_status_threshold_seconds": 120,
            },
          },
          "logs": Object {
            "index": "filebeat-*",
          },
          "max_bucket_size": 10000,
          "metricbeat": Object {
            "index": "metricbeat-*",
          },
          "min_interval_seconds": 10,
          "show_license_expiration": true,
        },
      }
    `);
  });
});

describe('createConfig()', () => {
  const MOCKED_PATHS = [
    'src/platform/packages/shared/kbn-dev-utils/certs/ca.crt',
    'src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.crt',
    'src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.key',
  ];

  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation((path, enc) => {
      if (typeof path === 'string' && MOCKED_PATHS.includes(path) && enc === 'utf8') {
        return `contents-of-${path}`;
      }

      throw new Error(`unpexpected arguments to fs.readFileSync: ${path}, ${enc}`);
    });
  });

  it('should wrap in Elasticsearch config', async () => {
    const config = createConfig(
      configSchema.validate({
        ui: {
          elasticsearch: {
            hosts: 'http://localhost:9200',
          },
        },
      })
    );
    expect(config.ui.elasticsearch.hosts).toEqual(['http://localhost:9200']);
  });

  it('should attempt to read PEM files', async () => {
    const ssl = {
      certificate: 'src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.crt',
      key: 'src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.key',
      certificateAuthorities: 'src/platform/packages/shared/kbn-dev-utils/certs/ca.crt',
    };
    const config = createConfig(
      configSchema.validate({
        ui: {
          elasticsearch: {
            ssl,
          },
        },
      })
    );
    const expected = expect.objectContaining({
      certificate: 'contents-of-src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.crt',
      key: 'contents-of-src/platform/packages/shared/kbn-dev-utils/certs/elasticsearch.key',
      certificateAuthorities: [
        'contents-of-src/platform/packages/shared/kbn-dev-utils/certs/ca.crt',
      ],
    });
    expect(config.ui.elasticsearch.ssl).toEqual(expected);
  });
});
