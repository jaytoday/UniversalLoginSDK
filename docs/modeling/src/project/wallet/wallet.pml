@startuml

title Wallet


package UserInterface {
  package Home {
    class Balance {
      balance
    }

    class HomeScreen {

    }
  }

  package Login {
    class ApproveScreen {

    }
    class Login {
      onCreateClick()
      onConnectionClick()
    }

    class RecoveryScreen {

    }

    class Spinner {

    }

    class Suggestions {
      getSuggestionsItems()
    }

    class TransferringFundsScreen {

    }

    class WalletSelector {
      busy
      connections
      creations
    }
  }
}

package Core {
  class TransferService {
    transfer(details)
  }

  package ValueObject {
    class TransferDetails {

    }
  }

  class BalanceService {
    loop()
    subscribe(callback)
  }


  package app {
    class ModalService {
      subscribe(callback)
    }
  }

  package commons {
    class DebouncedSuggestionsService {

    }
    class SuggestionsService {

    }

  }

  class NotificationsService {
    subscribe()
    reject()
    confirm()
  }

}

package Integration {
  class SDK {

  }

  class EtherBalanceService {
    getBalance()
  }

  class ConnectToWallet {
    connectToWallet()
  }

  class Creation {
    createWallet(ensName)
  }


  class TokenService {
    tokenDetails: TokenDetails[]
    start()
    getTokenAddress()
    provider
  }

  class WalletService {
    userWallet: UserWallet
    walletDeployed(): boolean
    isAuthorized(): boolean
    disconnect(): void
  }

}


HomeScreen --|> Balance


Balance --|> BalanceService

ApproveScreen --|> WalletService
ApproveScreen --|> Spinner

Login --|> Creation
Login --|> BalanceService
Login --|> ConnectToWallet
Login --|> WalletSelector

TransferringFundsScreen --|> Spinner


WalletSelector --|> DebouncedSuggestionsService
WalletSelector --|> Suggestions

BalanceService --|> EtherBalanceService

EtherBalanceService --|> WalletService

ConnectToWallet --|> WalletService
ConnectToWallet --|> SDK

Creation --|> WalletService
Creation --|> SDK

TransferService --|> TokenService
TransferService --|> WalletService

TransferService --|> SDK

DebouncedSuggestionsService --|> SDK
DebouncedSuggestionsService --|> SuggestionsService


@enduml