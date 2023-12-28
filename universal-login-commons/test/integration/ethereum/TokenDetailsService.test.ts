import {Wallet, Contract} from 'ethers';
import {MockProvider, deployContract} from 'ethereum-waffle';
import {expect} from 'chai';
import {TokenDetailsService} from '../../../src/integration/ethereum/TokenDetailsService';
import {ETHER_NATIVE_TOKEN} from '../../../src/core/constants/constants';
import MockToken from '../../fixtures/MockToken.json';
import MockDai from '../../fixtures/MockDai.json';

describe('INT: TokenDetailsService', () => {
  let provider: MockProvider;
  let tokenDetailsService: TokenDetailsService;
  let wallet: Wallet;
  let mockSai: Contract;

  beforeEach(async () => {
    provider = new MockProvider();
    [wallet] = provider.getWallets();
    mockSai = await deployContract(wallet, MockDai, []);
    tokenDetailsService = new TokenDetailsService(provider, mockSai.address);
  });

  it('ether', async () => {
    const details = await tokenDetailsService.getTokenDetails(ETHER_NATIVE_TOKEN.address);

    expect(details.symbol).to.eq(ETHER_NATIVE_TOKEN.symbol);
    expect(details.name).to.eq(ETHER_NATIVE_TOKEN.name);
    expect(details.address).to.eq(ETHER_NATIVE_TOKEN.address);
    expect(details.decimals).to.eq(ETHER_NATIVE_TOKEN.decimals);
  });

  it('token', async () => {
    const mockToken = await deployContract(wallet, MockToken, []);
    const details = await tokenDetailsService.getTokenDetails(mockToken.address);

    expect(details.symbol).to.eq('Mock');
    expect(details.name).to.eq('MockToken');
    expect(details.address).to.eq(mockToken.address);
  });

  it('token not deployed', async () => {
    const notDeployedtokenAddress = '0x000000000000000000000000000000000000DEAD';
    await expect(tokenDetailsService.getSymbol(notDeployedtokenAddress))
      .to.be.eventually.rejectedWith('contract not deployed');
  });

  it('[token, ether]', async () => {
    const mockToken = await deployContract(wallet, MockToken, []);
    const tokensDetails = await tokenDetailsService.getTokensDetails([mockToken.address, ETHER_NATIVE_TOKEN.address]);

    expect(tokensDetails).to.be.lengthOf(2);

    const [tokenDetails, etherDetails] = tokensDetails;

    expect(tokenDetails.symbol).to.eq('Mock');
    expect(tokenDetails.name).to.eq('MockToken');
    expect(tokenDetails.address).to.eq(mockToken.address);

    expect(etherDetails.symbol).to.eq(ETHER_NATIVE_TOKEN.symbol);
    expect(etherDetails.name).to.eq(ETHER_NATIVE_TOKEN.name);
    expect(etherDetails.address).to.eq(ETHER_NATIVE_TOKEN.address);
  });

  it('works for DAI', async () => {
    const mockDai = await deployContract(wallet, MockDai, []);
    const details = await tokenDetailsService.getTokenDetails(mockDai.address);
    expect(details.symbol).to.eq('DAI');
    expect(details.name).to.eq('Dai Stablecoin v1.0');
    expect(details.address).to.eq(mockDai.address);
    expect(details.decimals).to.eq(18);
  });

  it('works for SAI', async () => {
    const details = await tokenDetailsService.getTokenDetails(mockSai.address);
    expect(details.symbol).to.eq('SAI');
    expect(details.name).to.eq('Sai Stablecoin v1.0');
    expect(details.address).to.eq(mockSai.address);
  });
});
