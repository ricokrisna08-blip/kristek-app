# Billing access is centralized across Wilayah, not scoped like other entities

Kristek's existing Wilayah-scoping pattern (see ADR-0001) restricts Admin visibility on Tiket/Pelanggan/ODP to their assigned region. For the new billing module (`.scratch/billing-tagihan-kristek/`), we chose to keep Admin's Tagihan and Pelanggan-harga access unscoped — centralized across all Wilayah — rather than following that pattern. The owner (Pemilik) wants finance handled centrally for now rather than divided by region.

The trade-off: once Kristek expands to a second Wilayah, an Admin assigned to Region A will be able to see and edit payment records for Pelanggan in Region B — exactly what Wilayah-scoping elsewhere is designed to prevent. This was a conscious choice for the current single-Wilayah reality, not an oversight. Revisit this decision before or when a second Wilayah goes live, since the trade-off changes materially at that point.
