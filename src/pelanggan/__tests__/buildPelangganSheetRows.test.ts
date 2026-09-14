import { buildPelangganSheetRows } from "../buildPelangganSheetRows";

test("maps export rows to sheet columns", () => {
  const result = buildPelangganSheetRows([
    {
      nama: "Budi",
      alamat: "Jl. Mawar 1",
      paketNama: "Paket 10 Mbps",
      harga: 165000,
      noHp: "6281111111111",
      status: "Aktif",
    },
  ]);

  expect(result).toEqual([
    {
      Nama: "Budi",
      Alamat: "Jl. Mawar 1",
      Paket: "Paket 10 Mbps",
      Harga: 165000,
      "Nomor Telepon": "6281111111111",
      Status: "Aktif",
    },
  ]);
});

test("missing Paket falls back to a dash, missing harga falls back to 0", () => {
  const result = buildPelangganSheetRows([
    { nama: "Siti", alamat: "Jl. Melati", paketNama: null, harga: null, noHp: "1", status: "Isolir" },
  ]);

  expect(result[0]).toMatchObject({ Paket: "-", Harga: 0 });
});

test("empty input produces an empty sheet", () => {
  expect(buildPelangganSheetRows([])).toEqual([]);
});
