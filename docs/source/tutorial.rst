.. _tutorial:

Tutorial
========

**This documentation is DEPRECATED.**

**Some descriptions might be invalid.**

.. _quickstart:

Quickstart
-----------

Starting with Web3 provider
^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you are developing a web application the easiest way to get started with Universal-Login is by using our Web3 provider.

Installation

  To add the provider to your project using npm type the following:
  ::

    npm i web3 @unilogin/web3 react react-dom

  If you are using yarn than type:
  ::

    yarn add @unilogin/web3 react react-dom

Creating the provider
  ::

    const ulProvider = ULWeb3Provider.getDefaultProvider('mainnet');
    const web3 = new Web3(ulProvider);

  Now you can continue writing your application as a normal Web3 DApp.
  To read more how to write web3 app go to `Web3 docs <https://web3js.readthedocs.io/>`_.

User onboarding
  First time you send a transaction the modal will appear asking users to create an account.
  After user finishes the onboarding flow the transaction will be executed as normal

  You can also trigger an early onboarding (for example if you have a "login" button on your website).
  To do so call the ``create`` on the provider:
  ::

    await ulProvider.create();

  The promise will be resolved once the user completes the flow.

Detecting Universal-Login
  To detect whether the web3 is running with UniversalLogin use the following code:
  ::

    const usingUniversalLogin = web3.currentProvider && web3.currentProvider.isUniLogin;

Starting with SDK
^^^^^^^^^^^^^^^^^

Installation
  To add the SDK to your project using npm type the following:
  ::

    npm i @unilogin/sdk

  If you are using yarn than type:
  ::

    yarn add @unilogin/sdk

.. _development_environment:

Development environment
^^^^^^^^^^^^^^^^^^^^^^^

Prerequisites
  Before running the development environment, make sure you have **PostgreSQL** installed, up and running.

Installation
  To use the development environment, you need to install ``@unilogin/ops`` as dev dependency to your project.

  With npm:

    ::

      npm install @unilogin/ops --save-dev

  With yarn:

    ::

      yarn add --dev @unilogin/ops -D

Adding a script
  The simplest way to use the development environment is to add a script to ``package.json`` file:

  ::

    ...
    "scripts": {
      ...
      "start:dev": "universal-login start:dev"
    }

Running development environment
  To start the development environment type in your console:

  ::

    yarn start:dev

Which will start the development environment. The output should look somewhat like this:

  ::

    Wallets:
      0x17ec8597ff92C3F44523bDc65BF0f1bE632917ff - 0x29f3edee0ad3abf8e2699402e0e28cd6492c9be7eaab00d732a791c33552f797
      0x63FC2aD3d021a4D7e64323529a55a9442C444dA0 - 0x5c8b9227cd5065c7e3f6b73826b8b42e198c4497f6688e3085d5ab3a6d520e74
      0xD1D84F0e28D6fedF03c73151f98dF95139700aa7 - 0x50c8b3fc81e908501c8cd0a60911633acaca1a567d1be8e769c5ae7007b34b23
      0xd59ca627Af68D29C547B91066297a7c469a7bF72 - 0x706618637b8ca922f6290ce1ecd4c31247e9ab75cf0530a0ac95c0332173d7c5
      0xc2FCc7Bcf743153C58Efd44E6E723E9819E9A10A - 0xe217d63f0be63e8d127815c7f26531e649204ab9486b134ec1a0ae9b0fee6bcf
      0x2ad611e02E4F7063F515C8f190E5728719937205 - 0x8101cca52cd2a6d8def002ffa2c606f05e109716522ca2440b2cc84e4d49700b
      0x5e8b3a7e6241CeE1f375924985F9c08706f41d34 - 0x837fd366bc7402b65311de9940de0d6c0ba3125629b8509aebbfb057ebeaaa25
      0xFC6F167a5AB77Fe53C4308a44d6893e8F2E54131 - 0xba35c32f7cbda6a6cedeea5f73ff928d1e41557eddfd457123f6426a43adb1e4
      0xDe41151d0762CB537921c99208c916f1cC7dA04D - 0x71f7818582e55456cb575eea3d0ce408dcf4cbbc3d845e86a7936d2f48f74035
      0x121199e18C70ac458958E8eB0BC97c0Ba0A36979 - 0x03c909455dcef4e1e981a21ffb14c1c51214906ce19e8e7541921b758221b5ae

    Node url (ganache): http://localhost:18545...
          ENS address: 0x67AC97e1088C332cBc7a7a9bAd8a4f7196D5a1Ce
    Registered domains: mylogin.eth, universal-id.eth, popularapp.eth
        Token address: 0x0E2365e86A50377c567E1a62CA473656f0029F1e
          Relayer url: http://localhost:3311



.. _using_sdk:

Using the SDK
-------------

Creating a wallet contract
^^^^^^^^^^^^^^^^^^^^^^^^^^

To start using the SDK you will need to create an SDK instance and deploy a wallet contract.
Below is a snippet doing precisely that for the development environment.

::

  import UniversalLoginSDK from '@unilogin/sdk';

  const universalLoginSDK = new UniversalLoginSDK('http://localhost:3311', 'http://localhost:18545');
  const [privateKey, contractAddress] = await sdk.create('myname.mylogin.eth');


The first argument of ``UniversalLoginSDK`` constructor is a relayer address, second is an Ethereum node address.

Sending a meta-transaction
^^^^^^^^^^^^^^^^^^^^^^^^^^
Once you have the contract wallet deployed you can execute a transaction via relayer:

::

  const message = {
    from: '0xA193E42526F1FEA8C99AF609dcEabf30C1c29fAA',
    to: '0xbA03ea3517ddcD75e38a65EDEB4dD4ae17D52A1A',
    data: '0x0',
    value: '500000000000000000',
    gasToken: '0x9f2990f93694B496F5EAc5822a45f9c642aaDB73',
    gasPrice: 1000000000,
    gasLimit: 1000000
  };

  await sdk.execute(message, privateKey);


Note: ``from`` field in this case is the contract address.

Most fields of the message are analogous to a normal Ethereum transaction, except for ``gasToken``,
which allows to specify the token in which transaction cost will be refunded.

The token need to be supported by a relayer.
The wallet contact needs to have enough token balance to refund the transaction.

A detailed explanation of each method can be found in subsections of the :ref:`SDK documentation<sdk>`: :ref:`creating SDK<sdk_create>`, :ref:`creating wallet contract<sdk_create_contract>` and :ref:`execute<sdk_execute>`.


.. _sdk_example_testnet:


Connecting to an existing app on testnet
----------------------------------------

Create a wallet contract
^^^^^^^^^^^^^^^^^^^^^^^^

Create your own wallet contract using `Universal Login Wallet <https://wallet.universallogin.io/>`_ and get your contract address.

Create UniversalLoginSDK
^^^^^^^^^^^^^^^^^^^^^^^^

In your project, create the UniversalLoginSDK
::

  import UniversalLoginSDK from '@unilogin/sdk';
  import ethers from 'ethers';


  const relayerUrl = 'https://relayer-mainnet.universallogin.io';
  const jsonRpcUrl = 'https://mainnet.infura.io';

  const universalLoginSDK = new UniversalLoginSDK(relayerUrl, jsonRpcUrl);

Start listening for events
^^^^^^^^^^^^^^^^^^^^^^^^^^

Then make UniversalLoginSDK start listening for relayer and blockchain events
::

  sdk.start();

Request a connection
^^^^^^^^^^^^^^^^^^^^

Now, you can request a connection to the created wallet contract
::

  const privateKey = await sdk.connect('YOUR_CONTRACT_ADDRESS');

Subscribe to KeyAdded
^^^^^^^^^^^^^^^^^^^^^

Subscribe to ``KeyAdded`` event with your new key filter
::

  const key = new ethers.Wallet(privateKey).address;
  const filter =
    {
      contractAddress: 'YOUR_CONTRACT_ADDRESS',
      key
    };

  const subscription = sdk.subscribe(
    'KeyAdded',
    filter,
    (keyInfo) =>
      {
        console.log(`${keyInfo.key} now has permission to manage wallet contract`);
      });

Accept a connection request
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Accept a connection request in Universal Login Example App. After that your newly created key has a permission to manage your wallet contract.

Stop listening for events
^^^^^^^^^^^^^^^^^^^^^^^^^

Remember to stop listening for relayer and blockchain events
::

  sdk.stop();


.. _helpers:

Helpers
-------

Prerequisites
^^^^^^^^^^^^^

Install the universal-login toolkit:

::

  yarn global add @unilogin/ops

Test token
^^^^^^^^^^

To deploy a test token use the ``deploy:token`` script
``universal-login deploy:token --nodeUrl [url] --privateKey [privateKey]``

Example:

::

  universal-login deploy:token --nodeUrl http://localhost:18545 --privateKey 0x29f3edee0ad3abf8e2699402e0e28cd6492c9be7eaab00d732a791c33552f797


Sending funds
^^^^^^^^^^^^^

To send funds to an address use the ``send`` script
``universal-login send [to] [amount] [currency] --nodeUrl [url] --privateKey [privateKey]``

Parameters:
  - **to** - the address to send funds to
  - **amount** - the amount to send
  - **currency** - the currency of transfer
  - **nodeUrl** (optional) - JSON-RPC URL of an Ethereum node, set to ``http://localhost:18545`` by default
  - **privateKey** (optional) - the private key of a wallet with additional balance, set to ``DEV_DEFAULT_PRIVATE_KEY`` by default which corresponds to a wallet that has enough ethers


Example:

::

  universal-login send 0xA193E42526F1FEA8C99AF609dcEabf30C1c29fAA 4 ETH




.. _ens-registration:

ENS registration
----------------

To use Universal Login with your own ENS domain, you will need to register it, connect to the resolver and deploy your own registrar. There is a script for that.

`Note:` the script currently works only for ``.test`` domains. Tested on the Rinkeby and the Ropsten test networks.

You can register the domain in two ways: from command line and programmatically.
To use a registered domain in your relayer, type its name in relayer config.


From command line
^^^^^^^^^^^^^^^^^


To register an **.eth** ENS domain type in the console:

  ::

    universal-login register:eth:domain [my-domain] --ensAddress [ensAddress] --privateKey [privateKey] --nodeUrl [url] --gasPrice [gasPrice]

Parameters:
  - **my-domain** - a domain to register
  - **ensAddress** : string - the address of an ENS contract ([list of ENS addresses](https://docs.ens.domains/ens-deployments) on public networks)
  - **privateKey** : string - private key to execute registrations. `Note:` You need to have ether on it to pay for contracts deployment.
  - **nodeUrl** : string - JSON-RPC URL of an Ethereum node
  - **gasPrice** : string `optional` - gas price of transactions, default gas price value is 9 gwei

  To register `cool-domain.eth` (each transaction's gasPrice set to 11 gwei):

  ::

    universal-login register:eth:domain cool-domain --ensAddress 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e --privateKey 'YOUR_PRIVATE_KEY' --nodeUrl 'https://mainnet.infura.io' --gasPrice 11000000000

  Result:

  ::

    Registering cool-domain.eth...
    New public resolver deployed: 0x75242e98198486fe0307e5ee307f340Af5c950a4
    Resolver for cool-domain.eth set to 0x75242e98198486fe0307e5ee307f340Af5c950a4 (public resolver)
    New registrar deployed: 0x09873b81932b7726595b86Fe8612c82e65bdB9Fe
    cool-domain.eth owner set to: 0x09873b81932b7726595b86Fe8612c82e65bdB9Fe (registrar)


Note: You must be the owner of the domain that means you need to buy it. You can buy an ENS domain for example `here<https://ethsimple.com/>`_




To register an **.test** ENS domain type in the console:

  ::

    universal-login register:test:domain [my-domain] [publicResolverAddress] --ensAddress [ensAddress] --privateKey [privateKey] --nodeUrl [url]

Parameters:
  - **my-domain** - a domain to register
  - **publicResolverAddress** : string - the address of a public resolver. For the Mainnet a working public resolver address is ``0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41``.
  - **ensAddress** : string - the address of an ENS contract (`list of ENS addresses<https://docs.ens.domains/ens-deployments>`_ on public networks)
  - **privateKey** : string - private key to execute registrations. `Note:` You need to have ether on it to pay for contracts deployment.
  - **nodeUrl** : string - JSON-RPC URL of an Ethereum node

  To register `cool-domain.test` on a test network that supports registration of test domains (e.g. Ropsten, Rinkeby, Görli) and connect it to resolver at address `0x4C641FB9BAd9b60EF180c31F56051cE826d21A9A` type following:

  ::

    universal-login register:test:domain cool-domain 0x4C641FB9BAd9b60EF180c31F56051cE826d21A9A --ensAddress 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e --privateKey 'YOUR_PRIVATE_KEY' --nodeUrl 'https://ropsten.infura.io'

  Result:

  ::

    Registering cool-domain.test...
    Registrar address for test: 0x21397c1A1F4aCD9132fE36Df011610564b87E24b
    Registered cool-domain.test with owner: 0xf4C1A210B6436eEe17fDEe880206E9d3Ab178c18
    Resolver for cool-domain.test set to 0x4C641FB9BAd9b60EF180c31F56051cE826d21A9A (public resolver)
    New registrar deployed: 0xf1Af1CCEEC4464212Fc7b790c205ca3b8E74ba67
    cool-domain.test owner set to: 0xf1Af1CCEEC4464212Fc7b790c205ca3b8E74ba67 (registrar)


Note: use ``.test`` tld only on testnets.


Programmatically
^^^^^^^^^^^^^^^^

To register your own ENS domain programmatically, you should use DomainRegistrar.

**new DomainRegistrar(config)**
  creates DomainRegistrar.

  Parameters:
    - **ensInfo** : object - required informations about ENS:

      - **ensAddress** : string - the address of an ENS contract
      - **publicResolverAddress** : string - the address of a public resolver
    - **wallet** : ethers.Wallet - instance of ethers Wallet connected to the specific network
  Returns:
    DomainRegistrar instance

  Example:
    ::

      import {providers, Wallet} from 'ethers';

      const ensInfo = {
        ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        publicResolverAddress: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
      };
      const provider = new providers.JsonRpcProvider('https://mainnet.infura.io');
      const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

      const registrar = new DomainRegistrar(ensInfo, wallet);

**registrar.registerAndSave(domain, tld)**
  registers a new domain and saves all information about newly registered domain to a new file (a registrar address or resolver address)

  Parameters:
    - **domain** : string - a domain to register
    - **tld** : string - a top level domain, for example: ``eth`` or on testnets: ``test``

  Example:
    ::

      registrar.registerAndSave('new-domain', 'test');

  Result:
    file named ``extra-domain.test_info`` that includes:
    ::

        DOMAIN='extra-domain.test'
        PUBLIC_RESOLVER_ADDRESS='0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
        REGISTRAR_ADDRESS='0xEe0b357352C7Ba455EFD0E20d192bC44F1Bf8d22'

