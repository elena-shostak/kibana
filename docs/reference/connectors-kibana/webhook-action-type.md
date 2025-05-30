---
navigation_title: "Webhook"
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/webhook-action-type.html
applies_to:
  stack: all
  serverless: all
---

# Webhook connector and action [webhook-action-type]

The Webhook connector uses [axios](https://github.com/axios/axios) to send a POST or PUT request to a web service.

## Create connectors in {{kib}} [define-webhook-ui]

You can create connectors in **{{stack-manage-app}} > {{connectors-ui}}** or as needed when you’re creating a rule. For example:

:::{image} ../images/webhook-connector.png
:alt: Webhook connector
:screenshot:
:::

### Connector configuration [webhook-connector-configuration]

Webhook connectors have the following configuration properties:

Name
:   The name of the connector.

Method
:   The HTTP request method, either `post`(default) or `put`.

URL
:   The request URL. If you are using the [`xpack.actions.allowedHosts`](/reference/configuration-reference/alerting-settings.md#action-settings) setting, make sure the hostname is added to the allowed hosts.

Authentication
:   The authentication type: none, basic, or SSL. If you choose basic authentication, you must provide a user name and password. If you choose SSL authentication, you must provide SSL server certificate authentication data in a CRT and key file format or a PFX file format. You can also optionally provide a passphrase if the files are password-protected.

HTTP headers
:   A set of key-value pairs sent as headers with the request. For example, set `Content-Type` to the appropriate media type for your requests.

Certificate authority
:   A certificate authority (CA) that the connector can trust, for example to sign and validate server certificates. This option is available for all authentication types.

    CA file
    :   The certificate authority file.

    Verification mode
    :   Controls the certificate verification.
        * Use `full` to validate that the certificate has an issue date within the `not_before` and `not_after` dates, chains to a trusted certificate authority, and has a hostname or IP address that matches the names within the certificate.
        * Use `certificate` to validate the certificate and verifies that it is signed by a trusted authority; this option does not check the certificate hostname.
        * Use `none` to skip certificate validation.

## Test connectors [webhook-action-configuration]

You can test connectors as you’re creating or editing the connector in {{kib}}. For example:

:::{image} ../images/webhook-params-test.png
:alt: Webhook params test
:screenshot:
:::

Webhook actions have the following properties.

Body
:   A JSON payload sent to the request URL. For example:

    ```text
    {
      "short_description": "{{context.rule.name}}",
      "description": "{{context.rule.description}}",
      ...
    }
    ```

Mustache template variables (the text enclosed in double braces, for example, `context.rule.name`) have their values escaped, so that the final JSON will be valid (escaping double quote characters). For more information on Mustache template variables, refer to [Actions](docs-content://explore-analyze/alerts-cases/alerts/create-manage-rules.md#defining-rules-actions-details).

## Connector networking configuration [webhook-connector-networking-configuration]

Use the [Action configuration settings](/reference/configuration-reference/alerting-settings.md#action-settings) to customize connector networking configurations, such as proxies, certificates, or TLS settings. You can set configurations that apply to all your connectors or use `xpack.actions.customHostSettings` to set per-host configurations.
