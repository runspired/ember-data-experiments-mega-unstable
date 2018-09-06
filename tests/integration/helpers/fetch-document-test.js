import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { attr, hasMany, belongsTo } from '@ember-decorators/data';
import JSONAPISerializer from 'ember-data/serializers/json-api';
import JSONAPIAdapter from 'ember-data/adapters/json-api';
import Store from 'ember-data/store';
import Model from 'ember-data/model';
import { resolve, reject } from 'rsvp';
import { ServerError } from 'ember-data/adapters/errors';
// import Ember from 'ember';

class Person extends Model {
  @attr
  name;
  @hasMany('person', { async: true, inverse: 'parents' })
  children;
  @hasMany('person', { async: false, inverse: 'children' })
  parents;
  @belongsTo('pet', { inverse: 'bestHuman', async: true })
  bestDog;
}

class Pet extends Model {
  @belongsTo('person', { inverse: 'bestDog', async: false })
  bestHuman;
  @attr
  name;
}

module('Integration | Helper | fetch-document', function(hooks) {
  setupRenderingTest(hooks);
  let store;

  hooks.beforeEach(function() {
    let { owner } = this;
    owner.register('model:person', Person);
    owner.register('model:pet', Pet);
    owner.register(
      'serializer:application',
      JSONAPISerializer.extend({
        normalizeResponse(_, __, jsonApi) {
          return jsonApi;
        },
      })
    );
    owner.register('service:store', Store);
    store = owner.lookup('service:store');
  });

  module('tests for document.data', function() {
    test('it works with classic sync belongsTo', async function(assert) {
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.ok(false, 'We should not call findRecord');
          return resolve({ data: null });
        }
      }));

      let pet = store.push({
        data: {
          type: 'pet',
          id: '1',
          attributes: { name: 'Shen' },
          relationships: {
            bestHuman: {
              data: { type: 'person', id: '1' }
            }
          }
        },
        included: [
          {
            type: 'person',
            id: '1',
            attributes: { name: 'Chris' },
            relationships: {
              bestDog: {
                data: { type: 'pet', id: '1' }
              }
            }
          }
        ]
      });

      this.set('pet', pet);

      await render(hbs`
      {{#let (fetch-document pet 'bestHuman') as |bestHuman|}}
        {{#if bestHuman.data}}
            {{bestHuman.data.name}}  
        {{else}}
          has no human!
        {{/if}}
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'Chris');

      pet.set('bestHuman', null);

      await settled();

      assert.equal(this.element.textContent.trim(), 'has no human!');
    });

    test('it works with classic async belongsTo (sideloaded)', async function(assert) {
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.ok(false, 'We should not call findRecord');
          return resolve({ data: null });
        }
      }));

      let person = store.push({
        data:
          {
            type: 'person',
            id: '1',
            attributes: { name: 'Chris' },
            relationships: {
              bestDog: {
                data: { type: 'pet', id: '1' }
              }
            }
          },
        included: [
          {
            type: 'pet',
            id: '1',
            attributes: { name: 'Shen' },
            relationships: {
              bestHuman: {
                data: { type: 'person', id: '1' }
              }
            }
          },
        ]
      });

      this.set('person', person);

      await render(hbs`
      {{#let (fetch-document person 'bestDog') as |bestDog|}}
        {{#if bestDog.data}}
          {{bestDog.data.name}}  
        {{else}}
          has no pet!
        {{/if}}
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'Shen');

      person.set('bestDog', null);

      await settled();

      assert.equal(this.element.textContent.trim(), 'has no pet!');
    });

    test('it works with classic async belongsTo (fetched)', async function(assert) {
      let findRecordCalled = false;
      let findRecordResolve;
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.equal(findRecordCalled, false, 'We should not call findRecord more than once');
          findRecordCalled = true;
          return new Promise(resolve => {
            findRecordResolve = resolve;
          }).then(() => {
            return {
              data: {
                type: 'pet',
                id: '1',
                attributes: { name: 'Shen' },
                relationships: {
                  bestHuman: {
                    data: { type: 'person', id: '1' }
                  }
                }
              }
            }
          });
        }
      }));

      let person = store.push({
        data:
          {
            type: 'person',
            id: '1',
            attributes: { name: 'Chris' },
            relationships: {
              bestDog: {
                data: { type: 'pet', id: '1' }
              }
            }
          },
        included: []
      });

      this.set('person', person);

      await render(hbs`
      {{#let (fetch-document person 'bestDog') as |bestDog|}}
        {{#if bestDog.data}}
          {{bestDog.data.name}}  
        {{else}}
          has no pet!
        {{/if}}
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'has no pet!');

      findRecordResolve();
      await settled();

      assert.equal(this.element.textContent.trim(), 'Shen');

      person.set('bestDog', null);

      await settled();

      assert.equal(this.element.textContent.trim(), 'has no pet!');
    });

    test('it works with classic sync hasMany', async function(assert) {
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.ok(false, 'We should not call findRecord');
          return resolve({ data: null });
        },
        findMany() {
          assert.ok(false, 'We should not call findMany');
          return resolve({ data: [] });
        }
      }));

      let person = store.push({
        data:
          {
            type: 'person',
            id: '1',
            attributes: { name: 'Chris' },
            relationships: {
              parents: {
                data: [
                  { type: 'person', id: '2' }
                ]
              }
            }
          },
        included: [
          {
            type: 'person',
            id: '2',
            attributes: { name: 'John' },
            relationships: {
              children: {
                data: [
                  { type: 'person', id: '1' }
                ]
              }
            }
          },
          {
            type: 'person',
            id: '3',
            attributes: { name: 'Renee' },
            relationships: {
              children: {
                data: []
              }
            }
          },
        ]
      });

      this.set('person', person);

      await render(hbs`
      {{#let (fetch-document person 'parents') as |parents|}}
        {{#each parents.data as |parent|}}{{parent.name}}|{{else}}has no parents!{{/each}} 
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'John|');

      let parents = await person.get('parents');
      let Renee = store.peekRecord('person', '3');

      parents.pushObject(Renee);
      await settled();

      assert.equal(this.element.textContent.trim(), 'John|Renee|');
      person.set('parents', []);

      await settled();

      assert.equal(this.element.textContent.trim(), 'has no parents!');
    });

    test('it works with classic async hasMany (sideloaded)', async function(assert) {
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.ok(false, 'We should not call findRecord');
          return resolve({ data: null });
        },
        findMany() {
          assert.ok(false, 'We should not call findMany');
          return resolve({ data: [] });
        }
      }));

      let person = store.push({
        data:
          {
            type: 'person',
            id: '1',
            attributes: { name: 'John' },
            relationships: {
              children: {
                data: [
                  { type: 'person', id: '2' }
                ]
              }
            }
          },
        included: [
          {
            type: 'person',
            id: '2',
            attributes: { name: 'Chris' },
            relationships: {
              parents: {
                data: [
                  { type: 'person', id: '1' }
                ]
              }
            }
          },
          {
            type: 'person',
            id: '3',
            attributes: { name: 'William' },
            relationships: {
              parents: {
                data: []
              }
            }
          }
        ]
      });

      this.set('person', person);

      await render(hbs`
      {{#let (fetch-document person 'children') as |children|}}
        {{#each children.data as |child|}}{{child.name}}|{{else}}has no children!{{/each}} 
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'Chris|');

      let children = await person.get('children');
      let William = store.peekRecord('person', '3');

      children.pushObject(William);
      await settled();

      assert.equal(this.element.textContent.trim(), 'Chris|William|');

      person.set('children', []);
      await settled();

      assert.equal(this.element.textContent.trim(), 'has no children!');
    });

    test('it works with classic async hasMany (fetched)', async function(assert) {
      let findRecordCalled = false;
      let findRecordResolve;
      this.owner.register('adapter:application', JSONAPIAdapter.extend({
        findRecord() {
          assert.equal(findRecordCalled, false, 'We should not call findRecord more than once');
          findRecordCalled = true;
          return new Promise(resolve => {
            findRecordResolve = resolve;
          }).then(() => {
            return {
              data: {
                type: 'person',
                id: '2',
                attributes: { name: 'Chris' },
                relationships: {
                  parents: {
                    data: [
                      { type: 'person', id: '1' }
                    ]
                  }
                }
              }
            }
          });
        },
        findMany() {
          assert.ok(false, 'We should not call findMany');
          return resolve({ data: [] });
        }
      }));

      let person = store.push({
        data:
          {
            type: 'person',
            id: '1',
            attributes: { name: 'John' },
            relationships: {
              children: {
                data: [
                  { type: 'person', id: '2' }
                ]
              }
            }
          },
        included: [
          {
            type: 'person',
            id: '3',
            attributes: { name: 'William' },
            relationships: {
              parents: {
                data: []
              }
            }
          }
        ]
      });

      this.set('person', person);

      await render(hbs`
      {{#let (fetch-document person 'children') as |children|}}
        {{#each children.data as |child|}}{{child.name}}|{{else}}has no children!{{/each}} 
      {{/let}}
    `);

      assert.equal(this.element.textContent.trim(), 'has no children!');

      findRecordResolve();
      await settled();

      assert.equal(this.element.textContent.trim(), 'Chris|');

      let children = await person.get('children');
      let William = store.peekRecord('person', '3');

      children.pushObject(William);
      await settled();

      assert.equal(this.element.textContent.trim(), 'Chris|William|');

      person.set('children', []);
      await settled();

      assert.equal(this.element.textContent.trim(), 'has no children!');
    });
  });
});
