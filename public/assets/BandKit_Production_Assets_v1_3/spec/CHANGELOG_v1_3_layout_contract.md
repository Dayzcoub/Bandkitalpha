# BandKit TZ / Assets Changelog — v1.3

## Added

- `spec/BandKit_Interface_Layout_Contract_v1_0.md` — mandatory interface layout contract.
- `metadata/layout_contract.json` — machine-readable layout constraints for implementation.
- `spec/BandKit_TZ_v1_2.md` — main TZ updated with a dedicated Interface Layout Contract section.

## Changed

- README updated to explain that v1.3 includes a layout contract, not only assets and i18n.
- Asset manifest/QA summary updated for v1.3.

## Development rule

Any future screen implementation must follow the Layout Contract before screen-level CSS fixes are added. Pixel-level one-off fixes are not accepted unless the shared pattern itself is updated.
