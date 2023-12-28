import {expect, use} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fetch, {Response} from 'node-fetch';
import {http, handleApiResponse} from '../../../src/integration/http/http';

use(chaiAsPromised);

describe('UNIT: http', () => {
  it('returns a function', () => {
    const result = http(fetch)('baseurl');
    expect(result).to.be.a('function');
  });
});

describe('handleApiResponse', () => {
  it('works for success response', async () => {
    const response = new Response(
      JSON.stringify({x: 1}),
      {status: 200},
    );

    const result = await handleApiResponse(response as any);
    expect(result).to.deep.eq({x: 1});
  });

  it('works for error response', async () => {
    const response = new Response(
      JSON.stringify({x: 1}),
      {status: 400},
    );

    const promise = handleApiResponse(response as any);
    await expect(promise).to.be.rejected;
    expect(await promise.catch((x) => x)).to.deep.eq(({x: 1}));
  });

  it('works for empty success response', async () => {
    const response = new Response(
      '',
      {status: 200},
    );

    const result = await handleApiResponse(response as any);
    expect(result).to.eq('');
  });

  it('works for empty error response', async () => {
    const response = new Response(
      '',
      {status: 400},
    );

    const promise = handleApiResponse(response as any);
    await expect(promise).to.be.rejectedWith('');
  });

  it('works for html error response', async () => {
    const response = new Response(
      '<html>Some text</html>',
      {status: 400},
    );

    const promise = handleApiResponse(response as any);
    await expect(promise).to.be.rejectedWith('<html>Some text</html>');
  });
});
