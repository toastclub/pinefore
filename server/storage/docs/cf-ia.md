# Does the Cloudflare infrequent access tier make sense?

Standard storage is `0.015/GB/month` and infrequent access is `0.01/GB/month`. Writes are `4.5$` more expensive per million. Reads are `0.54$` more per million. Assuming each archive document is `3mb` and we have `100k` documents, we can calculate the cost of each tier.

| Tier       | Storage | Writes | Reads  | Total  |
| ---------- | ------- | ------ | ------ | ------ |
| Standard   | 4.5$    | 0.45$  | 0.018$ | 4.968$ |
| Infrequent | 3$      | 0.9$   | 0.045$ | 3.945$ |

A: Yes!
