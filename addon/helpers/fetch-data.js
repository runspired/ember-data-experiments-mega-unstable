import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { resolve } from 'rsvp';
import { addObserver, removeObserver } from '@ember/object/observers';

function guard(promise, complete) {
  let cancelled = false;

  resolve(promise)
    .then(
      v => { if (!cancelled) { complete(v) } },
      e => { if (!cancelled) { throw e; } }
    );

  return () => {
    cancelled = true;
  };
}

export default Helper.extend({
  compute(params/*, hash*/) {
    if (!this.shouldRebuild(params)) {
      return this._value;
    }

    this._cachedParams = params;
    this.installObserver(params);

    return this.computeValue(params);
  },

  computeValue(params) {
    let [record, relationshipName] = params;
    let rels = get(record.constructor, 'relationshipsByName');
    let meta = rels.get(relationshipName);
    let { kind } = meta;
    let reference = record[kind](relationshipName);
    let value = reference.value();

    this._value = reference.value();

    if (meta.options.async === false) {
      return value;
    }

    this._load = guard(reference.load(), (v) => {
      this._load = null;
      if (this._value !== v) {
        this._value = v;
        this.recompute();
      }
    });

    return value;
  },

  shouldRebuild(params) {
    let cached = this._cachedParams;
    this._cachedParams = params;

    if (!cached) {
      return true;
    } else if (cached[0] !== params[0] || cached[1] !== params[1]) {
      this.removeInstalledObserver(cached);

      if (this._load) {
        this._load.cancel();
        this._load = null;
      }

      return true;
    }

    return false;
  },

  updateValue() {
    this.computeValue(this._cachedParams);
    this.recompute();
  },

  installObserver([object, key]) {
    addObserver(object, key, this, 'updateValue')
  },

  removeInstalledObserver([object, key]) {
    removeObserver(object, key, this, 'updateValue');
  }
});
