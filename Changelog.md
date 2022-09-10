# Changelog
All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2022-09-11
- Fixed several D&D 5e compatibility bugs
- Improved PF2e Effect linking
- Removed dependency on LibWrapper, thanks to new dnd5e hooks (thanks @arbron!)

## [1.4.1] - 2022-09-03
- Improved support for V10 journals (will show page 1 content)
- Minor pf2e and dnd5e bugfixes and improvements

## [1.4.0] - 2022-08-06
- Upgraded compatibility to FoundryVTT v10

## [1.3.2] - 2022-07-07
- Reduced permission restriction to only apply for some journal sheets (#12)

## [1.3.1] - 2022-06-08
- Improved migration process of name change

## [1.3.0] - 2022-06-05
- Renamed module from 'Roll From Compendium' to 'Quick Roll To Chat'
- Renamed dummy actor from "(Compendium Roll)" to "(Quick Roll To Chat - Dummy Actor)"
- Improved button handling everywhere
- Added buttons to roll from inside folders of items, macros, etc (same right click style)
- Improved PF2e integration for specific naming of roll actions
- Changed Window header button config to be visible in the settings

## [1.2.4] - 2022-01-06
- Improved names of 'Roll' action - now they will say stuff like "Draw From Table" or "Post Image+Name To Chat"
- Improved PF2e integration - fixing a bug that happened with some less common item types
- Fixed a bug that prevented object deletion after rolling the object

## [1.2.2] - 2021-12-26
- Explicitly marked libWrapper as a dependency, and updated libWrapper shim code

## [1.2.1] - 2021-12-25
- Migration fix for Pf2e 

## [1.2.0] - 2021-12-19
- Completed pf2e compatibility fixes 
- Fixed remaining Foundry v9 compatibility 

## [1.1.3] - 2021-12-15
- Improved compatibility with Pathfinder 2nd edition (PF2e), but not done yet.

## [1.1.2] - 2021-05-29
- [1.1.1] Fixed compatibility with Foundry 0.8.x
- [1.1.2] Fixed another compatibility bug

## [1.1.0] - 2021-03-05
- Added context menu button to items directory
- Added ability to hold the Alt key to disable BetterRolls integration (to show weapon descriptions instead of attacks)

## [1.0.5] - 2021-01-13
- Added settings option (not visible in Settings) for power users who have too many sheet header buttons.
See https://github.com/shemetz/roll-from-compendium/issues/4 for details.
- Added changelog
- Added fields for Manifest+

## 1.0.3 and earlier
- prehistory

## See also: [Unreleased]

[1.0.5]: https://github.com/shemetz/roll-from-compendium/compare/1.0.3...1.0.5
[1.1.0]: https://github.com/shemetz/roll-from-compendium/compare/1.0.5...1.1.0
[1.1.2]: https://github.com/shemetz/roll-from-compendium/compare/1.1.0...1.1.2
[1.1.3]: https://github.com/shemetz/roll-from-compendium/compare/1.1.2...1.1.3
[1.2.0]: https://github.com/shemetz/roll-from-compendium/compare/1.1.3...1.2.0
[1.2.1]: https://github.com/shemetz/roll-from-compendium/compare/1.2.0...1.2.1
[1.2.2]: https://github.com/shemetz/roll-from-compendium/compare/1.2.1...1.2.2
[1.2.4]: https://github.com/shemetz/roll-from-compendium/compare/1.2.2...1.2.4
[1.3.0]: https://github.com/shemetz/roll-from-compendium/compare/1.2.4...1.3.0
[1.3.1]: https://github.com/shemetz/roll-from-compendium/compare/1.3.0...1.3.1
[1.3.2]: https://github.com/shemetz/roll-from-compendium/compare/1.3.1...1.3.2
[1.4.0]: https://github.com/shemetz/roll-from-compendium/compare/1.3.2...1.4.0
[1.4.1]: https://github.com/shemetz/roll-from-compendium/compare/1.4.0...1.4.1
[1.5.0]: https://github.com/shemetz/roll-from-compendium/compare/1.4.1...1.5.0
[Unreleased]: https://github.com/shemetz/roll-from-compendium/compare/1.5.0...HEAD
