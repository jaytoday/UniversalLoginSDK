import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {solidity, createFixtureLoader} from 'ethereum-waffle';
import Relayer from '@unilogin/relayer';
import basicSDK from '../../fixtures/basicSDK';
import UniLoginSdk from '../../../src/api/sdk';
import AuthorisationsObserver from '../../../src/core/observers/AuthorisationsObserver';
import {waitUntil, RelayerRequest} from '@unilogin/commons';
import {utils, Wallet} from 'ethers';
import {createdDeployedWallet} from '../../helpers/createDeployedWallet';

chai.use(solidity);
chai.use(sinonChai);

const loadFixture = createFixtureLoader();

describe('INT: AuthorisationsObserver', () => {
  let relayer: Relayer;
  let sdk: UniLoginSdk;
  let contractAddress: string;
  let authorisationsObserver: AuthorisationsObserver;
  let privateKey: string;
  let wallet: Wallet;
  let authorisationRequest: RelayerRequest;

  const createauthorisationRequest = async (walletContractAddress: string, privateKey: string, sdk: UniLoginSdk) => {
    const authorisationRequest: RelayerRequest = {
      contractAddress: walletContractAddress,
      signature: '',
    };
    await sdk.walletContractService.signRelayerRequest(privateKey, authorisationRequest);
    return authorisationRequest;
  };

  beforeEach(async () => {
    ({sdk, relayer, contractAddress, privateKey, wallet} = await loadFixture(basicSDK));
    authorisationRequest = await createauthorisationRequest(contractAddress, privateKey, sdk);
    ({authorisationsObserver} = sdk);
  });

  it('no authorisation requests', () => {
    const callback = sinon.spy();
    const unsubscribe = authorisationsObserver.subscribe(authorisationRequest, callback);
    unsubscribe();
    expect(callback).to.have.been.calledWith([]);
  });

  it('one authorisation requests', async () => {
    const callback = sinon.spy();
    const unsubscribe = authorisationsObserver.subscribe(authorisationRequest, callback);
    expect(callback).to.have.been.calledWith([]);
    const {privateKey} = await sdk.connect(contractAddress);
    await waitUntil(() => !!callback.secondCall);
    expect(callback.secondCall.args[0][0]).to.deep.include({
      walletContractAddress: contractAddress,
      key: utils.computeAddress(privateKey),
    });
    unsubscribe();
    expect(callback).to.have.been.calledTwice;
  });

  it('two authorisation requests', async () => {
    const newWalletContract = await createdDeployedWallet('newlogin.mylogin.eth', sdk, wallet);
    const callback1 = sinon.spy();
    const callback2 = sinon.spy();

    const unsubscribe1 = authorisationsObserver.subscribe(authorisationRequest, callback1);
    const unsubscribe2 = authorisationsObserver.subscribe(authorisationRequest, callback2);

    await sdk.connect(contractAddress);
    await sdk.connect(newWalletContract.contractAddress);

    await waitUntil(() => !!callback1.secondCall);
    await waitUntil(() => !!callback2.secondCall);

    unsubscribe1();
    unsubscribe2();

    expect(callback1).to.have.been.calledTwice;
    expect(callback2).to.have.been.calledTwice;
  });

  after(async () => {
    await relayer.stop();
  });
});
