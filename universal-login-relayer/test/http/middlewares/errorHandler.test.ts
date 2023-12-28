import {getCodeForException} from '../../../src/http/middlewares/errorHandler';
import {expect} from 'chai';
import {InvalidTransaction, NotEnoughSignatures, InvalidMessage, NotFound, ValidationFailed, PaymentError, Conflict, InvalidSignature, InvalidENSDomain, NotEnoughGas, NotEnoughBalance, DuplicatedSignature, DuplicatedExecution} from '../../../src/core/utils/errors';
import {InvalidContract, NotEnoughTokens} from '@unilogin/commons';

describe('UNIT: Error Handler', () => {
  describe('getCodeForException', () => {
    it('general exceptions', () => {
      expect(getCodeForException(new ValidationFailed('msg', 'NotFound'))).to.eq(400);
      expect(getCodeForException(new PaymentError('msg', 'NotFound'))).to.eq(402);
      expect(getCodeForException(new NotFound('msg', 'NotFound'))).to.eq(404);
      expect(getCodeForException(new Conflict('msg', 'NotFound'))).to.eq(409);
    });

    it('specific exceptions', () => {
      expect(getCodeForException(new InvalidSignature())).to.eq(400);
      expect(getCodeForException(new InvalidContract('0x0'))).to.eq(400);
      expect(getCodeForException(new InvalidTransaction('0x0'))).to.eq(400);
      expect(getCodeForException(new NotEnoughSignatures(3, 2))).to.eq(400);
      expect(getCodeForException(new InvalidMessage('0x0'))).to.eq(404);
      expect(getCodeForException(new InvalidENSDomain('domain'))).to.eq(404);
      expect(getCodeForException(new NotEnoughGas())).to.eq(402);
      expect(getCodeForException(new NotEnoughBalance())).to.eq(402);
      expect(getCodeForException(new NotEnoughTokens())).to.eq(402);
      expect(getCodeForException(new DuplicatedSignature())).to.eq(409);
      expect(getCodeForException(new DuplicatedExecution())).to.eq(409);
    });

    it('other exceptions', () => {
      expect(getCodeForException(new Error('msg'))).to.eq(500);
    });
  });
});
