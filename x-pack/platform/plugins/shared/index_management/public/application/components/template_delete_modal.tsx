/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Fragment, useState } from 'react';
import {
  EuiConfirmModal,
  EuiCallOut,
  EuiCheckbox,
  EuiBadge,
  EuiSpacer,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { DeleteManagedAssetsCallout } from '@kbn/delete-managed-asset-callout';
import { deleteTemplates } from '../services/api';
import { notificationService } from '../services/notification';

export const TemplateDeleteModal = ({
  templatesToDelete,
  callback,
}: {
  templatesToDelete: Array<{ name: string; isLegacy?: boolean; type?: string }>;
  callback: (data?: { hasDeletedTemplates: boolean }) => void;
}) => {
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState<boolean>(false);

  const modalTitleId = useGeneratedHtmlId();

  const numTemplatesToDelete = templatesToDelete.length;

  const hasSystemTemplate = Boolean(templatesToDelete.find(({ name }) => name.startsWith('.')));
  const managedTemplatesToDelete = templatesToDelete.filter(
    ({ type }) => type === 'managed'
  ).length;

  const handleDeleteTemplates = () => {
    deleteTemplates(templatesToDelete).then(({ data: { templatesDeleted, errors }, error }) => {
      const hasDeletedTemplates = templatesDeleted && templatesDeleted.length;

      if (hasDeletedTemplates) {
        const successMessage =
          templatesDeleted.length === 1
            ? i18n.translate(
                'xpack.idxMgmt.deleteTemplatesModal.successDeleteSingleNotificationMessageText',
                {
                  defaultMessage: "Deleted template ''{templateName}''",
                  values: { templateName: templatesToDelete[0].name },
                }
              )
            : i18n.translate(
                'xpack.idxMgmt.deleteTemplatesModal.successDeleteMultipleNotificationMessageText',
                {
                  defaultMessage:
                    'Deleted {numSuccesses, plural, one {# template} other {# templates}}',
                  values: { numSuccesses: templatesDeleted.length },
                }
              );

        callback({ hasDeletedTemplates });
        notificationService.showSuccessToast(successMessage);
      }

      if (error || (errors && errors.length)) {
        const hasMultipleErrors =
          (errors && errors.length > 1) || (error && templatesToDelete.length > 1);
        const errorMessage = hasMultipleErrors
          ? i18n.translate(
              'xpack.idxMgmt.deleteTemplatesModal.multipleErrorsNotificationMessageText',
              {
                defaultMessage: 'Error deleting {count} templates',
                values: {
                  count: (errors && errors.length) || templatesToDelete.length,
                },
              }
            )
          : i18n.translate('xpack.idxMgmt.deleteTemplatesModal.errorNotificationMessageText', {
              defaultMessage: "Error deleting template ''{name}''",
              values: { name: (errors && errors[0].name) || templatesToDelete[0] },
            });
        notificationService.showDangerToast(errorMessage);
      }
    });
  };

  const handleOnCancel = () => {
    setIsDeleteConfirmed(false);
    callback();
  };

  return (
    <EuiConfirmModal
      aria-labelledby={modalTitleId}
      titleProps={{ id: modalTitleId }}
      buttonColor="danger"
      data-test-subj="deleteTemplatesConfirmation"
      title={
        <FormattedMessage
          id="xpack.idxMgmt.deleteTemplatesModal.modalTitleText"
          defaultMessage="Delete {numTemplatesToDelete, plural, one {template} other {# templates}}"
          values={{ numTemplatesToDelete }}
        />
      }
      onCancel={handleOnCancel}
      onConfirm={handleDeleteTemplates}
      cancelButtonText={
        <FormattedMessage
          id="xpack.idxMgmt.deleteTemplatesModal.cancelButtonLabel"
          defaultMessage="Cancel"
        />
      }
      confirmButtonText={
        <FormattedMessage
          id="xpack.idxMgmt.deleteTemplatesModal.confirmButtonLabel"
          defaultMessage="Delete {numTemplatesToDelete, plural, one {template} other {templates} }"
          values={{ numTemplatesToDelete }}
        />
      }
      confirmButtonDisabled={hasSystemTemplate ? !isDeleteConfirmed : false}
    >
      <Fragment>
        {managedTemplatesToDelete > 0 && (
          <>
            <DeleteManagedAssetsCallout
              assetName={i18n.translate('xpack.idxMgmt.deleteTemplatesModal.assetName', {
                defaultMessage: 'index templates',
              })}
            />

            <EuiSpacer size="m" />
          </>
        )}
        <p>
          <FormattedMessage
            id="xpack.idxMgmt.deleteTemplatesModal.deleteDescription"
            defaultMessage="You are about to delete {numTemplatesToDelete, plural, one {this template} other {these templates} }:"
            values={{ numTemplatesToDelete }}
          />
        </p>

        <ul>
          {templatesToDelete.map(({ name, type }) => (
            <li key={name}>
              {name}
              {type === 'managed' && (
                <>
                  {' '}
                  <EuiBadge color="hollow">
                    <FormattedMessage
                      id="xpack.idxMgmt.deleteTemplatesModal.managedTemplateLabel"
                      defaultMessage="Managed"
                    />
                  </EuiBadge>
                </>
              )}
              {name.startsWith('.') ? (
                <Fragment>
                  {' '}
                  <EuiBadge iconType="warning" color="hollow">
                    <FormattedMessage
                      id="xpack.idxMgmt.deleteTemplatesModal.systemTemplateLabel"
                      defaultMessage="System template"
                    />
                  </EuiBadge>
                </Fragment>
              ) : null}
            </li>
          ))}
        </ul>
        {hasSystemTemplate && (
          <EuiCallOut
            title={
              <FormattedMessage
                id="xpack.idxMgmt.deleteTemplatesModal.proceedWithCautionCallOutTitle"
                defaultMessage="Deleting a system template can break Kibana"
              />
            }
            color="danger"
            iconType="warning"
            data-test-subj="deleteSystemTemplateCallOut"
          >
            <p>
              <FormattedMessage
                id="xpack.idxMgmt.deleteTemplatesModal.proceedWithCautionCallOutDescription"
                defaultMessage="System templates are critical for internal operations.
                  If you delete this template, you can’t recover it."
              />
            </p>
            <EuiCheckbox
              id="confirmDeleteTemplatesCheckbox"
              label={
                <FormattedMessage
                  id="xpack.idxMgmt.deleteTemplatesModal.confirmDeleteCheckboxLabel"
                  defaultMessage="I understand the consequences of deleting a system template"
                />
              }
              checked={isDeleteConfirmed}
              onChange={(e) => setIsDeleteConfirmed(e.target.checked)}
            />
          </EuiCallOut>
        )}
      </Fragment>
    </EuiConfirmModal>
  );
};
