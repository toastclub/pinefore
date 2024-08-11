# Helpers

## base62

Generate base62 strings used to encode IDs

## fingerprinting

Tools for extracting information from requests to use for account security

## root-domain

Extract the root domain from a URL (e.g `www.example.com/path` → `example`)

## string-similarity

Calculate the similarity between two strings, used in title generation code.

## URL Rewriter

Our goal here is to remove "undesirable" parts of URLs. This includes:

1. Rewrite youtu.be to youtube.com
2. Remove UTM
3. Follow shorteners

### Watch list

We are monitoring the following urls:

1. rawgit.com, which is being deprecated

We may rewrite these URLs in the future, including retroactively.
