export async function handle(state, action) {
  const input = action.input;

  const list = state.list;
  const everfinance_nft_auctions = state.everfinance_nft_auctions;
  const signatures = state.signatures;
  const verification_message = state.verification_message;
  const evm_molecule_endpoint = state.evm_molecule_endpoint;
  const arweave_addresses = state.arweave_addresses;
  const admin_address = state.admin_address;

  if (input.function === "apply") {
    const arweave_address = input.arweave_address;
    const caller = input.caller;
    const signature = input.signature;

    _validateArweaveAddress(arweave_address);
    ContractAssert(state.is_active, "ERROR_CONTRACT_PAUSED");
    ContractAssert(
      !list.map((addr) => addr.evm).includes(caller),
      "ERROR_ALREADY_WHITELISTED"
    );
    ContractAssert(
      !list.map((addr) => addr.arweave).includes(caller),
      "ERROR_ALREADY_WHITELISTED"
    );

    await _moleculeSignatureVerification(caller, signature);

    const IS_EVERPAY_WINNER = everfinance_nft_auctions.includes(caller); // check 1
    const IS_ARNS_OWNER = await _getArnsRecord(arweave_address, caller); // check 2
    const IS_ARK_NFT_HOLDER = await _isArkNftHolder(caller); // check 3

    ContractAssert(
      IS_ARK_NFT_HOLDER || IS_EVERPAY_WINNER || IS_ARNS_OWNER,
      "ERROR_CANNOT_WL_USER"
    );

    list.push({
      evm: caller,
      arweave: arweave_address,
      results: { IS_ARK_NFT_HOLDER, IS_ARNS_OWNER, IS_EVERPAY_WINNER },
    });

    arweave_addresses.push(arweave_address);

    return {
      state,
      result: { IS_ARK_NFT_HOLDER, IS_ARNS_OWNER, IS_EVERPAY_WINNER },
    };
  }

  if (input.function === "pauseContract") {
    const { caller, signature } = input;
    ContractAssert(admin_address === caller, "ERROR_INVALID_CALLER");
    await _moleculeSignatureVerification(caller, signature);
    state.is_active = false;
    return { state };
  }

  if (input.function === "adminAddAddress") {
    const { caller, signature, address } = input;
    _validateArweaveAddress(address);
    ContractAssert(!arweave_addresses.includes(address), "ERROR_ADDRESS_ADDED");
    ContractAssert(admin_address === caller, "ERROR_INVALID_CALLER");
    await _moleculeSignatureVerification(caller, signature);
    state.arweave_addresses.push(address);

    return { state };
  }

  function _validateArweaveAddress(address) {
    ContractAssert(
      /[a-z0-9_-]{43}/i.test(address),
      "ERROR_INVALID_ARWEAVE_ADDRESS"
    );
  }

  async function _getArnsRecord(arweave_address, evm_address) {
    try {
      const req = await EXM.deterministicFetch(
        `https://ark-core.decent.land/v2/domains/arweave/${arweave_address}`
      );

      const arkConnection = await EXM.deterministicFetch(
        `https://ark-core.decent.land/v2/address/resolve/${evm_address}`
      );

      const arns = req.asJSON()?.ARNS;
      const ark_ar_address = arkConnection.asJSON()?.arweave_address;

      return (
        arns && ark_ar_address.toLowerCase() === arweave_address.toLowerCase()
      );
    } catch (error) {
      throw new ContractError("molecule res error");
    }
  }

  async function _isArkNftHolder(evm_address) {
    try {
      const req = await EXM.deterministicFetch(
        `https://molecule-apis-wrapper.herokuapp.com/ark-collection`
      );
      const state = req.asJSON()?.result;
      const isOwner = state
        .map((obj) => obj.owner_of.toLowerCase())
        .includes(evm_address.toLowerCase());
      return isOwner;
    } catch (error) {
      throw new ContractError("molecule res error");
    }
  }

  async function _moleculeSignatureVerification(caller, signature) {
    try {
      ContractAssert(
        !signatures.includes(signature),
        "error signed message used"
      );
      const message = btoa(verification_message);
      const isValid = await EXM.deterministicFetch(
        `${evm_molecule_endpoint}/signer/${caller}/${message}/${signature}`
      );
      ContractAssert(isValid.asJSON()?.result, "unauthorized caller");
      signatures.push(signature);
    } catch (error) {
      throw new ContractError("molecule res error");
    }
  }
}
