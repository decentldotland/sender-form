<p align="center">
  <a href="http://sender.gg">
    <img src="https://raw.githubusercontent.com/decentldotland/sender-protocol/main/img/sender.png" height="275">
  </a>
  <h3 align="center"><code>@decentdotland/sender-form</code></h3>
  <p align="center">multichain and token-gated DeForm protocol</p>
</p>

## Synopsis

Sender-Form is a token-gated web3 form protocol that operates on multiple blockchain networks. It requires users to hold a specific token in order to access and fill forms. This adds a layer of security and incentivizes users to participate in the network. Sender-Form provides an efficient way to gather data while ensuring the authenticity, accuracy of responses and user's anonymity.

## Tech-Stack

Sender-Form protocol smart contracts will be serverless functions deployed on the [EXM protocol](https://exm.dev). The protocol contracts will use [molecule.sh](https://molecule.sh/) molecules to facilitate multichain gasless user's authentication (through EOAs).

## Proof of Concept
The first proof of concept (PoC) for Sender-Form is a whitelisting form for ANS Protocol. The whitelist contract includes various conditional checks to validate the validity of the user and ensure the submission of a valid Arweave address for whitelisting. [source code](./poc) | [contract address](https://zxcPHmIeSYqF2dQstdIdDFcY9lTqhKQ0e8XTrrVuOIA.exm.run)

## License 
This project is licensed under the [MIT License](./LICENSE)
