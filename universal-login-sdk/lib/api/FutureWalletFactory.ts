import {providers, utils} from 'ethers';
import {
  calculateInitializeSignature,
  SerializableFutureWallet,
  PublicRelayerConfig,
  ensure,
  isValidEnsName,
  SupportedToken,
} from '@universal-login/commons';
import {encodeInitializeWithENSData, BlockchainService} from '@universal-login/contracts';
import {DeploymentReadyObserver} from '../core/observers/DeploymentReadyObserver';
import {RelayerApi} from '../integration/http/RelayerApi';
import {ENSService} from '../integration/ethereum/ENSService';
import UniversalLoginSDK from './sdk';
import {InvalidAddressOrEnsName} from '../core/utils/errors';
import {DeployingWallet} from './wallet/DeployingWallet';

export type BalanceDetails = {
  tokenAddress: string;
  contractAddress: string;
};

export interface FutureWallet extends SerializableFutureWallet {
  waitForBalance: () => Promise<BalanceDetails>;
  deploy: (ensName: string, gasPrice: string, gasToken: string) => Promise<DeployingWallet>;
  setSupportedToken: (supportedToken: SupportedToken) => void;
}

type FutureFactoryConfig = Pick<PublicRelayerConfig, 'supportedTokens' | 'factoryAddress' | 'contractWhiteList' | 'chainSpec'>;

export class FutureWalletFactory {
  private ensService: ENSService;
  private deploymentReadyObserver: DeploymentReadyObserver;

  constructor(
    private config: FutureFactoryConfig,
    private provider: providers.Provider,
    private blockchainService: BlockchainService,
    private relayerApi: RelayerApi,
    private sdk: UniversalLoginSDK,
  ) {
    this.ensService = new ENSService(provider, config.chainSpec.ensAddress);
    this.deploymentReadyObserver = new DeploymentReadyObserver(config.supportedTokens, provider);
  }

  private async setupInitData(publicKey: string, ensName: string, gasPrice: string, gasToken: string) {
    const args = await this.ensService.argsFor(ensName) as string[];
    const initArgs = [publicKey, ...args, gasPrice, gasToken];
    return encodeInitializeWithENSData(initArgs);
  }

  createFromExistingCounterfactual(wallet: SerializableFutureWallet): FutureWallet {
    const {privateKey, contractAddress} = wallet;
    const publicKey = utils.computeAddress(privateKey);

    return {
      privateKey,
      contractAddress,
      waitForBalance: async () => new Promise<BalanceDetails>(
        (resolve) => {
          this.deploymentReadyObserver.startAndSubscribe(
            contractAddress,
            (tokenAddress, contractAddress) => resolve({tokenAddress, contractAddress}),
          ).catch(console.error);
        },
      ),
      deploy: async (ensName: string, gasPrice: string, gasToken: string): Promise<DeployingWallet> => {
        ensure(isValidEnsName(ensName), InvalidAddressOrEnsName, ensName);
        const initData = await this.setupInitData(publicKey, ensName, gasPrice, gasToken);
        const signature = await calculateInitializeSignature(initData, privateKey);
        const {deploymentHash} = await this.relayerApi.deploy(publicKey, ensName, gasPrice, gasToken, signature, this.sdk.sdkConfig.applicationInfo);
        return new DeployingWallet({deploymentHash, contractAddress, name: ensName, privateKey}, this.sdk);
      },
      setSupportedToken: (supportedToken: SupportedToken) => {
        this.deploymentReadyObserver.setSupportedToken(supportedToken);
      },
    };
  }

  async createFutureWallet(): Promise<FutureWallet> {
    const [privateKey, contractAddress] = await this.blockchainService.createFutureWallet(this.config.factoryAddress);
    return this.createFromExistingCounterfactual({privateKey, contractAddress});
  }
}
