import {ObservedCurrency, TokensPrices, CurrencyToValue} from '../models/CurrencyData';
import {TokenDetailsWithBalance} from '../models/TokenData';
import {safeMultiplyAndFormatEther} from '../utils/safeMultiply';

export class TokensValueConverter {
  constructor(private observedCurrencies: ObservedCurrency[]) {}

  getTotal(tokensDetailsWithBalance: TokenDetailsWithBalance[], tokensPrices: TokensPrices) {
    const tokensTotalWorth = this.getTokensTotalWorth(tokensDetailsWithBalance, tokensPrices);
    return tokensTotalWorth.reduce(
      (tokensTotal, tokenTotal) => this.addBalances(tokensTotal, tokenTotal),
      this.getZeroedBalances(),
    );
  }

  getTokensTotalWorth(tokensDetailsWithBalance: TokenDetailsWithBalance[], tokensPrices: TokensPrices) {
    return tokensDetailsWithBalance.map((token) => this.getTokenTotalWorth(token, tokensPrices[token.symbol]));
  }

  getTokenTotalWorth(token: TokenDetailsWithBalance, tokenPrices: CurrencyToValue) {
    const tokenValues = {} as CurrencyToValue;
    for (const symbol in tokenPrices) {
      tokenValues[symbol as ObservedCurrency] = Number(safeMultiplyAndFormatEther(token.balance, tokenPrices[symbol as ObservedCurrency], token.decimals));
    }
    return tokenValues;
  }

  addBalances(totalBalances: CurrencyToValue, toAddBalances: CurrencyToValue) {
    for (const key in totalBalances) {
      if (key in toAddBalances && typeof toAddBalances[key as ObservedCurrency] === 'number') {
        totalBalances[key as ObservedCurrency] += toAddBalances[key as ObservedCurrency];
      }
    }
    return totalBalances;
  }

  getZeroedBalances() {
    const zeroBalances = {} as CurrencyToValue;
    for (const symbol of this.observedCurrencies) {
      zeroBalances[symbol] = 0;
    }
    return zeroBalances;
  }
}
