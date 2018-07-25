#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

ganache_port=8545

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  # We define 2 accounts, DAO and default Hotel Manager
  # with balance lots of ether, needed for high-value tests.
  # Available Accounts - on a clean network
  # =======================================
  # (0) 0x87265a62c60247f862b9149423061b36b460f4bb
  # (1) 0xb99c958777f024bc4ce992b2a0efb2f1f50a4dcf
  # (2) 0xD037aB9025d43f60a31b32A82E10936f07484246
  #
  local accounts=(
    --account="0xe8280389ca1303a2712a874707fdd5d8ae0437fab9918f845d26fd9919af5a92,10000000000000000000000000000000000000000000000000000000000000000000000000000000"
    --account="0xa4605db83bb3e663f33fb92542ca38344bd8d1bf2d07cc6cc908fec87b7674d5,10000000000000000000000000000000000000000000000000000000000000000000000000000000"
    --account="0x4259ac86777aa87b3e24006fe6bc98a9c726c3618b18541716a8acc1a7161fa2,10000000000000000000000000000000000000000000000000000000000000000000000000000000"
  )

  node_modules/.bin/ganache-cli -i 77 --gasLimit 6000000 "${accounts[@]}"
  ganache_pid=$!
  sleep 1
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi
