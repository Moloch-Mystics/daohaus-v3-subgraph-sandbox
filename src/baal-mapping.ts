import { log } from "@graphprotocol/graph-ts";
import { Dao } from "../generated/schema";

import { SetupComplete } from "../generated/templates/BaalTemplate/Baal";
import { addTransaction } from "./util/transactions";

export function handleSetupComplete(event: SetupComplete): void {
  let daoId = event.address.toHexString();

  let dao = Dao.load(daoId);
  if (dao === null) {
    log.info("---no dao entity, {}", [daoId]);
    return;
  }

  dao.lootPaused = event.params.lootPaused;
  dao.sharesPaused = event.params.sharesPaused;
  dao.gracePeriod = event.params.gracePeriod;
  dao.votingPeriod = event.params.votingPeriod;
  dao.proposalOffering = event.params.proposalOffering;
  dao.quorumPercent = event.params.quorumPercent;
  dao.sponsorThreshold = event.params.sponsorThreshold;
  dao.minRetentionPercent = event.params.minRetentionPercent;
  dao.shareTokenName = event.params.name;
  dao.shareTokenSymbol = event.params.symbol;
  dao.totalShares = event.params.totalShares;
  dao.totalLoot = event.params.totalLoot;

  dao.save();

  addTransaction(event.block, event.transaction);
}

// TransferLoot (index_topic_1 address from, index_topic_2 address to, uint256 amount)
// Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
// DelegateVotesChanged (index_topic_1 address delegate, uint256 previousBalance, uint256 newBalance)
// ShamanSet (index_topic_1 address shaman, uint256 permission)
// GovernanceConfigSet (uint32 voting, uint32 grace, uint256 newOffering, uint256 quorum, uint256 sponsor, uint256 minRetention)
// LootPaused (bool paused)
// SharesPaused (bool paused)
// OwnershipTransferred (index_topic_1 address previousOwner, index_topic_2 address newOwner)
// why twice - once from summoner to safe and once from 0x0 to safe
