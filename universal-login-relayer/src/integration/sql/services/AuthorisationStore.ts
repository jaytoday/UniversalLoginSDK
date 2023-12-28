import Knex from 'knex';
import {AddAuthorisationRequest} from '../../../core/models/AddAuthorisationRequest';

class AuthorisationStore {
  constructor(private database: Knex) {}

  addRequest(request: AddAuthorisationRequest) {
    const {walletContractAddress, key, deviceInfo} = request;
    return this.database.insert({walletContractAddress, key, deviceInfo})
      .into('authorisations')
      .returning('id');
  }

  getPendingAuthorisations(walletContractAddress: string) {
    return this.database('authorisations')
      .where({walletContractAddress})
      .select();
  }

  get(contractAddress: string, key: string) {
    return this.database('authorisations')
      .where({
        walletContractAddress: contractAddress,
        key,
      })
      .select('key', 'walletContractAddress', 'deviceInfo')
      .first();
  }

  async removeRequest(contractAddress: string, key: string): Promise<number> {
    return this.database('authorisations')
      .where('walletContractAddress', contractAddress)
      .where('key', key)
      .del();
  }

  removeRequests(contractAddress: string) {
    return this.database('authorisations')
      .where('walletContractAddress', contractAddress)
      .del();
  }
}

export default AuthorisationStore;
