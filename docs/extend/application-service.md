---
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/application-service.html
---

# Application service [application-service]

Kibana has migrated to be a Single Page Application. Plugins should use `Application service` API to instruct Kibana that an application should be loaded and rendered in the UI in response to user interactions. The service also provides utilities for controlling the navigation link state, seamlessly integrating routing between applications, and loading async chunks on demand.

::::{note}
The Application service is only available client side.
::::


```typescript
import { AppMountParameters, CoreSetup, Plugin, DEFAULT_APP_CATEGORIES } from '@kbn/core/public';

export class MyPlugin implements Plugin {
  public setup(core: CoreSetup) {
    core.application.register({ <1>
      category: DEFAULT_APP_CATEGORIES.kibana,
      id: 'my-plugin',
      title: 'my plugin title',
      euiIconType: '/path/to/some.svg',
      order: 100,
      appRoute: '/app/my_plugin', <2>
      async mount(params: AppMountParameters) { <3>
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services
        const [coreStart, depsStart] = await core.getStartServices(); <4>
        // Render the application
        return renderApp(coreStart, depsStart, params); <5>
      },
    });
  }
}
```

1. Refer to  [application.register interface](https://github.com/elastic/kibana/tree/master/src/core/packages/application/browser/src/contracts.ts)
2. Application specific URL.
3. `mount` callback is invoked when a user navigates to the application-specific URL.
4. `core.getStartServices` method provides API available during `start` lifecycle.
5. `mount` method must return a function that will be called to unmount the application, which is called when Kibana unmounts the application. You can put a clean-up logic there.


::::{note}
you are free to use any UI library to render a plugin application in DOM. However, we recommend using React and [EUI](https://elastic.github.io/eui) for all your basic UI components to create a consistent UI experience.
::::


