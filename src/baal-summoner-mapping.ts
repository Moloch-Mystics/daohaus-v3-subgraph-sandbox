import { log } from "@graphprotocol/graph-ts";

import { SummonBaal } from "../generated/BaalSummoner/BaalSummoner";
import { BaalTemplate } from "../generated/templates";
import { Dao } from "../generated/schema";
import { addTransactionWithDao } from "./util/transactions";

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

  dao.createdAt = event.block.timestamp.toString();
  dao.daoAddress = event.params.baal;
  dao.transactionHashSummon = event.transaction.hash;
  dao.lootAddress = event.params.loot;
  dao.safeAddress = event.params.safe;

  dao.save();

  // TODO: do we need withDao anymore?
  addTransactionWithDao(event.block, event.transaction, event.params.baal);
}
