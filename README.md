![](https://waka.boehs.org/api/badge/evan/evan/interval:30_days/project:pinefore?label=last%2030d)

<img align="left" width="300px" src="https://pinefore.com/branding/widelogo.svg"/> Pinefore is a new type of internet service, or rather, an old one revitalized for a modern era. It is an internet service that, from the very beginning, has been designed consciously in ways that empower our users. It is a service that intends to foster diversity in our web, at a time when the largest companies are attacking it. It is the result of hundreds of hours spent examining the cultural shifts between 2000-2015. We pine for beautiful gardens of home grown content — bastions of individuality. Through every method possible, our goal is to encourage their growth.

Pinefore plans to launch with full protocol support for _Delicious/Pinboard_ ('05), _RSS_ ('99), _Google Reader_ ('05), and _Fever_ ('13). Soon, we will add support for _WebMention_ and _ActivityPub_ ('18).

We currently are launching with tightly integrated and communal _Bookmarking_, _RSS_, and _Annotations_; and we plan to add support for: _Croundfunding_ à la Coil, "_Small Search_", and anything else that could foster the indieweb.

We are not taking investments. That would be contrary to our goals.

## OSS

Given the nature of our service, most of our "proprietary technology" would be beneficial to the web community as a whole. As a result, we've open sourced most of the interesting bits. We believe a rising tide lifts all boats. All the code here is identical to what is in production.

OSS has the following additional advantages:

- Documentation is inherently more ambiguous than code
- Users can verify their data is stored responsibly

The apps and the extension are both open source. Around 50% of the backend is open source, as well. The open source components includes most middleware and helper functions. The closed source code is mostly the "glue" between these interesting pieces (eg. the router, the database).

We are ultimately running a business, and we intend to offer paying customers the very best. The success of the business allows me to devote more time to the project. By open sourcing the more interesting parts, we intend to foster a community of "competitors" on the fediverse, that offer different takes on this problem. In other words, instead of a homogenous cluster of instances, we want many unique variants.

## Notes

- The docs used to be here, but they aren't anymore. That's due to an edgecase in our build system, arising from symlinks
- Contributions are accepted, however local development may be difficult due to the fact that not everything is open source
- The database schema is currently not included, but in some cases it can be inferred from usage
- The package.json is included, but it does not contain the package.json for the entire project.
