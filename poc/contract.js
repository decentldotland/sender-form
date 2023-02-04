export async function handle(state, action) {
  const input = action.input;

  const list = state.list;
  const everfinance_nft_auctions = state.everfinance_nft_auctions;
  const signatures = state.signatures;
  const verification_message = state.verification_message;
  const evm_molecule_endpoint = state.evm_molecule_endpoint;

  if (input.function === "apply") {
    const arweave_address = input.arweave_address;
    const caller = input.caller;
    const signature = input.signature;

    ContractAssert(!list.map((addr) => addr.evm).includes(caller), "ERROR_ALREADY_WHITELISTED");
    ContractAssert(!list.map((addr) => addr.arweave).includes(caller), "ERROR_ALREADY_WHITELISTED");

    ContractAssert(
      !signatures.includes(signature),
      "error signed message used"
    );

    const message = btoa(verification_message);
    await _moleculeSignatureVerification(caller, message, signature);

    const IS_EVERPAY_WINNER = everfinance_nft_auctions.includes(caller); // check 1
    const IS_ARNS_OWNER = await _getArnsRecord(arweave_address, caller); // check 2
    const IS_ARK_NFT_HOLDER = await _isArkNftHolder(caller); // check 3

    ContractAssert(IS_ARK_NFT_HOLDER || IS_EVERPAY_WINNER || IS_ARNS_OWNER, "ERROR_CANNOT_WL_USER");

    signatures.push(signature);
    
    list.push({
      evm: caller,
      arweave: arweave_address,
      results:{IS_ARK_NFT_HOLDER, IS_ARNS_OWNER, IS_EVERPAY_WINNER}
    });

    return {
      state, 
      result: {IS_ARK_NFT_HOLDER, IS_ARNS_OWNER, IS_EVERPAY_WINNER}
    }
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
      
      return arns  && ark_ar_address.toLowerCase() === arweave_address.toLowerCase()

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
      const isOwner = state.map((obj) => obj.owner_of.toLowerCase()).includes(evm_address.toLowerCase());
      return isOwner; 

    } catch (error) {
      throw new ContractError("molecule res error");
    }
  }

  async function _moleculeSignatureVerification(caller, message, signature) {
    try {
      const isValid = await EXM.deterministicFetch(
        `${evm_molecule_endpoint}/signer/${caller}/${message}/${signature}`
      );
      ContractAssert(isValid.asJSON()?.result, "unauthorized caller");
    } catch (error) {
      throw new ContractError("molecule res error");
    }
  }
}
