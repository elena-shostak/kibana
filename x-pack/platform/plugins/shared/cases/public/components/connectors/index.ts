/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CaseConnectorsRegistry } from './types';
import { createCaseConnectorsRegistry } from './connectors_registry';
import { getCaseConnector as getJiraCaseConnector } from './jira';
import { getCaseConnector as getSwimlaneCaseConnector } from './swimlane';
import { getCaseConnector as getResilientCaseConnector } from './resilient';
import { getCaseConnector as getCasesWebhookCaseConnector } from './cases_webhook';
import { getServiceNowITSMCaseConnector, getServiceNowSIRCaseConnector } from './servicenow';
import { getCaseConnector as getTheHiveCaseConnector } from './thehive';
import type {
  JiraFieldsType,
  ServiceNowITSMFieldsType,
  ServiceNowSIRFieldsType,
  ResilientFieldsType,
  SwimlaneFieldsType,
  TheHiveFieldsType,
} from '../../../common/types/domain';

export type * from './types';

interface GetCaseConnectorsReturn {
  caseConnectorsRegistry: CaseConnectorsRegistry;
}

class CaseConnectors {
  private caseConnectorsRegistry: CaseConnectorsRegistry;

  constructor() {
    this.caseConnectorsRegistry = createCaseConnectorsRegistry();
    this.init();
  }

  private init() {
    this.caseConnectorsRegistry.register<JiraFieldsType>(getJiraCaseConnector());
    this.caseConnectorsRegistry.register<ResilientFieldsType>(getResilientCaseConnector());
    this.caseConnectorsRegistry.register<ServiceNowITSMFieldsType>(
      getServiceNowITSMCaseConnector()
    );
    this.caseConnectorsRegistry.register<ServiceNowSIRFieldsType>(getServiceNowSIRCaseConnector());
    this.caseConnectorsRegistry.register<SwimlaneFieldsType>(getSwimlaneCaseConnector());
    this.caseConnectorsRegistry.register<null>(getCasesWebhookCaseConnector());
    this.caseConnectorsRegistry.register<TheHiveFieldsType>(getTheHiveCaseConnector());
  }

  registry(): CaseConnectorsRegistry {
    return this.caseConnectorsRegistry;
  }
}

const caseConnectors = new CaseConnectors();

export const getCaseConnectors = (): GetCaseConnectorsReturn => ({
  caseConnectorsRegistry: caseConnectors.registry(),
});
