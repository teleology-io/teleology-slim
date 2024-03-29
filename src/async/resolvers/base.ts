import { Buffer } from 'buffer/'

const base64 = (v: string): string => Buffer.from(v).toString('base64').replace(/=/g, '');

/* eslint-disable no-new-func */
const compile = (cmd: string, context: any) =>
  new Promise((resolve) => {
    const hash = base64(cmd);
    context[hash] = resolve;
    try {
      new Function(`with(this) {
      Promise.resolve(${cmd})
        .then((result) => {
          if (typeof result === 'number') return ${hash}(result);
          ${hash}(result || '');
        })
        .catch((e) => ${hash}(''))
    }`).apply(context);
    } catch (e) {
      resolve('');
    }
  });

export default {
  regex: /{{.*?}}/g,
  resolver: async ({ match, context }: ResolverArgs) => {
    const key = match.slice(2, -2).trim();
    const value = context[key];
    if (typeof value === 'number') return value;
    return value && typeof value === 'function'
      ? value(context)
      : compile(key, context);
  },
};
