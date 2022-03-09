import { log } from "@graphprotocol/graph-ts";

import { SummonBaal } from "../generated/BaalSummoner/BaalSummoner";
import { BaalTemplate } from "../generated/templates";
import { Dao } from "../generated/schema";
import { addTransaction } from "./util/transactions";

// emit SummonBaal(
//   address(_baal),
//   address(_baal.lootToken()),
//   address(_safe)
// );
export function handleSummonBaal(event: SummonBaal): void {
  BaalTemplate.create(event.params.baal);

  let daoId = event.params.baal.toHexString();

  let dao = new Dao(daoId);

  if (dao === null) {
    return;
  }

  log.info("event.transaction.from", [event.transaction.from.toHexString()]);
  // log.info("event.transaction.to", [event.transaction.to.toHexString()]);
  log.info("event.address", [event.address.toHexString()]);

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params.baal;
  dao.transactionHash = event.transaction.hash;
  dao.lootAddress = event.params.loot;
  dao.safeAddress = event.params.safe;

  dao.save();

  addTransaction(event.block, event.transaction);
}
