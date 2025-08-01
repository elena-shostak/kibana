/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ConversationRoundStep, ConversationRoundStepType } from '@kbn/onechat-common';
import React from 'react';
import { ToolCallPanel } from './tool_call_panel';

interface RoundStepsProps {
  steps: ConversationRoundStep[];
}

export const RoundSteps: React.FC<RoundStepsProps> = ({ steps }) => {
  return (
    <>
      {steps?.map((step) => {
        if (step.type === ConversationRoundStepType.toolCall) {
          return <ToolCallPanel key={step.tool_call_id} step={step} />;
        }
        return null;
      })}
    </>
  );
};
