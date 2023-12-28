import {WalletSuggestionAction, WALLET_SUGGESTION_ALL_ACTIONS} from '../models/WalletSuggestionAction';
import {isValidEnsNameElement} from '../utils/ens';

export interface WalletExistenceVerifier {
  walletContractExist(domain: string): Promise<boolean>;
}

const ensDomains = ['mylogin.eth'];

export class SuggestionsService {
  constructor(
    private sdk: WalletExistenceVerifier,
    private domains: string[] = ensDomains,
    private actions: WalletSuggestionAction[] = WALLET_SUGGESTION_ALL_ACTIONS,
  ) {}

  isCorrectDomainPrefix(domain: string) {
    return this.domains
      .filter((element: string) => element.startsWith(domain))
      .length > 0;
  }

  isCorrectTld(tld: string) {
    return 'test'.startsWith(tld) || 'eth'.startsWith(tld) || 'xyz'.startsWith(tld);
  }

  isCorrectPrefix(prefix: string) {
    const splitted = prefix.split('.');
    if (splitted.length === 0 || splitted.length > 3) {
      return false;
    }
    if (!isValidEnsNameElement(splitted[0])) {
      return false;
    }
    if (splitted.length > 1 && splitted[1] !== '' && !isValidEnsNameElement(splitted[1])) {
      return this.isCorrectDomainPrefix(splitted[1]);
    }
    if (splitted.length > 2) {
      return (splitted[1].length === 0) ? false : this.isCorrectTld(splitted[2]);
    }
    return true;
  }

  private includeCreates() {
    return this.actions.includes(WalletSuggestionAction.create);
  }

  private includeConnections() {
    return this.actions.includes(WalletSuggestionAction.connect);
  }

  async splitByExistence(domains: string[]) {
    const connections = [];
    const creations = [];
    for (const domain of domains) {
      if (await this.sdk.walletContractExist(domain)) {
        this.includeConnections() && connections.push(domain);
      } else {
        this.includeCreates() && creations.push(domain);
      }
    }
    return {connections, creations};
  }

  async getSuggestionsForNodePrefix(nodePrefix: string) {
    const domains = this.domains
      .map((domain) => `${nodePrefix}.${domain}`);
    return this.splitByExistence(domains);
  }

  async getSuggestionsForNodeAndSldPrefix(node: string, sldPrefix: string) {
    const domains = this.domains
      .filter((domain) => domain.startsWith(sldPrefix))
      .map((domain) => `${node}.${domain}`);
    return this.splitByExistence(domains);
  }

  async getSuggestions(namePrefix: string) {
    const splitted = namePrefix.split('.');
    const [name, domain, tld] = splitted;
    if (!this.isCorrectPrefix(namePrefix)) {
      return {connections: [], creations: []};
    }
    if (splitted.length === 1) {
      return this.getSuggestionsForNodePrefix(namePrefix);
    } else if (splitted.length === 2) {
      return this.isCorrectDomainPrefix(domain)
        ? this.getSuggestionsForNodeAndSldPrefix(name, domain)
        : {connections: [], creations: []};
    } else if (splitted.length === 3) {
      if (!this.isCorrectDomainPrefix(`${domain}.`)) {
        return {connections: [], creations: []};
      } else if (this.isCorrectTld(tld)) {
        if (tld.length < 3) {
          return this.getSuggestionsForNodeAndSldPrefix(name, domain);
        }
        return (await this.sdk.walletContractExist(namePrefix))
          ? {connections: [namePrefix], creations: []}
          : {connections: [], creations: [namePrefix]};
      }
    }
  }
}
