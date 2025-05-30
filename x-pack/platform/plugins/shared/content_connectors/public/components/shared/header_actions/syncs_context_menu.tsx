/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';

import { useActions, useValues } from 'kea';

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPopover,
  EuiContextMenu,
  EuiContextMenuProps,
  EuiIcon,
  EuiText,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';

import { ConnectorStatus, IngestionStatus } from '@kbn/search-connectors';

import { useKibana } from '@kbn/kibana-react-plugin/public';
import { CancelSyncsApiLogic } from '../../../api/connector/cancel_syncs_api_logic';
import { ConnectorViewLogic } from '../../connector_detail/connector_view_logic';

import { IndexViewLogic } from '../../search_index/index_view_logic';

import { SyncsLogic } from './syncs_logic';
import { useAppContext } from '../../../app_context';
import { Status } from '../../../../common/types/api';

export interface SyncsContextMenuProps {
  disabled?: boolean;
}

export const SyncsContextMenu: React.FC<SyncsContextMenuProps> = ({ disabled = false }) => {
  const {
    services: { http },
  } = useKibana();
  const { isAgentlessEnabled } = useAppContext();
  const { ingestionStatus, isCanceling, isSyncing, isWaitingForSync } = useValues(
    IndexViewLogic({ http })
  );
  const { connector, hasDocumentLevelSecurityFeature, hasIncrementalSyncFeature } = useValues(
    ConnectorViewLogic({ http })
  );
  const { status } = useValues(CancelSyncsApiLogic);
  const { startSync, startIncrementalSync, startAccessControlSync, cancelSyncs } = useActions(
    SyncsLogic({ http })
  );

  const [isPopoverOpen, setPopover] = useState(false);
  const togglePopover = () => setPopover(!isPopoverOpen);
  const closePopover = () => setPopover(false);

  const getSyncButtonText = () => {
    if (isWaitingForSync) {
      return i18n.translate(
        'xpack.contentConnectors.content.index.syncButton.waitingForSync.label',
        {
          defaultMessage: 'Waiting for sync',
        }
      );
    }
    if (isSyncing && connector?.status !== ConnectorStatus.ERROR) {
      return i18n.translate('xpack.contentConnectors.content.index.syncButton.syncing.label', {
        defaultMessage: 'Syncing',
      });
    }
    return i18n.translate('xpack.contentConnectors.content.index.syncButton.label', {
      defaultMessage: 'Sync',
    });
  };

  const syncLoading = (isSyncing || isWaitingForSync) && ingestionStatus !== IngestionStatus.ERROR;

  const isWaitingForConnector = !connector?.status || connector?.status === ConnectorStatus.CREATED;

  const shouldShowDocumentLevelSecurity = hasDocumentLevelSecurityFeature;
  const shouldShowIncrementalSync = hasIncrementalSyncFeature;

  const isSyncsDisabled =
    (connector?.is_native && !isAgentlessEnabled) ||
    ingestionStatus === IngestionStatus.INCOMPLETE ||
    !connector?.index_name;

  const panels: EuiContextMenuProps['panels'] = [
    {
      id: 0,
      items: [
        ...(syncLoading
          ? []
          : [
              {
                // @ts-ignore - data-* attributes are applied but doesn't exist on types
                'data-telemetry-id': `entSearchContent-connector-header-sync-startSync`,
                'data-test-subj': `entSearchContent-connector-header-sync-startSync`,
                disabled: isSyncsDisabled,
                icon: 'play',
                name: i18n.translate('xpack.contentConnectors.index.header.more.fullSync', {
                  defaultMessage: 'Full Content',
                }),
                onClick: () => {
                  closePopover();
                  startSync(connector);
                },
              },
            ]),
        ...(shouldShowIncrementalSync
          ? [
              {
                // @ts-ignore - data-* attributes are applied but doesn't exist on types
                'data-telemetry-id': `entSearchContent-connector-header-sync-more-incrementalSync`,
                'data-test-subj': `entSearchContent-connector-header-sync-more-incrementalSync`,
                disabled: isSyncsDisabled,
                icon: 'play',
                name: i18n.translate('xpack.contentConnectors.index.header.more.incrementalSync', {
                  defaultMessage: 'Incremental Content',
                }),
                onClick: () => {
                  closePopover();
                  startIncrementalSync(connector);
                },
              },
            ]
          : []),
        ...(shouldShowDocumentLevelSecurity
          ? [
              {
                // @ts-ignore - data-* attributes are applied but doesn't exist on types
                'data-telemetry-id': `entSearchContent-connector-header-sync-more-accessControlSync`,
                'data-test-subj': `entSearchContent-connector-header-sync-more-accessControlSync`,
                disabled: Boolean(
                  isSyncsDisabled || !connector?.configuration.use_document_level_security?.value
                ),
                icon: 'play',
                name: i18n.translate(
                  'xpack.contentConnectors.index.header.more.accessControlSync',
                  {
                    defaultMessage: 'Access Control',
                  }
                ),
                onClick: () => {
                  closePopover();
                  startAccessControlSync(connector);
                },
              },
            ]
          : []),
        {
          // @ts-ignore - data-* attributes are applied but doesn't exist on types
          'data-telemetry-id': `entSearchContent-connector-header-sync-cancelSync`,
          disabled:
            (isCanceling && ingestionStatus !== IngestionStatus.ERROR) || status === Status.LOADING,
          icon: <EuiIcon type="cross" size="m" color="danger" />,
          name: (
            <EuiText color="danger" size="s">
              <p>
                {i18n.translate('xpack.contentConnectors.index.header.cancelSyncsTitle', {
                  defaultMessage: 'Cancel Syncs',
                })}
              </p>
            </EuiText>
          ),
          onClick: () => {
            closePopover();
            cancelSyncs(connector);
          },
        },
      ],
      title: 'Sync',
    },
  ];

  return (
    <EuiPopover
      button={
        <EuiButton
          disabled={disabled || isWaitingForConnector}
          data-test-subj="enterpriseSearchSyncsContextMenuButton"
          data-telemetry-id="entSearchContent-connector-header-sync-openSyncMenu"
          iconType="arrowDown"
          iconSide="right"
          onClick={togglePopover}
          fill
        >
          <EuiFlexGroup alignItems="center" responsive={false} gutterSize="s">
            {syncLoading && (
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner size="m" />
              </EuiFlexItem>
            )}
            <EuiFlexItem data-test-subj="entSearchContent-connector-header-sync-menu">
              {getSyncButtonText()}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiButton>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downCenter"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
