import {SignedMessage, IMessageValidator} from '@unilogin/commons';

export class ComposeValidator implements IMessageValidator {
  constructor(private validators: Array<IMessageValidator>) {}

  async validate(signedMessage: SignedMessage) {
    for (let i = 0; i < this.validators.length; i++) {
      await this.validators[i].validate(signedMessage);
    }
  }
}
