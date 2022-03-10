import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import { EventTransaction } from "../../generated/schema";

export function addTransaction(
  block: ethereum.Block,
  tx: ethereum.Transaction
): void {
  let transaction = new EventTransaction(tx.hash.toHex());
  transaction.createdAt = block.timestamp.toString();
  transaction.save();
}

export function addTransactionWithDao(
  block: ethereum.Block,
  tx: ethereum.Transaction,
  daoAddress: Bytes
): void {
  let transaction = new EventTransaction(tx.hash.toHex());
  transaction.createdAt = block.timestamp.toString();
  transaction.summonedDao = daoAddress;
  transaction.save();
}
