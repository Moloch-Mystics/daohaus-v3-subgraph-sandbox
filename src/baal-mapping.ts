import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Dao,
  Member,
	MemberUri,
	ProposalUri,
  Proposal,
  // RageQuit,
  // Shaman,
  Vote,
} from "../generated/schema";

import {
  CancelProposal,
  DelegateChanged,
  DelegateVotesChanged,
  GovernanceConfigSet,
  LootPaused,
  ProcessingFailed,
  ProcessProposal,
  Ragequit,
  SetupComplete,
  ShamanSet,
  SharesPaused,
  SponsorProposal,
  SubmitProposal,
  SubmitVote,
  Transfer,
  TransferLoot
} from "../generated/templates/BaalTemplate/Baal";
import { constants } from "./util/constants";
// import { addTransaction } from "./util/transactions";

function burnShares(dao: MemberUri, memberId: string, amount: BigInt): void {
  let member = Member.load(memberId);

  if (member === null) {
    log.info("burn member not found", []);
  } else {
    member.shares = member.shares.minus(amount);

    member.save();
    dao.save();
  }
}

function mintShares(event: Transfer, dao: MemberUri, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.dao = event.address.toHexString();
    member.memberAddress = event.params.to;
    member.delegatingTo = event.params.to;
    member.shares = constants.BIGINT_ZERO;
    member.loot = constants.BIGINT_ZERO;
  }

  member.shares = member.shares.plus(event.params.amount);

  member.save();
  dao.save();
}

function burnLoot(dao: MemberUri, memberId: string, amount: BigInt): void {
  let member = Member.load(memberId);

  if (member === null) {
    log.info("burn member not found, {}", [memberId]);
  } else {
    member.loot = member.loot.minus(amount);
    dao.totalLoot = dao.totalLoot.minus(amount);

    member.save();
    dao.save();
  }
}

function mintLoot(event: TransferLoot, dao: MemberUri, memberId: string): void {
  let member = Member.load(memberId);

  if (member === null) {
    member = new Member(memberId);
    member.createdAt = event.block.timestamp.toString();
    member.dao = event.address.toHexString();
    member.memberAddress = event.params.to;
    member.delegatingTo = event.params.to;
    member.shares = constants.BIGINT_ZERO;
    member.loot = constants.BIGINT_ZERO;
  }

  member.loot = member.loot.plus(event.params.amount);
  dao.totalLoot = dao.totalLoot.plus(event.params.amount);

  member.save();
  dao.save();
}

// Proposal Handlers
export function handleSubmitProposal(event: SubmitProposal): void {
  let dao = Dao.load(event.address.toHexString());
  if (dao === null) {
    return;
  }

  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = new Proposal(proposalId);
  proposal.createdAt = event.block.timestamp.toString();
  proposal.createdBy = event.transaction.from;
  proposal.dao = event.address.toHexString();
  proposal.proposalId = event.params.proposal;
  proposal.proposalDataHash = event.params.proposalDataHash;
  proposal.proposalData = event.params.proposalData;
  proposal.votingPeriod = event.params.votingPeriod;
  proposal.expiration = event.params.expiration;
  proposal.sponsored = event.params.selfSponsor;
  proposal.cancelled = false;
  proposal.processed = false;
  proposal.actionFailed = false;
  proposal.passed = false;
  proposal.proposalOffering = event.transaction.value;
  proposal.maxTotalSharesAndLootAtYesVote = constants.BIGINT_ZERO;
  proposal.selfSponsor = event.params.selfSponsor;
  proposal.votingStarts = event.params.selfSponsor
    ? event.block.timestamp
    : constants.BIGINT_ZERO;
  proposal.votingEnds = event.params.selfSponsor
    ? event.block.timestamp.plus(event.params.votingPeriod)
    : constants.BIGINT_ZERO;
  proposal.graceEnds = event.params.selfSponsor
    ? event.block.timestamp
        .plus(event.params.votingPeriod)
        .plus(dao.gracePeriod)
    : constants.BIGINT_ZERO;

  // let result = parser.getResultFromJson(event.params.details);
  // if (result.error != "none") {
  //   log.error("details parse error prop: {}", [proposalId]);
  //   proposal.details = event.params.details;
  // } else {
  //   let object = result.object;

  //   let title = parser.getStringFromJson(object, "title");
  //   if (title.error == "none") {
  //     proposal.title = title.data;
  //   }

  //   let description = parser.getStringFromJson(object, "description");
  //   if (description.error == "none") {
  //     proposal.description = description.data;
  //   }

  //   let proposalType = parser.getStringFromJson(object, "proposalType");
  //   if (proposalType.error == "none") {
  //     proposal.proposalType = proposalType.data;
  //   } else {
  //     proposal.proposalType = "unknown";
  //   }

  //   let contentURI = parser.getStringFromJson(object, "contentURI");
  //   if (contentURI.error == "none") {
  //     proposal.contentURI = contentURI.data;
  //   }

  //   let contentURIType = parser.getStringFromJson(object, "contentURIType");
  //   if (contentURIType.error == "none") {
  //     proposal.contentURIType = contentURIType.data;
  //   }
  // }

  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}

export function handleSponsorProposal(event: SponsorProposal): void {
  let dao = Dao.load(event.address.toHexString());
  if (dao === null) {
    return;
  }

  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = Proposal.load(proposalId);
  if (proposal === null) {
    return;
  }

  proposal.sponsor = event.params.member;
  proposal.sponsored = true;
  proposal.votingStarts = event.block.timestamp;
  proposal.votingEnds = event.block.timestamp.plus(dao.votingPeriod);
  proposal.graceEnds = event.block.timestamp
    .plus(dao.votingPeriod)
    .plus(dao.gracePeriod);


  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}

export function handleProcessProposal(event: ProcessProposal): void {
  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = Proposal.load(proposalId);
  if (proposal === null) {
    return;
  }

  proposal.processed = true;
  proposal.passed = event.params.passed;
  proposal.actionFailed = event.params.actionFailed;

  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}

// why do we need this when the above event emit it too?
export function handleProcessingFailed(event: ProcessingFailed): void {
  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = Proposal.load(proposalId);
  if (proposal === null) {
    return;
  }

  proposal.actionFailed = true;

  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}

export function handleCancelProposal(event: CancelProposal): void {
  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = Proposal.load(proposalId);
  if (proposal === null) {
    return;
  }

  proposal.cancelled = true;

  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}

export function handleSubmitVote(event: SubmitVote): void {
  let dao = ProposalUri.load(event.address.toHexString());
  if (dao === null) {
    return;
  }

  let proposalId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toString());

  let proposal = Proposal.load(proposalId);
  if (proposal === null) {
    return;
  }

  let voteId = event.address
    .toHexString()
    .concat("-proposal-")
    .concat(event.params.proposal.toHexString())
    .concat("-vote-")
    .concat(event.params.member.toHexString());

  let vote = new Vote(voteId);

  vote.createdAt = event.block.timestamp.toString();
  vote.daoAddress = event.address;
  vote.approved = event.params.approved;
  vote.balance = event.params.balance;

  let memberId = event.address
    .toHexString()
    .concat("-member-")
    .concat(event.params.member.toHexString());
  vote.member = memberId;
  vote.proposal = proposalId;

  if (event.params.approved) {
    proposal.yesVotes = proposal.yesVotes.plus(constants.BIGINT_ONE);
    proposal.yesBalance = proposal.yesBalance.plus(event.params.balance);
  } else {
    proposal.noVotes = proposal.noVotes.plus(constants.BIGINT_ONE);
    proposal.noBalance = proposal.noBalance.plus(event.params.balance);
  }

  vote.save();
  proposal.save();

  // addTransaction(event.block, event.transaction, event.address);
}
