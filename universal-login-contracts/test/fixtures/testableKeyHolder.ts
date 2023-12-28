import KeyHolder from '../../dist/contracts/TestableKeyHolder.json';
import {Wallet} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import {Provider} from 'ethers/providers';
import {createKeyPair} from '@unilogin/commons';

export default async function testableKeyHolder(provider: Provider, [unknownWallet, , , wallet]: Wallet[]) {
  const initialPublicKey = wallet.address;
  const publicKey = createKeyPair().publicKey;
  const publicKey2 = createKeyPair().publicKey;
  const unknownWalletKey = unknownWallet.address;
  const keyHolder = await deployContract(wallet, KeyHolder, [initialPublicKey]);
  const fromUnknownWallet = await keyHolder.connect(unknownWallet);
  return {provider, keyHolder, wallet, publicKey, publicKey2, initialPublicKey, unknownWalletKey, fromUnknownWallet};
}
