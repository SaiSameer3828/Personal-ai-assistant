#!/bin/bash

cd /mnt/c/Users/botsa/email-collector

node gmail-save.mjs
node digest.mjs
node send-discord.mjs
