import { BigInt, log } from "@graphprotocol/graph-ts";
import { Dao, Member } from "../generated/schema";

import {
  SetupComplete,
  Transfer,
  TransferLoot,
} from "../generated/templates/BaalTemplate/Baal";
import { constants } from "./util/constants";
import { addTransaction } from "./util/transactions";

function burnShares(event: Transfer, dao: Dao, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    log.info("burn member not found", []);
  } else {
    member.shares = member.shares.minus(event.params.amount);
    dao.totalShares = dao.totalShares.minus(event.params.amount);

    member.save();
    dao.save();
  }
}

function mintShares(event: Transfer, dao: Dao, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.dao = event.address.toHexString();
    member.memberAddress = event.params.to;
    member.shares = constants.BIGINT_ZERO;
    member.loot = constants.BIGINT_ZERO;
  }

  member.shares = member.shares.plus(event.params.amount);
  dao.totalShares = dao.totalShares.plus(event.params.amount);

  member.save();
  dao.save();
}

function burnLoot(event: TransferLoot, dao: Dao, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    log.info("burn member not found", []);
  } else {
    member.loot = member.loot.minus(event.params.amount);
    dao.totalLoot = dao.totalLoot.minus(event.params.amount);

    member.save();
    dao.save();
  }
}

function mintLoot(event: TransferLoot, dao: Dao, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.dao = event.address.toHexString();
    member.memberAddress = event.params.to;
    member.shares = constants.BIGINT_ZERO;
    member.loot = constants.BIGINT_ZERO;
  }

  member.loot = member.loot.plus(event.params.amount);
  dao.totalLoot = dao.totalLoot.plus(event.params.amount);

  member.save();
  dao.save();
}

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
}

// Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
export function handleTransfer(event: Transfer): void {
  log.info("handleTransfer, to: {}, from: {}, address: {}", [
    event.params.to.toHexString(),
    event.params.from.toHexString(),
    event.address.toHexString(),
  ]);

  let dao = Dao.load(event.address.toHexString());
  if (dao === null) {
    return;
  }

  //if from zero address it mints to a member
  if (event.params.from.toHexString() === constants.ADDRESS_ZERO) {
    let memberId = event.params.from
      .toHexString()
      .concat("-member-")
      .concat(event.address.toHexString());

    mintShares(event, dao, memberId);
    return;
  }

  //if to baal it burns from member
  if (event.params.to === event.address) {
    let memberId = event.params.from
      .toHexString()
      .concat("-member-")
      .concat(event.address.toHexString());

    burnShares(event, dao, memberId);
    return;
  }

  //if member to member it transfers (add/subtract)
  let burnMemberId = event.params.from
    .toHexString()
    .concat("-member-")
    .concat(event.address.toHexString());

  let mintMemberId = event.params.to
    .toHexString()
    .concat("-member-")
    .concat(event.address.toHexString());

  burnShares(event, dao, burnMemberId);
  mintShares(event, dao, mintMemberId);

  addTransaction(event.block, event.transaction);
}

// TransferLoot (index_topic_1 address from, index_topic_2 address to, uint256 amount)
export function handleTransferLoot(event: TransferLoot): void {
  log.info("handleTransfer, to: {}, from: {}, address: {}", [
    event.params.to.toHexString(),
    event.params.from.toHexString(),
    event.address.toHexString(),
  ]);

  let dao = Dao.load(event.address.toHexString());
  if (dao === null) {
    return;
  }

  //if from zero address it mints to a member
  if (event.params.from.toHexString() === constants.ADDRESS_ZERO) {
    let memberId = event.params.from
      .toHexString()
      .concat("-member-")
      .concat(event.address.toHexString());

    mintLoot(event, dao, memberId);
    return;
  }

  //if to baal it burns from member
  if (event.params.to === event.address) {
    let memberId = event.params.from
      .toHexString()
      .concat("-member-")
      .concat(event.address.toHexString());

    burnLoot(event, dao, memberId);
    return;
  }

  //if member to member it transfers (add/subtract)
  let burnMemberId = event.params.from
    .toHexString()
    .concat("-member-")
    .concat(event.address.toHexString());

  let mintMemberId = event.params.to
    .toHexString()
    .concat("-member-")
    .concat(event.address.toHexString());

  burnLoot(event, dao, burnMemberId);
  mintLoot(event, dao, mintMemberId);

  addTransaction(event.block, event.transaction);
}

// DelegateVotesChanged (index_topic_1 address delegate, uint256 previousBalance, uint256 newBalance)
// ShamanSet (index_topic_1 address shaman, uint256 permission)
// GovernanceConfigSet (uint32 voting, uint32 grace, uint256 newOffering, uint256 quorum, uint256 sponsor, uint256 minRetention)
// LootPaused (bool paused)
// SharesPaused (bool paused)
// OwnershipTransferred (index_topic_1 address previousOwner, index_topic_2 address newOwner)
// why twice - once from summoner to safe and once from 0x0 to safe
