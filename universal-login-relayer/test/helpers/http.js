import {Wallet, utils, Contract} from 'ethers';
import {RelayerUnderTest} from '../../lib/http/relayers/RelayerUnderTest';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {waitForContractDeploy, calculateDeploySignature, calculateInitializeSignature, TEST_GAS_PRICE, parseDomain} from '@universal-login/commons';
import WalletContract from '@universal-login/contracts/build/WalletMaster.json';
import ENS from '@universal-login/contracts/build/ENS.json';
import chai from 'chai';
import {deployFactory, getFutureAddress, deployWalletMasterWithRefund, encodeInitializeWithRefundData} from '@universal-login/contracts';

export const startRelayer = async (port = '33111') => {
  const provider = createMockProvider();
  const [deployer] = getWallets(provider);
  const wallet = Wallet.createRandom();
  const otherWallet = Wallet.createRandom();
  const {relayer, factoryContract, walletMaster, mockToken} = await RelayerUnderTest.createPreconfigured(deployer, port);
  await relayer.start();
  return {provider, wallet, otherWallet, relayer, deployer, factoryContract, walletMaster, mockToken};
};

export const createWalletContract = async (provider, relayerUrlOrServer, publicKey, ensName = 'marek.mylogin.eth') => {
  const result = await chai.request(relayerUrlOrServer)
  .post('/wallet')
  .send({
    managementKey: publicKey,
    ensName
  });
  const {transaction} = result.body;
  return waitForContractDeploy(provider, WalletContract, transaction.hash);
};

export const createWalletCounterfactually = async (wallet, relayerUrlOrServer, keyPair, walletMasterAddress, factoryContractAddress, ensAddress, ensName = 'marek.mylogin.eth') => {
  const futureAddress = getFutureAddress(walletMasterAddress, factoryContractAddress, keyPair.publicKey);
  await wallet.sendTransaction({to: futureAddress, value: utils.parseEther('1.0')});
  const initData = await getInitData(keyPair, ensName, ensAddress, wallet.provider, wallet.address, TEST_GAS_PRICE);
  const signature = await calculateInitializeSignature(initData, keyPair.privateKey);
  await chai.request(relayerUrlOrServer)
  .post('/wallet/deploy')
  .send({
    publicKey: keyPair.publicKey,
    ensName,
    gasPrice: TEST_GAS_PRICE,
    signature
  });
  return new Contract(futureAddress, WalletContract.interface, wallet);
};


export const startRelayerWithRefund = async (port = '33111') => {
  const provider = createMockProvider();
  const [deployer] = getWallets(provider);
  const walletMaster = await deployWalletMasterWithRefund(deployer);
  const factoryContract = await deployFactory(deployer, walletMaster.address);
  const {relayer, mockToken, ensAddress} = await RelayerUnderTest.createPreconfiguredRelayer({port, wallet: deployer, walletMaster, factoryContract});
  await relayer.start();
  return {provider, relayer, mockToken, factoryContract, walletMaster, deployer, ensAddress};
};

export const getInitData = async (keyPair, ensName, ensAddress, provider, relayerAddress, gasPrice) => {
  const [label, domain] = parseDomain(ensName);
  const hashLabel = utils.keccak256(utils.toUtf8Bytes(label));
  const node = utils.namehash(`${label}.${domain}`);
  const ens = new Contract(ensAddress, ENS.interface, provider);
  const resolverAddress = await ens.resolver(utils.namehash(domain));
  const registrarAddress = await ens.owner(utils.namehash(domain));
  return encodeInitializeWithRefundData([keyPair.publicKey, hashLabel, ensName, node, ensAddress, registrarAddress, resolverAddress, relayerAddress, gasPrice]);
};
