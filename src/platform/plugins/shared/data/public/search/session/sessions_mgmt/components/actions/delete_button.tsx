/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { EuiConfirmModal, useGeneratedHtmlId } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { useState } from 'react';
import { CoreStart } from '@kbn/core/public';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { SearchSessionsMgmtAPI } from '../../lib/api';
import { IClickActionDescriptor } from '..';
import { OnActionDismiss } from './types';
import { UISession } from '../../types';

interface DeleteButtonProps {
  api: SearchSessionsMgmtAPI;
  searchSession: UISession;
}

const DeleteConfirm = (props: DeleteButtonProps & { onActionDismiss: OnActionDismiss }) => {
  const { searchSession, api, onActionDismiss } = props;
  const { name, id } = searchSession;
  const [isLoading, setIsLoading] = useState(false);
  const modalTitleId = useGeneratedHtmlId();

  const title = i18n.translate('data.mgmt.searchSessions.cancelModal.title', {
    defaultMessage: 'Delete search session',
  });
  const confirm = i18n.translate('data.mgmt.searchSessions.cancelModal.deleteButton', {
    defaultMessage: 'Delete',
  });
  const cancel = i18n.translate('data.mgmt.searchSessions.cancelModal.cancelButton', {
    defaultMessage: 'Cancel',
  });
  const message = i18n.translate('data.mgmt.searchSessions.cancelModal.message', {
    defaultMessage: `Deleting the search session ''{name}'' deletes all cached results.`,
    values: {
      name,
    },
  });

  return (
    <EuiConfirmModal
      aria-labelledby={modalTitleId}
      titleProps={{ id: modalTitleId }}
      title={title}
      onCancel={onActionDismiss}
      onConfirm={async () => {
        setIsLoading(true);
        await api.sendDelete(id);
        onActionDismiss();
      }}
      confirmButtonText={confirm}
      confirmButtonDisabled={isLoading}
      cancelButtonText={cancel}
      defaultFocusedButton="confirm"
      buttonColor="danger"
    >
      {message}
    </EuiConfirmModal>
  );
};

export const createDeleteActionDescriptor = (
  api: SearchSessionsMgmtAPI,
  uiSession: UISession,
  core: CoreStart
): IClickActionDescriptor => ({
  iconType: 'trash',
  label: <FormattedMessage id="data.mgmt.searchSessions.actionDelete" defaultMessage="Delete" />,
  onClick: async () => {
    const ref = core.overlays.openModal(
      toMountPoint(
        <DeleteConfirm onActionDismiss={() => ref?.close()} searchSession={uiSession} api={api} />,
        core
      )
    );
    await ref.onClose;
  },
});
