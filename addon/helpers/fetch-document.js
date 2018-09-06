import Helper from './fetch-data';

export default Helper.extend({
  computeReturnValue(reference) {
    let data = reference.value();

    return { data };
  }
});
