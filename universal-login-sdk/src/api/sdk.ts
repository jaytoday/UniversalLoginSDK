import {addCodesToNotifications, BalanceChecker, createKeyPair, deepMerge, DeepPartial, ensure, ensureNotEmpty, ensureNotFalsy, generateCode, Notification, PublicRelayerConfig, resolveName, TokenDetailsService, TokensValueConverter, SufficientBalanceValidator, Nullable, GasMode, MessageStatus, Network, asNetwork, Lazy} from '@unilogin/commons';
import {BlockchainService} from '@unilogin/contracts';
import {providers} from 'ethers';
import {SdkConfig} from '../config/SdkConfig';
import {SdkConfigDefault} from '../config/SdkConfigDefault';
import {AggregateBalanceObserver, OnAggregatedBalanceChange} from '../core/observers/AggregateBalanceObserver';
import AuthorisationsObserver from '../core/observers/AuthorisationsObserver';
import {BalanceObserver, OnBalanceChange} from '../core/observers/BalanceObserver';
import {OnTokenPricesChange, PriceObserver} from '../core/observers/PriceObserver';
import {ExecutionFactory} from '../core/services/ExecutionFactory';
import {FeatureFlagsService} from '../core/services/FeatureFlagsService';
import {GasModeService} from '../core/services/GasModeService';
import {MessageConverter} from '../core/services/MessageConverter';
import {TokensDetailsStore} from '../core/services/TokensDetailsStore';
import {InvalidContract, InvalidENSRecord, InvalidEvent, MissingConfiguration} from '../core/utils/errors';
import {ENSService} from '../integration/ethereum/ENSService';
import {GasPriceOracle} from '../integration/ethereum/gasPriceOracle';
import {RelayerApi} from '../integration/http/RelayerApi';
import {FutureWalletFactory} from './FutureWalletFactory';
import {FutureWallet} from './wallet/FutureWallet';
import {WalletEventType, WalletEventFilter, WalletEventCallback} from '../core/models/events';
import WalletEventsObserverFactory from '../core/observers/WalletEventsObserverFactory';
import {BlockNumberState} from '../core/states/BlockNumberState';
import {WalletContractService} from '../integration/ethereum/WalletContractService';
import {Beta2Service} from '../integration/ethereum/Beta2Service';
import {GnosisSafeService} from '../integration/ethereum/GnosisSafeService';
import {NotifySdk} from '../integration/notifySdk/NotifySdk';
import {cast} from '@restless/sanitizers';
import {INotifySdk} from '../integration/notifySdk/interfaces';

class UniversalLoginSDK {
  readonly provider: providers.Provider;
  readonly relayerApi: RelayerApi;
  readonly authorisationsObserver: AuthorisationsObserver;
  readonly executionFactory: ExecutionFactory;
  readonly balanceChecker: BalanceChecker;
  readonly tokensValueConverter: TokensValueConverter;
  readonly priceObserver: PriceObserver;
  readonly tokenDetailsService: TokenDetailsService;
  readonly tokensDetailsStore: TokensDetailsStore;
  readonly blockchainService: BlockchainService;
  readonly gasPriceOracle: GasPriceOracle;
  readonly gasModeService: GasModeService;
  readonly sdkConfig: SdkConfig;
  readonly sufficientBalanceValidator: SufficientBalanceValidator;
  readonly factoryAddress?: string;
  readonly featureFlagsService: FeatureFlagsService;
  readonly messageConverter: MessageConverter;
  readonly walletEventsObserverFactory: WalletEventsObserverFactory;
  readonly walletContractService: WalletContractService;
  private readonly relayerConfig: Lazy<PublicRelayerConfig>;
  balanceObserver?: BalanceObserver;
  aggregateBalanceObserver?: AggregateBalanceObserver;
  futureWalletFactory?: FutureWalletFactory;
  notifySdk?: INotifySdk;

  constructor(
    relayerUrl: string,
    providerOrUrl: string | providers.Provider,
    sdkConfig?: DeepPartial<SdkConfig>,
  ) {
    this.provider = typeof (providerOrUrl) === 'string'
      ? new providers.JsonRpcProvider(providerOrUrl)
      : providerOrUrl;
    this.sdkConfig = deepMerge(SdkConfigDefault, sdkConfig);
    this.relayerApi = new RelayerApi(relayerUrl);
    this.authorisationsObserver = new AuthorisationsObserver(this.relayerApi, this.sdkConfig.authorizationsObserverTick);
    this.executionFactory = new ExecutionFactory(this.relayerApi, this.sdkConfig.mineableFactoryTick, this.sdkConfig.mineableFactoryTimeout);
    this.blockchainService = new BlockchainService(this.provider);
    const blockNumberState = new BlockNumberState(this.blockchainService);
    this.walletEventsObserverFactory = new WalletEventsObserverFactory(this.blockchainService, blockNumberState, this.sdkConfig.storageService);
    this.balanceChecker = new BalanceChecker(this.provider);
    this.sufficientBalanceValidator = new SufficientBalanceValidator(this.provider);
    this.tokenDetailsService = new TokenDetailsService(this.provider, this.sdkConfig.saiTokenAddress);
    this.tokensDetailsStore = new TokensDetailsStore(this.tokenDetailsService, this.sdkConfig.observedTokensAddresses);
    this.priceObserver = new PriceObserver(this.tokensDetailsStore, this.sdkConfig.observedCurrencies, this.sdkConfig.priceObserverTick);
    this.gasPriceOracle = new GasPriceOracle();
    this.tokensValueConverter = new TokensValueConverter(this.sdkConfig.observedCurrencies);
    this.gasModeService = new GasModeService(this.tokensDetailsStore, this.gasPriceOracle, this.priceObserver);
    this.featureFlagsService = new FeatureFlagsService();
    this.messageConverter = new MessageConverter(this.blockchainService);
    const beta2Service = new Beta2Service(this.provider);
    const gnosisSafeService = new GnosisSafeService(this.provider);
    this.walletContractService = new WalletContractService(this.blockchainService, beta2Service, gnosisSafeService);
    this.relayerConfig = new Lazy(() => this.loadRelayerConfigFromApi());
  }

  private async loadRelayerConfigFromApi() {
    const config = await this.relayerApi.getConfig();
    if (!Network.equals(cast(config.chainSpec.name, asNetwork), this.sdkConfig.network)) {
      throw new Error(`Relayer is configured to a different network. Expected: ${this.sdkConfig.network}, got: ${config.chainSpec.name}`);
    }
    return config;
  }

  getNotice() {
    return `This is beta version running on ${this.sdkConfig.network}`;
  }

  getFutureWalletFactory() {
    this.getRelayerConfig();
    this.fetchFutureWalletFactory();
    return this.futureWalletFactory!;
  }

  createFutureWallet(ensName: string, gasPrice: string, gasToken: string): Promise<FutureWallet> {
    return this.getFutureWalletFactory().createNew(ensName, gasPrice, gasToken);
  }

  getMessageStatus(messageHash: string): Promise<MessageStatus> {
    return this.relayerApi.getStatus(messageHash);
  }

  getRelayerConfig(): PublicRelayerConfig {
    return this.relayerConfig.get();
  }

  fetchRelayerConfig(): Promise<PublicRelayerConfig> {
    return this.relayerConfig.load();
  }

  async fetchBalanceObserver(contractAddress: string) {
    if (this.balanceObserver) {
      return;
    }
    ensureNotFalsy(contractAddress, InvalidContract);
    ensureNotEmpty(this.sdkConfig, MissingConfiguration);

    await this.tokensDetailsStore.fetchTokensDetails();
    this.balanceObserver = new BalanceObserver(this.balanceChecker, contractAddress, this.tokensDetailsStore, this.sdkConfig.balanceObserverTick);
  }

  async fetchAggregateBalanceObserver(contractAddress: string) {
    if (this.aggregateBalanceObserver) {
      return;
    }
    await this.fetchBalanceObserver(contractAddress);
    this.aggregateBalanceObserver = new AggregateBalanceObserver(this.balanceObserver!, this.priceObserver, this.tokensValueConverter);
  }

  private fetchFutureWalletFactory() {
    const {supportedTokens, factoryAddress, contractWhiteList, chainSpec, ensRegistrar, walletContractAddress, relayerAddress} = this.getRelayerConfig();
    const futureWalletConfig = {supportedTokens, factoryAddress, contractWhiteList, chainSpec, walletContractAddress, relayerAddress};
    this.futureWalletFactory = this.futureWalletFactory || new FutureWalletFactory(
      futureWalletConfig,
      new ENSService(this.provider, futureWalletConfig.chainSpec.ensAddress, ensRegistrar),
      this,
    );
  }

  async getWalletContractAddress(ensName: string): Promise<string> {
    const walletContractAddress = await this.resolveName(ensName);
    ensureNotFalsy(walletContractAddress, InvalidENSRecord, ensName);
    ensure(await this.blockchainService.getCode(walletContractAddress) !== '0x', InvalidENSRecord, ensName);
    return walletContractAddress;
  }

  async walletContractExist(ensName: string) {
    const walletContractAddress = await this.resolveName(ensName);
    return !!(walletContractAddress && await this.blockchainService.getCode(walletContractAddress));
  }

  async resolveName(ensName: string): Promise<Nullable<string>> {
    const {chainSpec} = await this.fetchRelayerConfig();
    return resolveName(this.provider, chainSpec.ensAddress, ensName);
  }

  async connect(walletContractAddress: string) {
    const {publicKey, privateKey} = createKeyPair();
    await this.relayerApi.connect(walletContractAddress, publicKey, this.sdkConfig.applicationInfo);
    return {
      privateKey,
      securityCode: generateCode(publicKey),
    };
  }

  async denyRequests(contractAddress: string, privateKey: string) {
    const authorisationRequest = {contractAddress};
    await this.walletContractService.signRelayerRequest(privateKey, authorisationRequest);
    await this.relayerApi.denyConnection(authorisationRequest);
  }

  async cancelRequest(contractAddress: string, privateKey: string) {
    const authorisationRequest = {contractAddress};
    await this.walletContractService.signRelayerRequest(privateKey, authorisationRequest);
    return this.relayerApi.cancelConnection(authorisationRequest);
  }

  subscribe(eventType: WalletEventType, filter: WalletEventFilter, callback: WalletEventCallback) {
    ensure(['KeyAdded', 'KeyRemoved', 'AddedOwner', 'RemovedOwner'].includes(eventType), InvalidEvent, eventType);
    return this.walletEventsObserverFactory.subscribe(eventType, filter, callback);
  }

  async subscribeToBalances(contractAddress: string, callback: OnBalanceChange) {
    await this.fetchBalanceObserver(contractAddress);
    return this.balanceObserver!.subscribe(callback);
  }

  async subscribeToAggregatedBalance(contractAddress: string, callback: OnAggregatedBalanceChange) {
    await this.fetchAggregateBalanceObserver(contractAddress);
    return this.aggregateBalanceObserver!.subscribe(callback);
  }

  subscribeToPrices(callback: OnTokenPricesChange) {
    return this.priceObserver.subscribe(callback);
  }

  async subscribeAuthorisations(contractAddress: string, privateKey: string, callback: Function) {
    return this.authorisationsObserver.subscribe(
      await this.walletContractService.signRelayerRequest(privateKey, {contractAddress}),
      (notifications: Notification[]) => callback(addCodesToNotifications(notifications)),
    );
  }

  async getConnectedDevices(contractAddress: string, privateKey: string) {
    return this.relayerApi.getConnectedDevices(
      await this.walletContractService.signRelayerRequest(privateKey, {contractAddress}),
    );
  }

  getGasModes(): Promise<GasMode[]> {
    return this.gasModeService.getModes();
  }

  getNotifySdk(): INotifySdk {
    if (!this.notifySdk) {
      const relayerConfig = this.getRelayerConfig();
      this.notifySdk = NotifySdk.createForNetwork(
        this.sdkConfig.notifySdkApiKey,
        cast(relayerConfig.chainSpec.name, asNetwork),
      );
    }
    return this.notifySdk!;
  }

  async start() {
    await Promise.all([
      this.fetchRelayerConfig(),
      this.startBlockchainServices(),
    ]);
  }

  private async startBlockchainServices() {
    await this.walletEventsObserverFactory.start();
    await this.tokensDetailsStore.fetchTokensDetails();
  }

  stop() {
    this.walletEventsObserverFactory.stop();
  }

  async finalizeAndStop() {
    await this.walletEventsObserverFactory.finalizeAndStop();
  }
}

export default UniversalLoginSDK;
