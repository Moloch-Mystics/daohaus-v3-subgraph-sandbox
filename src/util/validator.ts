import { Address } from "@graphprotocol/graph-ts";
// import { constants } from "./constants";

export namespace validator {
  export function isSummoner(
    daoAddress: string,
    senderAddress: Address | null
  ): boolean {
    if (senderAddress === null) {
      return false;
    }
    // let address = changetype<Address>(senderAddress);
    // let minionContract = Minion.bind(address);

    // let result = minionContract.try_moloch();
    // if (result.reverted) {
    //   // log.info("^^^^^ minion call failed; {}", [senderAddress.toHexString()]);
    //   return false;
    // }

    // log.info("^^^^^ comparing; {} with {}", [
    //   result.value.toHexString(),
    //   molochAddress,
    // ]);

    // return result.value.toHexString() == molochAddress;

    // WHO IS SENDER AND HOW TO CHECK SUMMONER ADDRESS

    return true;
  }
}
