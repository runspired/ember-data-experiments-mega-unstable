ember-data-experiments-mega-unstable
==============================================================================

This addon provides potential future ember-data APIs as experiments in ergonomics.

- You should play around with it, you probably shouldn't build a production app with it.
- You should create RFCs from the ideas or open issues with feedback, you probably shouldn't start refactoring your app with it.
- You should contribute tests, bugfixes, or additional concepts, you probably shouldn't copy paste any of this into your app.

### Why?

The goal of this addon is to explore paths for

- eliminating `PromiseProxy`.
- eliminating `ArrayProxy`.
- unwrapping dual-purpose proxies (proxies that proxy to more than one source, for instance, how relationships and queries also have meta and links attached to their proxy).
- eliminating unnecessary proxies.
- providing access to more complete document and resource contents.

The paths MUST be capable of working with the world we have today, while unlocking the world we want to refactor to tomorrow.

Installation
------------------------------------------------------------------------------

```
ember install ember-data-experiments-mega-unstable
```


Usage
------------------------------------------------------------------------------

### Template Helpers

**fetch-data**

```hbs
{{#let (fetch-data record 'relationshipName') as |data|}}
  {{#if data}}
     ... do things with record or array of records ...
  {{else}}
     ... do something else ...
  {{/if}}
{{/let}}
```

**fetch-document**

```hbs
{{#let (fetch-document record 'relationshipName') as |document|}}
  {{#if document.errors}}
     ... do things with request errors ...
  {{else if document.isLoading}}
     ... show spinner ...
  {{else}}
     ... do things with {{document.meta}} {{document.data}} {{document.links}} ...  
  {{/if}}
{{/let}}
```

Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ember-data-experiments-mega-unstable`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
