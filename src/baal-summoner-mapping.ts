import { log } from "@graphprotocol/graph-ts";

import { SummonBaal } from "../generated/BaalSummoner/BaalSummoner";
import { BaalTemplate } from "../generated/templates";
import { MemberUri } from "../generated/schema";
// import { addTransaction } from "./util/transactions";
import { constants } from "./util/constants";

export function handleSummonBaal(event: SummonBaal): void {
  BaalTemplate.create(event.params.baal);

  let daoId = event.params.baal.toHexString();
  let memberUri = new MemberUri(daoId);
  if (memberUri === null) {
    return;
  }
  memberUri.save();
}
