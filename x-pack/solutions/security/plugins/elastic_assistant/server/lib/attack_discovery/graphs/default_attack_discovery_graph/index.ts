/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ElasticsearchClient, Logger } from '@kbn/core/server';
import { Replacements } from '@kbn/elastic-assistant-common';
import { AnonymizationFieldResponse } from '@kbn/elastic-assistant-common/impl/schemas';
import type { ActionsClientLlm } from '@kbn/langchain/server';
import { END, START, StateGraph } from '@langchain/langgraph';

import {
  getGenerateNode,
  getGenerateOrEndEdge,
  getGenerateOrRefineOrEndEdge,
  getRefineNode,
  getRefineOrEndEdge,
  getRetrieveAnonymizedDocsOrGenerateEdge,
} from '../../../langchain/output_chunking';
import { NodeType } from '../../../langchain/graphs/constants';
import { getCombinedAttackDiscoveryPrompt } from './prompts/get_combined_attack_discovery_prompt';
import { responseIsHallucinated } from './helpers/response_is_hallucinated';
import { getRetrieveAnonymizedAlertsNode } from './nodes/retriever';
import { getAttackDiscoveriesGenerationSchema } from './schemas';
import { CombinedPrompts } from './prompts';
import { getDefaultGraphAnnotation } from './state';

export interface GetDefaultAttackDiscoveryGraphParams {
  alertsIndexPattern?: string;
  anonymizationFields: AnonymizationFieldResponse[];
  end?: string;
  esClient: ElasticsearchClient;
  filter?: Record<string, unknown>;
  llm: ActionsClientLlm;
  logger?: Logger;
  onNewReplacements?: (replacements: Replacements) => void;
  prompts: CombinedPrompts;
  replacements?: Replacements;
  size: number;
  start?: string;
}

export type DefaultAttackDiscoveryGraph = ReturnType<typeof getDefaultAttackDiscoveryGraph>;

/**
 * This function returns a compiled state graph that represents the default
 * Attack discovery graph.
 *
 * Refer to the following diagram for this graph:
 * x-pack/solutions/security/plugins/elastic_assistant/docs/img/default_attack_discovery_graph.png
 */
export const getDefaultAttackDiscoveryGraph = ({
  alertsIndexPattern,
  anonymizationFields,
  end,
  esClient,
  filter,
  llm,
  logger,
  onNewReplacements,
  prompts,
  replacements,
  size,
  start,
}: GetDefaultAttackDiscoveryGraphParams) => {
  try {
    const graphState = getDefaultGraphAnnotation({ end, filter, prompts, start });

    // get nodes:
    const retrieveAnonymizedAlertsNode = getRetrieveAnonymizedAlertsNode({
      alertsIndexPattern,
      anonymizationFields,
      esClient,
      logger,
      onNewReplacements,
      replacements,
      size,
    });

    const generationSchema = getAttackDiscoveriesGenerationSchema(prompts);

    const generateNode = getGenerateNode({
      llm,
      logger,
      getCombinedPromptFn: getCombinedAttackDiscoveryPrompt,
      generationSchema,
      responseIsHallucinated,
    });

    const refineNode = getRefineNode({
      llm,
      logger,
      generationSchema,
      responseIsHallucinated,
    });

    // get edges:
    const generateOrEndEdge = getGenerateOrEndEdge(logger);

    const generatOrRefineOrEndEdge = getGenerateOrRefineOrEndEdge(logger);

    const refineOrEndEdge = getRefineOrEndEdge(logger);

    const retrieveAnonymizedAlertsOrGenerateEdge = getRetrieveAnonymizedDocsOrGenerateEdge(logger);

    // create the graph:
    const graph = new StateGraph(graphState)
      .addNode(NodeType.RETRIEVE_ANONYMIZED_DOCS_NODE, retrieveAnonymizedAlertsNode)
      .addNode(NodeType.GENERATE_NODE, generateNode)
      .addNode(NodeType.REFINE_NODE, refineNode)
      .addConditionalEdges(START, retrieveAnonymizedAlertsOrGenerateEdge, {
        generate: NodeType.GENERATE_NODE,
        retrieve_anonymized_docs: NodeType.RETRIEVE_ANONYMIZED_DOCS_NODE,
      })
      .addConditionalEdges(NodeType.RETRIEVE_ANONYMIZED_DOCS_NODE, generateOrEndEdge, {
        end: END,
        generate: NodeType.GENERATE_NODE,
      })
      .addConditionalEdges(NodeType.GENERATE_NODE, generatOrRefineOrEndEdge, {
        end: END,
        generate: NodeType.GENERATE_NODE,
        refine: NodeType.REFINE_NODE,
      })
      .addConditionalEdges(NodeType.REFINE_NODE, refineOrEndEdge, {
        end: END,
        refine: NodeType.REFINE_NODE,
      });

    // compile the graph:
    return graph.compile();
  } catch (e) {
    throw new Error(`Unable to compile AttackDiscoveryGraph\n${e}`);
  }
};
